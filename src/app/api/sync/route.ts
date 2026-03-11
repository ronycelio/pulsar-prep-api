import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * POST /api/sync
 * Recebe lote de progresso AND daily_state do IndexedDB e sincroniza com PostgreSQL.
 * Estratégia: Upsert baseado em [userId, questionId] para progress.
 *             Upsert baseado em [userId, categoryKey, date] para daily_state.
 */
export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { progress = [], dailyStates = [] } = body;

        if (!Array.isArray(progress)) {
            return NextResponse.json({ success: false, error: "Formato inválido" }, { status: 400 });
        }

        const userId = session.user.id;

        // ── 1. Sync de Progresso (questões respondidas) ──
        const syncPromises = progress.map((item) => {
            return prisma.progressEntry.upsert({
                where: {
                    userId_questionId: {
                        userId: userId,
                        questionId: item.questionId,
                    },
                },
                update: {
                    categoryKey: item.categoryKey,
                    answeredAt: new Date(item.answeredAt),
                    isCorrect: item.isCorrect,
                    selectedAlternativeId: item.selectedAlternativeId,
                    timeSpentMs: item.timeSpentMs,
                },
                create: {
                    userId: userId,
                    questionId: item.questionId,
                    categoryKey: item.categoryKey,
                    answeredAt: new Date(item.answeredAt),
                    isCorrect: item.isCorrect,
                    selectedAlternativeId: item.selectedAlternativeId,
                    timeSpentMs: item.timeSpentMs,
                },
            });
        });

        // ── 2. Sync de Daily State (streak, meta, progresso do dia) ──
        const statePromises = dailyStates.map((state: any) => {
            return prisma.dailyState.upsert({
                where: {
                    userId_categoryKey_date: {
                        userId,
                        categoryKey: state.categoryKey,
                        date: state.date,
                    },
                },
                update: {
                    goalTotal: state.goalTotal,
                    goalCompleted: state.goalCompleted,
                    goalReached: state.goalReached ?? false,
                    streakDay: state.streakDay ?? 0,
                },
                create: {
                    userId,
                    categoryKey: state.categoryKey,
                    date: state.date,
                    goalTotal: state.goalTotal,
                    goalCompleted: state.goalCompleted,
                    goalReached: state.goalReached ?? false,
                    streakDay: state.streakDay ?? 0,
                },
            }).catch(() => null); // Ignora se modelo não existe ainda
        });

        await Promise.all([...syncPromises, ...statePromises]);

        console.log(`[Sync API]: Sincronizados ${progress.length} progresso + ${dailyStates.length} daily_state para ${userId}.`);

        return NextResponse.json({
            success: true,
            syncedCount: progress.length,
            statesSynced: dailyStates.length,
        });

    } catch (error: any) {
        console.error("[Sync API Error]:", error);
        return NextResponse.json(
            { success: false, error: "Erro ao sincronizar dados" },
            { status: 500 }
        );
    }
}

