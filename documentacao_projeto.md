# Pulsar Prep — Documentação do Projeto

> **Última atualização:** 2026-03-10 | **Versão:** MVP Completo (Pré-Launch)

---

## 1. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Banco de Dados | Supabase (PostgreSQL) + Prisma ORM |
| Auth | Auth.js v5 (next-auth) — sessão baseada em JWT |
| Offline/Local | Dexie.js (IndexedDB wrapper) |
| Pagamentos | Mercado Pago (checkout preference link + webhook) |
| Email | Resend |
| PWA | Serwist (Service Worker) |
| Estado Global | Zustand (onboardingStore) |
| UI | shadcn/ui + Tailwind v4 (CSS-first) |
| Deploy | EasyPanel (Docker / container) |

---

## 2. Variáveis de Ambiente (`.env.local`)

```
DATABASE_URL=          # Supabase connection pooler (prisma)
DIRECT_URL=            # Supabase direct connection (migrate)
NEXTAUTH_SECRET=
NEXTAUTH_URL=
MERCADOPAGO_ACCESS_TOKEN=
RESEND_API_KEY=
```

---

## 3. Status dos Épicos MVP

### ✅ Epic 1 — Fundação & Autenticação
- Registro / Login com senha (Auth.js v5)
- JWT com `deviceId` para anti-pirataria (sessão única por device)
- `BlockedSessionUI` exibido se sessão substituída por novo device
- Webhook Mercado Pago em `/api/webhooks/mercadopago` — ativa `lifetimeLicense` + `plan` no DB
- E-mail pós-pagamento via Resend com instruções de acesso
- Exclusão de conta LGPD em `/api/account/delete`
- PWA instalável (manifest + Serwist service worker)

### ✅ Epic 2 — Onboarding
- Seleção de Trilha (`/onboarding/track`): ENEM ou Vestibular
- Seleção de Etapa (`/onboarding/level`): 1º Ano / 2º Ano / 3º Ano / Avançado
- Seleção de Meta Diária (`/onboarding/goal`): slider dinâmico
- Dados persistidos no Zustand (`onboardingStore`) + Prisma User (`track`, `level`, `dailyGoal`)
- Rota `/dashboard/settings` para alterar configurações

### ✅ Epic 3 — Motor de Estudo 70/30
- `lib/engine/generator.ts` — gera sessão com 70% questões novas + 30% revisão de erros
- Banco: **28.119 questões auditadas** em `public/data/questions.json` (42 MB)
- Seed para IndexedDB via `lib/db/seed.ts` (filtra por track+level)
- Interface de questão com alternativas A-E + confirmação + feedback expandido
- Racionais por alternativa (por que errou / por que está certa)
- Progress bar da sessão em tempo real
- `StudySessionClient.tsx` — componente principal da sessão
- Rotas: `/study/[track]/[level]` → `select-subject` → questões

### ✅ Epic 4 — Gamificação & Dashboard (implementado 2026-03-10)
- **Streak auto-increment** no `StudySessionClient.handleConfirm()`:
  - Incrementa ao bater a meta do dia pela primeira vez
  - Verifica `daily_state` de ontem para calcular continuidade correta
  - Persiste em `daily_state.streakDay` no Dexie
- **Tela de Celebração** ao completar a meta:
  - Confetti CSS puro (sem libs externas) — `@keyframes confetti-fall` em `globals.css`
  - Emoji dinâmico: 🏆 (≥80%), 🎯 (≥60%), 📚 (<60%)
  - Badge de ofensiva: *"🔥 X dias de Ofensiva"*
  - Botão **⚡ Treino Extra** — gera nova sessão imediatamente
  - Botão **Ver Dashboard**
- **Dashboard atualizado** (`DashboardCategoryClient.tsx`):
  - Card de Meta: fica verde + badge "Concluída! ✓" quando meta batida
  - Card de Streak: borda laranja + mensagem motivacional (`>= 3 dias`)
  - Barra de progresso: verde gradiente quando meta batida, texto "✓ Meta batida!"
  - Botão CTA: gradiente âmbar/laranja com ícone ⚡ quando meta batida
  - Toast de celebração (1× por dia/categoria via localStorage flag)
