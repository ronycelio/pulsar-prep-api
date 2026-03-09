"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";

/**
 * NetworkStatusTrigger
 * Componente invisível que apenas ativa o hook de monitoramento de rede.
 */
export default function NetworkStatusTrigger() {
    useNetworkStatus();
    return null;
}
