"use server";

import { auth } from "@/lib/auth";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { redirect } from "next/navigation";

export async function createCheckout(plan: "enem" | "full" | "upgrade") {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
        throw new Error("Não autenticado");
    }

    const client = new MercadoPagoConfig({
        accessToken: process.env.MP_ACCESS_TOKEN ?? "",
    });

    const preference = new Preference(client);

    let title = "";
    let price = 0;

    if (plan === "enem") {
        title = "Plano Prep ENEM";
        price = 1.00;
    } else if (plan === "full") {
        title = "Plano Prep Medicina Completo";
        price = 1.10;
    } else if (plan === "upgrade") {
        title = "Upgrade Medicina";
        price = 1.10;
    }

    const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

    let checkoutUrl: string | null = null;

    try {
        const isLocalhost = APP_URL.includes("localhost");

        const body: any = {
            items: [
                {
                    id: plan,
                    title: title,
                    quantity: 1,
                    unit_price: price,
                }
            ],
            external_reference: session.user.id,
            payer: {
                email: session.user.email,
            },
            back_urls: {
                success: `${APP_URL}/dashboard/enem/1`,
                failure: `${APP_URL}/paywall`,
                pending: `${APP_URL}/paywall`
            },
            // MP não aceita auto_return com localhost — só ligamos em produção
            ...(isLocalhost ? {} : { auto_return: "approved" }),
        };

        console.log("[CHECKOUT] Sending to MP:", JSON.stringify(body, null, 2));

        const response = await preference.create({ body });

        console.log("[CHECKOUT] MP Response:", JSON.stringify(response, null, 2));

        if (response.init_point) {
            checkoutUrl = response.init_point;
        } else {
            throw new Error("Falha ao gerar link do Mercado Pago.");
        }
    } catch (error: any) {
        console.error("[CHECKOUT] Erro:", error?.cause ?? error?.message ?? error);
        throw new Error(error?.cause?.message ?? error?.message ?? "Erro ao criar checkout.");
    }

    redirect(checkoutUrl!);
}
