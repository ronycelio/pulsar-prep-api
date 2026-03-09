"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function registerAction(values: z.infer<typeof registerSchema>) {
    try {
        const parsed = registerSchema.safeParse(values);
        if (!parsed.success) {
            return { error: "Dados inválidos." };
        }

        const { name, email, password } = parsed.data;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { error: "Este e-mail já está em uso." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                lifetimeLicense: false,
            },
        });

        return { success: "Conta criada com sucesso!" };
    } catch (error) {
        console.error("Register Error:", error);
        return { error: "Erro interno do servidor." };
    }
}

export async function loginAction(values: z.infer<typeof loginSchema>) {
    try {
        const parsed = loginSchema.safeParse(values);
        if (!parsed.success) {
            return { error: "Dados inválidos." };
        }

        const { email, password } = parsed.data;

        await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        // Após sign-in com sucesso, checa se a senha é temporária (conta criada pelo Webhook do MP)
        const user = await prisma.user.findUnique({
            where: { email },
            select: { isTemporaryPassword: true }
        });

        if (user?.isTemporaryPassword) {
            return { success: true, requiresPasswordChange: true };
        }

        return { success: "Login realizado com sucesso!" };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Credenciais inválidas." };
                default:
                    return { error: "Ocorreu um erro ao fazer login." };
            }
        }

        // Auth.js throw redirect error under the hood
        throw error;
    }
}

// Ação para trocar a senha pela definitiva (usada na primeira troca obrigatória)
const changePasswordSchema = z.object({
    email: z.string().email(),
    newPassword: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

export async function changePasswordAction(values: z.infer<typeof changePasswordSchema>) {
    try {
        const parsed = changePasswordSchema.safeParse(values);
        if (!parsed.success) {
            return { error: parsed.error.issues[0].message };
        }

        const { email, newPassword } = parsed.data;

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                isTemporaryPassword: false, // Limpa a flag — nunca mais pede troca
            },
        });

        return { success: "Senha atualizada com sucesso!" };
    } catch (error) {
        console.error("Change Password Error:", error);
        return { error: "Erro ao atualizar a senha." };
    }
}
