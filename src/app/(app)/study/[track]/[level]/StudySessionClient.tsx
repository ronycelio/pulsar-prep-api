import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import type { Question } from "@/types/question";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2, XCircle, ChevronDown, ChevronUp,
    ArrowRight, Flame, Trophy, Target, RotateCcw
} from "lucide-react";

const ALT_LABELS = ["A", "B", "C", "D", "E"];

interface Props {
    questions: Question[];
    userId: string;
    track: string;
    level: string;
    categoryKey: string;
    subject: string;
}

// ──────────────────────────────────────────────
// Tela de Resumo Final
// ──────────────────────────────────────────────
function SessionSummary({
    total, correct, track, level, onRestart
}: { total: number; correct: number; track: string; level: string; onRestart: () => void }) {
    const router = useRouter();
    const [isResetting, setIsResetting] = useState(false);
    const wrong = total - correct;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const medal = pct >= 80 ? "🏆" : pct >= 60 ? "👍" : "📚";

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-in fade-in duration-500">
            <div className="text-6xl mb-4">{medal}</div>
            <h1 className="text-3xl font-extrabold mb-1 text-center">Sessão Concluída!</h1>
            <p className="text-muted-foreground mb-8 text-center">
                Confira seu aproveitamento de hoje
            </p>

            <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-8">
                <div className="flex flex-col items-center bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-1" />
                    <span className="text-2xl font-black text-emerald-500">{correct}</span>
                    <span className="text-xs text-muted-foreground">Acertos</span>
                </div>
                <div className="flex flex-col items-center bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <XCircle className="h-6 w-6 text-red-500 mb-1" />
                    <span className="text-2xl font-black text-red-500">{wrong}</span>
                    <span className="text-xs text-muted-foreground">Erros</span>
                </div>
                <div className="flex flex-col items-center bg-primary/10 border border-primary/30 rounded-xl p-4">
                    <Target className="h-6 w-6 text-primary mb-1" />
                    <span className="text-2xl font-black text-primary">{pct}%</span>
                    <span className="text-xs text-muted-foreground">Acerto</span>
                </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-sm">
                <Button
                    size="lg"
                    className="w-full h-12 font-bold"
                    onClick={() => router.push(`/dashboard/${track}/${level}`)}
                >
                    <Trophy className="h-5 w-5 mr-2" />
                    Ver Dashboard
                </Button>
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                        setIsResetting(true);
                        await onRestart();
                    }}
                    disabled={isResetting}
                >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {isResetting ? "Preparando..." : "Nova Sessão (Limpar Fila)"}
                </Button>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// Card de uma alternativa
