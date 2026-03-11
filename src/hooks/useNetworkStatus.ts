"use client";

import { useEffect, useState } from "react";
import { SyncQueue } from "@/lib/sync/syncQueue";
import { toast } from "sonner";
import { db } from "@/lib/db";

const PULL_DONE_KEY = "pulsar_pull_done";

/**
 * useNetworkStatus
 * Epic 5 — Monitora rede e dispara sincronização automática.
 * 
 * Comportamento:
 * - Ao montar (online): flush de items pendentes + pull cross-device (se primeiro acesso no dispositivo)
 * - window 'online': flush de items pendentes
 * - window 'offline': log + estado isOnline = false
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(
        typeof window !== "undefined" ? window.navigator.onLine : true
    );

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleOnline = async () => {
            setIsOnline(true);
            console.log("[Network]: Online. Tentando sincronizar progresso pendente...");

            const result = await SyncQueue.flush();

            if (result.success && result.syncedCount > 0) {
                toast.success("Progresso sincronizado", {
                    description: `${result.syncedCount} questões foram enviadas para o servidor.`,
                });
            } else if (!result.success) {
                console.error("[Sync Error]:", result.error);
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            console.warn("[Network]: Offline. O progresso será salvo apenas localmente.");
            toast.warning("Sem conexão", {
                description: "Estudando offline. Seu progresso será sincronizado quando a internet voltar.",
                duration: 4000,
            });
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // ── Ao montar: flush de pendentes + pull cross-device (primeiro acesso) ──
        if (window.navigator.onLine) {
            // 1. Flush de pendentes
            SyncQueue.flush().then(result => {
                if (result.success && result.syncedCount > 0) {
                    console.log(`[SyncQueue] Flush no mount: ${result.syncedCount} itens enviados.`);
                }
            });

            // 2. Cross-device pull: executa UMA vez por device (localStorage flag)
            const pullAlreadyDone = localStorage.getItem(PULL_DONE_KEY);
            if (!pullAlreadyDone) {
                // Verifica se o Dexie está vazio para este usuário (novo device)
                db.progress.count().then(async (localCount) => {
                    if (localCount === 0) {
                        console.log("[Network]: Banco local vazio — executando pull cross-device...");
                        const pullResult = await SyncQueue.pullFromServer();

                        if (pullResult.success && pullResult.pulledCount > 0) {
                            toast.success("Progresso restaurado!", {
                                description: `${pullResult.pulledCount} questões recuperadas do servidor. Bem-vindo de volta!`,
                                duration: 5000,
                            });
                        }
                    }
                    // Marca como feito (independente do resultado)
                    localStorage.setItem(PULL_DONE_KEY, "1");
                });
            }
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return { isOnline };
}
