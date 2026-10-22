import { SignUpForm } from "@/components/auth/sign-up-form";
import FooterSection from "@/components/footer";
import { HeroHeader } from "@/components/header";
import { Suspense } from "react";
// import DynamicHeader from "@/components/landing/header";
// import Footer from "@/components/landing/footer";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeroHeader />
      <div className="flex min-h-svh w-full items-center justify-center pb-6 px-6 pt-24">
        <div className="w-full max-w-sm">
          <Suspense fallback={<div>Cargando...</div>}>
            <SignUpForm />
          </Suspense>
        </div>
      </div>
      <FooterSection />
    </div>
  );
}
