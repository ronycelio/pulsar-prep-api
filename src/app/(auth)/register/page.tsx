"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerAction } from "@/lib/actions/auth";

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
    name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
    email: z.string().email({ message: "Insira um e-mail válido." }),
    password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [errorStatus, setErrorStatus] = useState<string | null>(null);
    const [successStatus, setSuccessStatus] = useState<string | null>(null);
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setErrorStatus(null);
        setSuccessStatus(null);

        try {
            const response = await registerAction(values);
            if (response?.error) {
                setErrorStatus(response.error);
            } else if (response?.success) {
                setSuccessStatus(response.success);
                setTimeout(() => {
                    router.push("/login");
                }, 1500);
            }
        } catch (err) {
            setErrorStatus("Ocorreu um erro no servidor.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="text-xl">Crie sua Conta</CardTitle>
                <CardDescription>
                    Inicie sua jornada no Pulsar Prep hoje mesmo.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {errorStatus && (
                    <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium border border-destructive">
                        {errorStatus}
                    </div>
                )}
                {successStatus && (
                    <div className="mb-4 rounded-md bg-success/15 p-3 text-sm text-success font-medium border border-success">
                        {successStatus} Redirecionando...
                    </div>
                )}
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                            id="name"
                            placeholder="João da Silva"
                            {...form.register("name")}
                        />
                        {form.formState.errors.name && (
                            <p className="text-sm text-destructive">
                                {form.formState.errors.name.message}
                            </p>
                        )}
                    </div>
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
                        <Label htmlFor="password">Senha</Label>
                        <Input
                            id="password"
                            type="password"
                            {...form.register("password")}
                        />
                        {form.formState.errors.password && (
                            <p className="text-sm text-destructive">
                                {form.formState.errors.password.message}
                            </p>
                        )}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Criando..." : "Criar Conta"}
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
                    Já tem uma conta?{" "}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Faça login
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
