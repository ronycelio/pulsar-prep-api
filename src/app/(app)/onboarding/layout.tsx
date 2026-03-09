import React from "react";
import Image from "next/image";

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="mb-8 select-none">
                <Image
                    src="/pulsar-logo.svg"
                    alt="Pulsar Prep Logo"
                    width={48}
                    height={48}
                    className="mx-auto"
                />
            </div>
            {children}
            <p className="mt-8 text-sm text-muted-foreground text-center">
                Pulsar Prep — Sistema Inteligente 70/30
            </p>
        </div>
    );
}
