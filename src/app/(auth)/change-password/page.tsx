import { Suspense } from "react";
import ChangePasswordClient from "./ChangePasswordClient";

export default function ChangePasswordPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8 text-muted-foreground">Carregando...</div>}>
            <ChangePasswordClient />
        </Suspense>
    );
}
