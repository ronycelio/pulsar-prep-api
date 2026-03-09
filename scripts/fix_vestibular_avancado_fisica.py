import json
from pathlib import Path


PREFIX = "med_avancado_3_Fisica_"


def qid(suffix: str) -> str:
    return f"{PREFIX}{suffix}"


FILE_PATH = Path(
    r"d:\projetomedicinaapp\pulsar-prep\prontas\vestibular\vestibular-avancado-fisica\vestibular-avancado-fisica.jsonl"
)


correct_option_updates = {
    qid("000004"): "A",
    qid("000006"): "C",
    qid("000008"): "E",
    qid("000010"): "A",
    qid("000011"): "B",
    qid("000016"): "A",
    qid("000017"): "A",
    qid("000018"): "D",
    qid("000019"): "A",
    qid("000020"): "A",
    qid("000021"): "C",
    qid("000022"): "B",
    qid("000023"): "B",
    qid("000024"): "A",
    qid("000025"): "B",
    qid("000029"): "C",
    qid("000030"): "B",
    qid("000031"): "A",
    qid("000033"): "B",
    qid("000034"): "C",
    qid("000036"): "A",
    qid("000037"): "B",
    qid("000038"): "B",
    qid("000039"): "C",
    qid("000040"): "A",
    qid("000041"): "A",
    qid("000042"): "B",
    qid("000044"): "C",
    qid("000046"): "B",
    qid("000047"): "A",
    qid("000048"): "B",
    qid("000049"): "A",
    qid("000116"): "C",
    qid("000147"): "E",
    qid("000156"): "A",
    qid("000161"): "D",
    qid("000178"): "A",
    qid("000188"): "A",
    qid("000191"): "D",
    qid("000196"): "C",
    qid("000206"): "C",
    qid("000306"): "A",
    qid("000319"): "A",
    qid("000328"): "A",
    qid("000330"): "B",
    qid("000341"): "B",
    qid("000342"): "E",
    qid("000346"): "B",
    qid("000347"): "C",
    qid("000348"): "A",
    qid("000663"): "B",
    qid("000691"): "D",
    qid("000714"): "B",
    qid("000803"): "B",
    qid("000806"): "C",
    qid("000816"): "B",
    qid("000824"): "A",
    qid("000826"): "A",
    qid("000830"): "B",
    qid("000839"): "A",
    qid("000846"): "B",
    qid("000888"): "C",
}


option_updates = {
    qid("000003"): {"option_d": "(ln 2)/k"},
    qid("000058"): {"option_b": "2,0 m/s^2"},
    qid("000066"): {"option_b": "1"},
    qid("000073"): {"option_a": "5,0 m/s"},
    qid("000081"): {"option_b": "-3,2×10^9 J"},
    qid("000084"): {"option_a": "4,5 N"},
    qid("000091"): {"option_d": "560 N"},
    qid("000101"): {"option_e": "sqrt(42) m/s"},
    qid("000148"): {"option_c": "`5/8`"},
    qid("000159"): {"option_a": "`8`"},
    qid("000163"): {"option_a": "`(3/2)R*600`"},
    qid("000168"): {"option_b": "`250 J`"},
    qid("000193"): {"option_a": "`150R`"},
    qid("000195"): {"option_b": "`400 J`"},
    qid("000198"): {"option_c": "`32°C`"},
    qid("000201"): {"option_d": "720 J"},
    qid("000210"): {"option_b": "+400 J"},
    qid("000211"): {"option_c": "0,25 kg"},
    qid("000221"): {"option_b": "2/3"},
    qid("000228"): {"option_a": "35,0°C", "option_b": "40,0°C"},
    qid("000231"): {"option_d": "1300 J"},
    qid("000245"): {"option_a": "800 J"},
    qid("000255"): {"option_b": "140 J"},
    qid("000283"): {"option_c": "12"},
    qid("000318"): {"option_c": "`4,0e3 Pa`"},
    qid("000361"): {"option_b": "1.92e5 Pa"},
    qid("000371"): {"option_b": "0.5 m/s"},
    qid("000418"): {"option_b": "4.0e-3 J"},
    qid("000431"): {"option_d": "20 N"},
    qid("000469"): {"option_a": "1,6 mT"},
    qid("000506"): {"option_b": "55 V"},
    qid("000528"): {"option_b": "0,40 V"},
    qid("000591"): {"option_b": "4,5e-5 J"},
    qid("000636"): {"option_d": "950 Hz"},
    qid("000655"): {"option_b": "50 Hz"},
    qid("000661"): {"option_c": "390 nm"},
    qid("000665"): {"option_b": "450 Hz"},
    qid("000673"): {"option_b": "1080 Hz"},
    qid("000686"): {"option_b": "t=3lambda0/(4n)"},
    qid("000690"): {"option_b": "0,60 mm"},
    qid("000698"): {"option_a": "160 Hz"},
    qid("000700"): {"option_a": "0"},
    qid("000781"): {"option_c": "4,5"},
    qid("000786"): {"option_b": "6,0 N"},
    qid("000791"): {"option_b": "0,80 V"},
    qid("000798"): {"option_c": "4,0 cm"},
    qid("000800"): {"option_b": "0,60 V"},
    qid("000804"): {"option_b": "41 V"},
    qid("000808"): {"option_d": "1600 J"},
    qid("000811"): {"option_e": "0,011 °C"},
    qid("000815"): {"option_c": "25 m"},
    qid("000818"): {"option_c": "2,0 m"},
    qid("000821"): {"option_c": "4,0e3 C"},
    qid("000823"): {"option_b": "6"},
    qid("000828"): {"option_d": "8,0e-4 J"},
    qid("000831"): {"option_e": "40%"},
    qid("000832"): {"option_a": "6,0e-5 kg/C"},
    qid("000833"): {"option_a": "do=50 cm e m=−0,6"},
    qid("000836"): {"option_e": "103 °C"},
    qid("000837"): {"option_a": "155 V"},
    qid("000838"): {"option_d": "33°C"},
    qid("000842"): {"option_a": "2,57 A"},
    qid("000847"): {"option_a": "0,08 °C"},
    qid("000848"): {"option_c": "0,80"},
    qid("000849"): {"option_a": "0,50 J e 180 J"},
    qid("000856"): {"option_e": "3,0e4 Pa"},
    qid("000871"): {"option_b": "78 dB"},
    qid("000880"): {"option_b": "67 dB"},
    qid("000926"): {"option_c": "52°"},
    qid("000936"): {"option_c": "20 V"},
}


