import { db } from "../db";
import { ProgressEntry } from "@/types/progress";
import { getSession } from "next-auth/react";

/**
 * SyncQueue: Gerencia a sincronização do progresso local para o servidor.
 * Epic 5 — Push: progress + daily_state | Pull: progresso + streaks cross-device
 */
export class SyncQueue {
    private static isSyncing = false;

    /**
     * Coleta todo o progresso não sincronizado (e daily_state pendente)
     * e envia para o servidor em um único POST.
     */
    static async flush(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
        if (this.isSyncing) return { success: true, syncedCount: 0 };

        try {
            this.isSyncing = true;

            // 1. Coletar itens pendentes (isSynced: false)
            const pendingItems = await db.progress
                .where("isSynced")
                .equals(0)
                .toArray();

            // Fallback para quando o índice de boolean não funciona como esperado
            const allPending = pendingItems.length > 0
                ? pendingItems
                : (await db.progress.toArray()).filter(p => !p.isSynced);

            // 2. Coletar daily_state pendentes (pendingSync: true)
            const allDailyStates = await db.daily_state
                .filter(s => s.pendingSync === true)
                .toArray();

            if (allPending.length === 0 && allDailyStates.length === 0) {
                return { success: true, syncedCount: 0 };
            }

            console.log(`[SyncQueue]: Sincronizando ${allPending.length} progress + ${allDailyStates.length} daily_state.`);

            // 3. Enviar para a API
            const response = await fetch("/api/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    progress: allPending,
                    dailyStates: allDailyStates.map(s => ({
                        categoryKey: s.categoryKey,
                        date: s.date,
                        goalTotal: s.goalTotal,
                        goalCompleted: s.goalCompleted,
                        goalReached: s.goalReached,
                        streakDay: s.streakDay,
                    })),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erro na resposta do servidor");
            }

            // 4. Marcar progress como sincronizado localmente
            const ids = allPending.map(item => item.id).filter((id): id is number => id !== undefined);
            if (ids.length > 0) {
                await db.progress.bulkUpdate(
                    ids.map(id => ({
                        key: id,
                        changes: { isSynced: true }
                    }))
                );
            }

            // 5. Marcar daily_state como sincronizado
            const stateIds = allDailyStates.map(s => s.id).filter((id): id is number => id !== undefined);
            if (stateIds.length > 0) {
                await db.daily_state.bulkUpdate(
                    stateIds.map(id => ({
                        key: id,
                        changes: { pendingSync: false }
                    }))
                );
            }

            console.log(`[SyncQueue]: Sync concluído com sucesso.`);
            return { success: true, syncedCount: allPending.length };

        } catch (error: any) {
            console.error("[SyncQueue Error]:", error);
            return { success: false, syncedCount: 0, error: error.message };
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Recupera o progresso AND daily_state do servidor e mescla com o local.
     * Usado após o login em novo dispositivo (Story 5.3 — Cross-device restore).
     */
    static async pullFromServer(): Promise<{ success: boolean; pulledCount: number }> {
        try {
            const session = await getSession();
            if (!session?.user?.id) throw new Error("Usuário não autenticado");
            const userId = session.user.id;

            const response = await fetch("/api/sync/pull");
            if (!response.ok) throw new Error("Falha ao buscar dados remotos");

            const {
                progress: remoteProgress,
                dailyStates: remoteDailyStates = []
            }: { progress: ProgressEntry[]; dailyStates: any[] } = await response.json();

            // ── Restaurar Progress (questões respondidas) ──
            if (remoteProgress.length > 0) {
                const localProgress = await db.progress.where("userId").equals(userId).toArray();

                const resolveProgressConflicts = (await import("./conflicts")).resolveProgressConflicts;
                const finalProgress = resolveProgressConflicts(localProgress, remoteProgress);

                await db.progress.where("userId").equals(userId).delete();
                await db.progress.bulkAdd(finalProgress);
            }

            // ── Restaurar Daily State (streak, meta) por LWW ──
            for (const remoteState of remoteDailyStates) {
                const localState = await db.daily_state
                    .where("[userId+categoryKey+date]")
                    .equals([userId, remoteState.categoryKey, remoteState.date])
                    .first();

                // LWW: só sobrescreve se o remoto tem streak maior (mais seguro para não perder streak)
                if (!localState || (remoteState.streakDay ?? 0) > (localState.streakDay ?? 0)) {
                    await db.daily_state.put({
                        ...localState,
                        userId,
                        categoryKey: remoteState.categoryKey,
                        date: remoteState.date,
                        goalTotal: remoteState.goalTotal,
                        goalCompleted: remoteState.goalCompleted,
                        goalReached: remoteState.goalReached,
                        streakDay: remoteState.streakDay,
                        pendingSync: false,
                        questionQueue: localState?.questionQueue ?? [],
                    });
                }
            }

            console.log(`[SyncQueue Pull]: Restaurados ${remoteProgress.length} progress + ${remoteDailyStates.length} daily_state.`);
            return { success: true, pulledCount: remoteProgress.length };

        } catch (error) {
            console.error("[SyncPool Pull Error]:", error);
            return { success: false, pulledCount: 0 };
        }
    }
}
