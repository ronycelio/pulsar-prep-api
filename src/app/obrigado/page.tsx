import { MailCheck, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function ObrigadoPage({
    searchParams,
}: {
    searchParams: { status?: string };
}) {
    const isPending = searchParams.status === "pending";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-green-950/30 flex flex-col items-center justify-center p-6 text-center">

            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 shadow-2xl animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                    {isPending ? (
                        <span className="text-4xl">⏳</span>
                    ) : (
                        <ShieldCheck className="w-10 h-10 text-green-400" />
                    )}
                </div>

                <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">
                    {isPending ? "Pagamento em Processamento" : "Pagamento Aprovado!"}
                </h1>

                <p className="text-slate-300 mb-8 text-base leading-relaxed">
                    {isPending
                        ? "Seu pagamento via Pix ou Boleto está sendo processado. Assim que for confirmado, você receberá seu acesso por e-mail."
                        : "Sua compra foi concluída com sucesso. Bem-vindo(a) ao Pulsar Prep!"}
                </p>

                {!isPending && (
                    <div className="mb-8 text-left bg-slate-900/50 border border-amber-500/30 rounded-xl p-5">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 bg-amber-500/20 p-2 rounded-lg">
                                <MailCheck className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold mb-1">Passo Importante</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Enviamos sua senha inicial para o seu e-mail. Por favor, verifique sua <strong className="text-amber-400">Caixa de Entrada</strong> e também a pasta de <strong className="text-amber-400">SPAM</strong> ou Promoções.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <Link
                    href="/login"
                    className="flex items-center justify-center w-full px-6 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all shadow-md shadow-green-900/40 hover:shadow-lg active:scale-95"
                >
                    Ir para o Login do Aplicativo
                    <ArrowRight className="ml-2 w-5 h-5" />
                </Link>

                <p className="mt-6 text-xs text-slate-500">
                    Em caso de dúvidas ou se não receber o e-mail em até 5 minutos, entre em contato respondendo a qualquer e-mail nosso.
                </p>
            </div>
        </div>
    );
}
