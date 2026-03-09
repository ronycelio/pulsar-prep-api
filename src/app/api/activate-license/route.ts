import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import * as z from "zod";

const bodySchema = z.object({
    code: z.string().min(1).max(100),
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
        }

        const json = await req.json();
        const parsed = bodySchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json({ error: "Código de ativação inválido." }, { status: 400 });
        }

        const { code } = parsed.data;

        // Busca a chave — deve existir e não ter sido usada
        const licenseKey = await prisma.licenseKey.findUnique({
            where: { code: code.trim().toUpperCase() },
        });

        if (!licenseKey || licenseKey.usedAt !== null) {
            return NextResponse.json(
                { error: "Chave inválida ou já utilizada." },
                { status: 400 }
            );
        }

        // Ativa a licença do usuário e marca a chave como usada (transação atômica)
        await prisma.$transaction([
            prisma.user.update({
                where: { id: session.user.id },
                data: {
                    lifetimeLicense: true,
                    licenseActivatedAt: new Date(),
                },
            }),
            prisma.licenseKey.update({
                where: { code: code.trim().toUpperCase() },
                data: {
                    usedByEmail: session.user.email ?? "",
                    usedAt: new Date(),
                },
            }),
        ]);

        // E-mail de boas-vindas (não bloqueia a resposta se falhar)
        sendWelcomeEmail(session.user.email ?? "", session.user.name ?? undefined)
            .catch((err) => console.error("[ACTIVATE] Falha e-mail:", err));

        console.log(`[ACTIVATE] Licença ativada via chave para ${session.user.email}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[ACTIVATE ERROR]:", error);
        return NextResponse.json(
            { error: "Erro interno ao ativar licença. Tente novamente." },
            { status: 500 }
        );
    }
}
