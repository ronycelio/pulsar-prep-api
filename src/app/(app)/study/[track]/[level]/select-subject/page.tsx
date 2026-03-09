import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SelectSubjectClient from "./SelectSubjectClient";

const VALID_TRACKS = ["enem", "vestibular"];
const VALID_LEVELS = ["1", "2", "3", "avancado"];

interface Props {
    params: Promise<{ track: string; level: string }>;
}

export default async function SelectSubjectPage({ params }: Props) {
    const { track, level } = await params;
    const session = await auth();

    if (!session?.user?.id) redirect("/login");
    if (!VALID_TRACKS.includes(track) || !VALID_LEVELS.includes(level)) {
        redirect("/onboarding/track");
    }

    return <SelectSubjectClient track={track as "enem" | "vestibular"} level={level} />;
}
