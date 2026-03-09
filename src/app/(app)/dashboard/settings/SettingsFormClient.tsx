"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Trash2, AlertTriangle, Loader2, Save, BookOpen,
    Target, Rocket, Trophy, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { db } from "@/lib/db";
import { updateSettingsAction } from "@/lib/actions/onboarding";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useRouter } from "next/navigation";

type Track = "enem" | "vestibular" | "medicina";
type Level = "1" | "2" | "3" | "avancado";

interface Props {
    initialTrack: Track | null;
    initialLevel: Level | null;
    initialDailyGoal: number;
}

const TRACKS = [
    { value: "enem" as Track, label: "ENEM", emoji: "📝" },
    { value: "vestibular" as Track, label: "Vestibular", emoji: "🎓" },
];

const LEVELS = [
    { value: "1" as Level, label: "1º Ano", sub: "até 5 questões/dia", icon: BookOpen, max: 5 },
    { value: "2" as Level, label: "2º Ano", sub: "até 15 questões/dia", icon: Target, max: 15 },
    { value: "3" as Level, label: "3º Ano", sub: "até 20 questões/dia", icon: Rocket, max: 20 },
    { value: "avancado" as Level, label: "Avançado", sub: "até 30 questões/dia", icon: Trophy, max: 30 },
];

