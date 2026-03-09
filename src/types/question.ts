// Fixed JSON contract for questions — do NOT change without migration script
export interface Question {
    id: string;
    trackId: "enem" | "vestibular" | "medicina"; // aligned with Onboarding
    levelId: "1" | "2" | "3" | "avancado";       // aligned with Onboarding
    subject: string;       // e.g. "Matemática", "Biologia"
    difficulty: "easy" | "medium" | "hard";
    year?: number;
    statement: string;
    alternatives: Alternative[];
    correctAlternativeId: string;
    explanation: string;
    rationales?: Record<string, string>; // Maps alternativeId -> logic behind why it's wrong (FR19)
    tags?: string[];
}

export interface Alternative {
    id: string;
    text: string;
}
