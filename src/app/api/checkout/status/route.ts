import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const userId = searchParams.get("userId");
    const planRequested = searchParams.get("plan");

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
        } else if (email && planRequested) {
            // Consulta por E-mail (usado na Compra Nova com envio do plano que está sendo comprado)
            const user = await prisma.user.findUnique({
                where: { email },
                select: { plan: true }
            });

            if (user) {
                // Se a pessoa está comprando o FULL, ela PRECISA estar com o user.plan === "full"
                if (planRequested === "full" && user.plan === "full") {
                    return NextResponse.json({ status: "approved" });
                } 
                // Se a pessoa está comprando o ENEM, ela precisa ter user.plan === "enem" ou já ser "full"
                else if (planRequested === "enem" && (user.plan === "enem" || user.plan === "full")) {
                    return NextResponse.json({ status: "approved" });
                }
            }
        } else if (email) {
            // Fallback (caso o frontend ainda não mande o plan)
            const user = await prisma.user.findUnique({
                where: { email },
                select: { plan: true }
            });
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
