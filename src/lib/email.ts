import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

if (!resend) {
    console.warn("⚠️ [EMAIL] RESEND_API_KEY não encontrada. E-mails não serão enviados.");
} else {
    console.log("✅ [EMAIL] Resend configurado com chave:", resendKey?.substring(0, 5) + "...");
}

const FROM = process.env.EMAIL_FROM ?? "noreply@pulsarprep.shop";
const APP_URL = process.env.NEXTAUTH_URL ?? "https://api.pulsarprep.shop";

export async function sendWelcomeEmail(
    to: string,
    userName?: string,
    planType: string = "enem",
    generatedPassword?: string
) {
    if (!resend) {
        console.error("[EMAIL] Abortando envio: Resend não inicializado.");
        return { error: "Serviço de e-mail não configurado" };
    }

    const firstName = userName?.split(" ")[0] ?? "Aluno";
    const planLabel = planType === "full" ? "Plano Completo" : "Plano ENEM";

    const credentialsBlock = generatedPassword
        ? `
      <tr>
        <td style="padding:0 0 24px;">
          <table width="100%" cellpadding="16" cellspacing="0"
                 style="background:#f4f4f5;border-radius:6px;border:1px solid #e4e4e7;">
            <tr>
              <td style="font-family:monospace;font-size:14px;color:#18181b;line-height:1.8;">
                <strong>E-mail:</strong> ${to}<br/>
                <strong>Senha inicial:</strong> ${generatedPassword}<br/>
                <span style="font-size:12px;color:#71717a;">
                  Você vai definir uma nova senha no primeiro acesso.
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
        : "";

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Seu acesso ao Pulsar Prep</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;color:#18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">

          <!-- Header simples -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #e4e4e7;">
              <span style="font-size:18px;font-weight:bold;color:#18181b;">Pulsar Prep</span>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:32px;">
              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Saudação -->
                <tr>
                  <td style="padding:0 0 16px;font-size:15px;color:#18181b;line-height:1.6;">
                    Olá, ${firstName}.
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
                    Seu acesso ao Pulsar Prep (${planLabel}) foi liberado.
                    Use os dados abaixo para entrar no aplicativo.
                  </td>
                </tr>

                ${credentialsBlock}

                <!-- CTA -->
                <tr>
                  <td style="padding:0 0 24px;">
                    <a href="${APP_URL}/login"
                       style="display:inline-block;background:#6d28d9;color:#ffffff;
                              text-decoration:none;font-size:14px;font-weight:bold;
                              padding:12px 28px;border-radius:6px;">
                      Acessar o aplicativo
                    </a>
                  </td>
                </tr>

                <!-- Divider -->
                <tr><td style="border-top:1px solid #e4e4e7;padding:24px 0 0;"></td></tr>

                <!-- Suporte -->
                <tr>
                  <td style="font-size:13px;color:#71717a;line-height:1.6;">
                    Dúvidas? Responda este e-mail que retornamos em breve.<br/>
                    Este é um e-mail transacional enviado após a confirmação do seu pagamento.
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background:#fafafa;border-top:1px solid #e4e4e7;
                       font-size:12px;color:#a1a1aa;">
              Pulsar Prep &middot; ${FROM}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
        from: FROM,
        to,
        subject: `Seu acesso ao Pulsar Prep foi liberado`,
        text: `Olá, ${firstName}.\n\nSeu acesso ao Pulsar Prep (${planLabel}) foi liberado.\n\n${generatedPassword ? `E-mail: ${to}\nSenha inicial: ${generatedPassword}\n\n` : ""}Acesse: ${APP_URL}/login\n\nDúvidas? Responda este e-mail.`,
        html,
    });

    if (error) {
        console.error("[EMAIL] Erro ao enviar welcome email para", to, error);
        throw new Error(`Resend error: ${error.message}`);
    }

    console.log("[EMAIL] Welcome email enviado para", to, "| ID:", data?.id);
    return data;
}
