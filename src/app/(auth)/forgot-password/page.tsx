"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";

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
});

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            // Em um app real, aqui chamaria o endpoint de recuperação de senha:
            // await forgotPasswordAction(values.email);
            
            // Simulando um timer de comunicação com o servidor
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setIsSent(true);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    if (isSent) {
        return (
            <Card className="animate-in fade-in zoom-in duration-300">
                <CardHeader className="text-center pt-8">
                    <div className="mx-auto bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-primary">
                        <MailCheck className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-xl">E-mail Enviado</CardTitle>
                    <CardDescription className="pt-2">
                        Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                    <Button asChild className="w-full mt-4" variant="outline">
                        <Link href="/login">Voltar para o Login</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-start mb-2">
                    <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
                        <Link href="/login" className="flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" />
                            <span>Voltar</span>
                        </Link>
                    </Button>
                </div>
                <CardTitle className="text-xl">Esqueceu a senha?</CardTitle>
                <CardDescription>
                    Digite seu e-mail cadastrado e enviaremos instruções para redefinir sua senha.
                </CardDescription>
            </CardHeader>
            <CardContent>
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
                    
                    <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                        {isLoading ? "Enviando..." : "Enviar instruções"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
