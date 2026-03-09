"use client";

import { useOnboardingStore } from "@/stores/onboardingStore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen } from "lucide-react";

interface TrackSelectionClientProps {
    userName: string;
    isFirstTime: boolean;
}

export default function TrackSelectionClient({ userName, isFirstTime }: TrackSelectionClientProps) {
    const setTrack = useOnboardingStore((state) => state.setTrack);
    const router = useRouter();

    const handleSelect = (track: "enem" | "vestibular") => {
        setTrack(track);
        router.push("/onboarding/level");
    };

    const firstName = userName ? userName.split(" ")[0] : "Estudante";
    const greeting = isFirstTime
        ? `Seja bem-vindo(a), ${firstName}! 🎓`
        : `Seja bem-vindo(a) de volta, ${firstName}! 👋`;

    return (
        <Card className="w-full max-w-md shadow-xl border-2 bg-background/60 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
            <CardHeader className="text-center pb-6 border-b">
                <CardTitle className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                    {greeting}
                </CardTitle>
                <CardDescription className="text-lg mt-3 font-semibold text-foreground">
                    Qual estudo deseja iniciar hoje?
                </CardDescription>
                <p className="text-sm text-muted-foreground mt-1">
                    Nossa I.A. adaptará as questões para o seu foco diário.
                </p>
            </CardHeader>
            <CardContent className="pt-8 space-y-4 pb-8">

                {/* ENEM */}
                <Button
                    variant="outline"
                    className="w-full h-28 text-lg justify-start px-6 border-2 hover:border-blue-500 hover:bg-blue-500/5 group transition-all duration-200"
                    onClick={() => handleSelect("enem")}
                >
                    <div className="bg-blue-500/10 p-3 rounded-full mr-4 group-hover:bg-blue-500/20 transition-colors">
                        <GraduationCap className="h-7 w-7 text-blue-500" />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="font-bold text-blue-500 text-xl">ENEM</span>
                        <span className="text-sm font-normal text-muted-foreground text-left">
                            Exame Nacional do Ensino Médio.
                        </span>
                        <span className="text-xs text-blue-500/70 mt-1">Matemática · Humanas · Natureza · Linguagens</span>
                    </div>
                </Button>

                {/* Vestibular */}
                <Button
                    variant="outline"
                    className="w-full h-28 text-lg justify-start px-6 border-2 hover:border-primary hover:bg-primary/5 group transition-all duration-200"
                    onClick={() => handleSelect("vestibular")}
                >
                    <div className="bg-primary/10 p-3 rounded-full mr-4 group-hover:bg-primary/20 transition-colors">
                        <BookOpen className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="font-bold text-primary text-xl">Vestibular</span>
                        <span className="text-sm font-normal text-muted-foreground text-left">
                            FUVEST, UNICAMP, UERJ e regionais.
                        </span>
                        <span className="text-xs text-primary/70 mt-1">Inclui VestMed · Bio · Fis · Qui · Mat · Port · Hist</span>
                    </div>
                </Button>

            </CardContent>
        </Card>
    );
}
