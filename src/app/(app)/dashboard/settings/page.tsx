import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SettingsFormClient from "./SettingsFormClient";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const liveUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            name: true,
            email: true,
            lifetimeLicense: true,
            createdAt: true,
            track: true,
            level: true,
            dailyGoal: true,
        }
    });

    if (!liveUser) {
        redirect("/login");
    }

    return (
        <div className="container max-w-2xl min-h-[calc(100vh-4rem)] flex flex-col py-8 mx-auto px-4">
            <div className="flex items-center gap-4 mb-8">
                <BackButton href="/onboarding/track" />
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Configurações da Conta</h1>
                    <p className="text-muted-foreground text-sm mt-1">Gerencie seu perfil e regulamentação LGPD</p>
                </div>
            </div>

            <Card className="border-2 shadow-sm mb-6 bg-card/60 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Dados Pessoais</CardTitle>
                    <CardDescription>Informações básicas do seu cadastro.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm font-semibold text-muted-foreground">Nome</p>
                        <p className="text-base font-medium">{liveUser.name || "Não informado"}</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-muted-foreground">E-mail</p>
                        <p className="text-base font-medium">{liveUser.email}</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-muted-foreground">Status da Assinatura</p>
                        <div className="flex items-center gap-2 mt-1">
                            {liveUser.lifetimeLicense ? (
                                <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-600 ring-1 ring-inset ring-emerald-500/20">
                                    Lifetime Ativo
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-md bg-rose-500/15 px-2 py-1 text-xs font-medium text-rose-600 ring-1 ring-inset ring-rose-500/20">
                                    Inativo / Pendente
                                </span>
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-muted-foreground">Membro desde</p>
                        <p className="text-base font-medium">
                            {new Date(liveUser.createdAt).toLocaleDateString("pt-BR", {
                                day: "2-digit", month: "long", year: "numeric"
                            })}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <SettingsFormClient
                initialTrack={(liveUser.track as any) ?? null}
                initialLevel={(liveUser.level as any) ?? null}
                initialDailyGoal={liveUser.dailyGoal ?? 10}
            />
        </div>
    );
}
