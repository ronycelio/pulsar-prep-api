"use client";

import { useOnboardingStore } from "@/stores/onboardingStore";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, buildCategoryKey } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, Rocket, Trophy, CheckCircle2, Lock } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useEffect } from "react";
import { toast } from "sonner";

const LEVEL_OPTIONS = [
    {
        value: "1" as const,
        label: "1º Ano",
        sub: "Ensino Médio  ·  até 5 questões/dia",
        icon: <BookOpen className="h-6 w-6" />,
        activeClass: "border-emerald-500 text-emerald-600",
        hoverClass: "hover:border-emerald-400 hover:bg-emerald-500/5",
    },
    {
        value: "2" as const,
        label: "2º Ano",
        sub: "Ensino Médio  ·  até 15 questões/dia",
        icon: <Target className="h-6 w-6" />,
        activeClass: "border-sky-500 text-sky-600",
        hoverClass: "hover:border-sky-400 hover:bg-sky-500/5",
    },
    {
        value: "3" as const,
        label: "3º Ano — Terceirão",
        sub: "Intensivo pré-vestibular  ·  até 20 questões/dia",
        icon: <Rocket className="h-6 w-6" />,
        activeClass: "border-primary text-primary",
        hoverClass: "hover:border-primary hover:bg-primary/5",
    },
    {
        value: "avancado" as const,
        label: "Cursinho / Avançado",
        sub: "Reforço intensivo  ·  até 30 questões/dia",
        icon: <Trophy className="h-6 w-6 text-amber-500" />,
        activeClass: "border-amber-500 text-amber-600",
        hoverClass: "hover:border-amber-400 hover:bg-amber-500/5",
    },
];

export default function LevelSelectionClient({ isPremium }: { isPremium?: boolean }) {
    const { track, setLevel } = useOnboardingStore();
    const router = useRouter();

    useEffect(() => {
        if (!track) router.replace("/onboarding/track");
    }, [track, router]);

    // Query all daily_states to find which category keys already have any progress
    // We filter in JS since goalCompleted is not indexed — this is a small dataset so it's fine
    const allDailyStates = useLiveQuery(
        () => db.daily_state.toArray(),
        []
    );

    const categoryKeysWithProgress = new Set(
        (allDailyStates || [])
            .filter((s) => s.goalCompleted > 0)
            .map((s) => s.categoryKey)
    );

    const handleSelect = (level: "1" | "2" | "3" | "avancado") => {
        // Bloqueio de Paywall (Níveis superiores são para Premium apenas)
        if (!isPremium && level !== "1") {
            toast.error("Nível Exclusivo Premium", {
                description: "Acesse planos vitálicios para desbloquear as trilhas 2º, 3º e Avançado.",
                action: {
                    label: "Assinar",
                    onClick: () => router.push("/paywall")
                }
            });
            return;
        }

        setLevel(level);
        router.push(`/dashboard/${track}/${level}`);
    };

    if (!track) return null;

    const trackLabel = track === "enem" ? "ENEM" : "Vestibular";

    return (
        <Card className="w-full max-w-md shadow-xl border-2 bg-background/60 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
            <CardHeader className="text-center pb-6 pt-6 border-b">
                <div className="flex justify-start mb-4">
                    <BackButton href="/onboarding/track" />
                </div>
                <CardTitle className="text-2xl font-bold">
                    {trackLabel} — Qual o seu nível?
                </CardTitle>
                <CardDescription className="text-base mt-2">
                    Cada nível tem seu progresso independente. Escolha à vontade!
                </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 pb-8 space-y-3">
                {LEVEL_OPTIONS.map((lvl) => {
                    const key = buildCategoryKey(track, lvl.value);
                    const hasProgress = categoryKeysWithProgress.has(key);
                    const isLocked = !isPremium && lvl.value !== "1";

                    return (
                        <Button
                            key={lvl.value}
                            variant="outline"
                            className={`w-full min-h-[5rem] h-auto whitespace-normal justify-start px-4 py-3 border-2 transition-all duration-200
                                ${isLocked ? "opacity-60 bg-muted/50 grayscale-[0.5] hover:bg-muted/50 cursor-not-allowed" : ""}
                                ${hasProgress && !isLocked
                                    ? `${lvl.activeClass} bg-opacity-5`
                                    : !isLocked ? `text-muted-foreground border-border ${lvl.hoverClass}` : ""
                                }`}
                            onClick={() => handleSelect(lvl.value)}
                        >
                            <div className={`mr-4 shrink-0 mt-1 self-start ${hasProgress && !isLocked ? lvl.activeClass.split(" ")[1] : "text-muted-foreground"}`}>
                                {isLocked ? <Lock className="h-6 w-6 text-muted-foreground/70" /> : lvl.icon}
                            </div>
                            <div className="flex flex-col items-start flex-1 min-w-0 pb-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className={`font-semibold text-base leading-tight ${hasProgress && !isLocked ? lvl.activeClass.split(" ")[1] : ""}`}>
                                        {lvl.label}
                                    </span>
                                    {hasProgress && (
                                        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border border-primary/30 flex items-center gap-1">
                                            <CheckCircle2 className="h-2.5 w-2.5" />
                                            Andamento
                                        </Badge>
                                    )}
                                </div>
                                <span className="text-xs leading-relaxed text-muted-foreground text-left">{lvl.sub}</span>
                            </div>
                        </Button>
                    );
                })}
            </CardContent>
        </Card>
    );
}
