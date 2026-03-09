"use client";

import { useOnboardingStore } from "@/stores/onboardingStore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Flame, Loader2 } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useEffect, useState, useMemo } from "react";
import { completeOnboardingAction } from "@/lib/actions/onboarding";
import { toast } from "sonner";

export default function GoalSelectionPage() {
    const { track, level, dailyGoal, setDailyGoal } = useOnboardingStore();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Regra de Negócio de Preservação do Banco de Inéditas (70/30)
    const maxGoalAllowed = useMemo(() => {
        if (level === "1") return 5;
        if (level === "2") return 15;
        if (level === "3") return 20;
        return 30; // avançado
    }, [level]);

    useEffect(() => {
        if (!track || !level) {
            router.replace("/onboarding/track");
            return;
        }

        // Auto-ajuste de segurança caso o usuário volte as telas reduzindo o ano
        if (dailyGoal && dailyGoal > maxGoalAllowed) {
            setDailyGoal(maxGoalAllowed);
        }
    }, [track, level, router, maxGoalAllowed, dailyGoal, setDailyGoal]);

    const handleFinish = async () => {
        if (!track || !level || !dailyGoal) return;

        setIsSubmitting(true);
        try {
            const formData = { track, level, dailyGoal };
            const result = await completeOnboardingAction(formData);

            if (result.error) {
                toast.error("Ocorreu um erro", {
                    description: result.error,
                });
                setIsSubmitting(false);
                return;
            }

            // Sync Dexie - We will add this later mas conceitualmente pronto
            router.push("/dashboard");

        } catch (e) {
            setIsSubmitting(false);
            toast.error("Falha de conexão", {
                description: "Não foi possível contactar o servidor.",
            });
        }
    };

    if (!track || !level) return null;

    return (
        <Card className="w-full max-w-md shadow-lg border-2 border-transparent bg-background/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-6 pt-6 border-b">
                <div className="flex justify-start mb-4">
                    <BackButton />
                </div>
                <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Flame className="text-orange-500 h-6 w-6" />
                    Meta Diária de Questões
                </CardTitle>
                <CardDescription className="text-base mt-2">
                    Frequência é tudo! Quantas questões você fará por dia?
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 pb-4">
                <div className="flex flex-col items-center justify-center space-y-8">
                    <div className="text-6xl font-black text-primary transition-all duration-200">
                        {dailyGoal || Math.min(10, maxGoalAllowed)}
                    </div>

                    <Slider
                        defaultValue={[dailyGoal || Math.min(10, maxGoalAllowed)]}
                        max={maxGoalAllowed}
                        min={1}
                        step={1}
                        onValueChange={(vals: number[]) => setDailyGoal(vals[0])}
                        className="w-[80%]"
                    />

                    <p className="text-sm text-muted-foreground text-center px-4">
                        Limitar a carga ao seu ano minimiza queima de questões inéditas fáceis.
                        O motor 70/30 preserva o restante pro vestibular!
                    </p>
                </div>
            </CardContent>
            <CardFooter className="pt-4 pb-6 px-6">
                <Button
                    className="w-full h-12 text-lg font-bold"
                    onClick={handleFinish}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Finalizando...
                        </>
                    ) : (
                        "Começar a Estudar!"
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
