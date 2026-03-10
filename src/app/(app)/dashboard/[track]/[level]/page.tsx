export const dynamic = "force-dynamic";

import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardCategoryClient from "./DashboardCategoryClient";
import { UpgradeButton } from "@/components/UpgradeButton";

interface Props {
    params: Promise<{ track: string; level: string }>;
}

const VALID_TRACKS = ["enem", "vestibular"];
const VALID_LEVELS = ["1", "2", "3", "avancado"];

export default async function DashboardCategoryPage({ params }: Props) {
    const { track, level } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    // Validate route params
    if (!VALID_TRACKS.includes(track) || !VALID_LEVELS.includes(level)) {
        redirect("/onboarding/track");
    }

    const trackLabel = track === "enem" ? "ENEM" : "Vestibular";
    const levelLabel =
        level === "1" ? "1º Ano"
            : level === "2" ? "2º Ano"
                : level === "3" ? "3º Ano"
                    : "Avançado";

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { lifetimeLicense: true, plan: true }
    });

    const isPremium = !!dbUser?.lifetimeLicense;

    // Verificação de Plano: trava a trilha 'vestibular' para APENAS quem tem o plano completo
    // Isso engloba tanto os assinantes 'enem' quanto os usuários novos 'free'
    if (track === "vestibular" && dbUser?.plan !== "full") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 relative">

                {/* Back Link */}
                <div className="absolute top-8 left-8">
                    <a href="/dashboard" className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        Voltar ao Painel
                    </a>
                </div>

                <div className="bg-background/80 backdrop-blur-sm border-2 border-border p-8 rounded-2xl max-w-md w-full shadow-xl">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl text-primary font-bold">🔒</span>
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight mb-3">Conteúdo Exclusivo</h1>
                    <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                        O acesso à trilha de Vestibular / Medicina e provas como a FUVEST faz parte do nosso <strong className="text-foreground">Plano Completo</strong>.
                    </p>

                    <UpgradeButton userId={session.user.id} />

                    <p className="text-xs text-muted-foreground mt-4">Libere milhares de questões avançadas focadas nas maiores bancas do país. Pagamento via Mercado Pago.</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardCategoryClient
            userId={session.user.id}
            track={track as "enem" | "vestibular"}
            level={level as "1" | "2" | "3" | "avancado"}
            trackLabel={trackLabel}
            levelLabel={levelLabel}
            isPremium={isPremium}
        />
    );
}
