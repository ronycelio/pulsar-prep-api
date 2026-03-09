import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Não autorizado" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // O Prisma Adapter com onDelete: Cascade nas relações (Account, Session, ProgressEntry)
        // deve limpar tudo automaticamente ao deletar o User.
        await prisma.user.delete({
            where: { id: userId },
        });

        console.log(`[LGPD]: Conta do usuário ${userId} excluída via API.`);

        return NextResponse.json({
            success: true,
            message: "Conta excluída permanentemente."
        });
    } catch (error) {
        console.error("[LGPD DELETE ERROR]:", error);
        return NextResponse.json(
            { error: "Erro ao processar exclusão" },
            { status: 500 }
        );
    }
}
