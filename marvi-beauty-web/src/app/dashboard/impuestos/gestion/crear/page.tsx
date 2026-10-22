import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CreateTaxForm } from "@/components/dashboard/impuestos/create-tax-form";
import { getUserWithPermissions } from "@/lib/actions/user.actions";

export default async function CreateTaxPage() {
  const user = await getUserWithPermissions();
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  const canCreateTaxes = permissions.includes("create:tax_management");

  if (!canCreateTaxes) {
    return (
      <div className="min-h-screen bg-[#0A0F17] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 font-medium text-lg mb-2">
            Acceso denegado
          </div>
          <p className="text-gray-400">
            No tienes permiso para crear impuestos.
          </p>
          <Link
            href="/dashboard/impuestos"
            className="inline-flex items-center mt-4 text-yellow-400 hover:text-yellow-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver a impuestos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Botón de volver y título FUERA del contenedor */}
        <div className="mb-6">
          <Link
            href="/dashboard/impuestos/gestion"
            className="inline-flex items-center text-gray-400 hover:text-yellow-400 mb-4 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>

          <h1 className="text-2xl font-bold text-white mb-2">
            Crear Nuevo Impuesto
          </h1>
        </div>

        {/* Contenedor del formulario */}
        <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-6">
          <CreateTaxForm />
        </div>
      </div>
    </div>
  );
}
