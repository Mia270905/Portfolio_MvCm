// app/dashboard/lista_de_precios/gestion/editar/[id]/page.tsx
import { getPriceListById } from "@/lib/actions/price_list.actions";
import PriceListForm from "@/components/dashboard/lista-de-precios/price_list-form";
import { notFound, redirect } from "next/navigation";
import { getUserWithPermissions } from "@/lib/actions/user.actions";

interface EditPriceListPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPriceListPage({
  params,
}: EditPriceListPageProps) {
  // Verificar permisos
  const user = await getUserWithPermissions();
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  const canEditPriceLists = permissions.includes("update:price_management");

  if (!canEditPriceLists) {
    redirect("/dashboard/lista_de_precios/gestion");
  }

  // Esperar los params primero
  const { id } = await params;

  // Obtener los datos de la lista de precios desde el servidor
  const result = await getPriceListById(id);

  if (!result.success || !result.priceList) {
    notFound();
  }

  // Mostrar advertencia si la lista está eliminada
  const isDeleted = result.priceList.deleted_at !== null;

  return (
    <>
      {isDeleted && (
        <div className="max-w-2xl mx-auto px-4 pt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Lista de precios eliminada
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Esta lista de precios fue marcada como eliminada. Al guardar
                    los cambios, será restaurada automáticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <PriceListForm
        initialData={result.priceList}
        isEditing={true}
        isDeleted={isDeleted}
      />
    </>
  );
}
