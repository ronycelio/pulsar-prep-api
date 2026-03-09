import { ReactNode } from "react";
import Link from "next/link";
import { BrainCircuit } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <Link href="/" className="flex items-center gap-2 self-center font-medium">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <BrainCircuit className="size-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">Pulsar Prep</span>
                </Link>
                {children}
            </div>
        </div>
    );
}
