import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/sync/pull
 * Retorna todo o progresso do usuário para sincronização inicial em novos dispositivos.
 */
export async function GET(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
        }

        const userId = session.user.id;

        const progress = await prisma.progressEntry.findMany({
            where: { userId: userId },
            orderBy: { answeredAt: "desc" },
        });

        return NextResponse.json({
            success: true,
            progress: progress.map(p => ({
                questionId: p.questionId,
                userId: p.userId,
                categoryKey: p.categoryKey,
                answeredAt: p.answeredAt.toISOString(),
                isCorrect: p.isCorrect,
                selectedAlternativeId: p.selectedAlternativeId,
                timeSpentMs: p.timeSpentMs,
                isSynced: true, // It's coming from server, so it's synced
            })),
        });

    } catch (error: any) {
        console.error("[Pull API Error]:", error);
        return NextResponse.json(
            { success: false, error: "Erro ao baixar dados de sincronização" },
            { status: 500 }
        );
    }
}
