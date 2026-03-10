import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PLANS: Record<string, { title: string; real: number; test: number }> = {
    upgrade: { title: "Pulsar Prep - Upgrade Vestibular", real: 32.00, test: 1.00 },
};

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const plan = "upgrade";
        const APP_URL = process.env.NEXTAUTH_URL || "https://api.pulsarprep.shop";

        const isTestMode = APP_URL.includes("localhost") || process.env.MP_TEST_MODE === "true";
        const price = isTestMode ? PLANS.upgrade.test : PLANS.upgrade.real;

        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN ?? "",
        });

        const response = await new Preference(client).create({
            body: {
                items: [
                    {
                        id: plan,
                        title: PLANS.upgrade.title,
                        quantity: 1,
                        unit_price: price,
                    },
                ],
                // Passa o ID do usuário diretamente, o Webhook já identifica como UPDATE (FLUXO 2)
                external_reference: session.user.id,
                notification_url: `${APP_URL}/api/webhooks/mercadopago`,
                back_urls: {
                    success: `${APP_URL}/dashboard?upgrade=success`,
                    failure: `${APP_URL}/dashboard?upgrade=failure`,
                    pending: `${APP_URL}/dashboard?upgrade=pending`,
                },
                auto_return: "approved",
            },
        });

        if (response.init_point) {
            return NextResponse.json({ url: response.init_point });
        }

        return NextResponse.json({ error: "Falha ao gerar link do Mercado Pago." }, { status: 500 });
    } catch (error: any) {
        console.error("[UPGRADE CHECKOUT] Erro:", error?.cause ?? error?.message ?? error);
        return NextResponse.json({ error: "Erro interno ao criar checkout de upgrade." }, { status: 500 });
    }
}
