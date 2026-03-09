"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, buildCategoryKey } from "@/lib/db";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Flame, PlayCircle, Loader2, RotateCcw, ArrowLeft,
    BookOpen, Target, CheckCircle2,
    LayoutDashboard, BarChart3, ListFilter
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { seedDatabase } from "@/lib/db/seed";
import { StatsView } from "./StatsView";
import { ErrorsView } from "./ErrorsView";

interface Props {
    userId: string;
    track: "enem" | "vestibular";
    level: "1" | "2" | "3" | "avancado";
    trackLabel: string;
    levelLabel: string;
    isPremium?: boolean;
}

const MAX_GOAL: Record<string, number> = {
    "1": 5,
    "2": 15,
    "3": 20,
    "avancado": 30,
};

export default function DashboardCategoryClient({ userId, track, level, trackLabel, levelLabel, isPremium }: Props) {
    const router = useRouter();
    const { setTrack, setLevel, setDailyGoal, dailyGoal } = useOnboardingStore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState("");
    const [isResetting, setIsResetting] = useState(false);
    const [localGoal, setLocalGoal] = useState<number>(5);

    const categoryKey = useMemo(() => buildCategoryKey(track, level), [track, level]);
    const maxGoal = MAX_GOAL[level] ?? 10;
    const todayStr = new Date().toISOString().split("T")[0];

    // Sync Zustand with the current route params
    useEffect(() => {
        setTrack(track);
        setLevel(level);
    }, [track, level, setTrack, setLevel]);

    // Seed mock questions on first load
    useEffect(() => {
        seedDatabase().catch(console.error);
    }, []);

    // Live state for today's session in this category
    const dailyState = useLiveQuery(
        () => db.daily_state
            .where("[userId+categoryKey+date]")
            .equals([userId, categoryKey, todayStr])
            .first(),
        [userId, categoryKey, todayStr]
    );

    // Cumulative stats for this category (all time)
    const totalAnswered = useLiveQuery(
        () => db.progress.where("[userId+categoryKey]").equals([userId, categoryKey]).count(),
        [userId, categoryKey]
    );

    const totalCorrect = useLiveQuery(
        () => db.progress
            .where("[userId+categoryKey]")
            .equals([userId, categoryKey])
            .filter((p) => p.isCorrect)
            .count(),
        [userId, categoryKey]
    );

    // Global stats across all categories to enforce Paywall 50-limit on Free Accounts
    const globalTotalAnswered = useLiveQuery(
        () => db.progress.where("userId").equals(userId).count(),
        [userId]
    );

    // Set initial slider from dailyState or Zustand or max
    useEffect(() => {
        if (dailyState?.goalTotal) {
            setLocalGoal(dailyState.goalTotal);
        } else if (dailyGoal && dailyGoal <= maxGoal) {
            setLocalGoal(dailyGoal);
        } else {
            setLocalGoal(Math.min(maxGoal, 5));
        }
    }, [dailyState, dailyGoal, maxGoal]);

    const goalCompleted = dailyState?.goalCompleted ?? 0;
    const goalTotal = localGoal;
    const streakDay = dailyState?.streakDay ?? 0;
    const accuracy = totalAnswered ? Math.round(((totalCorrect ?? 0) / totalAnswered) * 100) : 0;

    const handleSliderChange = (vals: number[]) => {
        setLocalGoal(vals[0]);
        setDailyGoal(vals[0]);
    };

    const handleStartStudy = async () => {
        setIsGenerating(true);
        try {
            // Trava de Paywall: Degustação expira em 50 questões no modelo Gratuito
            if (!isPremium && (globalTotalAnswered ?? 0) >= 50) {
                toast.error("Degustação Concluída 🚀", {
                    description: "Seu limite de 50 questões gratuitas foi atingido. Desbloqueie o acesso vitalício para continuar evoluindo!",
                    action: {
                        label: "Assinar",
                        onClick: () => router.push("/paywall")
                    },
                    duration: 6000,
                });
                setIsGenerating(false);
                return;
            }

            // Se já bateu a meta, queremos esvaziar a fila e atualizar goalTotal
            // com o valor atual do slider para que o StudyPageClient gere a fila correta.
            if (isGoalDone && dailyState?.id) {
                await db.daily_state.update(dailyState.id, {
                    questionQueue: [],
                    goalTotal: localGoal,   // ← garante que o motor use o slider atual
                    goalCompleted: 0,       // ← reseta o progresso do treino extra
                    goalReached: false,
                });
            } else if (dailyState?.id) {
                await db.daily_state.update(dailyState.id, {
                    goalTotal: localGoal
                });
            } else {
                await db.daily_state.put({
                    date: todayStr,
                    userId,
                    categoryKey,
                    goalTotal: localGoal,
                    goalCompleted: goalCompleted,
                    goalReached: false,
                    streakDay,
                    pendingSync: true,
                    questionQueue: [],
                });
            }

            // Redirecionamos para a seleção de matérias. 
            // O StudyPageClient que fará a geração via Engine.
            router.push(`/study/${track}/${level}/select-subject`);
        } catch (e) {
            console.error(e);
            toast.error("Erro ao iniciar sessão", { description: "Tente novamente." });
            setIsGenerating(false);
        }
    };

    const handleReset = async () => {
        if (resetConfirmText.toUpperCase() !== "RESETAR") {
            toast.error("Digite RESETAR para confirmar.");
            return;
        }
        setIsResetting(true);
        try {
            // Delete all progress entries for this category
            await db.progress
                .where("[userId+categoryKey]")
                .equals([userId, categoryKey])
                .delete();

            // Delete all daily_state entries for this category
            const statesToDelete = await db.daily_state
                .where("[userId+categoryKey+date]")
                .between([userId, categoryKey, "0000-00-00"], [userId, categoryKey, "9999-99-99"])
                .toArray();
            await db.daily_state.bulkDelete(statesToDelete.map((s) => s.id!));

            toast.success("Progresso resetado!", {
                description: `Todo o histórico de ${trackLabel} ${levelLabel} foi apagado.`,
            });
        } catch (e) {
            toast.error("Erro ao resetar. Tente novamente.");
        } finally {
            setIsResetting(false);
            setResetConfirmText("");
        }
    };

    const progressPercent = goalTotal > 0 ? Math.round((goalCompleted / goalTotal) * 100) : 0;
    const isGoalDone = goalCompleted >= goalTotal && goalTotal > 0;

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-2xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <BackButton href="/onboarding/level" />
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">{trackLabel} · {levelLabel}</h1>
                    <p className="text-muted-foreground text-sm">Dashboard de Estudos</p>
                </div>
            </div>

            {/* Tabs de Navegação */}
            <Tabs defaultValue="inicio" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="inicio" className="text-xs sm:text-sm">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Início</span>
                    </TabsTrigger>
                    <TabsTrigger value="estatisticas" className="text-xs sm:text-sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Estatísticas</span>
                    </TabsTrigger>
                    <TabsTrigger value="revisao" className="text-xs sm:text-sm">
                        <ListFilter className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Revisão</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="inicio" className="animate-in fade-in duration-500">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        <Card>
                            <CardHeader className="pb-1 pt-4 px-4">
                                <CardTitle className="text-xs text-muted-foreground font-medium">Meta Hoje</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="text-2xl font-black">{goalCompleted} <span className="text-muted-foreground text-base font-normal">/ {goalTotal}</span></div>
                                {isGoalDone && <Badge className="mt-1 text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Concluída!</Badge>}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-1 pt-4 px-4">
                                <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    <Flame className={`h-3 w-3 ${streakDay > 0 ? "text-orange-500" : ""}`} />
                                    Ofensiva
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className={`text-2xl font-black ${streakDay > 0 ? "text-orange-500" : ""}`}>
                                    {streakDay} <span className="text-base font-normal text-muted-foreground">dias</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hidden lg:block">
                            <CardHeader className="pb-1 pt-4 px-4">
                                <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    <BookOpen className="h-3 w-3" />
                                    Total
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="text-2xl font-black">{totalAnswered ?? 0}</div>
                                <p className="text-xs text-muted-foreground">questões feitas</p>
                            </CardContent>
                        </Card>

                        <Card className="hidden lg:block">
                            <CardHeader className="pb-1 pt-4 px-4">
                                <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    <Target className="h-3 w-3" />
                                    Acerto
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="text-2xl font-black">{accuracy}<span className="text-base font-normal text-muted-foreground">%</span></div>
                                <p className="text-xs text-muted-foreground">aproveitamento</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Progress Bar */}
                    {goalTotal > 0 && (
                        <div className="mb-6">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Progresso de hoje</span>
                                <span>{progressPercent}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                                <div
                                    className="bg-primary h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Daily Goal Slider */}
                    <Card className="mb-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Flame className="h-4 w-4 text-orange-500" />
                                Meta Diária de Questões
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pb-4">
                            <div className="text-5xl font-black text-primary text-center">{localGoal}</div>
                            <Slider
                                value={[localGoal]}
                                onValueChange={handleSliderChange}
                                min={1}
                                max={maxGoal}
                                step={1}
                                className="w-full"
                            />
                            <p className="text-xs text-muted-foreground text-center">
                                Para {levelLabel}: mínimo 1, máximo {maxGoal} questões/dia
                            </p>
                        </CardContent>
                    </Card>

                    {/* CTA + Reset */}
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-6">
                            <Button
                                size="lg"
                                className="w-full h-14 text-lg font-bold shadow-md hover:shadow-primary/30 mb-4"
                                onClick={handleStartStudy}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando Sessão...</>
                                ) : isGoalDone ? (
                                    <><PlayCircle className="mr-2 h-6 w-6" /> Treino Extra (Revisão)</>
                                ) : goalCompleted > 0 ? (
                                    <><PlayCircle className="mr-2 h-6 w-6" /> Continuar Meta ({goalCompleted}/{goalTotal})</>
                                ) : (
                                    <><PlayCircle className="mr-2 h-6 w-6" /> Iniciar Estudos do Dia</>
                                )}
                            </Button>

                            {/* Reset Button */}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-muted-foreground border-muted-foreground/30 hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5 transition-colors"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Resetar Progresso de {trackLabel} {levelLabel}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-destructive">
                                            ⚠️ Resetar {trackLabel} · {levelLabel}?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="space-y-3">
                                            <p>
                                                Você está prestes a apagar <strong>TODO o histórico</strong> de{" "}
                                                <strong>{trackLabel} {levelLabel}</strong>, incluindo questões respondidas,
                                                ofensiva e caderno de erros.
                                            </p>
                                            <p className="text-destructive font-medium">
                                                Esta ação é IRREVERSÍVEL e não afeta outras categorias.
                                            </p>
                                            <p className="text-sm">
                                                Para confirmar, digite <strong>RESETAR</strong> abaixo:
                                            </p>
                                            <input
                                                type="text"
                                                value={resetConfirmText}
                                                onChange={(e) => setResetConfirmText(e.target.value)}
                                                placeholder="Digite RESETAR"
                                                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-destructive/50"
                                            />
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setResetConfirmText("")}>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleReset}
                                            disabled={resetConfirmText.toUpperCase() !== "RESETAR" || isResetting}
                                            className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-40"
                                        >
                                            {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Reset"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="estatisticas" className="animate-in fade-in duration-500">
                    <StatsView userId={userId} categoryKey={categoryKey} />
                </TabsContent>

                <TabsContent value="revisao" className="animate-in fade-in duration-500">
                    <ErrorsView userId={userId} categoryKey={categoryKey} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
