export interface ProgressEntry {
    id?: number;         // auto-incremented
    questionId: string;
    userId: string;
    categoryKey: string; // ex: "enem_1", "vestibular_avancado"
    answeredAt: string;  // ISO 8601
    isCorrect: boolean;
    selectedAlternativeId: string;
    isSynced: boolean;       // tracked for offline first sync
    timeSpentMs?: number;
}

export interface DailyState {
    id?: number;         // auto-incremented
    date: string;        // ISO date "YYYY-MM-DD"
    userId: string;
    categoryKey: string; // ex: "enem_1", "vestibular_avancado"
    goalTotal: number;
    goalCompleted: number;
    goalReached: boolean;
    streakDay: number;
    pendingSync: boolean;
    questionQueue: string[]; // List of Question IDs generated for today
}
