const fs = require('fs');
const path = require('path');

const prontasDir = path.join(__dirname, 'prontas');
const outputDir = path.join(__dirname, 'public', 'data');
const outputFile = path.join(outputDir, 'questions.json');

// Garante que o diretório de saída existe
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

let allQuestions = [];
let totalFilesProcessed = 0;
let errors = 0;

function processDirectory(directory) {
    const items = fs.readdirSync(directory);

    for (const item of items) {
        const itemPath = path.join(directory, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            processDirectory(itemPath);
        } else if (item.endsWith('.jsonl')) {
            processFile(itemPath);
            totalFilesProcessed++;
        }
    }
}

function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
        if (!line.trim()) continue;

        try {
            const rawQ = JSON.parse(line);
            const formattedQ = transformQuestion(rawQ);
            if (formattedQ) {
                allQuestions.push(formattedQ);
            }
        } catch (e) {
            console.error(`Erro ao parsear linha no arquivo ${filePath}:`, e.message);
            errors++;
        }
    }
}

function transformQuestion(raw) {
    // Validação básica
    if (!raw.id || !raw.statement) return null;

    // Track
    let trackId = "enem";
    if (raw.track && (raw.track.includes("vestibular") || raw.track.includes("medicina"))) {
        trackId = "vestibular";
    }

    // Level
    let levelId = "avancado";
    if (raw.level === "avancado") {
        levelId = "avancado";
    } else if (raw.year === 1 || raw.year === 2 || raw.year === 3) {
        levelId = raw.year.toString();
    } else if (raw.level === "n1" || raw.level === "normal_1") {
        levelId = "1";
    } else if (raw.level === "n2" || raw.level === "normal_2") {
        levelId = "2";
    } else if (raw.level === "n3" || raw.level === "normal_3") {
        levelId = "3";
    }

    // Difficulty
    let difficulty = "medium";
    if (raw.difficulty === 1 || raw.difficulty === "1" || raw.difficulty === "easy") difficulty = "easy";
    else if (raw.difficulty === 3 || raw.difficulty === "3" || raw.difficulty === "hard") difficulty = "hard";

    // Alternatives
    const alternatives = [];
    ['a', 'b', 'c', 'd', 'e'].forEach(letter => {
        const optionKey = `option_${letter}`;
        if (raw[optionKey]) {
            alternatives.push({ id: letter, text: raw[optionKey] });
        }
    });

    // Rationales
    const rationales = {};
    ['a', 'b', 'c', 'd', 'e'].forEach(letter => {
        const rationaleKey = `rationale_${letter}`;
        if (raw[rationaleKey]) {
            rationales[letter] = raw[rationaleKey];
        }
    });

    // HasImage
    let hasImage = false;
    if (raw.has_image === 1 || raw.has_image === true || raw.has_image === "1" || raw.has_image === "true") {
        hasImage = true;
    }

    // ImagePath
    let imagePath = "";
    if (raw.image_path && raw.image_path !== "null" && raw.image_path !== "false") {
        imagePath = raw.image_path;
    }

    return {
        id: raw.id,
        trackId: trackId,
        levelId: levelId,
        subject: raw.subject || "Conhecimentos Gerais",
        difficulty: difficulty,
        year: raw.year || null,
        statement: raw.statement,
        alternatives: alternatives,
        correctAlternativeId: typeof raw.correct_option === 'string' ? raw.correct_option.toLowerCase() : "a",
        explanation: raw.explanation_correct || "",
        rationales: rationales,
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        hasImage: hasImage,
        imagePath: imagePath
    };
}

console.log('Iniciando correção e integração de questões...');
processDirectory(prontasDir);

console.log(`\nIntegração finalizada!`);
console.log(`Questões convertidas: ${allQuestions.length}`);

console.log('\nSalvando questions.json...');
fs.writeFileSync(outputFile, JSON.stringify(allQuestions, null, 2), 'utf8');
console.log(`Arquivo salvo. Tamanho: ${(fs.statSync(outputFile).size / (1024 * 1024)).toFixed(2)} MB`);
