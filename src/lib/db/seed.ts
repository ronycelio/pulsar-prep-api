import { db } from "./index";
import { Question } from "@/types/question";

export async function seedDatabase() {
    const existingQuestions = await db.questions.count();
    const EXPECTED_MIN_QUESTIONS = 28000; // Ajustado para refletir o novo total validado das novas questões prontas (28.220)

    // Controle de versão do seed para forçar relistagem quando atualizamos o index O(1) e o nível do Vestibular
    const CURRENT_SEED_VERSION = "7"; // v7: fix do mapeamento do nível "avancado"
    const localSeedVersion = typeof window !== "undefined" ? localStorage.getItem("pulsar_seed_version") : null;
    const needsSeed = existingQuestions < EXPECTED_MIN_QUESTIONS || localSeedVersion !== CURRENT_SEED_VERSION;

    if (needsSeed) {
        console.log("Iniciando download da base completa ou atualizando índices (28k+ questões)...");

        try {
            // Timestamp adicionado para forçar ignorar o cache local travado do navegador
            const response = await fetch('/data/questions.json?v=' + new Date().getTime(), { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Falha ao baixar questoes.json: ${response.statusText}`);
            }

            const allQuestions: Question[] = await response.json();
            console.log(`JSON carregado com ${allQuestions.length} questões. Inserindo no Dexie...`);

            await db.questions.clear(); // Limpa as antigas para reconstruir índice composto com dados novos

            // Inserção em chunks para não travar a UI
            const CHUNK_SIZE = 2000;
            for (let i = 0; i < allQuestions.length; i += CHUNK_SIZE) {
                const chunk = allQuestions.slice(i, i + CHUNK_SIZE);
                await db.questions.bulkPut(chunk);
                console.log(`Chunk inserido/atualizado: ${i} a ${i + chunk.length}`);
            }

            if (typeof window !== "undefined") {
                localStorage.setItem("pulsar_seed_version", CURRENT_SEED_VERSION);
            }
            console.log("✅ Banco local populado e indexado com questoes reais com sucesso.");
        } catch (error) {
            console.error("❌ Erro fatal ao efetuar seed da base de questoes:", error);
        }
    } else {
        console.log(`O banco Dexie já possui ${existingQuestions} questões oficiais e está na versão atualizada.`);
    }
}
