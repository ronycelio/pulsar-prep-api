import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActivateLicenseForm } from "./ActivateLicenseForm";
import { CheckoutButton } from "./CheckoutButton";

export default async function PaywallPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    // Sempre verifica direto no banco para evitar JWT desatualizado
    const liveUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { lifetimeLicense: true, plan: true },
    });

    // E-mails com acesso administrativo — podem acessar o paywall mesmo se já tiverem licença para testes
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
    const isAdmin = ADMIN_EMAILS.includes((session.user?.email ?? "").toLowerCase());

    if (liveUser?.lifetimeLicense && !isAdmin) {
        redirect("/onboarding/track");
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background overflow-hidden relative">
            {/* Background embellishments */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/3" />

            <Card className="w-full max-w-lg shadow-2xl border-primary/20 bg-background/80 backdrop-blur-md z-10">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20 shadow-inner">
                        <LockKeyhole className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight">
                        Acesso Restrito
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                        Para liberar o acesso vitalício à ferramenta, ative sua licença abaixo.
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 pb-6 border-b border-border/50">
                    {/* Benefícios */}
                    <div className="bg-primary/5 rounded-xl p-6 border border-primary/10 mb-6">
                        <h3 className="font-semibold text-lg text-primary mb-4">O que você ganha com o Lifetime Deal:</h3>
                        <ul className="space-y-3">
                            {[
                                "Acesso Vitalício sem mensalidades",
                                "Motor 70/30 para revisão intercalada automática",
                                "Funcionamento 100% Offline (sem pagar internet)",
                                "Caderno de erros inteligente e Racionais detalhados",
                                "Estatísticas avançadas de desempenho por matéria",
                            ].map((item, index) => (
                                <li key={index} className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-3 shrink-0" />
                                    <span className="text-sm font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Renderização Condicional de Vendas (Ancoragem vs Upsell) */}
                    {liveUser?.plan === "enem" ? (
                        <div className="mb-6">
                            <div className="border-2 border-primary rounded-xl p-6 flex flex-col items-center bg-primary/5 shadow-lg shadow-primary/20">
                                <h4 className="font-bold text-xl text-center mb-2">Upgrade para Medicina</h4>
                                <div className="text-3xl font-black text-primary mb-3">R$ 32</div>
                                <p className="text-sm text-balance text-muted-foreground text-center mb-6">
                                    Você já tem a excelente trilha do ENEM. Libere instantaneamente o acesso à <strong className="text-foreground">Trilha Avançada de Vestibular (FUVEST e Top Bancas)</strong> e expanda suas aprovações pagando apenas a diferença.
                                </p>
                                <CheckoutButton plan="upgrade" className="w-full max-w-xs">
                                    <Button type="submit" className="w-full text-lg h-12 font-bold shadow-md hover:shadow-primary/40 transition-all group">
                                        Fazer Upgrade Agora
                                        <LockKeyhole className="w-4 h-4 ml-2 group-hover:hidden" />
                                        <CheckCircle2 className="w-4 h-4 ml-2 hidden group-hover:block" />
                                    </Button>
                                </CheckoutButton>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Plano ENEM */}
                            <div className="border border-border/50 rounded-xl p-4 flex flex-col items-center bg-background/50 hover:bg-muted/20 transition-colors">
                                <h4 className="font-bold text-lg mb-1">Plano ENEM</h4>
                                <div className="text-3xl font-black text-primary mb-2">R$ 97,99</div>
                                <p className="text-xs text-muted-foreground text-center mb-4 min-h-[40px]">
                                    Acesso vitalício à trilha completa do ENEM (1º, 2º e 3º ano).
                                </p>
                                <CheckoutButton plan="enem" className="w-full">
                                    <Button type="submit" variant="outline" className="w-full font-bold border-primary/50 text-foreground hover:bg-primary/10 transition-colors">
                                        Assinar ENEM
                                    </Button>
                                </CheckoutButton>
                            </div>

                            {/* Plano Completo */}
                            <div className="border-2 border-primary rounded-xl p-4 flex flex-col items-center bg-primary/5 relative transform md:-translate-y-2 shadow-lg shadow-primary/20">
                                <div className="absolute -top-3 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    Mais Escolhido
                                </div>
                                <h4 className="font-bold text-lg mb-1 flex items-center gap-1">Plano Completo</h4>
                                <div className="text-2xl font-black text-primary mb-2">R$ 129</div>
                                <p className="text-xs text-muted-foreground text-center mb-4 min-h-[40px]">
                                    ENEM + Trilha Medicina/Vestibular (FUVEST + Top Bancas).
                                </p>
                                <CheckoutButton plan="full" className="w-full">
                                    <Button type="submit" className="w-full font-bold shadow-md hover:shadow-primary/40 transition-all active:scale-95">
                                        Assinar Completo
                                    </Button>
                                </CheckoutButton>
                            </div>
                        </div>
                    )}

                    {/* Divisor */}
                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">ou</span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="pt-6 pb-6 flex flex-col items-center gap-4">
                    {/* Ativação por chave (client component) */}
                    <div className="w-full">
                        <ActivateLicenseForm />
                    </div>

                    {/* Logout */}
                    <form
                        action={async () => {
                            "use server";
                            await signOut({ redirectTo: "/login" });
                        }}
                    >
                        <Button variant="ghost" className="text-sm text-foreground/70 hover:text-foreground">
                            Sair da conta
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}
