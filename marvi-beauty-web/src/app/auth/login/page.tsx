import { LoginForm } from "@/components/auth - supabse/login-form";
import { LoginHeader } from "@/components/header2";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="flex bg-[#E3E2DD] min-h-svh w-full items-center justify-center p-6 md:p-10">
      <LoginHeader />
      <div className="w-full max-w-sm">
        <Suspense fallback={<div>Cargando...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
