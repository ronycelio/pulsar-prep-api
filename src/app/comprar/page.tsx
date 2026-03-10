"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrainCircuit, ArrowRight, Lock, Mail } from "lucide-react";
import { Suspense } from "react";

const PLANS: Record<string, { name: string; price: string; features: string[] }> = {
    enem: {
        name: "Licença ENEM",
        price: "R$ 97,00",
        features: ["Acesso vitalício", "Todas as edições do ENEM", "Motor de estudo inteligente"],
    },
    full: {
        name: "Licença Completa",
        price: "R$ 129,00",
        features: ["Tudo do ENEM +", "Questões de Vestibulares", "Acesso prioritário a novidades"],
    },
    upgrade: {
        name: "Upgrade Vestibular",
        price: "R$ 32,00",
        features: ["Adiciona questões de Vestibular", "ao seu plano ENEM existente"],
    },
};

function ComprarForm() {
    const searchParams = useSearchParams();
    const plan = searchParams.get("plan") ?? "enem";
    const planConfig = PLANS[plan] ?? PLANS.enem;

    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Insira um e-mail válido.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan, email }),
            });

            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                setError("Erro ao gerar link de pagamento. Tente novamente.");
            }
        } catch {
            setError("Erro de conexão. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 flex flex-col items-center justify-center p-6">
            {/* Logo */}
            <div className="mb-8 flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 shadow-lg shadow-purple-900/50">
                    <BrainCircuit className="h-8 w-8 text-white" />
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">Pulsar Prep</span>
            </div>

            {/* Card */}
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 shadow-2xl">
                {/* Plan badge */}
                <div className="mb-6 text-center">
                    <span className="inline-block rounded-full bg-purple-600/20 border border-purple-500/30 px-4 py-1.5 text-sm font-medium text-purple-300">
                        {planConfig.name}
                    </span>
                    <p className="mt-3 text-4xl font-bold text-white">{planConfig.price}</p>
                    <ul className="mt-3 space-y-1">
                        {planConfig.features.map((f) => (
                            <li key={f} className="text-sm text-slate-400">✓ {f}</li>
                        ))}
                    </ul>
                </div>

                <hr className="border-white/10 mb-6" />

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <Mail className="inline h-4 w-4 mr-1.5 text-purple-400" />
                            Seu melhor e-mail
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="voce@email.com"
                            required
                            className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition"
                        />
                        <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Usamos seu e-mail apenas para enviar sua chave de acesso após o pagamento.
                        </p>
                    </div>

                    {error && (
                        <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-semibold py-3.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-purple-900/40"
                    >
                        {isLoading ? (
                            <span className="animate-pulse">Redirecionando...</span>
                        ) : (
                            <>
                                Ir para o Pagamento
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-5 text-center text-xs text-slate-600">
                    Pagamento 100% seguro via Mercado Pago · Acesso vitalício após a confirmação
                </p>
            </div>
        </div>
    );
}

export default function ComprarPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Carregando...</div>}>
            <ComprarForm />
        </Suspense>
    );
}
