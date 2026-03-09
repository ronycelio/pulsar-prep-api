import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * POST /api/sync
 * Recebe lote de progresso do IndexedDB e sincroniza com PostgreSQL via Prisma.
 * Estratégia: Upsert baseado em [userId, questionId].
 */
export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
        }

        const { progress } = await req.json();

        if (!Array.isArray(progress)) {
            return NextResponse.json({ success: false, error: "Formato inválido" }, { status: 400 });
        }

        const userId = session.user.id;

        // Processar cada item em paralelo (ou sequencialmente se o lote for gigante)
        // Para o MVP: Promise.all é seguro para lotes de meta diária (~50 itens)
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

        await Promise.all(syncPromises);

        console.log(`[Sync API]: Sincronizados ${progress.length} itens para o usuário ${userId}.`);

        return NextResponse.json({
            success: true,
            syncedCount: progress.length,
        });

    } catch (error: any) {
        console.error("[Sync API Error]:", error);
        return NextResponse.json(
            { success: false, error: "Erro ao sincronizar dados" },
            { status: 500 }
        );
    }
}
