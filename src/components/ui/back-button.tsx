"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
    /** Optional explicit URL to go back to. If omitted, uses router.back() */
    href?: string;
    label?: string;
}

export function BackButton({ href, label = "Voltar" }: BackButtonProps) {
    const router = useRouter();

    return (
        <button
            onClick={() => (href ? router.push(href) : router.back())}
            aria-label={label}
            title={label}
            className="flex items-center justify-center w-12 h-12 rounded-full
                       bg-primary/15 border-2 border-primary/40 text-primary
                       hover:bg-primary/25 hover:border-primary hover:scale-105
                       transition-all duration-200 shrink-0 shadow-sm"
        >
            <ArrowLeft className="h-6 w-6" />
        </button>
    );
}
