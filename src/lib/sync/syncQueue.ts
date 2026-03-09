import { db } from "../db";
import { ProgressEntry } from "@/types/progress";
import { getSession } from "next-auth/react";

/**
 * SyncQueue: Gerencia a sincronização do progresso local para o servidor.
 */
export class SyncQueue {
    private static isSyncing = false;

    /**
     * Coleta todo o progresso não sincronizado e envia para o servidor.
     */
    static async flush(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
        if (this.isSyncing) return { success: true, syncedCount: 0 };

        try {
            this.isSyncing = true;

            // 1. Coletar itens pendentes (isSynced: false)
            const pendingItems = await db.progress
                .where("isSynced")
                .equals(0) // Dexie armazena booleans como 0/1 em índices às vezes, ou use false
                .toArray();

            // Fallback para quando o índice de boolean não funciona como esperado em alguns browsers
            const allPending = pendingItems.length > 0 ? pendingItems : (await db.progress.toArray()).filter(p => !p.isSynced);

            if (allPending.length === 0) {
                return { success: true, syncedCount: 0 };
            }

            console.log(`[SyncQueue]: Iniciando sync de ${allPending.length} itens.`);

            // 2. Enviar para a API
            const response = await fetch("/api/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ progress: allPending }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erro na resposta do servidor");
            }

            // 3. Marcar como sincronizado localmente
            const ids = allPending.map(item => item.id).filter((id): id is number => id !== undefined);

            await db.progress.bulkUpdate(
                ids.map(id => ({
                    key: id,
                    changes: { isSynced: true }
                }))
            );

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
     * Recupera o progresso do servidor e mescla com o local.
     * Usado após o login ou para restauração forçada.
     */
    static async pullFromServer(): Promise<{ success: boolean; pulledCount: number }> {
        try {
            const session = await getSession();
            if (!session?.user?.id) throw new Error("Usuário não autenticado");
            const userId = session.user.id;

            const response = await fetch("/api/sync/pull");
            if (!response.ok) throw new Error("Falha ao buscar dados remotos");

            const { progress: remoteProgress }: { progress: ProgressEntry[] } = await response.json();

            if (!remoteProgress.length) return { success: true, pulledCount: 0 };

            // 1. Coletar progresso local
            const localProgress = await db.progress.where("userId").equals(userId).toArray();

            // 2. Resolver conflitos (LWW)
            const resolveProgressConflicts = (await import("./conflicts")).resolveProgressConflicts;
            const finalProgress = resolveProgressConflicts(localProgress, remoteProgress);

            // 3. Atualizar Dexie (Limpa e reinsere para garantir integridade)
            // Nota: Em cenários de produção, bulkPut é melhor.
            await db.progress.where("userId").equals(userId).delete();
            await db.progress.bulkAdd(finalProgress);

            console.log(`[SyncQueue]: Recuperados ${remoteProgress.length} itens do servidor.`);
            return { success: true, pulledCount: remoteProgress.length };

        } catch (error) {
            console.error("[SyncPool Pull Error]:", error);
            return { success: false, pulledCount: 0 };
        }
    }
}
