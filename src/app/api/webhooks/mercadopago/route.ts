import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Valida a assinatura HMAC enviada pelo Mercado Pago no header x-signature.
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
function validateMpSignature(req: Request, rawBody: string): boolean {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret || secret.trim() === "") {
        // Se não tiver secret configurado (ou vazio), logar aviso mas não bloquear (dev/staging)
        console.warn("[WEBHOOK MP] MP_WEBHOOK_SECRET não configurado — pulando validação HMAC.");
        return true;
    }

    const xSignature = req.headers.get("x-signature") ?? "";
    const xRequestId = req.headers.get("x-request-id") ?? "";

    // Extrai ts e v1 do header x-signature (formato: "ts=XXX,v1=YYY")
    const parts = Object.fromEntries(
        xSignature.split(",").map((part) => part.split("=") as [string, string])
    );
    const ts = parts["ts"];
    const v1 = parts["v1"];

    if (!ts || !v1) return false;

    // Monta o template de assinatura conforme documentação do MP
    const manifest = `id:${xRequestId};request-id:${xRequestId};ts:${ts};`;
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(manifest)
        .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(v1, "hex"),
        Buffer.from(expectedSignature, "hex")
    );
}

export async function POST(req: Request) {
    try {
        // Lê o body como texto para usar na validação HMAC
        const rawBody = await req.text();
        const body = JSON.parse(rawBody);

        // Valida autenticidade do webhook
        if (!validateMpSignature(req, rawBody)) {
            console.warn("[WEBHOOK MP] Assinatura HMAC inválida — request rejeitado.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // MP pode enviar 'action' ou 'type' dependendo do tipo de notificação
        const action = body.action || body.type;

        if (action === "payment.created" || action === "payment.updated") {
            const paymentId = body.data?.id;

            if (!paymentId) {
                return NextResponse.json({ success: true, received: true });
            }

            // [NOVO] Idempotência: Verifica se este transaction_id gerado pelo MP já foi processado.
            const existingTx = await prisma.processedTransaction.findUnique({
                where: { transactionId: String(paymentId) }
            });

            if (existingTx) {
                console.log(`[WEBHOOK MP] Ignorando notificação duplicada. Pagamento ${paymentId} já processado em: ${existingTx.processedAt}`);
                return NextResponse.json({ success: true, ignored: "already_processed" });
            }

            const client = new MercadoPagoConfig({
                accessToken: process.env.MP_ACCESS_TOKEN ?? "",
            });

            const paymentApi = new Payment(client);
            const paymentData = await paymentApi.get({ id: paymentId });

            if (paymentData.status === "approved") {
                const payerEmail = paymentData.payer?.email;
                const externalReference = paymentData.external_reference;
                const payerName = (paymentData.payer as any)?.first_name ?? undefined;

                // Pega o ID do plano dinâmico que passamos no checkout ou via título/descrição
                const itemId = paymentData.additional_info?.items?.[0]?.id?.toLowerCase() || "";
                const itemTitle = paymentData.additional_info?.items?.[0]?.title?.toLowerCase() || "";
                const description = paymentData.description?.toLowerCase() || "";

                let plan = "enem";
                if (
                    itemId === "full" || itemId === "upgrade" ||
                    itemTitle.includes("vestibular") || itemTitle.includes("completo") || itemTitle.includes("full") || itemTitle.includes("upgrade") ||
                    description.includes("vestibular") || description.includes("completo") || description.includes("full") || description.includes("upgrade")
                ) {
                    plan = "full";
                }

                let updatedCount = 0;
                let isNewUser = false;
                let generatedPassword = "";

                if (externalReference) {
                    // FLUXO 1: Upgrade Interno (O aluno já estava logado e clicou em "Fazer Upgrade Agora")
                    const result = await prisma.user.updateMany({
                        where: { id: externalReference },
                        data: {
                            lifetimeLicense: true,
                            plan: plan,
                            licenseActivatedAt: new Date(),
                        },
                    });
                    updatedCount = result.count;
                    console.log(`[WEBHOOK MP] Aprovado via external_reference / Upgrade (ID: ${externalReference}). Plano: ${plan}, Updates: ${updatedCount}`);
                } else if (payerEmail) {
                    // FLUXO 2: Venda na Landing Page (O aluno nunca entrou no app, clicou no link público)
                    // Verifica se o usuário já existe
                    const existingUser = await prisma.user.findUnique({
                        where: { email: payerEmail }
                    });

                    if (existingUser) {
                        // Se já tem cadastro com esse e-mail (ex: tentou logar antes de comprar), só atualiza a licença
                        await prisma.user.update({
                            where: { id: existingUser.id },
                            data: {
                                lifetimeLicense: true,
                                plan: plan,
                                licenseActivatedAt: new Date(),
                            },
                        });
                        updatedCount = 1;
                        console.log(`[WEBHOOK MP] Aprovado E-mail Existente (${payerEmail}). Plano: ${plan}`);
                    } else {
                        // O coração do Funil Desktop M1: Cria a conta automaticamente e gera a senha "Chave de Ativação"
                        isNewUser = true;

                        // Função simples para gerar senha segura aleatória
                        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
                        for (let i = 0; i < 8; i++) {
                            generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        // Força um prefixo para ficar com "cara de chave de licença"
                        generatedPassword = `PP-${generatedPassword}`;

                        const bcrypt = require("bcryptjs");
                        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

                        await prisma.user.create({
                            data: {
                                email: payerEmail,
                                name: payerName || "Aluno Prep",
                                password: hashedPassword,
                                isTemporaryPassword: true,
                                lifetimeLicense: true,
                                plan: plan,
                                licenseActivatedAt: new Date(),
                            }
                        });
                        updatedCount = 1;
                        console.log(`[WEBHOOK MP] Nova Conta Criada via Pagamento: (${payerEmail}). Plano: ${plan}`);
                    }
                }

                if (payerEmail && updatedCount > 0) {
                    // Valida formato básico de e-mail (pra evitar crash do Resend com dados de sandbox inválidos)
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(payerEmail)) {
                        console.error(`[WEBHOOK MP] Ignorando envio de e-mail. Formato de e-mail inválido recebido do MP Sandbox: "${payerEmail}"`);
                    } else {
                        // Dispara e-mail de boas-vindas após ativar/criar
                        try {
                            const passwordToSend = isNewUser ? generatedPassword : undefined;
                            await sendWelcomeEmail(payerEmail, payerName, plan, passwordToSend);
                        } catch (emailErr) {
                            // Não travar o webhook por falha de e-mail
                            console.error("[WEBHOOK MP] Falha ao enviar e-mail:", emailErr);
                        }
                    }
                }

                // [NOVO] Sucesso total: Marca a transação como processada para o webhook não repetir a criação de senha/e-mail
                await prisma.processedTransaction.create({
                    data: {
                        transactionId: String(paymentId),
                        status: "approved"
                    }
                });
            }
        }

        // MP exige resposta 2xx rápida (ACK)
        return NextResponse.json({ success: true, received: true });
    } catch (error) {
        console.error("[WEBHOOK MP ERROR]:", error);
        return NextResponse.json(
            { success: false, error: "Webhook process error" },
            { status: 500 }
        );
    }
}
