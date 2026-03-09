import { db } from "../db";
import type { Question } from "@/types/question";
import type { ProgressEntry } from "@/types/progress";

export interface EngineResult {
    questions: Question[];
    stats: {
        newCount: number;
        reviewCount: number;
    };
}

/**
 * Motor de Geração de Questões 70/30
 * Opera 100% offline via Dexie API.
 * Histórico filtrado por categoryKey para isolamento por categoria.
 */
export async function generateSessionQuestions(
    userId: string,
    track: "enem" | "vestibular" | "medicina",
    level: "1" | "2" | "3" | "avancado",
    dailyGoal: number,
    categoryKey: string,
    subjectFilter?: string
): Promise<EngineResult> {

    // 1. Fetch user's entire progress to know what they've seen/missed
    const userProgress = await db.progress.where({ userId, categoryKey }).toArray();

    const answeredIds = new Set(userProgress.map(p => p.questionId));

    // Identify missed questions for the 30% spaced-repetition
    const missedIds = new Set(
        userProgress
            .filter(p => !p.isCorrect)
            .map(p => p.questionId)
    );

    // 2. Fetch all available questions for the track and level
    let possibleQuestions = await db.questions
        .where("[trackId+levelId]")
        .equals([track, level])
        .toArray();

    // FALLBACK DE SEGURANÇA: Se o índice composto falhar (comum no Firefox/Dexie em upgrades ou tipagem frouxa),
    // carrega e filtra usando scan manual forçado garantindo conversão de tipo.
    if (possibleQuestions.length === 0) {
        console.warn(`[Engine] Index composto não achou nada para [${track}, ${level}]. Tentando scan manual...`);
        const allLocal = await db.questions.toArray();
        possibleQuestions = allLocal.filter(q =>
            q.trackId === track && String(q.levelId) === String(level)
        );
        console.log(`[Engine] Scan manual encontrou ${possibleQuestions.length} questões na trilha e nível.`);
    }

    // 2.5 Filter by subject se providenciado
    if (subjectFilter) {
        const queryLabel = subjectFilter.toLowerCase();
        let targets: string[] = [];

        if (track === "enem") {
            if (queryLabel.includes("matematica")) targets = ["matemática", "matematica"];
            else if (queryLabel.includes("linguagens") || queryLabel.includes("portugues")) targets = ["linguagens", "língua portuguesa", "português", "portugues"];
            else if (queryLabel.includes("natureza") || queryLabel.includes("biologia") || queryLabel.includes("fisica") || queryLabel.includes("quimica")) targets = ["biologia", "física", "fisica", "química", "quimica", "ciências da natureza", "natureza"];
            else if (queryLabel.includes("humanas") || queryLabel.includes("historia") || queryLabel.includes("geo")) targets = ["história", "historia", "geografia", "filosofia", "sociologia", "ciências humanas", "humanas", "histgeo", "historia_geografia"];
            else targets = [queryLabel];
        } else {
            // Isolamento rigoroso para Vestibular
            if (queryLabel.includes("matematica")) targets = ["matemática", "matematica"];
            else if (queryLabel.includes("portugues") || queryLabel.includes("linguagens")) targets = ["português", "portugues", "língua portuguesa", "lingua portuguesa"];
            else if (queryLabel.includes("biologia")) targets = ["biologia"];
            else if (queryLabel.includes("fisica")) targets = ["física", "fisica"];
            else if (queryLabel.includes("quimica")) targets = ["química", "quimica"];
            else if (queryLabel.includes("hist") || queryLabel.includes("geo")) targets = ["histgeo", "historia", "geografia", "historia_geografia", "história"];
            else targets = [queryLabel];
        }

        if (targets.length > 0) {
            possibleQuestions = possibleQuestions.filter((q) =>
                targets.some((t) => q.subject.toLowerCase().includes(t))
            );
        }
    }

    // 3. Remover fallbacks indesejáveis: a lógica anterior puxava TODAS as da trilha se faltasse questão ou a matéria não clicasse! 
    // Com o banco real, nós garantimos que a meta seja limitada apenas as questões achadas *do subject pedido* e ponto.
    if (possibleQuestions.length === 0) {
        console.warn(`[Engine] Nenhuma questão local encontrada para ${track} -> ${level} -> ${subjectFilter}. O Dexie tem 11.5k questões? O seed foi rodado?`);
    }

    // 4. Separate into pools
    const reviewPool = possibleQuestions.filter(q => missedIds.has(q.id));
    const newPool = possibleQuestions.filter(q => !answeredIds.has(q.id));

    // 5. Calculate targets (70% new, 30% review)
    let reviewTarget = Math.floor(dailyGoal * 0.3);
    let newTarget = dailyGoal - reviewTarget;

    // Adjust if we don't have enough review questions
    if (reviewPool.length < reviewTarget) {
        reviewTarget = reviewPool.length;
        newTarget = dailyGoal - reviewTarget; // Shift the empty review slots to new questions
    }

    // Adjust if we don't have enough new questions
    if (newPool.length < newTarget) {
        newTarget = newPool.length;
        // Shift remaining to extra reviews if possible
        const remainder = dailyGoal - newTarget;
        reviewTarget = Math.min(reviewPool.length, reviewTarget + remainder);
    }

    // 5. Randomly pick from pools
    const shuffleList = (list: Question[]) => [...list].sort(() => 0.5 - Math.random());

    const selectedReview = shuffleList(reviewPool).slice(0, reviewTarget);
    const selectedNew = shuffleList(newPool).slice(0, newTarget);

    // 6. Combine and shuffle the final daily list
    const finalQueue = shuffleList([...selectedReview, ...selectedNew]);

    return {
        questions: finalQueue,
        stats: {
            newCount: selectedNew.length,
            reviewCount: selectedReview.length
        }
    };
}
