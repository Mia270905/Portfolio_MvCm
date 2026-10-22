"use client";

import { LoginForm } from "@/components/auth/login-form";
import FooterSection from "@/components/footer";
import { HeroHeader } from "@/components/header";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-[#140909] relative overflow-hidden">
      <HeroHeader />

      {/* Fondos decorativos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0c0a09]" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      </div>

      {/* Contenido */}
      <div className="relative z-10 flex min-h-svh w-full items-center justify-center pb-6 px-6 pt-28">
        <div className="w-full max-w-sm">
          <Suspense fallback={<div className="text-sm text-gray-400 text-center">Cargando…</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      <FooterSection />
    </div>
  );
}
