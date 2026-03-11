import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/sync/pull
 * Retorna todo o progresso E daily_state do usuário para sincronização cross-device.
 * Epic 5 — Story 5.3: Restauração ao logar em novo dispositivo.
 */
export async function GET(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
        }

        const userId = session.user.id;

        // ── 1. Buscar todo o progresso de questões ──
        const progress = await prisma.progressEntry.findMany({
            where: { userId },
            orderBy: { answeredAt: "desc" },
        });

        // ── 2. Buscar daily_state (streak + meta diária histórica) ──
        let dailyStates: any[] = [];
        try {
            dailyStates = await (prisma as any).dailyState.findMany({
                where: { userId },
                orderBy: { date: "desc" },
                take: 90, // últimos 90 dias — suficiente para streak histórico
            });
        } catch {
            // Fallback: tabela pode não existir em ambientes antigos
            dailyStates = [];
        }

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
                isSynced: true,
            })),
            dailyStates: dailyStates.map((s: any) => ({
                categoryKey: s.categoryKey,
                date: s.date,
                goalTotal: s.goalTotal,
                goalCompleted: s.goalCompleted,
                goalReached: s.goalReached,
                streakDay: s.streakDay,
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
