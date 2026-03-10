import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextResponse } from "next/server";

const PLANS: Record<string, { title: string; real: number; test: number }> = {
    enem: { title: "Pulsar Prep - Licença ENEM", real: 97.00, test: 1.00 },
    full: { title: "Pulsar Prep - Licença Completa (ENEM + Vestibular)", real: 129.00, test: 1.10 },
    upgrade: { title: "Pulsar Prep - Upgrade Vestibular", real: 32.00, test: 1.10 },
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const plan = searchParams.get("plan");

    if (!plan || !PLANS[plan]) {
        return NextResponse.json({ error: "Plano inválido. Use ?plan=enem, ?plan=full ou ?plan=upgrade" }, { status: 400 });
    }

    const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const isTestMode = APP_URL.includes("localhost") || process.env.MP_TEST_MODE === "true";
    const planConfig = PLANS[plan];
    const price = isTestMode ? planConfig.test : planConfig.real;

    const client = new MercadoPagoConfig({
        accessToken: process.env.MP_ACCESS_TOKEN ?? "",
    });

    try {
        const response = await new Preference(client).create({
            body: {
                items: [
                    {
                        id: plan,
                        title: planConfig.title,
                        quantity: 1,
                        unit_price: price,
                    },
                ],
                // Garante o envio do webhook mesmo se o aluno fechar o navegador antes de retornar
                notification_url: `${APP_URL}/api/webhooks/mercadopago`,
                back_urls: {
                    success: `${APP_URL}/login?checkout=success`,
                    failure: `${APP_URL}/login?checkout=failure`,
                    pending: `${APP_URL}/login?checkout=pending`,
                },
                ...(isTestMode ? {} : { auto_return: "approved" }),
            },
        });

        if (response.init_point) {
            return NextResponse.redirect(response.init_point);
        }

        return NextResponse.json({ error: "Falha ao gerar link do Mercado Pago." }, { status: 500 });
    } catch (error: any) {
        console.error("[PUBLIC CHECKOUT] Erro:", error?.cause ?? error?.message ?? error);
        return NextResponse.json({ error: "Erro interno ao criar checkout." }, { status: 500 });
    }
}
