/**
 * Script de seed do Admin — Pulsar Prep
 * 
 * Uso: npx ts-node scripts/seed-admin.ts
 * Ou com dotenv/tsx: npx tsx scripts/seed-admin.ts
 * 
 * Ativa a licença lifetime para o e-mail configurado em ADMIN_EMAILS.
 * Também pode ser usado para ativar qualquer e-mail manualmente.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

    if (adminEmails.length === 0) {
        console.error("❌ Nenhum e-mail definido em ADMIN_EMAILS no .env");
        process.exit(1);
    }

    for (const email of adminEmails) {
        const result = await prisma.user.updateMany({
            where: { email },
            data: {
                lifetimeLicense: true,
                licenseActivatedAt: new Date(),
            },
        });

        if (result.count > 0) {
            console.log(`✅ Licença ativada para: ${email}`);
        } else {
            console.warn(`⚠️  Usuário não encontrado no banco: ${email} (faça login pelo app primeiro)`);
        }
    }

    // Criar uma chave de ativação de teste
    const testKey = await prisma.licenseKey.upsert({
        where: { code: "PULSAR-ADMIN-TESTE" },
        update: {},
        create: { code: "PULSAR-ADMIN-TESTE" },
    });
    console.log(`🔑 Chave de teste disponível: ${testKey.code}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
