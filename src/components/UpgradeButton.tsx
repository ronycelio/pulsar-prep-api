"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function UpgradeButton() {
    const [isLoading, setIsLoading] = useState(false);

    async function handleUpgrade() {
        setIsLoading(true);
        try {
            const res = await fetch("/api/checkout/upgrade", {
                method: "POST",
            });
            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Erro ao gerar link de pagamento. Tente novamente.");
                setIsLoading(false);
            }
        } catch {
            alert("Erro de conexão. Tente novamente.");
            setIsLoading(false);
        }
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