- **StatsView** — gráfico de acerto por matéria (tab "Estatísticas")
- **ErrorsView** — Caderno de Erros com accordion (tab "Revisão")

### ✅ Epic 5 — Sync Engine Offline-First (implementado 2026-03-10)

#### Arquitetura de Dados
```
IndexedDB (Dexie)           →  API /api/sync  →  PostgreSQL (Supabase)
  db.progress (isSynced:false) → flush()     →  progress_entries
  db.daily_state (pendingSync:true) → flush() →  daily_states  ← NOVO
```

#### Sync Push (dispositivo → servidor)
- `POST /api/sync` — recebe `{ progress[], dailyStates[] }` em um único request
- Upsert por `[userId, questionId]` para progress
- Upsert por `[userId, categoryKey, date]` para daily_state

#### Sync Pull (servidor → dispositivo / cross-device)
- `GET /api/sync/pull` — retorna `{ progress[], dailyStates[] }` (últimos 90 dias de daily_state)
- `SyncQueue.pullFromServer()` — restaura progresso + streak ao logar em novo dispositivo
- Resolução de conflitos: **LWW por `answeredAt`** para progress; **LWW by maior `streakDay`** para daily_state

#### Detecção de Rede (`useNetworkStatus.ts`)
- Montado globalmente no `(app)/layout.tsx` via `<NetworkStatusTrigger />`
- `window.online` → flush de pendentes + toast "X questões sincronizadas"
- `window.offline` → toast "Estudando offline. Progresso será sincronizado quando a internet voltar"
- **Pull cross-device automático**: se Dexie vazio ao montar → pull do servidor (executa 1× por device via localStorage `pulsar_pull_done`)

#### Banco de Dados (Prisma)
```prisma
model DailyState {    // NOVO em 2026-03-10
  userId       String
  categoryKey  String
  date         String   // "YYYY-MM-DD"
  goalTotal    Int
  goalCompleted Int
  goalReached  Boolean
  streakDay    Int
  @@unique([userId, categoryKey, date])
  @@map("daily_states")
}
```
> `prisma db push` aplicado em produção. Tabela `daily_states` criada no Supabase.

---

## 4. Checkout & Pagamentos

### Fluxo de Compra
1. `/comprar` — página com planos ENEM (R$X) e FULL (R$X)
2. `POST /api/checkout` — cria preference no Mercado Pago
3. Popup abre com link MP; polling a cada 3s em `/api/checkout/status`
4. Webhook MP em `/api/webhooks/mercadopago` — ativa `lifetimeLicense=true` + `plan` no DB
5. Redirecionamento para `/obrigado`

### Upgrade
- `UpgradeButton.tsx` — mesmo fluxo popup+polling via `/api/checkout/upgrade`

### Paywall
- Free: acesso ao **1º Ano** (ENEM) com limite de **50 questões**
- Plano ENEM: acesso ao ENEM níveis 1-3 + Avançado
- Plano Full: ENEM + Vestibular completo
- Vestibular bloqueado para não-full em `dashboard/[track]/[level]/page.tsx`

---

## 5. Estrutura de Arquivos-Chave

