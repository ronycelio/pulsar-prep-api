"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, AlertCircle, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Question } from "@/types/question";

interface Props {
    userId: string;
    categoryKey: string;
}

interface ErrorItem {
    progressId: number;
    questionId: string;
    subject: string;
    date: string;
    questionData?: Question;
}

export function ErrorsView({ userId, categoryKey }: Props) {
    const [errors, setErrors] = useState<ErrorItem[]>([]);
    const [loading, setLoading] = useState(true);

    const rawProgress = useLiveQuery(
        () => db.progress
            .where("[userId+categoryKey]")
            .equals([userId, categoryKey])
            .filter(p => !p.isCorrect) // Apenas erros
            .reverse() // Mais recentes primeiro
            .limit(50) // Limite de histórico
            .toArray(),
        [userId, categoryKey]
    );

    // Quando o progresso carregar, buscar as questões originais
    useEffect(() => {
        async function loadQuestionData() {
            if (!rawProgress) return;

            try {
                // Mapear IDs das questões para hidratá-las do banco offline
                const qIds = rawProgress.map(p => p.questionId);
                const questions = await db.questions.where("id").anyOf(qIds).toArray();

                // Mapeia por ID pra busca rápida
                const qMap = new Map<string, Question>();
                questions.forEach(q => qMap.set(q.id, q));

                const hydrated = rawProgress.map(p => {
                    const qData = qMap.get(p.questionId);
                    return {
                        progressId: p.id!,
                        questionId: p.questionId,
                        subject: qData?.subject || "Desconhecida",
                        date: new Date(p.answeredAt).toLocaleDateString("pt-BR"),
                        questionData: qData
                    };
                });

                setErrors(hydrated);
            } catch (e) {
                console.error("Erro ao puxar questões erradas:", e);
            } finally {
                setLoading(false);
            }
        }

        loadQuestionData();
    }, [rawProgress]);

    if (rawProgress === undefined || loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (errors.length === 0) {
        return (
            <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <SearchX className="h-10 w-10 text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Caderno Limpo</h3>
                    <p className="text-muted-foreground text-sm max-w-[280px]">
                        Você ainda não errou nenhuma questão desta categoria ou apagou seu histórico. Continue os estudos!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-4 border-b">
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Revisão de Erros Recentes
                </CardTitle>
                <CardDescription>Reveja as últimas questões que você errou para fixar o conteúdo.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 p-0 sm:p-6">
                <Accordion type="single" collapsible className="w-full">
                    {errors.map((erro) => {
                        const q = erro.questionData;
                        const subjectName = erro.subject.charAt(0).toUpperCase() + erro.subject.slice(1);

                        return (
                            <AccordionItem key={erro.progressId} value={erro.progressId.toString()} className="border-b-0 mb-2 border rounded-lg overflow-hidden bg-card">
                                <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 data-[state=open]:bg-slate-50 dark:data-[state=open]:bg-slate-900 transition-colors">
                                    <div className="flex items-center text-left w-full gap-3">
                                        <Badge variant="outline" className="shrink-0">{subjectName}</Badge>
                                        <span className="text-sm font-medium line-clamp-1 flex-1">
                                            {q ? q.statement.substring(0, 80) + "..." : "Questão Indisponível"}
                                        </span>
                                        <span className="text-xs text-muted-foreground shrink-0 mr-2">{erro.date}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4 pt-2 border-t">
                                    {q ? (
                                        <div className="space-y-4">
                                            <div className="text-sm border-l-2 border-primary/40 pl-3">
                                                {q.statement}
                                            </div>

                                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 p-3 rounded-md text-sm">
                                                <div className="font-bold flex items-center gap-1 mb-1">
                                                    A Defesa da Resposta Certa (Alternativa {q.alternatives.find(a => a.id === q.correctAlternativeId)?.text}):
                                                </div>
                                                {q.explanation}
                                            </div>

                                            {/* Opcional: mostrar as demais como lista */}
                                            <div className="text-xs text-muted-foreground mt-2">
                                                <strong>Por que as outras estavam erradas?</strong>
                                                <ul className="list-disc pl-4 mt-1 space-y-1">
                                                    {q.alternatives.map(alt => {
                                                        if (alt.id === q.correctAlternativeId) return null;
                                                        return (
                                                            <li key={alt.id}>
                                                                <span className="font-semibold text-foreground/80">{alt.text})</span> {q.rationales?.[alt.id] || "Sem justificativa"}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground italic">
                                            O enunciado desta questão não foi encontrado no banco offline The question statement could not be found in the offline database.
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </CardContent>
        </Card>
    );
}
