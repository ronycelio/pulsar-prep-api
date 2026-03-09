export const dynamic = "force-dynamic";

import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LevelSelectionClient from "./LevelSelectionClient";

// The level page is a lightweight Server Component that validates auth
// and passes the track from the session/searchParams.
// The actual progress badges are computed client-side via Dexie LiveQuery
// in the LevelSelectionClient.
export default async function LevelSelectionPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { lifetimeLicense: true }
    });

    const isPremium = !!dbUser?.lifetimeLicense;

    return <LevelSelectionClient isPremium={isPremium} />;
}
