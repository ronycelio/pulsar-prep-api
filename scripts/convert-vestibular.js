/**
 * Script de conversão: JSONL (legado) → questions.json (formato do app)
 * 
 * Uso: node scripts/convert-vestibular.js
 * 
 * Lê todos os .jsonl de:
 *   projeto antigi/content/prontas/vestibular/**
 * 
 * Converte e ADICIONA ao arquivo existente:
 *   pulsar-prep/public/data/questions.json
 */

const fs = require("fs");
const path = require("path");

// ─── Configurações ────────────────────────────────────────────────────────────
const SOURCE_DIR = path.join(__dirname, "../../projeto antigi/content/prontas/vestibular");
const OUTPUT_FILE = path.join(__dirname, "../public/data/questions.json");

// ─── Mapeamentos ──────────────────────────────────────────────────────────────

/** Converte o `level` legado para `levelId` do app */
function mapLevel(levelRaw) {
    if (!levelRaw) return "1";
    const l = String(levelRaw).toLowerCase().trim();
    if (l === "n1") return "1";
    if (l === "n2") return "2";
    if (l === "n3") return "3";
    if (l === "avancado" || l === "avançado") return "avancado";
    return l; // fallback
}

/** Converte dificuldade numérica (1/2/3) para string */
function mapDifficulty(d) {
    const n = Number(d);
    if (n === 1) return "easy";
    if (n === 3) return "hard";
    return "medium"; // 2 ou qualquer outro
}

/** Normaliza o trackId para o formato do app */
function mapTrack(trackRaw) {
    if (!trackRaw) return "vestibular";
    const t = String(trackRaw).toLowerCase();
    if (t.includes("avancado") || t.includes("avançado")) return "vestibular"; // track = vestibular, level = avancado
    return "vestibular";
}

/** Extrai o levelId a partir do nome da pasta */
function levelFromFolder(folderName) {
    // exemplos: vestibular-1º-biologia, vestibular-avancado-matematica
    if (folderName.includes("-1") || folderName.includes("1º")) return "1";
    if (folderName.includes("-2") || folderName.includes("2º")) return "2";
    if (folderName.includes("-3") || folderName.includes("3º")) return "3";
    if (folderName.includes("avancado") || folderName.includes("avançado")) return "avancado";
    return null; // desconhecido
}

/** Extrai a matéria a partir do nome da pasta */
function subjectFromFolder(folderName) {
    const map = {
        "biologia": "Biologia",
        "fisica": "Física",
        "quimica": "Química",
        "matematica": "Matemática",
        "portugues": "Português",
        "hist-geogra": "História e Geografia",
        "hist-geografia": "História e Geografia",
    };
    for (const [key, val] of Object.entries(map)) {
        if (folderName.toLowerCase().includes(key)) return val;
    }
    return folderName; // fallback
}

/** Converte uma linha do JSONL legado para o formato do app */
function convertQuestion(raw, folderName) {
    // IDs das alternativas
    const altIds = ["a", "b", "c", "d", "e"];

    const alternatives = altIds.map((id) => ({
        id,
        text: raw[`option_${id}`] || "",
    })).filter(alt => alt.text); // remove alternativas vazias

    const correctId = (raw.correct_option || "A").toLowerCase();

    const rationales = {};
    for (const id of altIds) {
        const key = `rationale_${id}`;
        if (raw[key]) rationales[id] = raw[key];
    }

    // Derivar levelId: prioridade NOME DA PASTA (porque os JSONs do n2 estão com n3 incorretamente)
    const levelFromDir = levelFromFolder(folderName);
    const levelId = levelFromDir || mapLevel(raw.level);

    return {
        id: raw.id || `vest_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        trackId: "vestibular",
        levelId,
        subject: raw.subject || subjectFromFolder(folderName),
        difficulty: mapDifficulty(raw.difficulty),
        year: raw.year || null,
        statement: raw.statement || "",
        alternatives,
        correctAlternativeId: correctId,
        explanation: raw.explanation_correct || raw.explanation || "",
        rationales,
        tags: raw.tags || [],
        hasImage: raw.has_image || false,
        imagePath: raw.image_path || "",
    };
}

// ─── Execução ─────────────────────────────────────────────────────────────────

console.log("📂 Carregando questões existentes de:", OUTPUT_FILE);
let existing = [];
if (fs.existsSync(OUTPUT_FILE)) {
    const raw = fs.readFileSync(OUTPUT_FILE, "utf8");
    existing = JSON.parse(raw);
    console.log(`✅ ${existing.length} questões existentes carregadas.`);
} else {
    console.log("⚠️  Arquivo não encontrado, será criado.");
}

const existingIds = new Set(existing.map((q) => q.id));
const newQuestions = [];
let skipped = 0;
let errored = 0;

console.log("\n📂 Processando subpastas em:", SOURCE_DIR);
const folders = fs.readdirSync(SOURCE_DIR).filter((f) => {
    const p = path.join(SOURCE_DIR, f);
    return fs.statSync(p).isDirectory();
});

console.log(`📁 ${folders.length} subpastas encontradas.\n`);

for (const folder of folders) {
    const folderPath = path.join(SOURCE_DIR, folder);
    const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".jsonl"));

    let folderCount = 0;
    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const content = fs.readFileSync(filePath, "utf8");
        const lines = content.split("\n").filter((l) => l.trim());

        for (const line of lines) {
            try {
                const raw = JSON.parse(line);
                if (existingIds.has(raw.id)) {
                    skipped++;
                    continue;
                }
                const converted = convertQuestion(raw, folder);
                newQuestions.push(converted);
                existingIds.add(converted.id);
                folderCount++;
            } catch (e) {
                errored++;
                console.error(`  ❌ Erro ao processar linha em ${file}:`, e.message);
            }
        }
    }
    console.log(`  ✅ ${folder}: +${folderCount} questões`);
}

// ─── Salvar ───────────────────────────────────────────────────────────────────
const combined = [...existing, ...newQuestions];
console.log(`\n💾 Salvando ${combined.length} questões no total (+${newQuestions.length} novas, ${skipped} duplicatas ignoradas, ${errored} erros)`);

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(combined, null, 0), "utf8");
console.log(`✅ Concluído! Arquivo salvo em: ${OUTPUT_FILE}`);
