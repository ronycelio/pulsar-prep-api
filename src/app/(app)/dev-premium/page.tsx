import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function DevPremiumToggle() {
    const session = await auth();

    if (!session?.user?.email) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white p-8">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold">Faça login primeiro</h1>
                    <p>Você precisa estar logado para acessar ferramentas administrativas.</p>
                </div>
            </div>
        );
    }

    const toggleLicense = async (formData?: FormData) => {
        "use server";

        let targetEmail = session?.user?.email;
        if (formData && formData.get("email")) {
            targetEmail = formData.get("email") as string;
        }

        if (!targetEmail) return;

        const dbUser = await prisma.user.findUnique({
            where: { email: targetEmail },
            select: { id: true, lifetimeLicense: true }
        });

        if (!dbUser) {
            console.error("Usuário não encontrado:", targetEmail);
            return;
        }

        await prisma.user.update({
            where: { id: dbUser.id },
            data: { lifetimeLicense: !dbUser.lifetimeLicense }
        });

        revalidatePath("/", "layout");
        redirect("/onboarding/level");
    };

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { lifetimeLicense: true, email: true }
    });

    const isPremium = user?.lifetimeLicense;

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white p-4 md:p-8">
            <div className="max-w-md w-full text-center space-y-6 bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-xl shadow-2xl">
                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-primary">Painel do Administrador</h1>
                    <p className="text-slate-400">Alternar modo Freemium / Premium de qualquer conta</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-left space-y-2">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Acesso Master</p>
                    <p className="text-sm text-slate-400">Logado como: <span className="font-mono text-white">{user?.email}</span></p>
                    <div className="flex items-center justify-between pt-2">
                        <span className="text-sm text-slate-400">Status do SEU E-mail:</span>
                        {isPremium ? (
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] md:text-xs font-bold rounded-full border border-emerald-500/30">
                                🌟 VITALÍCIO ATIVO
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] md:text-xs rounded-full border border-slate-700">
                                Degustação Grátis
                            </span>
                        )}
                    </div>
                </div>

                {/* Form para ativar conta de TERCEIROS ou a Sede */}
                <form action={toggleLicense} className="space-y-4">
                    <div className="space-y-2 text-left">
                        <label className="text-sm text-slate-300 font-medium">E-mail da Conta Cliente:</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="exemplo@gmail.com"
                            defaultValue={user?.email || ""}
                            className="w-full bg-slate-950 border border-slate-800 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required
                        />
                        <p className="text-xs text-slate-500 leading-relaxed">
                            O botão Inverte a licença (se estiver Grátis, vira Premium. Se estiver Premium, vira Grátis)
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 px-6 rounded-lg font-bold text-lg bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20 transition-all mt-4"
                    >
                        Liberar/Bloquear E-mail Acima
                    </button>
                </form>

                <p className="text-[10px] md:text-xs text-slate-600">
                    O clique acima vai alterar o banco de dados oficial e redirecionar você de volta para as trilhas para testar os cadeados ao vivo.
                </p>
            </div>
        </div>
    );
}
