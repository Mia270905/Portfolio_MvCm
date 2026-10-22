"use client";

import { LoginForm } from "@/components/auth/login-form";
import FooterSection from "@/components/footer";
import { HeroHeader } from "@/components/header";
// import DynamicHeader from "@/components/landing/header";
// import Footer from "@/components/landing/footer";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeroHeader />
      <div className="flex min-h-svh w-full items-center justify-center pb-6 px-6 pt-10">
        <div className="w-full max-w-sm">
          <Suspense fallback={<div>Cargando...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
      <FooterSection />
    </div>
  );
}
