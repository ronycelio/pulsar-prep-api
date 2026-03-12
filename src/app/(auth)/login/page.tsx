"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/actions/auth";
import { SyncQueue } from "@/lib/sync/syncQueue";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
    email: z.string().email({ message: "Insira um e-mail válido." }),
    password: z.string().min(1, { message: "A senha é obrigatória." }),
});

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [errorStatus, setErrorStatus] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("reason") === "session_expired") {
                setErrorStatus("Sessão expirada: Você acessou sua conta em outro dispositivo.");
            }
            if (params.get("reason") === "session_mismatch") {
                setErrorStatus("Você foi desconectado porque sua conta foi acessada em outro dispositivo.");
            }

            // Restore "remember me" email
            const savedEmail = localStorage.getItem("pulsar_remembered_email");
            if (savedEmail) {
                form.setValue("email", savedEmail);
                setRememberMe(true);
            }
        }
    }, []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setErrorStatus(null);
        try {
            const response = await loginAction(values);
            if (response?.error) {
                setErrorStatus(response.error);
            } else if ((response as any)?.requiresPasswordChange) {
                // Conta criada via Webhook — força troca de senha antes de entrar no app
                router.push(`/change-password?email=${encodeURIComponent(values.email)}`);
            } else {
                // Save or clear remember me
                if (rememberMe) {
                    localStorage.setItem("pulsar_remembered_email", values.email);
                } else {
                    localStorage.removeItem("pulsar_remembered_email");
                }

                // Sincronizar dados do servidor após login (Recuperação Cross-Device)
                await SyncQueue.pullFromServer();
                router.push("/onboarding/track"); // Flow de Boas Vindas Diárias
            }
        } catch (err) {
            // Catch redirects or unhandled errors
            if (err instanceof Error && err.message !== "NEXT_REDIRECT") {
                setErrorStatus("Ocorreu um erro no servidor.");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="text-xl">Bem-vindo(a) de volta</CardTitle>
                <CardDescription>
                    Faça login com sua conta para continuar seus estudos.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {errorStatus && (
                    <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium border border-destructive">
                        {errorStatus}
                    </div>
                )}
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            {...form.register("email")}
                        />
                        {form.formState.errors.email && (
                            <p className="text-sm text-destructive">
                                {form.formState.errors.email.message}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Senha</Label>
                            <Link
                                href="/forgot-password"
                                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                            >
                                Esqueceu a senha?
                            </Link>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                className="pr-10"
                                {...form.register("password")}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {form.formState.errors.password && (
                            <p className="text-sm text-destructive">
                                {form.formState.errors.password.message}
                            </p>
                        )}
                    </div>

                    {/* Remember me */}
                    <div className="flex items-center space-x-2 pb-1 pt-1">
                        <input
                            type="checkbox"
                            id="rememberMe"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer text-muted-foreground">
                            Lembrar meu e-mail
                        </Label>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Entrando..." : "Entrar"}
                    </Button>
                    <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                        <span className="relative z-10 bg-background px-2 text-muted-foreground">
                            Ou continue com
                        </span>
                    </div>
                    <Button variant="outline" type="button" className="w-full" disabled={isLoading}>
                        Google
                    </Button>
                </form>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                    Não tem uma conta?{" "}
                    <Link href="/register" className="font-medium text-primary hover:underline">
                        Cadastre-se
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
