import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import FooterSection from "@/components/footer";
import { HeroHeader } from "@/components/header";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f3]">
      <HeroHeader />

      {/* Contenido */}
      <div className="relative flex flex-1 items-center justify-center px-6 pt-28 pb-16">
        {/* Fondo suave */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[#faf8f3]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-[#c6a365]/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent" />
        </div>

        {/* Formulario */}
        <div className="relative z-10 w-full max-w-sm">
          <ForgotPasswordForm />
        </div>
      </div>

      <FooterSection />
    </div>
  );
}
