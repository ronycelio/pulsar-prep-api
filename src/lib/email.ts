import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

if (!resend) {
  console.warn("⚠️ [EMAIL] RESEND_API_KEY não encontrada. E-mails não serão enviados.");
} else {
  // Log seguro (só 5 caracteres)
  console.log("✅ [EMAIL] Resend configurado com chave:", resendKey?.substring(0, 5) + "...");
}

const FROM = process.env.EMAIL_FROM ?? "noreply@pulsarprep.com.br";

/**
 * Dispara o e-mail de boas-vindas após a ativação da licença Lifetime.
 * Inclui instruções de como instalar a PWA no celular/PC.
 */
export async function sendWelcomeEmail(to: string, userName?: string, planType: string = "enem", generatedPassword?: string) {
  if (!resend) {
    console.error("[EMAIL] Abortando envio: Resend não inicializado.");
    return { error: "Serviço de e-mail não configurado" };
  }
  const firstName = userName?.split(" ")[0] ?? "Aluno(a)";

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "🚀 Sua licença Pulsar Prep foi ativada!",
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Licença Ativada — Pulsar Prep</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 32px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
                ⚡ Pulsar Prep
              </h1>
              <p style="margin:8px 0 0;font-size:15px;color:#c4b5fd;font-weight:500;">
                Motor de Estudos 70/30
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#f8fafc;">
                Parabéns, ${firstName}! 🎉
              </h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#94a3b8;">
                Sua <strong style="color:#a78bfa;">Licença Lifetime (${planType === "full" ? "Plano Completo" : "Plano ENEM"})</strong> foi ativada com sucesso. 
                Você agora tem acesso vitalício ao Pulsar Prep — sem mensalidades, para sempre.
              </p>

              ${generatedPassword ? `
              <!-- Credenciais -->
              <div style="background:#1e293b;border-radius:12px;padding:24px;border:1px dashed #6366f1;margin-bottom:32px;text-align:center;">
                <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#c4b5fd;">
                  Sua Chave de Acesso Inicial
                </h3>
                <p style="margin:0 0 8px;font-size:16px;color:#f8fafc;">
                  E-mail: <strong>${to}</strong>
                </p>
                <p style="margin:0;font-size:24px;font-weight:900;color:#fff;letter-spacing:1px;">
                  ${generatedPassword}
                </p>
                <p style="margin:12px 0 0;font-size:13px;color:#94a3b8;">
                  <i>(Você poderá alterar essa senha depois dentro do aplicativo)</i>
                </p>
              </div>
              ` : ''}

              <!-- CTA -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.NEXTAUTH_URL ?? "https://pulsarprep.com.br"}/login"
                   style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;
                          text-decoration:none;font-size:16px;font-weight:700;padding:14px 36px;
                          border-radius:50px;box-shadow:0 4px 24px rgba(99,102,241,0.4);">
                  Fazer Login Agora →
                </a>
              </div>

              <!-- Como instalar PWA & Desktop -->
              <div style="background:#0f172a;border-radius:12px;padding:24px;border:1px solid #334155;margin-top:8px;">
                <h3 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#f8fafc;">
                  ⬇️ Onde Baixar o Aplicativo
                </h3>
                
                <p style="margin:0 0 16px;font-size:14px;color:#94a3b8;line-height:1.6;">
                  <strong style="color:#a78bfa;font-size:15px;">💻 Windows Desktop (.exe):</strong><br/>
                  <a href="${process.env.NEXTAUTH_URL ?? "https://pulsarprep.com.br"}/download/PulsarPrepSetup.exe" style="color:#6366f1;text-decoration:none;font-weight:bold;">Baixar Instalador para Windows</a><br/>
                  <i>(Baixe, instale e abra o aplicativo no seu computador)</i>
                </p>

                <hr style="border-color:#334155; margin: 16px 0;" />
                
                <p style="margin:0 0 16px;font-size:14px;color:#94a3b8;line-height:1.6;">
                  <strong style="color:#a78bfa;font-size:15px;">🍏 iPhone / iPad (iOS):</strong><br/>
                  Abra <a href="${process.env.NEXTAUTH_URL ?? "https://pulsarprep.com.br"}" style="color:#6366f1;text-decoration:none;">pulsarprep.com.br</a> no <strong>Safari</strong> e toque em 
                  Compartilhar → "Adicionar à Tela de Início".
                </p>

                <hr style="border-color:#334155; margin: 16px 0;" />

                <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.6;">
                  <strong style="color:#a78bfa;font-size:15px;">🤖 Celulares Android:</strong><br/>
                  Abra <a href="${process.env.NEXTAUTH_URL ?? "https://pulsarprep.com.br"}" style="color:#6366f1;text-decoration:none;">pulsarprep.com.br</a> no <strong>Chrome</strong>. Um banner "Adicionar à tela inicial" aparecerá automaticamente (ou clique nos 3 pontos).
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">
                Você recebeu este e-mail porque uma compra foi associada a este endereço.<br/>
                Em caso de dúvidas, responda este e-mail. 
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `.trim(),
  });

  if (error) {
    console.error("[EMAIL] Erro ao enviar welcome email para", to, error);
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log("[EMAIL] Welcome email enviado para", to, "| ID:", data?.id);
  return data;
}
