import Dexie, { type EntityTable } from "dexie";
import type { Question } from "@/types/question";
import type { ProgressEntry, DailyState } from "@/types/progress";
import { PULSAR_DB_NAME, PULSAR_DB_SCHEMA } from "@/lib/db/schema";

class PulsarPrepDatabase extends Dexie {
    questions!: EntityTable<Question, "id">;
    progress!: EntityTable<ProgressEntry, "id">;
    daily_state!: EntityTable<DailyState, "id">;
    settings!: EntityTable<{ id: string; track?: string; level?: string; dailyGoal?: number }, "id">;

    constructor() {
        super(PULSAR_DB_NAME);

        this.version(1).stores(PULSAR_DB_SCHEMA.v1);
        this.version(2).stores(PULSAR_DB_SCHEMA.v2);
        this.version(3).stores(PULSAR_DB_SCHEMA.v3);
        this.version(4).stores(PULSAR_DB_SCHEMA.v4);
        this.version(5).stores(PULSAR_DB_SCHEMA.v5);
    }
}

export const db = new PulsarPrepDatabase();

/** Helper: build the category key from track and level */
export function buildCategoryKey(track: string, level: string): string {
    return `${track}_${level}`;
}
