import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import FooterSection from "@/components/footer";
import { HeroHeader } from "@/components/header";
// import Footer from "@/components/landing/footer";
// import DynamicHeader from "@/components/landing/header";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeroHeader />
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 ">
        <div className="w-full max-w-sm">
          <ForgotPasswordForm />
        </div>
      </div>
      <FooterSection />
    </div>
  );
}
