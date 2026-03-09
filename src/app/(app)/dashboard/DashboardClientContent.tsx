"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, buildCategoryKey } from "@/lib/db";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, PlayCircle, Loader2 } from "lucide-react";
import { generateSessionQuestions } from "@/lib/engine/generator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { seedDatabase } from "@/lib/db/seed";

export default function DashboardClientContent({ userId }: { userId: string }) {
    const { track, level, dailyGoal } = useOnboardingStore();
    const router = useRouter();
    const [isGenerating, setIsGenerating] = useState(false);

    // Seed mock database on mount (somente para testes do MVP)
    useEffect(() => {
        seedDatabase().catch(console.error);
    }, []);

    // Timestamp unificado de busca para "hoje"
    const todayStr = new Date().toISOString().split('T')[0];

    // Build the categoryKey from current selection
    const categoryKey = track && level ? buildCategoryKey(track, level) : "";

    // Ler reativamente do banco offline Dexie.js
    const dailyState = useLiveQuery(
        () => {
            if (!userId || !categoryKey) return undefined;
            return db.daily_state
                .where("[userId+categoryKey+date]")
                .equals([userId, categoryKey, todayStr])
                .first();
        },
        [todayStr, userId, categoryKey]
    );

    const goalCompleted = dailyState?.goalCompleted || 0;
    const goalTotal = dailyState?.goalTotal || dailyGoal || 10;
    const streakDay = dailyState?.streakDay || 0;

    const handleStartStudy = async () => {
        if (!track || !level || !dailyGoal || !categoryKey) {
            toast.error("Configurações ausentes", { description: "Por favor, refaça o Onboarding para calibrar o motor." });
            return;
        }

        setIsGenerating(true);
        try {
            // Se já tem fila salva para hoje e não concluiu, apenas retome
            if (dailyState && dailyState.questionQueue && dailyState.questionQueue.length > 0 && goalCompleted < goalTotal) {
                router.push("/study");
                return;
            }

            // Invocar Motor Gerador 70/30 (Offline) - Agora requer categoryKey
            const result = await generateSessionQuestions(userId, track, level, dailyGoal, categoryKey);

            if (result.questions.length === 0) {
                toast.error("Acervo insuficiente", {
                    description: "O banco esgotou as questões para seu perfil atual. Continue reciclando os erros!"
                });
                setIsGenerating(false);
                return;
            }

            // Sobrescreve/Alimenta o estado de estudos diário salvando no Browser Storage
            await db.daily_state.put({
                id: dailyState?.id, // se existir, atualiza.
                date: todayStr,
                userId: userId,
                categoryKey: categoryKey, // Requisito do Schema v4
                goalTotal: dailyGoal,
                goalCompleted: goalCompleted, // mantem oq já fez se for treino extra
                goalReached: false,
                streakDay: streakDay,
                pendingSync: true,
                questionQueue: result.questions.map(q => q.id)
            });

            // Redireciona à Tela de Foco
            router.push("/study");
        } catch (error) {
            console.error(error);
            toast.error("Falha Crítica no Motor", { description: "Não foi possível compilar o lote diário 70/30." });
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm border-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Meta Diária</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{goalCompleted} <span className="text-muted-foreground text-xl">/ {goalTotal}</span></div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Questões resolvidas hoje.
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Ofensiva Atual</CardTitle>
                        <Flame className={`h-5 w-5 ${streakDay > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-black ${streakDay > 0 ? "text-orange-500" : "text-primary"}`}>{streakDay} <span className="text-xl text-muted-foreground">Dias</span></div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {streakDay > 0 ? "Fogo aceso! Continue assim!" : "Inicie seus estudos para acender a chama."}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-primary/5 hover:bg-primary/10 transition-colors border-primary/20 shadow-md">
                <CardContent className="flex flex-col md:flex-row items-center justify-between p-6">
                    <div className="space-y-1 mb-6 md:mb-0">
                        <h3 className="text-2xl font-bold tracking-tight">Pronto para treinar?</h3>
                        <p className="text-muted-foreground text-sm">O motor Inteligente separou o conteúdo ideal para lapidar seus erros.</p>
                    </div>
                    <Button
                        size="lg"
                        onClick={handleStartStudy}
                        disabled={isGenerating}
                        className="w-full md:w-auto text-lg h-14 font-bold px-8 shadow-lg hover:shadow-primary/25"
                    >
                        {isGenerating ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando Motor...</>
                        ) : dailyState?.goalCompleted === dailyState?.goalTotal && (dailyState?.goalTotal || 0) > 0 ? (
                            <><PlayCircle className="mr-2 h-6 w-6" /> Treino Extra Infinito</>
                        ) : dailyState?.questionQueue?.length && dailyState.goalCompleted < (dailyState.goalTotal || 0) ? (
                            <><PlayCircle className="mr-2 h-6 w-6" /> Continuar Progresso</>
                        ) : (
                            <><PlayCircle className="mr-2 h-6 w-6" /> Iniciar Meta de Hoje</>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
