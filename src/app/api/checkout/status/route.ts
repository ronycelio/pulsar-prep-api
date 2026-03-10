import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const userId = searchParams.get("userId");

    try {
        if (userId) {
            // Consulta por ID (usado no Upgrade)
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { plan: true }
            });

            if (user?.plan === "full") {
                return NextResponse.json({ status: "approved" });
            }
        } else if (email) {
            // Consulta por E-mail (usado na Compra Nova)
            const user = await prisma.user.findUnique({
                where: { email },
                select: { plan: true }
            });

            // Se o usuário já existe e tem plano, o webhook já processou
            if (user && (user.plan === "enem" || user.plan === "full")) {
                return NextResponse.json({ status: "approved" });
            }
        } else {
            return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
        }

        return NextResponse.json({ status: "pending" });
    } catch (error) {
        console.error("[CHECKOUT STATUS] Erro ao verificar status:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
