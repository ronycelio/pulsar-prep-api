"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function UpgradeButton({ userId }: { userId?: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!isSent || !userId) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/checkout/status?userId=${userId}`);
                const data = await res.json();
                if (data.status === "approved") {
                    clearInterval(interval);
                    window.location.href = "/obrigado";
                }
            } catch (err) {
                console.error("Erro ao verificar status", err);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [isSent, userId]);

    async function handleUpgrade() {
        setIsLoading(true);
        // Abre a aba vazia imediatamente para não ser bloqueada pelo navegador
        const mpTab = window.open("about:blank", "_blank");
        if (mpTab) {
            mpTab.document.write(`
                <html style="background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center;">
                    <body><h2>Redirecionando de forma segura para o Mercado Pago...</h2></body>
                </html>
            `);
        }

        try {
            const res = await fetch("/api/checkout/upgrade", {
                method: "POST",
            });
            const data = await res.json();

            if (data.url) {
                if (mpTab) {
                    mpTab.location.href = data.url;
                } else {
                    window.open(data.url, "_blank");
                }
                setIsSent(true);
            } else {
                if (mpTab) mpTab.close();
                alert("Erro ao gerar link de pagamento. Tente novamente.");
                setIsLoading(false);
            }
        } catch {
            if (mpTab) mpTab.close();
            alert("Erro de conexão. Tente novamente.");
            setIsLoading(false);
        }
    }

    if (isSent) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-xl border border-amber-500/30 text-center animate-in fade-in duration-500 w-full shadow-lg">
                <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
                <h3 className="text-white font-bold mb-2">Aguardando Pagamento</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Uma nova guia foi aberta para você concluir o pagamento de forma segura no Mercado Pago.
                    <br /><br />
                    Estamos aguardando a confirmação do PIX ou Cartão. Esta tela atualizará automaticamente!
                </p>
                <button
                    onClick={() => {
                        setIsSent(false);
                        setIsLoading(false);
                    }}
                    className="mt-6 text-sm underline text-slate-500 hover:text-white transition-colors"
                >
                    Cancelar ou tentar novamente
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="flex items-center justify-center w-full px-6 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70"
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                </>
            ) : (
                "Acesse por apenas R$ 32,00"
            )}
        </button>
    );
}
