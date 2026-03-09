import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import React from "react";
import { headers } from "next/headers";

import BlockedSessionUI from "@/components/study/BlockedSessionUI";
import NetworkStatusTrigger from "@/components/study/NetworkStatusTrigger";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/login");
    }

    // ------------------------------------------------------------------------
    // ANTI-PIRACY SINGLE-SESSION CHECK (STORY 1.3)
    // ------------------------------------------------------------------------
    // We fetch the live record from Postgres using the native Engine.
    // If the deviceId in the session token doesn't exactly match the one in DB
    // it means they logged in on another device recently.
    const liveUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            currentDeviceId: true,
            onboardingCompleted: true,
            lifetimeLicense: true, // Fix for Paywall checking
        },
    } as any);

    if (liveUser && (session.user as any).currentDeviceId !== (liveUser as any).currentDeviceId) {
        // Bloqueio de Sessão (Anti-Pirataria)
        // Em vez de logout forçado, mostramos uma UI de bloqueio explicativa.
        return <BlockedSessionUI />;
    }

    const headerList = await headers();
    const pathname = headerList.get("x-invoke-path") || "";

    // O bloqueio global de licença vitalícia foi DESATIVADO para permitir a "degustação" (Story 1.4 do usuário).
    // Usuários com lifetimeLicense = false agora podem acessar a plataforma para o Nível 1.
    // O bloqueio é feito apenas visualmente nos componentes e ao atingir 50 questões.

    // Nós NÃO faremos o redirecionamento de Onboarding aqui no Server Component
    // porque o Next.js App Router engasga com redirecionamentos aninhados em RC baseados em cabeçalhos mutáveis.
    // O redirecionamento de Onboarding será forçado individualmente em cada Rota Page Protegida.

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <NetworkStatusTrigger />
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
