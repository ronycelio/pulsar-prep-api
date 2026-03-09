"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, KeyRound, RefreshCw } from "lucide-react";

export function ActivateLicenseForm() {
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const router = useRouter();

    const handleActivate = async () => {
        if (!code.trim()) {
            toast.error("Digite um código de ativação.");
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch("/api/activate-license", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: code.trim() }),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error("Ativação falhou", { description: data.error });
                return;
            }

            toast.success("Licença ativada com sucesso! 🎉", {
                description: "Redirecionando para o app...",
            });
            // Força um router.refresh() para reiniciar a sessão com a nova licença
            setTimeout(() => router.push("/onboarding/track"), 1500);
        } catch {
            toast.error("Erro de conexão. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshAccess = () => {
        setIsRefreshing(true);
        // Faz reload para o servidor re-checar o banco e a sessão JWT
        router.refresh();
        setTimeout(() => setIsRefreshing(false), 2000);
    };

    return (
        <div className="space-y-3">
            {/* Ativação por chave */}
            <p className="text-xs text-muted-foreground font-medium text-center">
                Recebeu um código de ativação?
            </p>
            <div className="flex gap-2">
                <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ex: PULSAR-XXXX-XXXX"
                    className="font-mono text-sm"
                    maxLength={30}
                    onKeyDown={(e) => e.key === "Enter" && handleActivate()}
                />
                <Button
                    onClick={handleActivate}
                    disabled={isLoading}
                    variant="secondary"
                    className="shrink-0"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <KeyRound className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Verificar se já pagou */}
            <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={handleRefreshAccess}
                disabled={isRefreshing}
            >
                {isRefreshing ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Já paguei — Verificar acesso
            </Button>
        </div>
    );
}
