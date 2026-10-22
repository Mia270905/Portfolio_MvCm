import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeroHeader />
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gray-50">
        <div className="w-full max-w-sm">
          <UpdatePasswordForm />
        </div>
      </div>
      <FooterSection />
    </div>
  );
}
