import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClientContent from "./DashboardClientContent";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    return (
        <div className="container max-w-5xl py-10 px-4">
            <h1 className="text-4xl font-black tracking-tight mb-2">Seu Dashboard</h1>
            <p className="text-muted-foreground">Bem-vindo de volta! Acompanhe sua evolução diária.</p>

            <DashboardClientContent userId={session.user.id} />
        </div>
    );
}
