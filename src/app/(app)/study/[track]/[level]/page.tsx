import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import StudyPageClient from "./StudyPageClient";

const VALID_TRACKS = ["enem", "vestibular"];
const VALID_LEVELS = ["1", "2", "3", "avancado"];

interface Props {
    params: Promise<{ track: string; level: string }>;
}

export default async function StudyPage({ params }: Props) {
    const { track, level } = await params;
    const session = await auth();

    if (!session?.user?.id) redirect("/login");
    if (!VALID_TRACKS.includes(track) || !VALID_LEVELS.includes(level)) {
        redirect("/onboarding/track");
    }

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <StudyPageClient
                params={{ track, level }}
                userId={session.user.id}
            />
        </Suspense>
    );
}
