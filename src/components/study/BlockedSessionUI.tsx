"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, LogOut, Monitor } from "lucide-react";
import { signOut } from "next-auth/react";

export default function BlockedSessionUI() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background/95 p-4 backdrop-blur-sm">
            <Card className="max-w-md border-destructive/20 shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Sessão Duplicada</CardTitle>
                    <CardDescription className="text-balance pt-2">
                        Sua conta foi acessada em outro dispositivo. Para garantir a segurança e cumprir nossa política de licença individual, esta sessão foi pausada.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground border border-border/50">
                        <div className="flex items-start gap-3">
                            <Monitor className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>
                                O Pulsar Prep permite apenas <strong>uma sessão ativa por conta</strong>.
                                Se você não reconhece este acesso, recomendamos alterar sua senha imediatamente.
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button
                        variant="destructive"
                        className="w-full font-semibold shadow-lg shadow-destructive/20 transition-all hover:shadow-destructive/40"
                        onClick={() => signOut({ callbackUrl: "/login?reason=session_mismatch" })}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair desta Sessão
                    </Button>
                    <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground/60">
                        Anti-Pirataria • Pulsar Prep
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
