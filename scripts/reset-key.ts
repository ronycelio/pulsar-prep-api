import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    await prisma.licenseKey.updateMany({
        where: { code: "PULSAR-ADMIN-TESTE" },
        data: {
            usedAt: null,
            usedByEmail: null
        }
    });

    console.log("✅ Chave PULSAR-ADMIN-TESTE resetada e pronta para ser usada novamente.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
