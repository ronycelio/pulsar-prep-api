import { ProgressEntry } from "@/types/progress";

/**
 * Resolve conflitos de progresso entre dados locais e remotos.
 * Estratégia: Last-Write-Wins (LWW) baseado no answeredAt.
 */
export function resolveProgressConflicts(local: ProgressEntry[], remote: ProgressEntry[]): ProgressEntry[] {
    const combined = [...local, ...remote];
    const map = new Map<string, ProgressEntry>();

    for (const item of combined) {
        const existing = map.get(item.questionId);
        if (!existing || new Date(item.answeredAt) > new Date(existing.answeredAt)) {
            map.set(item.questionId, item);
        }
    }

    return Array.from(map.values());
}
