"use client";

import { useEffect, useState } from "react";
import { SyncQueue } from "@/lib/sync/syncQueue";
import { toast } from "sonner";

/**
 * useNetworkStatus
 * Monitora o status da rede e dispara o flush da SyncQueue 
 * assim que o usuário volta a ficar online.
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
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Run sync on mount if online
        if (window.navigator.onLine) {
            SyncQueue.flush();
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return { isOnline };
}
