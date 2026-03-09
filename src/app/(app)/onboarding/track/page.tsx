import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TrackSelectionClient from "./TrackSelectionClient";
import { redirect } from "next/navigation";

export default async function TrackSelectionPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const liveUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, onboardingCompleted: true }
    });

    const isFirstTime = liveUser ? !liveUser.onboardingCompleted : true;
    const userName = liveUser?.name || "Estudante";

    return <TrackSelectionClient userName={userName} isFirstTime={isFirstTime} />;
}
