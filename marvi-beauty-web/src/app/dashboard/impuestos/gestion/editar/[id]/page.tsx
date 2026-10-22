import { EditTaxForm } from "@/components/dashboard/impuestos/edit-tax-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface EditTaxPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTaxPage({ params }: EditTaxPageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen">
      <div className="mb-6 px-4 pt-6">
        <Link
          href="/dashboard/impuestos/gestion"
          className="inline-flex items-center text-gray-400 hover:text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Editar Impuesto
          </h1>
        </div>
        <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-6">
          <EditTaxForm taxId={id} />
        </div>
      </div>
    </div>
  );
}
