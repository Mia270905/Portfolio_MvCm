import { getModuleWithChildren } from "@/lib/actions/module.actions";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import Link from "next/link";
import { getIcon } from "@/lib/utils/icons";
import { ArrowRight, FolderOpen } from "lucide-react";

export default async function CotizacionesPadrePage() {
  // --- Obtener permisos del usuario ---
  const userWithPermissions = await getUserWithPermissions();
  const userPermissions =
    userWithPermissions?.permissions?.map((p: { code: string }) => p.code) ||
    [];

  const { parent, children } = await getModuleWithChildren("quotation-parent");

  if (!parent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#04060B]">
        <p className="text-gray-400">Módulo no encontrado</p>
      </div>
    );
  }

  const ParentIcon = getIcon(parent.icon);

  const permissionsMap: Record<string, string> = {
    "cotizaciones": "menu:quotation-parent",
  };

  // --- Filtrar los hijos según permisos usando el mapeo ---
  const filteredChildren = children.filter((child) => {
    const requiredPermission = permissionsMap[child.code];
    
    if (!requiredPermission) return true;
    
    return userPermissions.includes(requiredPermission);
  });

  return (
    <div className="min-h-screen bg-[#04060B] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header del módulo padre */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-[#070B14] rounded-xl border border-gray-800">
              <ParentIcon className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                {parent.name}
              </h1>
              <p className="text-gray-400 mt-1">{parent.description}</p>
            </div>
          </div>
        </div>

        {/* Grid de módulos hijos */}
        {filteredChildren.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredChildren.map((child) => {
              const ChildIcon = getIcon(child.icon);

              return (
                <Link
                  key={child.id}
                  href={`/dashboard${child.path}`}
                  className="group"
                >
                  <div className="bg-[#070B14] rounded-2xl p-6 border border-gray-800 hover:bg-[#0A0F1C] hover:border-yellow-400/40 hover:shadow-xl hover:shadow-yellow-400/5 transition-all duration-200 h-full flex flex-col relative">
                    <div className="absolute top-6 right-6">
                      <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all duration-200" />
                    </div>

                    {/* Ícono */}
                    <div className="mb-4">
                      <div className="inline-flex p-3 bg-[#0A0F1C] rounded-xl group-hover:bg-yellow-400/10 transition-colors">
                        <ChildIcon className="w-7 h-7 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 pr-8">
                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                        {child.name}
                      </h3>
                      <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                        {child.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#070B14] rounded-2xl p-12 border border-gray-800 text-center">
            <FolderOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No hay módulos disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
}