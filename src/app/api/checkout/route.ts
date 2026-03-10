import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";

const PLANS: Record<string, { title: string; real: number; test: number }> = {
    enem: { title: "Pulsar Prep - Licença ENEM", real: 97.00, test: 1.00 },
    full: { title: "Pulsar Prep - Licença Completa (ENEM + Vestibular)", real: 129.00, test: 1.10 },
    upgrade: { title: "Pulsar Prep - Upgrade Vestibular", real: 32.00, test: 1.10 },
};

// GET /api/checkout?plan=enem → redireciona para /comprar?plan=enem (captura de e-mail)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const plan = searchParams.get("plan") ?? "enem";
    const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(`${APP_URL}/comprar?plan=${plan}`);
}

// POST /api/checkout { plan, email } → cria preferência MP e retorna o link
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { plan, email } = body;

        if (!plan || !PLANS[plan]) {
            return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
        }

        const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const isTestMode = APP_URL.includes("localhost") || process.env.MP_TEST_MODE === "true";
        const planConfig = PLANS[plan];
        const price = isTestMode ? planConfig.test : planConfig.real;

        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN ?? "",
        });

        const response = await new Preference(client).create({
            body: {
                items: [
                    {
                        id: plan,
                        title: planConfig.title,
                        quantity: 1,
                        unit_price: price,
                    },
                ],
                // Passa o e-mail real do aluno via external_reference
                // O webhook vai usar isso para criar a conta com o e-mail correto
                external_reference: `email:${email}`,
                notification_url: `${APP_URL}/api/webhooks/mercadopago`,
                back_urls: {
                    success: `${APP_URL}/login?checkout=success`,
                    failure: `${APP_URL}/login?checkout=failure`,
                    pending: `${APP_URL}/login?checkout=pending`,
                },
                ...(isTestMode ? {} : { auto_return: "approved" }),
            },
        });

        if (response.init_point) {
            return NextResponse.json({ url: response.init_point });
        }

        return NextResponse.json({ error: "Falha ao gerar link do Mercado Pago." }, { status: 500 });
    } catch (error: any) {
        console.error("[PUBLIC CHECKOUT] Erro:", error?.cause ?? error?.message ?? error);
        return NextResponse.json({ error: "Erro interno ao criar checkout." }, { status: 500 });
    }
}