// ──────────────────────────────────────────────
function AlternativeCard({
    label, text, state, rationale, explanation, isCorrect, onClick, confirmed
}: {
    label: string;
    text: string;
    state: "idle" | "selected-wrong" | "correct" | "other";
    rationale?: string;
    explanation?: string;
    isCorrect: boolean;
    onClick: () => void;
    confirmed: boolean;
}) {
    const [open, setOpen] = useState(false);

    const baseClass = "w-full text-left rounded-xl border-2 transition-all duration-200";

    const stateClasses = {
        "idle": "border-border bg-card hover:border-primary/40 hover:bg-primary/5 cursor-pointer",
        "selected-wrong": "border-red-500 bg-red-500/10 cursor-default",
        "correct": "border-emerald-500 bg-emerald-500/10 cursor-default",
        "other": "border-border/40 bg-muted/30 opacity-60 cursor-default",
    };

    const isExpanded = state === "selected-wrong" || state === "correct";

    return (
        <div className={`${baseClass} ${stateClasses[state]}`}>
            {/* Main row */}
            <div
                className={`flex items-center justify-between px-4 py-3 ${confirmed && state === "other" ? "cursor-pointer" : !confirmed ? "cursor-pointer" : ""}`}
                onClick={() => {
                    if (!confirmed) { onClick(); return; }
                    if (state === "other") setOpen((o) => !o);
                }}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`font-bold text-sm shrink-0 w-5 ${state === "correct" ? "text-emerald-500" : state === "selected-wrong" ? "text-red-500" : "text-muted-foreground"}`}>
                        {label})
                    </span>
                    <span className={`text-sm leading-snug ${state === "other" ? "text-muted-foreground" : "text-foreground"}`}>
                        {text}
                    </span>
                </div>
                {confirmed && (
                    <div className="ml-3 shrink-0">
                        {state === "correct" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                        {state === "selected-wrong" && <XCircle className="h-5 w-5 text-red-500" />}
                        {state === "other" && (open
                            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                    </div>
                )}
            </div>

            {/* Feedback expandido — para a selecionada errada */}
            {confirmed && state === "selected-wrong" && rationale && (
                <div className="px-4 pb-4 border-t border-red-500/20 pt-3">
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Por que você errou</p>
                    <p className="text-sm text-foreground/90">{rationale}</p>
                </div>
            )}

            {/* Feedback expandido — para a correta */}
            {confirmed && state === "correct" && (
                <div className="px-4 pb-4 border-t border-emerald-500/20 pt-3 space-y-2">
                    {explanation && (
                        <>
                            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Defesa da Resposta Certa</p>
                            <p className="text-sm text-foreground/90">{explanation}</p>
                        </>
                    )}
                </div>
            )}

            {/* Accordion para demais alternativas */}
            {confirmed && state === "other" && open && rationale && (
                <div className="px-4 pb-3 border-t border-border/30 pt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Por que está errada</p>
                    <p className="text-sm text-muted-foreground">{rationale}</p>
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────
// Componente Principal da Sessão
// ──────────────────────────────────────────────
export default function StudySessionClient({ questions, userId, track, level, categoryKey, subject }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [finished, setFinished] = useState(false);
    const router = useRouter();

    const question = questions[currentIndex];
    const total = questions.length;
    const progress = ((currentIndex) / total) * 100;

    const handleSelect = (altId: string) => {
        if (confirmed) return;
        setSelectedId(altId);
    };

    const handleConfirm = async () => {
        if (!selectedId || confirmed) return;
        setConfirmed(true);

        const isCorrect = selectedId === question.correctAlternativeId;
        if (isCorrect) setCorrectCount((c) => c + 1);

        // Save to Dexie progress
        try {
            await db.progress.add({
                questionId: question.id,
                userId,
                categoryKey,
                answeredAt: new Date().toISOString(),
                isCorrect,
                selectedAlternativeId: selectedId,
                isSynced: false,
            });

            // Update goalCompleted in daily_state
            const today = new Date().toISOString().split("T")[0];
            const state = await db.daily_state
                .where("[userId+categoryKey+date]")
                .equals([userId, categoryKey, today])
                .first();

            if (state?.id != null) {
                const newCompleted = (state.goalCompleted || 0) + 1;
                await db.daily_state.update(state.id, {
                    goalCompleted: newCompleted,
                    goalReached: newCompleted >= state.goalTotal,
                });
            }
        } catch (e) {
            console.error("Dexie save error:", e);
        }
    };

    const handleNext = () => {
        if (currentIndex + 1 >= total) {
            setFinished(true);
        } else {
            setCurrentIndex((i) => i + 1);
            setSelectedId(null);
            setConfirmed(false);
        }
    };

    if (finished) {
        return (
            <SessionSummary
                total={total}
                correct={correctCount}
                track={track}
                level={level}
                onRestart={async () => {
                    // Limpa a fila de hoje para forçar geração de novas questões
                    try {
                        const today = new Date().toISOString().split("T")[0];
                        const state = await db.daily_state
                            .where("[userId+categoryKey+date]")
                            .equals([userId, categoryKey, today])
                            .first();

                        if (state?.id != null) {
                            await db.daily_state.update(state.id, {
                                questionQueue: []
                            });
                        }
                    } catch (e) {
                        console.error(e);
                    }
                    router.push(`/study/${track}/${level}/select-subject`);
                }}
            />
        );
    }

    if (!question) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
                Nenhuma questão encontrada para esta seleção.
            </div>
        );
    }

    const subjectLabel = subject.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 animate-in fade-in duration-300">

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <BackButton href={`/dashboard/${track}/${level}`} />
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground font-medium">
                            {currentIndex + 1} de {total} questões
                        </span>
                        <span className="flex items-center gap-1 text-xs text-orange-500 font-semibold">
                            <Flame className="h-3.5 w-3.5" />
                            {subjectLabel}
                        </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-muted rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Subject tag */}
            <div className="mb-4">
                <span className="text-xs font-bold tracking-widest text-primary uppercase">
                    {question.subject} · {level === "1" ? "1º Ano" : level === "2" ? "2º Ano" : level === "3" ? "3º Ano" : "Avançado"}
                </span>
            </div>

            {/* Statement */}
            <div className="bg-card border rounded-xl px-5 py-4 mb-5 text-base leading-relaxed font-medium">
                {question.statement}
            </div>

            {/* Alternatives */}
            <div className="space-y-2.5 mb-6">
                {question.alternatives.map((alt, idx) => {
                    let state: "idle" | "selected-wrong" | "correct" | "other" = "idle";
                    if (confirmed) {
                        if (alt.id === question.correctAlternativeId) state = "correct";
                        else if (alt.id === selectedId) state = "selected-wrong";
                        else state = "other";
                    } else if (alt.id === selectedId) {
                        state = "correct"; // highlight selected before confirm (neutral blue not shown, just mark)
                        state = "idle"; // revert — will just show as selected via border below
                    }

                    const isSelectedPre = !confirmed && alt.id === selectedId;

                    return (
                        <div
                            key={alt.id}
                            className={isSelectedPre ? "ring-2 ring-primary rounded-xl" : ""}
                        >
                            <AlternativeCard
                                label={ALT_LABELS[idx]}
                                text={alt.text}
                                state={confirmed
                                    ? (alt.id === question.correctAlternativeId
                                        ? "correct"
                                        : alt.id === selectedId
                                            ? "selected-wrong"
                                            : "other")
                                    : "idle"
                                }
                                rationale={question.rationales?.[alt.id]}
                                explanation={question.explanation}
                                isCorrect={alt.id === question.correctAlternativeId}
                                onClick={() => handleSelect(alt.id)}
                                confirmed={confirmed}
                            />
                        </div>
                    );
                })}
            </div>

            {/* CTA */}
            {!confirmed ? (
                <Button
                    size="lg"
                    className="w-full h-13 text-base font-bold"
                    disabled={!selectedId}
                    onClick={handleConfirm}
                >
                    Confirmar Resposta
                </Button>
            ) : (
                <Button
                    size="lg"
                    className="w-full h-13 text-base font-bold"
                    onClick={handleNext}
                >
                    {currentIndex + 1 < total
                        ? <><ArrowRight className="mr-2 h-5 w-5" /> Próxima Questão</>
                        : <><Trophy className="mr-2 h-5 w-5" /> Ver Resultado Final</>
                    }
                </Button>
            )}
        </div>
    );
}
