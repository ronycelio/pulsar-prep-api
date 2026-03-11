"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import type { Question } from "@/types/question";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2, XCircle, ChevronDown, ChevronUp,
    ArrowRight, Flame, Trophy, Target, RotateCcw,
    Zap, Star, BarChart3
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
// Confetti simples em CSS puro
// ──────────────────────────────────────────────
function ConfettiPiece({ delay, left, color }: { delay: number; left: number; color: string }) {
    return (
        <div
            className="absolute top-0 w-2 h-2 rounded-sm animate-confetti"
            style={{
                left: `${left}%`,
                animationDelay: `${delay}s`,
                backgroundColor: color,
                animationDuration: `${1.5 + Math.random() * 1}s`,
            }}
        />
    );
}

function ConfettiBurst() {
    const pieces = Array.from({ length: 40 }, (_, i) => ({
        delay: Math.random() * 0.5,
        left: Math.random() * 100,
        color: ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"][Math.floor(Math.random() * 6)],
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {pieces.map((p, i) => <ConfettiPiece key={i} {...p} />)}
        </div>
    );
}

// ──────────────────────────────────────────────
// Tela de Celebração (meta batida!)
// ──────────────────────────────────────────────
function GoalCelebration({
    total, correct, streakDay, track, level, onExtraTraining, onGoToDashboard
}: {
    total: number;
    correct: number;
    streakDay: number;
    track: string;
    level: string;
    onExtraTraining: () => void;
    onGoToDashboard: () => void;
}) {
    const wrong = total - correct;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in duration-700">
            <ConfettiBurst />

            {/* Streak Badge de destaque */}
            {streakDay > 0 && (
                <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 mb-6 animate-in slide-in-from-top duration-500">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-bold text-orange-500">
                        {streakDay} {streakDay === 1 ? "dia" : "dias"} de Ofensiva 🔥
                    </span>
                </div>
            )}

            <div className="text-7xl mb-4 animate-in zoom-in duration-500">
                {pct >= 80 ? "🏆" : pct >= 60 ? "🎯" : "📚"}
            </div>

            <h1 className="text-3xl font-extrabold mb-2 text-center">
                {streakDay > 0 ? "Meta Concluída!" : "Sessão Concluída!"}
            </h1>
            <p className="text-muted-foreground text-sm mb-8 text-center max-w-xs">
                {pct >= 80
                    ? "Performance excelente! Você está dominando o conteúdo."
                    : pct >= 60
                    ? "Bom resultado! As explicações te ajudaram a aprender."
                    : "Continue praticando — cada erro é uma lição."}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-8">
                <div className="flex flex-col items-center bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-1" />
                    <span className="text-2xl font-black text-emerald-500">{correct}</span>
                    <span className="text-xs text-muted-foreground">Acertos</span>
                </div>
                <div className="flex flex-col items-center bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <XCircle className="h-5 w-5 text-red-500 mb-1" />
                    <span className="text-2xl font-black text-red-500">{wrong}</span>
                    <span className="text-xs text-muted-foreground">Erros</span>
                </div>
                <div className="flex flex-col items-center bg-primary/10 border border-primary/30 rounded-xl p-4">
                    <Target className="h-5 w-5 text-primary mb-1" />
                    <span className="text-2xl font-black text-primary">{pct}%</span>
                    <span className="text-xs text-muted-foreground">Acerto</span>
                </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col gap-3 w-full max-w-sm">
                <Button
                    size="lg"
                    className="w-full h-14 font-bold text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0 shadow-lg"
                    onClick={async () => {
                        setIsLoading(true);
                        await onExtraTraining();
                    }}
                    disabled={isLoading}
                >
                    <Zap className="h-5 w-5 mr-2" />
                    Treino Extra (bombar mais!)
                </Button>

                <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-12 font-bold"
                    onClick={onGoToDashboard}
                >
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Ver Dashboard
                </Button>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// Tela de Resumo Final (treino extra / fim de fila livre)
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
            <h1 className="text-3xl font-extrabold mb-1 text-center">Sessão Extra Concluída!</h1>
            <p className="text-muted-foreground mb-8 text-center">
                Você foi além da meta. Impressionante!
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
                    {isResetting ? "Preparando..." : "Mais Questões"}
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
    const [goalReached, setGoalReached] = useState(false);
    const [streakDay, setStreakDay] = useState(0);
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
                const newGoalReached = newCompleted >= state.goalTotal;

                // ── STREAK LOGIC ──
                // Só incrementa o streak na primeira vez que bate a meta hoje
                let newStreak = state.streakDay ?? 0;
                if (newGoalReached && !state.goalReached) {
                    // Verifica se ontem também tinha batido a meta (para calcular streak contínua)
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toISOString().split("T")[0];

                    const yesterdayState = await db.daily_state
                        .where("[userId+categoryKey+date]")
                        .equals([userId, categoryKey, yesterdayStr])
                        .first();

                    if (yesterdayState?.goalReached) {
                        // Continuidade: streak = streak de ontem + 1
                        newStreak = (yesterdayState.streakDay ?? 0) + 1;
                    } else {
                        // Novo streak ou primeiro dia
                        newStreak = (state.streakDay ?? 0) + 1;
                    }

                    setStreakDay(newStreak);
                    setGoalReached(true);
                }

                await db.daily_state.update(state.id, {
                    goalCompleted: newCompleted,
                    goalReached: newGoalReached,
                    streakDay: newStreak,
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

    // Tela de celebração: meta batida!
    if (finished && goalReached) {
        return (
            <GoalCelebration
                total={total}
                correct={correctCount}
                streakDay={streakDay}
                track={track}
                level={level}
                onGoToDashboard={() => router.push(`/dashboard/${track}/${level}`)}
                onExtraTraining={async () => {
                    // Esvazia a fila para gerar um novo lote de treino extra
                    const today = new Date().toISOString().split("T")[0];
                    const state = await db.daily_state
                        .where("[userId+categoryKey+date]")
                        .equals([userId, categoryKey, today])
                        .first();
                    if (state?.id != null) {
                        await db.daily_state.update(state.id, { questionQueue: [] });
                    }
                    router.push(`/study/${track}/${level}/select-subject`);
                }}
            />
        );
    }

    // Tela de resumo: sessão extra concluída
    if (finished) {
        return (
            <SessionSummary
                total={total}
                correct={correctCount}
                track={track}
                level={level}
                onRestart={async () => {
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
