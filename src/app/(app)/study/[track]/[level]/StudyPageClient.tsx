"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db, buildCategoryKey } from "@/lib/db";
import type { Question } from "@/types/question";
import StudySessionClient from "./StudySessionClient";
import { generateSessionQuestions } from "@/lib/engine/generator";
import { Loader2 } from "lucide-react";

interface Props {
    params: { track: string; level: string };
    userId: string;
}

export default function StudyPageClient({ params, userId }: Props) {
    const searchParams = useSearchParams();
    const subject = searchParams.get("subject") || "";
    const categoryKey = buildCategoryKey(params.track, params.level);
    const today = new Date().toISOString().split("T")[0];

    const [questions, setQuestions] = useState<Question[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadQuestions() {
            try {
                // Try to get today's queue from daily_state
                const state = await db.daily_state
                    .where("[userId+categoryKey+date]")
                    .equals([userId, categoryKey, today])
                    .first();

                let qIds: string[] = state?.questionQueue ?? [];
                let loaded: Question[] = [];

                if (qIds.length > 0) {
                    loaded = await db.questions.where("id").anyOf(qIds).toArray();

                    // Se temos um `subject` escolhido agora, a fila antiga pertence à mesma matéria?
                    if (subject) {
                        if (subject) {
                            const queryLabel = subject.toLowerCase();

                            let targets: string[] = [];
                            if (params.track === "enem") {
                                if (queryLabel.includes("matematica")) targets = ["matemática", "matematica"];
                                else if (queryLabel.includes("linguagens") || queryLabel.includes("portugues")) targets = ["linguagens", "língua portuguesa", "português", "portugues"];
                                else if (queryLabel.includes("natureza") || queryLabel.includes("biologia") || queryLabel.includes("fisica") || queryLabel.includes("quimica")) targets = ["biologia", "física", "fisica", "química", "quimica", "ciências da natureza", "natureza"];
                                else if (queryLabel.includes("humanas") || queryLabel.includes("historia") || queryLabel.includes("geo")) targets = ["história", "historia", "geografia", "filosofia", "sociologia", "ciências humanas", "humanas", "histgeo", "historia_geografia"];
                                else targets = [queryLabel];
                            } else {
                                // Vestibular rigoroso
                                if (queryLabel.includes("matematica")) targets = ["matemática", "matematica"];
                                else if (queryLabel.includes("portugues") || queryLabel.includes("linguagens")) targets = ["português", "portugues", "língua portuguesa", "lingua portuguesa"];
                                else if (queryLabel.includes("biologia")) targets = ["biologia"];
                                else if (queryLabel.includes("fisica")) targets = ["física", "fisica"];
                                else if (queryLabel.includes("quimica")) targets = ["química", "quimica"];
                                else if (queryLabel.includes("hist") || queryLabel.includes("geo")) targets = ["histgeo", "historia", "geografia", "historia_geografia", "história"];
                                else targets = [queryLabel];
                            }

                            const matchesSubject = loaded.some(q =>
                                targets.some(t => q.subject.toLowerCase().includes(t))
                            );

                            // Se a fila que estava salva não bater com a disciplina escolhida agora,
                            // descarta! Faremos gerar uma nova logogo abaixo.
                            if (!matchesSubject) {
                                console.log(`[Study] Matéria mudou ou não bate (${subject}). Descartando fila antiga. Fila lida:`, loaded[0]?.subject);
                                qIds = [];
                                loaded = [];
                            }
                        }
                    }
                }

                // If no queue (or discarded because user changed subjects), generate one now
                if (qIds.length === 0) {
                    // Fallback seguro por nível — nunca usa hardcode 5 para todos os níveis
                    const MAX_GOAL_BY_LEVEL: Record<string, number> = { "1": 5, "2": 15, "3": 20, "avancado": 30 };
                    const targetGoal = state?.goalTotal ? Number(state.goalTotal) : (MAX_GOAL_BY_LEVEL[params.level] ?? 10);
                    console.log(`[Study] Gerando nova fila. Meta: ${targetGoal}, Matéria: ${subject || 'Todas'}`);

                    const result = await generateSessionQuestions(
                        userId, params.track as any, params.level as any, targetGoal, categoryKey, subject
                    );
                    console.log(`[Study] Motor retornou ${result.questions.length} questões.`);
                    qIds = result.questions.map((q) => q.id);
                    loaded = result.questions;

                    // Persist the NEW generated queue
                    await db.daily_state.put({
                        id: state?.id,
                        date: today,
                        userId,
                        categoryKey,
                        goalTotal: targetGoal, // Restaura exatamente o que veio do Slider do Dashboard
                        goalCompleted: state?.goalCompleted ?? 0,
                        goalReached: state?.goalReached ?? false,
                        streakDay: state?.streakDay ?? 0,
                        pendingSync: true,
                        questionQueue: qIds,
                    });
                }

                if (loaded.length === 0) {
                    setError("Nenhuma questão encontrada para esta matéria. Tente outra ou recarregue o banco de dados.");
                    return;
                }

                setQuestions(loaded);
            } catch (e) {
                console.error(e);
                setError("Erro ao carregar questões. Tente novamente.");
            }
        }

        loadQuestions();
    }, [userId, categoryKey, subject, today, params.track, params.level]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center gap-4">
                <p className="text-destructive text-lg font-semibold">{error}</p>
            </div>
        );
    }

    if (!questions) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <StudySessionClient
            questions={questions}
            userId={userId}
            track={params.track}
            level={params.level}
            categoryKey={categoryKey}
            subject={subject}
        />
    );
}