export default function SettingsFormClient({ initialTrack, initialLevel, initialDailyGoal }: Props) {
    const router = useRouter();
    const { setTrack, setLevel, setDailyGoal } = useOnboardingStore();

    const [track, setLocalTrack] = useState<Track | null>(initialTrack);
    const [level, setLocalLevel] = useState<Level | null>(initialLevel);
    const [goal, setLocalGoal] = useState<number>(initialDailyGoal);
    const [isSaving, setIsSaving] = useState(false);

    const [deleteText, setDeleteText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const maxGoal = useMemo(() => {
        const found = LEVELS.find((l) => l.value === level);
        return found?.max ?? 30;
    }, [level]);

    const hasChanges =
        track !== initialTrack ||
        level !== initialLevel ||
        goal !== initialDailyGoal;

    const handleLevelChange = (newLevel: Level) => {
        setLocalLevel(newLevel);
        const maxForLevel = LEVELS.find((l) => l.value === newLevel)?.max ?? 30;
        if (goal > maxForLevel) setLocalGoal(maxForLevel);
    };

    const handleSave = async () => {
        if (!track || !level) {
            toast.error("Selecione uma trilha e uma etapa.");
            return;
        }
        setIsSaving(true);
        try {
            const result = await updateSettingsAction({ track, level, dailyGoal: goal });
            if (result.error) {
                toast.error("Erro ao salvar", { description: result.error });
                return;
            }
            // Atualiza o Zustand para que as próximas navegações usem os novos valores
            setTrack(track);
            setLevel(level);
            setDailyGoal(goal);

            toast.success("Preferências salvas!", {
                description: "As alterações entrarão em vigor no próximo dia de estudo.",
            });
            router.refresh();
        } catch {
            toast.error("Falha de conexão. Tente novamente.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteText !== "DELETE") {
            toast.error("Você precisa digitar DELETE para confirmar.");
            return;
        }
        setIsDeleting(true);
        try {
            const response = await fetch("/api/account/delete", { method: "POST" });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Falha ao excluir a conta no servidor");
            }
            await db.delete();
            toast.success("Conta excluída com sucesso.", {
                description: "Redirecionando...",
            });
            await signOut({ callbackUrl: "/login" });
        } catch (error: any) {
            toast.error("Erro na exclusão", { description: error.message });
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Preferências de Estudo ── */}
            <Card className="border-2 shadow-sm bg-card/60 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Preferências de Estudo
                    </CardTitle>
                    <CardDescription>
                        As alterações entram em vigor no próximo dia — sem perder seu progresso atual.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Trilha */}
                    <div className="space-y-2">
                        <p className="text-sm font-semibold">Trilha</p>
                        <div className="flex gap-3 flex-wrap">
                            {TRACKS.map((t) => (
                                <button
                                    key={t.value}
                                    onClick={() => setLocalTrack(t.value)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium
                                        transition-all duration-200 hover:scale-[1.02]
                                        ${track === t.value
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border text-muted-foreground hover:border-primary/50"
                                        }`}
                                >
                                    <span>{t.emoji}</span>
                                    {t.label}
                                    {track === t.value && <CheckCircle2 className="h-4 w-4" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Etapa */}
                    <div className="space-y-2">
                        <p className="text-sm font-semibold">Etapa</p>
                        <div className="grid grid-cols-2 gap-2">
                            {LEVELS.map((l) => {
                                const Icon = l.icon;
                                return (
                                    <button
                                        key={l.value}
                                        onClick={() => handleLevelChange(l.value)}
                                        className={`flex flex-col items-start px-4 py-3 rounded-lg border-2 text-left
                                            transition-all duration-200 hover:scale-[1.01]
                                            ${level === l.value
                                                ? "border-primary bg-primary/10"
                                                : "border-border text-muted-foreground hover:border-primary/40"
                                            }`}
                                    >
                                        <span className={`font-semibold text-sm flex items-center gap-1.5 ${level === l.value ? "text-primary" : ""}`}>
                                            <Icon className="h-4 w-4" />
                                            {l.label}
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-0.5">{l.sub}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Meta Diária */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Meta Diária</p>
                            <Badge variant="secondary" className="font-mono text-base px-3 py-1">
                                {goal} questões/dia
                            </Badge>
                        </div>
                        <Slider
                            value={[goal]}
                            onValueChange={(vals) => setLocalGoal(vals[0])}
                            min={1}
                            max={maxGoal}
                            step={1}
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            Mínimo 1, máximo {maxGoal} para a etapa selecionada.
                        </p>
                    </div>

                    {/* Botão Salvar */}
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        className="w-full h-11 font-semibold"
                    >
                        {isSaving ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                        ) : (
                            <><Save className="mr-2 h-4 w-4" /> {hasChanges ? "Salvar Preferências" : "Sem Alterações"}</>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* ── Zona de Risco (LGPD) ── */}
            <div className="border-t border-border pt-6 mt-2">
                <h2 className="text-xl font-bold text-destructive flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5" /> Zona de Risco (LGPD)
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                    A exclusão da conta é um processo <strong>irreversível</strong>. Todos os seus relatórios,
                    dados de aprendizagem, progresso diário e acesso à sua Assinatura Vitalícia (se aplicável)
                    serão destruídos permanentemente.
                </p>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="flex items-center gap-2 w-full sm:w-auto font-semibold shadow-lg shadow-destructive/20 hover:shadow-destructive/40">
                            <Trash2 className="h-4 w-4" />
                            Excluir Conta Permanentemente
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-destructive/20">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-destructive flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" /> Você tem certeza absoluta?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="space-y-4 pt-2">
                                <p>
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta
                                    e removerá seus dados retidos, perdendo imediatamente o acesso à plataforma.
                                </p>
                                <p className="font-medium text-foreground">
                                    Para confirmar, digite{" "}
                                    <span className="text-destructive font-mono select-none">DELETE</span> abaixo.
                                </p>
                                <Input
                                    placeholder="DELETE"
                                    value={deleteText}
                                    onChange={(e) => setDeleteText(e.target.value)}
                                    className="font-mono mt-2 uppercase border-destructive/20 focus-visible:ring-destructive/50"
                                    disabled={isDeleting}
                                />
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6">
                            <AlertDialogCancel disabled={isDeleting} onClick={() => setDeleteText("")}>
                                Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => { e.preventDefault(); handleDeleteAccount(); }}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                disabled={deleteText !== "DELETE" || isDeleting}
                            >
                                {isDeleting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>
                                ) : (
                                    "Sim, Excluir Minha Conta"
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
