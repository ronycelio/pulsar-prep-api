"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const onboardingSchema = z.object({
    track: z.enum(["enem", "vestibular", "medicina"]),
    level: z.enum(["1", "2", "3", "avancado"]),
    dailyGoal: z.number().min(1).max(30),
});

export async function completeOnboardingAction(values: z.infer<typeof onboardingSchema>) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Não autorizado." };
        }

        const validatedFields = onboardingSchema.safeParse(values);

        if (!validatedFields.success) {
            return { error: "Dados inválidos fornecidos no onboarding." };
        }

        const { track, level, dailyGoal } = validatedFields.data;

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                track,
                level,
                dailyGoal,
                onboardingCompleted: true,
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to complete onboarding:", error);
        return { error: "Ocorreu um erro interno ao salvar suas preferências." };
    }
}

// Schema para atualização parcial (todos os campos são opcionais)
const settingsSchema = z.object({
    track: z.enum(["enem", "vestibular", "medicina"]).optional(),
    level: z.enum(["1", "2", "3", "avancado"]).optional(),
    dailyGoal: z.number().min(1).max(30).optional(),
});

/**
 * Atualiza as preferências de estudo do usuário.
 * Regra de negócio: NÃO apaga o daily_state atual.
 * A mudança entra em efeito no próximo dia de estudo.
 */
export async function updateSettingsAction(values: z.infer<typeof settingsSchema>) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Não autorizado." };
        }

        const parsed = settingsSchema.safeParse(values);
        if (!parsed.success) {
            return { error: "Dados inválidos." };
        }

        const data: Record<string, unknown> = {};
        if (parsed.data.track !== undefined) data.track = parsed.data.track;
        if (parsed.data.level !== undefined) data.level = parsed.data.level;
        if (parsed.data.dailyGoal !== undefined) data.dailyGoal = parsed.data.dailyGoal;

        if (Object.keys(data).length === 0) {
            return { error: "Nenhuma alteração para salvar." };
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data,
        });

        return { success: true, updated: parsed.data };
    } catch (error) {
        console.error("Failed to update settings:", error);
        return { error: "Ocorreu um erro interno ao salvar. Tente novamente." };
    }
}
