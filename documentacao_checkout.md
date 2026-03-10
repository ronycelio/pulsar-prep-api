# Atualizações no Fluxo de Checkout (Pulsar Prep) - Março 2026

Este documento foi gerado a pedido do administrador para servir de contexto para o próximo Agente (IA) ou Desenvolvedor que assumir o projeto.

## Resumo das Modificações
O fluxo de checkout do Mercado Pago foi reestruturado para ser mais profissional, com menos cliques e maior taxa de conversão, além de garantir 100% de qualidade na integração de acordo com as exigências do Mercado Pago.

## O que foi planejado e implementado:

### 1. Página Única de Checkout (`src/app/comprar/page.tsx`)
- A rota `/comprar` agora concentra a escolha do plano (ENEM ou Completo) e a captura do e-mail na mesma tela, unificando os antigos links separados.
- O modal intermediário de aviso sobre a caixa de SPAM foi removido da etapa de compra (para reduzir o atrito). Esse aviso foi movido de forma passiva para a UX da rota final de `/obrigado`.
- A interface exibe cards interativos onde o plano "Completo" tem destaque ("Mais Popular"). A URL ainda aceita os parâmetros `?plan=enem` ou `?plan=full` para pré-selecionar a escolha do usuário.

### 2. Rotas da API do Mercado Pago (`src/app/api/checkout/route.ts` e `src/app/api/checkout/upgrade/route.ts`)
Para sanar os avisos de qualificação de integração no painel do MP:
- Foi adicionado o metadado `category_id: "learnings"` em todos os itens criados.
- Foi inserida uma `description` bem detalhada com a especificação ("Acesso vitalício à plataforma...").
- Foi enviada a URL do ícone (`picture_url: \`\${APP_URL}/favicon.ico\``) para a janela de pagamento do Mercado Pago ficar com a identidade visual da plataforma.
- Configurada explicitamente a preferência de método de pagamento com `default_installments: 1` para garantir ampla aceitação de formas à vista como Débito e Pix.
- Melhor controle de payer enviando o e-mail real do aluno e external_reference.

### 3. Comportamento Mágico da Interação Dinâmica (Frontend / Backend)
Para resolver o problema do usuário ficar perdido na tela de QR Code após o pagamento:
- **Fluxo Inicial:** Quando o usuário preenche o e-mail e clica em "Assinar", a página de checkout impede a navegação normal e abre uma **Nova Guia do Navegador (Popup)** para processar o link do checkout do Mercado Pago de forma segura.
- **Polling Background:** A página de base (`/comprar`), que continua aberta, entra numa tela de "Aguardando Pagamento..." e começa a fazer consultas em segundo plano a cada 3 segundos na rota `/api/checkout/status`.
- **Validação Cruzada:** A rota de status foi consertada para cruzar informações de banco de dados (`userId` / `email`) com o plano específico exigido (`plan`), garantindo que não dê falso positivo caso o e-mail seja de alguém testando que já possuía licença anterior comprada. A solicitação de rede (`fetch`) no backend da UI utiliza bust de cache `_t=${Date.now()}`.
- **Fechamento Automático:** Assim que o pagamento cai (seja via Pix ou Cartão) e o Webhook injeta no DB, a próxima consulta contínua de status retorna *"approved"*. O frontend, na página original, invoca o comando `mpWindowRef.close()`, **derrubando automaticamente o popup do checkout do Mercado Pago/QR Code** para o usuário, e então realiza `window.location.href = '/obrigado'`, dando uma sensação de confirmação instantânea perfeita.

### 4. Botão de Upgrade (`src/components/UpgradeButton.tsx`)
- Este componente (usado pelos alunos do plano ENEM que desejam comprar o acesso FULL via Dashboard) passou pelas exatas mesmas correções de Pop-up dinâmico e Polling, utilizando a via `api/checkout/upgrade`. 

## Status do Build
- **Testes locais:** Testado até o processo de Build. A aplicação compilou perfeitamente nos sistemas do Next.js sem nenhum erro de tipagem de React ou falhas de Server Actions. Tudo com estado VERDE.
- Próximo deploy deve ser enviado via o controle de versão.
