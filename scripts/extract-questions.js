import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Caminhos
const SOURCE_DIR = 'd:\\projetomedicinaapp\\projeto antigi\\content\\prontas\\enem';
const OUTPUT_FILE = 'd:\\projetomedicinaapp\\pulsar-prep\\public\\data\\questions.json';

// Função auxiliar para mapear nível e trilha
function mapLevelAndTrack(track, level, year) {
    let finalTrack = track.toLowerCase() === "enem" ? "enem" : "vestibular";
    let finalLevel = "avancado";

    if (level.toLowerCase() === "normal") {
        finalLevel = year.toString(); // "1", "2", "3"
    }

    return { finalTrack, finalLevel };
}

// Função auxiliar para mapear dificuldade
function mapDifficulty(diffInt) {
    if (diffInt === 1) return "easy";
    if (diffInt === 2) return "medium";
    if (diffInt === 3) return "hard";
    return "medium"; // fallback
}

// Função auxiliar para parsear um lote jsonl
async function processFile(filePath, allQuestions) {
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (!line.trim()) continue;

        try {
            const json = JSON.parse(line);

            const { finalTrack, finalLevel } = mapLevelAndTrack(json.track, json.level, json.year);

            const question = {
                id: json.id,
                trackId: finalTrack,
                levelId: finalLevel,
                subject: json.subject,
                difficulty: mapDifficulty(json.difficulty),
                statement: json.statement,
                alternatives: [
                    { id: "a", text: json.option_a },
                    { id: "b", text: json.option_b },
                    { id: "c", text: json.option_c },
                    { id: "d", text: json.option_d },
                    { id: "e", text: json.option_e }
                ],
                correctAlternativeId: json.correct_option.toLowerCase(),
                explanation: json.explanation_correct,
                rationales: {
                    "a": json.rationale_a,
                    "b": json.rationale_b,
                    "c": json.rationale_c,
                    "d": json.rationale_d,
                    "e": json.rationale_e
                },
                tags: json.tags || [],
                hasImage: json.has_image === 1,
                imagePath: json.image_path
            };

            allQuestions.push(question);
        } catch (e) {
            console.error(`Erro ao parsear a linha no arquivo ${filePath}:`, line);
            console.error(e);
        }
    }
}

// Lendo pastas recursivamente
async function walkAndProcess(dir, allQuestions) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            await walkAndProcess(fullPath, allQuestions);
        } else if (file.endsWith('.jsonl')) {
            console.log(`Processando ${fullPath}...`);
            await processFile(fullPath, allQuestions);
        }
    }
}

async function main() {
    console.log("Iniciando extração de questões...");
    const allQuestions = [];

    if (!fs.existsSync(SOURCE_DIR)) {
        console.error("DIRETÓRIO NÃO ENCONTRADO:", SOURCE_DIR);
        process.exit(1);
    }

    await walkAndProcess(SOURCE_DIR, allQuestions);

    console.log(`Total de questões extraídas: ${allQuestions.length}`);

    // Garante que a pasta de destino exista
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allQuestions), 'utf-8');
    console.log(`✅ Extração concluída! Salvo em: ${OUTPUT_FILE}`);
}

main().catch(console.error);
