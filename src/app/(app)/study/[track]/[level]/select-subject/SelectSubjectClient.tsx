"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface Subject {
    id: string;
    label: string;
    emoji: string;
    activeBorder: string;
    activeBg: string;
}

const ENEM_SUBJECTS: Subject[] = [
    { id: "matematica", label: "Matemática", emoji: "🔢", activeBorder: "hover:border-blue-500", activeBg: "hover:bg-blue-500/5" },
    { id: "linguagens", label: "Linguagens e Códigos", emoji: "📝", activeBorder: "hover:border-purple-500", activeBg: "hover:bg-purple-500/5" },
    { id: "ciencias-natureza", label: "Ciências da Natureza", emoji: "🔬", activeBorder: "hover:border-emerald-500", activeBg: "hover:bg-emerald-500/5" },
    { id: "ciencias-humanas", label: "Ciências Humanas", emoji: "🌍", activeBorder: "hover:border-amber-500", activeBg: "hover:bg-amber-500/5" },
];

const VESTIBULAR_SUBJECTS: Subject[] = [
    { id: "biologia", label: "Biologia", emoji: "🧬", activeBorder: "hover:border-emerald-500", activeBg: "hover:bg-emerald-500/5" },
    { id: "fisica", label: "Física", emoji: "⚡", activeBorder: "hover:border-yellow-500", activeBg: "hover:bg-yellow-500/5" },
    { id: "quimica", label: "Química", emoji: "⚗️", activeBorder: "hover:border-orange-500", activeBg: "hover:bg-orange-500/5" },
    { id: "matematica", label: "Matemática", emoji: "🔢", activeBorder: "hover:border-blue-500", activeBg: "hover:bg-blue-500/5" },
    { id: "portugues", label: "Português e Literatura", emoji: "📚", activeBorder: "hover:border-purple-500", activeBg: "hover:bg-purple-500/5" },
    { id: "historia-geo", label: "História e Geografia", emoji: "🌏", activeBorder: "hover:border-amber-500", activeBg: "hover:bg-amber-500/5" },
];

interface Props {
    track: "enem" | "vestibular";
    level: string;
}

export default function SelectSubjectClient({ track, level }: Props) {
    const router = useRouter();
    const subjects = track === "enem" ? ENEM_SUBJECTS : VESTIBULAR_SUBJECTS;
    const trackLabel = track === "enem" ? "ENEM" : "Vestibular";
    const levelLabel =
        level === "1" ? "1º Ano"
            : level === "2" ? "2º Ano"
                : level === "3" ? "3º Ano"
                    : "Avançado";

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-lg animate-in fade-in duration-500">

            {/* Header com seta bem visível e grande */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.push(`/dashboard/${track}/${level}`)}
                    aria-label="Voltar"
                    title="Voltar"
                    className="flex items-center justify-center w-12 h-12 rounded-full
                               bg-primary/15 border-2 border-primary/40 text-primary
                               hover:bg-primary/25 hover:border-primary hover:scale-105
                               transition-all duration-200 shrink-0 shadow-sm"
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">{trackLabel} · {levelLabel}</h1>
                    <p className="text-muted-foreground text-sm">Escolha a matéria para estudar hoje</p>
                </div>
            </div>

            <Card className="border-2 bg-background/50">
                <CardHeader className="pb-4 border-b">
                    <CardTitle className="text-lg">Qual matéria deseja focar?</CardTitle>
                    <CardDescription>
                        O motor 70/30 separará questões inéditas e de revisão para a matéria escolhida.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {subjects.map((subject) => (
                        <button
                            key={subject.id}
                            onClick={() => router.push(`/study/${track}/${level}?subject=${subject.id}`)}
                            className={`flex items-center min-h-[76px] px-4 py-3 rounded-lg border-2 border-border
                                bg-background text-left transition-all duration-200
                                ${subject.activeBorder} ${subject.activeBg}
                                hover:shadow-md active:scale-[0.98]`}
                        >
                            <span className="text-2xl mr-3 shrink-0 leading-none">{subject.emoji}</span>
                            <span className="font-semibold text-sm leading-snug whitespace-normal break-words">
                                {subject.label}
                            </span>
                        </button>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
