"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, Share, PlusSquare, MoreVertical, Smartphone } from "lucide-react";

interface PwaInstallModalProps {
    isFirstTime: boolean;
}

export function PwaInstallModal({ isFirstTime }: PwaInstallModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [os, setOs] = useState<"ios" | "android" | "other">("other");

    useEffect(() => {
        // Only show to first-time users who haven't seen it yet
        if (!isFirstTime) return;

        const hasSeenModal = localStorage.getItem("pwa_install_modal_seen");
        if (hasSeenModal) return;

        const checkOS = () => {
            const userAgent = window.navigator.userAgent.toLowerCase();
            if (/iphone|ipad|ipod/.test(userAgent)) return "ios";
            if (/android/.test(userAgent)) return "android";
            return "other";
        };

        // Don't show if it's desktop (mostly) or already installed (standalone)
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
        
        if (!isStandalone) {
            setOs(checkOS());
            setIsOpen(true);
        } else {
            // Already installed, mark as seen
            localStorage.setItem("pwa_install_modal_seen", "1");
        }
    }, [isFirstTime]);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem("pwa_install_modal_seen", "1");
    };

    if (!isOpen) return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent className="sm:max-w-md bg-background/95 backdrop-blur-md border-primary/20 shadow-2xl overflow-hidden p-6 gap-0">
                <AlertDialogHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 ring-8 ring-primary/5">
                        <Smartphone className="w-8 h-8 text-primary" />
                    </div>
                    <AlertDialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 mb-2">
                        Tenha a Experiência Completa
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-center">
                        Instale o aplicativo <strong>Pulsar Prep</strong> no seu celular para acesso rápido e estudos offline.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-6 space-y-6">
                    {/* iOS Instructions */}
                    {(os === "ios" || os === "other") && (
                        <div className="bg-muted/50 p-4 rounded-xl border border-border/50 transition-all">
                            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                                🍎 Se você usa iPhone/iPad:
                            </h4>
                            <ol className="space-y-3 text-sm text-muted-foreground w-full">
                                <li className="flex items-start gap-3 w-full">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">1</span>
                                    <span className="flex-1">Toque no ícone de <strong>Compartilhar</strong> <Share className="inline w-4 h-4 mx-1" /> na barra inferior do Safari.</span>
                                </li>
                                <li className="flex items-start gap-3 w-full">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">2</span>
                                    <span className="flex-1">Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> <PlusSquare className="inline w-4 h-4 mx-1" />.</span>
                                </li>
                            </ol>
                        </div>
                    )}

                    {/* Android Instructions */}
                    {(os === "android" || os === "other") && (
                        <div className="bg-muted/50 p-4 rounded-xl border border-border/50 transition-all">
                            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                                🤖 Se você usa Android:
                            </h4>
                            <ol className="space-y-3 text-sm text-muted-foreground w-full">
                                <li className="flex items-start gap-3 w-full">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">1</span>
                                    <span className="flex-1">Toque nos <strong>Três Pontinhos</strong> <MoreVertical className="inline w-4 h-4 mx-1" /> no topo superior direito do Chrome.</span>
                                </li>
                                <li className="flex items-start gap-3 w-full">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">2</span>
                                    <span className="flex-1">Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong> <Download className="inline w-4 h-4 mx-1" />.</span>
                                </li>
                            </ol>
                        </div>
                    )}
                </div>

                <AlertDialogFooter className="sm:justify-stretch flex-col gap-2 pt-2">
                    <Button 
                        onClick={handleClose} 
                        className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all"
                    >
                        Entendido, continuar
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={handleClose}
                        className="w-full text-muted-foreground hover:text-foreground"
                    >
                        Já instalei o app
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
