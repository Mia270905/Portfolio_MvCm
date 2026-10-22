import { SignUpForm } from "@/components/auth/sign-up-form";
import FooterSection from "@/components/footer";
import { HeroHeader } from "@/components/header";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f3]">
      <HeroHeader />

      {/* Contenido */}
      <div className="relative flex flex-1 items-center justify-center px-6 pt-28 pb-16">
        {/* Fondo sutil como login */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-[#c6a365]/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent" />
        </div>

        {/* Formulario */}
        <Suspense fallback={<div className="text-center text-sm text-[#7b746b]">Cargando…</div>}>
          <SignUpForm className="relative z-10 w-full max-w-md" />
        </Suspense>
      </div>

      <FooterSection />
    </div>
  );
}
