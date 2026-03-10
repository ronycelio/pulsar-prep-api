import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// E-mails com acesso administrativo — nunca bloqueados pelo paywall
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register|paywall|comprar|change-password).*)"],
};

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const pathname = req.nextUrl.pathname;
    const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
    const isPublicPage = pathname.startsWith("/comprar") || pathname.startsWith("/change-password");
    if (isPublicPage) return NextResponse.next();

    // ── Auth check ──────────────────────────────────────────────────────────
    if (isAuthPage) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL("/onboarding/track", req.url));
        }
        return null;
    }

    if (!isLoggedIn && pathname !== "/") {
        let from = pathname;
        if (req.nextUrl.search) from += req.nextUrl.search;
        return NextResponse.redirect(
            new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, req.url)
        );
    }

    // ── License check ────────────────────────────────────────────────────────
    if (isLoggedIn) {
        const userEmail = (req.auth?.user?.email ?? "").toLowerCase();
        const isAdmin = ADMIN_EMAILS.includes(userEmail);
        const hasLicense = !!(req.auth?.user as any)?.lifetimeLicense;

        // Admins e usuários com licença passam direto
        if (!isAdmin && !hasLicense && pathname !== "/paywall") {
            return NextResponse.redirect(new URL("/paywall", req.url));
        }
    }

    // ── Misc redirects ───────────────────────────────────────────────────────
    if (pathname === "/dashboard") {
        return NextResponse.redirect(new URL("/onboarding/track", req.url));
    }

    return NextResponse.next();
});