statement_updates = {
    qid(
        "000675"
    ): "Uma rede de difracao tem 1000 linhas por milimetro e e iluminada por luz de lambda=500 nm. Para a segunda ordem, o valor de sen(theta) e aproximadamente",
}


manual_explanations = {
    qid(
        "000206"
    ): "Em volume constante, para gás ideal, vale P/T constante. Portanto, se a pressão aumenta 30%, a temperatura absoluta também aumenta 30%.",
    qid(
        "000806"
    ): "Em isocórica, Q=nCvΔT, com Cv=(5/2)R=20 J/(mol·K). Assim, Q=1*20*60=1200 J e t=Q/P=1200/120=10 s.",
    qid(
        "000675"
    ): "O espacamento é d=1/(1,0e6)=1,0e-6 m. Para a segunda ordem, sen(theta)=m lambda/d=2*5,0e-7/1,0e-6=1,0.",
    qid(
        "000839"
    ): "Usando θ≈1,22λ/D, obtém-se θ≈1,22*5,0e-7/0,10≈6,1e-6 rad. A 2,0 km, s≈Lθ≈2000*6,1e-6≈0,012 m.",
}


cleanup_markers = [
    ". Em forma proposta",
    ". Como o gabarito",
    "; como o gabarito",
    ". Pelo gabarito",
    "; pelo gabarito",
    ". Entre as opções",
    ". Entre as opcoes",
    "; entre as opções",
    "; entre as opcoes",
    ". A opção",
    ". A opcao",
    "; a opção",
    "; a opcao",
    ". A alternativa",
    "; a alternativa",
    "; alternativa",
    ". Com arredondamentos",
    "; com arredondamentos",
    "; contudo",
    "; porem",
    "; porém",
    "; para obter",
    ", mais próximo",
    ", mais proximo",
    ", muito menor",
    ". Nenhuma opção",
    ". Nenhuma opcao",
    ". O conjunto",
]


def clean_explanation(text: str) -> str:
    cleaned = text
    for marker in cleanup_markers:
        if marker in cleaned:
            cleaned = cleaned.split(marker, 1)[0]
    return cleaned.rstrip(" ;,.")


def set_generic_rationales(obj: dict) -> None:
    correct = obj["correct_option"]
    for letter in "abcde":
        key = f"rationale_{letter}"
        if key not in obj:
            continue
        if letter.upper() == correct:
            obj[key] = "Corresponde ao resultado obtido na explicação."
        else:
            obj[key] = "Não corresponde ao resultado obtido na explicação."


all_corrected_ids = (
    set(correct_option_updates)
    | set(option_updates)
    | set(statement_updates)
    | set(manual_explanations)
)


lines = FILE_PATH.read_text(encoding="utf-8").splitlines()
items = [json.loads(line) for line in lines]

for obj in items:
    item_id = obj["id"]
    if item_id not in all_corrected_ids:
        continue

    if item_id in statement_updates:
        obj["statement"] = statement_updates[item_id]

    if item_id in option_updates:
        for key, value in option_updates[item_id].items():
            obj[key] = value

    if item_id in correct_option_updates:
        obj["correct_option"] = correct_option_updates[item_id]

    if item_id in manual_explanations:
        obj["explanation_correct"] = manual_explanations[item_id]
    else:
        obj["explanation_correct"] = clean_explanation(obj["explanation_correct"])

    set_generic_rationales(obj)


FILE_PATH.write_text(
    "\n".join(json.dumps(item, ensure_ascii=False) for item in items) + "\n",
    encoding="utf-8",
)


validation_errors = []
for obj in items:
    item_id = obj["id"]
    if item_id not in all_corrected_ids:
        continue

    options = {letter.upper(): obj[f"option_{letter}"] for letter in "abcde"}
    correct_text = options[obj["correct_option"]]
    duplicates = [letter for letter, text in options.items() if text == correct_text]
    if len(duplicates) > 1:
        validation_errors.append(f"{item_id}: resposta correta duplicada em {duplicates}")

    suspicious = [
        "gabarito fixo",
        "alternativa marcada",
        "mais próxima",
        "mais proxima",
        "Nenhuma opção",
        "Nenhuma opcao",
    ]
    exp = obj["explanation_correct"]
    if any(marker in exp for marker in suspicious):
        validation_errors.append(f"{item_id}: explicação ainda suspeita")

print(f"Itens corrigidos: {len(all_corrected_ids)}")
if validation_errors:
    print("VALIDATION_ERRORS")
    for error in validation_errors:
        print(error)
else:
    print("VALIDATION_OK")
