"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrainCircuit, ArrowRight, Lock, Mail, Loader2 } from "lucide-react";
import { Suspense } from "react";

const PLANS: Record<string, { name: string; price: string; features: string[] }> = {
    enem: {
        name: "Licença ENEM",
        price: "R$ 79,00",
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
    // Default plan from URL, or default to "full" se não tem o parâmetro (ou é inválido)
    const initialUrlPlan = searchParams.get("plan");
    const defaultPlan = initialUrlPlan === "enem" ? "enem" : "full";
    
    const [plan, setPlan] = useState<string>(defaultPlan);
    const planConfig = PLANS[plan] ?? PLANS.full;
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSentToMercadoPago, setIsSentToMercadoPago] = useState(false);
    const [mpWindowRef, setMpWindowRef] = useState<Window | null>(null);

    // Polling effect
    useEffect(() => {
        if (!isSentToMercadoPago || !email) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/checkout/status?email=${encodeURIComponent(email)}&plan=${encodeURIComponent(plan)}&_t=${Date.now()}`, {
                    cache: 'no-store'
                });
                const data = await res.json();
                if (data.status === "approved") {
                    clearInterval(interval);
                    if (mpWindowRef && !mpWindowRef.closed) {
                        mpWindowRef.close();
                    }
                    window.location.href = "/obrigado";
                }
            } catch (err) {
                console.error("Erro ao verificar status da compra:", err);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [isSentToMercadoPago, email, plan, mpWindowRef]);

    async function proceedToPayment(e?: React.FormEvent) {
        if (e) e.preventDefault();
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Insira um e-mail válido.");
            return;
        }

        setIsLoading(true);
        setError(null);

        // Abre a aba vazia imediatamente para não ser bloqueada pelo navegador
        const mpTab = window.open("about:blank", "_blank");
        if (mpTab) {
            mpTab.document.write(`
                <html style="background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center;">
                    <body><h2>Redirecionando de forma segura para o Mercado Pago...</h2></body>
                </html>
            `);
            setMpWindowRef(mpTab);
        }

        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan, email }),
            });

            const data = await res.json();

            if (data.url) {
                if (mpTab) {
                    mpTab.location.href = data.url;
                } else {
                    const newTab = window.open(data.url, "_blank");
                    setMpWindowRef(newTab);
                }
                setIsSentToMercadoPago(true);
            } else {
                if (mpTab) mpTab.close();
                setMpWindowRef(null);
                setError("Erro ao gerar link de pagamento. Tente novamente.");
                setIsLoading(false);
            }
        } catch {
            if (mpTab) mpTab.close();
            setMpWindowRef(null);
            setError("Erro de conexão. Tente novamente.");
            setIsLoading(false);
        }
    }

    if (isSentToMercadoPago) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 flex flex-col items-center justify-center p-6 relative">
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 shadow-lg shadow-purple-900/50">
                        <BrainCircuit className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">Pulsar Prep</span>
                </div>

                <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900/80 backdrop-blur-sm p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-3">Aguardando Pagamento</h2>
                    <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                        Uma nova tela do Mercado Pago foi aberta para você concluir sua compra de forma segura.
                    </p>

                    <div className="bg-amber-950/40 border border-amber-500/20 rounded-lg p-4 w-full text-left mb-6">
                        <p className="text-amber-400 text-sm font-medium">
                            ⚠️ Não feche esta página! Ela será atualizada automaticamente assim que o seu pagamento via PIX ou Cartão for confirmado pelo Mercado Pago. O QR Code sumirá sozinho.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setIsSentToMercadoPago(false);
                            setIsLoading(false);
                            setMpWindowRef(null);
                        }}
                        className="text-sm underline text-slate-500 hover:text-white transition-colors"
                    >
                        Cancelar ou tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 flex flex-col items-center justify-center p-6 relative">
            {/* Logo */}
            <div className="mb-8 flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 shadow-lg shadow-purple-900/50">
                    <BrainCircuit className="h-8 w-8 text-white" />
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">Pulsar Prep</span>
            </div>

            {/* Main Checkout Box */}
            <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 shadow-2xl">
                
                <h2 className="text-xl font-bold text-white mb-6 text-center">Escolha seu Plano</h2>
                
                {/* Plan Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {/* ENEM Plan */}
                    <div 
                        onClick={() => setPlan("enem")}
                        className={`cursor-pointer rounded-xl border p-5 transition-all relative ${
                            plan === "enem" 
                            ? "bg-purple-900/40 border-purple-500 ring-1 ring-purple-500/50 shadow-lg shadow-purple-900/20" 
                            : "bg-slate-900/40 border-slate-700 hover:border-slate-500"
                        }`}
                    >
                        <h3 className="text-white font-bold mb-1">ENEM</h3>
                        <p className="text-2xl font-extrabold text-white mb-3">R$ 79,00</p>
                        <ul className="space-y-1.5 mb-2">
                            {PLANS.enem.features.map(f => (
                                <li key={f} className="text-xs text-slate-400 flex items-start gap-2">
                                    <span className="text-purple-400">✓</span> {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* FULL Plan */}
                    <div 
                        onClick={() => setPlan("full")}
                        className={`cursor-pointer rounded-xl border p-5 transition-all relative ${
                            plan === "full" 
                            ? "bg-purple-900/40 border-purple-500 ring-1 ring-purple-500/50 shadow-lg shadow-purple-900/20" 
                            : "bg-slate-900/40 border-slate-700 hover:border-slate-500"
                        }`}
                    >
                        {/* Indicador de Recomendado */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-amber-950 text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-md whitespace-nowrap">
                            Mais Popular
                        </div>
                        
                        <h3 className="text-white font-bold mb-1 mt-1">Completo</h3>
                        <p className="text-2xl font-extrabold text-white mb-3">R$ 129,00</p>
                        <ul className="space-y-1.5 mb-2">
                            {PLANS.full.features.map(f => (
                                <li key={f} className="text-xs text-slate-400 flex items-start gap-2">
                                    <span className="text-purple-400">✓</span> {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <hr className="border-white/10 mb-6" />

                {/* Form */}
                <form onSubmit={proceedToPayment} className="space-y-4">
                    {/* Campo de e-mail */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-violet-400" />
                            Seu melhor e-mail
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="voce@email.com"
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                        />
                        <div className="flex gap-2">
                            <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Usamos seu e-mail apenas para enviar sua chave de acesso após o pagamento.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold py-4 transition-colors shadow-lg shadow-green-900/40 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
                        ) : (
                            <>
                                Assinar Plano {planConfig.name.replace('Licença ', '')}
                                <ArrowRight className="h-5 w-5 ml-1" />
                            </>
                        )}
                    </button>
                    
                    <p className="mt-5 text-center text-xs text-slate-600">
                        Pagamento 100% seguro via Mercado Pago · Acesso vitalício após a confirmação
                    </p>
                </form>
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
