"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

import { useState, useEffect } from "react";
import type { Question } from "@/types/question";

interface Props {
    userId: string;
    categoryKey: string;
}

export function StatsView({ userId, categoryKey }: Props) {
    const [statsList, setStatsList] = useState<{ subject: string; hitRate: number; total: number; correct: number }[]>([]);
    const [loading, setLoading] = useState(true);

    const rawProgress = useLiveQuery(
        () => db.progress.where("[userId+categoryKey]").equals([userId, categoryKey]).toArray(),
        [userId, categoryKey]
    );

    useEffect(() => {
        async function calculateStats() {
            if (!rawProgress) return;

            if (rawProgress.length === 0) {
                setStatsList([]);
                setLoading(false);
                return;
            }

            try {
                // Fetch all unique question IDs answered
                const qIds = Array.from(new Set(rawProgress.map(p => p.questionId)));
                const questions = await db.questions.where("id").anyOf(qIds).toArray();

                const qMap = new Map<string, Question>();
                questions.forEach(q => qMap.set(q.id, q));

                // Agrupar por matéria
                const statsBySubject: Record<string, { total: number; correct: number }> = {};

                rawProgress.forEach((p) => {
                    const q = qMap.get(p.questionId);
                    const subject = q?.subject || "Desconhecida";

                    if (!statsBySubject[subject]) {
                        statsBySubject[subject] = { total: 0, correct: 0 };
                    }
                    statsBySubject[subject].total += 1;
                    if (p.isCorrect) {
                        statsBySubject[subject].correct += 1;
                    }
                });

                const list = Object.entries(statsBySubject).map(([key, data]) => {
                    const labelStr = key === "Desconhecida" ? key : key.charAt(0).toUpperCase() + key.slice(1);
                    const hitRate = Math.round((data.correct / data.total) * 100);
                    return {
                        subject: labelStr,
                        hitRate,
                        total: data.total,
                        correct: data.correct,
                    };
                }).sort((a, b) => b.total - a.total);

                setStatsList(list);
            } catch (e) {
                console.error("Erro ao calcular estatísticas", e);
            } finally {
                setLoading(false);
            }
        }

        calculateStats();
    }, [rawProgress]);

    if (rawProgress === undefined || loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (statsList.length === 0 && !loading) {
        return (
            <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <h3 className="text-lg font-bold mb-2">Sem estatísticas</h3>
                    <p className="text-muted-foreground text-sm max-w-[280px]">
                        Você ainda não concluiu nenhuma questão desta categoria. Comece seus estudos para ver suas estatísticas!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg">Desempenho por Matéria</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {statsList.map((stat) => (
                    <div key={stat.subject} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold">{stat.subject}</span>
                            <span className="text-muted-foreground">{stat.correct} de {stat.total} acertadas ({stat.hitRate}%)</span>
                        </div>
                        <Progress value={stat.hitRate} className="h-2" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
