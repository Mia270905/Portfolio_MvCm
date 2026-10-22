import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-[#E3E2DD]">
      <div className="w-full max-w-sm">
        <Card className="bg-[#F5F2ED] border-[#D4CEC4]">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-[#8B7968]" />
            </div>
            <CardTitle className="text-2xl text-[#8B7968]">
              ¡Cuenta creada!
            </CardTitle>
            <CardDescription className="text-[#A89585]">
              Revisa tu correo electrónico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[#5C5248] text-center">
              Te hemos enviado un correo de confirmación. Por favor, revisa tu
              bandeja de entrada y haz clic en el enlace para verificar tu
              cuenta.
            </p>
            <p className="text-sm text-[#5C5248] text-center">
              Si no ves el correo, revisa tu carpeta de spam.
            </p>
            <Link href="/auth/login" className="block">
              <Button 
                className="w-full py-3 rounded-lg bg-[#A89585] text-white font-medium hover:bg-[#8B7968] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:ring-offset-2"
              >
                Ir a inicio de sesión
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}