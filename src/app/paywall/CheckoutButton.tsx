"use client";

import { useTransition } from "react";
import { createCheckout } from "./actions";

export function CheckoutButton({
    plan,
    children,
    className
}: {
    plan: "enem" | "full" | "upgrade",
    children: React.ReactNode,
    className?: string
}) {
    const [isPending, startTransition] = useTransition();

    return (
        <form
            className={className}
            action={() => {
                startTransition(async () => {
                    await createCheckout(plan);
                });
            }}
        >
            <div className={isPending ? "opacity-70 pointer-events-none" : ""}>
                {children}
            </div>
        </form>
    );
}
