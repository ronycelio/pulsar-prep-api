"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { changePasswordAction } from "@/lib/actions/auth";
import { signIn } from "next-auth/react";

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

const formSchema = z
    .object({
        newPassword: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
        confirmPassword: z.string().min(8, "Confirme a senha."),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "As senhas não coincidem.",
        path: ["confirmPassword"],
    });

export default function ChangePasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") ?? "";

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { newPassword: "", confirmPassword: "" },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!email) {
            setError("Sessão inválida. Por favor, faça login novamente.");
            return;
        }
        setIsLoading(true);
        setError(null);

        const result = await changePasswordAction({ email, newPassword: values.newPassword });

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
            return;
        }

        // Após trocar a senha, força o re-login silencioso com a nova senha
        await signIn("credentials", { email, password: values.newPassword, redirect: false });
        router.push("/onboarding/track");
    }

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="text-xl">🔑 Crie sua Senha Definitiva</CardTitle>
                <CardDescription>
                    Para proteger sua conta, crie uma senha pessoal agora.
                    Você usará ela em todos os próximos acessos.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium border border-destructive">
                        {error}
                    </div>
                )}
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            {...form.register("newPassword")}
                        />
                        {form.formState.errors.newPassword && (
                            <p className="text-sm text-destructive">
                                {form.formState.errors.newPassword.message}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Repita a senha acima"
                            {...form.register("confirmPassword")}
                        />
                        {form.formState.errors.confirmPassword && (
                            <p className="text-sm text-destructive">
                                {form.formState.errors.confirmPassword.message}
                            </p>
                        )}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Salvando..." : "Definir Senha e Entrar →"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
