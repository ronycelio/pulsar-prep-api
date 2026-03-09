import NextAuth, { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Augment NextAuth types
declare module "next-auth" {
    interface User {
        lifetimeLicense?: boolean;
        plan?: string;
        currentDeviceId?: string | null;
    }
    interface Session {
        user: User & {
            id: string;
            lifetimeLicense?: boolean;
            plan?: string;
            currentDeviceId?: string | null;
        };
    }
}

export const authOptions: NextAuthConfig = {
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Credenciais inválidas");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!user || !user.password) {
                    throw new Error("Usuário não encontrado");
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Senha incorreta");
                }

                const newDeviceId = crypto.randomUUID();

                await prisma.user.update({
                    where: { id: user.id },
                    data: { currentDeviceId: newDeviceId }
                });

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    lifetimeLicense: user.lifetimeLicense,
                    plan: user.plan,
                    currentDeviceId: newDeviceId,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.lifetimeLicense = user.lifetimeLicense;
                token.plan = user.plan;
                token.currentDeviceId = user.currentDeviceId;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                // Extend default session to include custom data required for offline sync caching
                (session.user as any).lifetimeLicense = token.lifetimeLicense;
                (session.user as any).plan = token.plan;
                (session.user as any).currentDeviceId = token.currentDeviceId;
            }
            return session;
        },
    },
};

export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth(authOptions);