```
src/
├── app/
│   ├── (app)/
│   │   ├── layout.tsx              # Auth guard + NetworkStatusTrigger
│   │   ├── dashboard/
│   │   │   ├── page.tsx            # Dashboard principal (overview)
│   │   │   └── [track]/[level]/
│   │   │       ├── page.tsx        # Auth + paywall check
│   │   │       ├── DashboardCategoryClient.tsx  # UI principal do dashboard
│   │   │       ├── StatsView.tsx   # Tab: acerto por matéria
│   │   │       └── ErrorsView.tsx  # Tab: caderno de erros
│   │   └── study/[track]/[level]/
│   │       ├── StudyPageClient.tsx     # Carrega fila de questões do Dexie
│   │       └── StudySessionClient.tsx  # Sessão ativa (questões + streak)
│   └── api/
│       ├── sync/route.ts           # POST: push progress + daily_state
│       ├── sync/pull/route.ts      # GET: pull progress + daily_state
│       ├── checkout/route.ts       # POST: nova compra MP
│       ├── checkout/upgrade/route.ts
│       ├── checkout/status/route.ts
│       └── webhooks/mercadopago/route.ts
├── lib/
│   ├── db/
│   │   ├── index.ts                # PulsarPrepDatabase (Dexie v5)
│   │   ├── schema.ts               # Definição das tabelas Dexie
│   │   └── seed.ts                 # Seed questões do questions.json para Dexie
│   ├── engine/generator.ts         # Motor 70/30
│   └── sync/
│       ├── syncQueue.ts            # Push + Pull para o servidor
│       └── conflicts.ts            # LWW conflict resolution
├── hooks/useNetworkStatus.ts       # Monitor de rede + auto-sync
└── components/
    ├── study/NetworkStatusTrigger.tsx  # Monta o hook globalmente
    └── UpgradeButton.tsx           # Botão de upgrade cross-sell
prisma/
└── schema.prisma                   # User, ProgressEntry, DailyState, LicenseKey...
public/data/
└── questions.json                  # 28.119 questões auditadas (42 MB)
```

---

## 6. Próximos Passos (Versão 2)

> **🎉 O MVP 1.0 está 100% concluído.** A instalação da PWA foi resolvida através de um Modal Educativo in-app (Risco Zero).

As próximas implementações focam em experiência avançada e segurança de conteúdo:

| Item | Prioridade | Descrição |
|------|-----------|-----------|
| **Questões com imagens** | 🔸 Alta | Campo `imagePath` já existe nas questões. Falta construir a renderização visual no frontend (`StudySessionClient`). |
| **Segurança das respostas** | 🔸 Média | Atualmente `questions.json` baixa para o client inteiro (com gabarito exposto). O correto é o front enviar a tentativa para uma API `/api/study/validate` e receber se acertou/errou + a explicação. |
| **Shuffle de alternativas** | 🔸 Baixa | Embaralhar as ordens das alternativas (A-E) a cada sessão para evitar decoreba visual e "cola". |

---

## 7. Como Fazer Deploy (EasyPanel)

1. Commit + push no VSCode para o repositório conectado ao EasyPanel
2. EasyPanel detecta o push e faz rebuild automático
3. Build usa `npm run build` (Next.js production build)
4. Variáveis de ambiente já configuradas no EasyPanel
5. Prisma: `prisma db push` **não é necessário** no deploy — já foi feito localmente com conexão direta

---

## 8. Histórico de Migrações (Prisma)

> ⚠️ Este projeto usa `prisma db push` (não `migrate dev`) porque o banco de produção foi criado manualmente. Para alterações futuras de schema, sempre use `prisma db push`.

| Data | Mudança |
|------|---------|
| Pré-MVP | User, Account, Session, ProgressEntry, LicenseKey, ProcessedTransaction |
| 2026-03-10 | **DailyState** — `daily_states` table para streak cross-device sync |

---

## 9. Questões — Fonte e Formato

- **Origem:** `D:\projetomedicinaapp\pulsar-prep\prontas\` (arquivos `.jsonl` auditados)
- **Script de conversão:** `C:\temp\convert_questions.js` (Node.js — converte JSONL → JSON)
- **Output:** `public/data/questions.json` (42 MB, 28.119 questões, deduplicadas)
- **Backup das antigas:** `public/data/questions_backup_old.json`
- **Formato de questão:**

```json
{
  "id": "enem_1_humanas_2019_q001",
  "trackId": "enem",
  "levelId": "1",
  "subject": "história",
  "year": "2019",
  "statement": "...",
  "alternatives": [
    { "id": "alt_a", "text": "..." },
    ...
  ],
  "correctAlternativeId": "alt_c",
  "explanation": "Defesa da resposta correta...",
  "rationales": {
    "alt_a": "Por que A está errada...",
    "alt_b": "Por que B está errada..."
  },
  "difficulty": "medio",
  "hasImage": false,
  "imagePath": null,
  "tags": ["reforma-agrária", "brasil-república"]
}
```

---

*Documento mantido pelo agente AI. Atualizar sempre que features críticas forem implementadas.*
