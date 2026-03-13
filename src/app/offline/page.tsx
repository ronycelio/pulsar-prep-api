"use client";

import { WifiOff, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                <WifiOff className="w-12 h-12 text-muted-foreground" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight mb-2">Sem Conexão</h1>
            
            <p className="text-muted-foreground max-w-sm mb-8">
                Você está offline e esta página não estava salva no seu dispositivo. Conecte-se à internet para carregá-la ou navegue por áreas já sincronizadas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                <Button 
                    className="w-full flex items-center gap-2"
                    onClick={() => {
                        if (typeof window !== "undefined") {
                            window.location.reload();
                        }
                    }}
                >
                    <RotateCcw className="w-4 h-4" />
                    Tentar Novamente
                </Button>
                <Button
                    variant="outline"
                    className="w-full"
                    asChild
                >
                    <Link href="/onboarding/track">Ir para o Início</Link>
                </Button>
            </div>
        </div>
    );
}
