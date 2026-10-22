import { getModuleWithChildren } from "@/lib/actions/module.actions";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import Link from "next/link";
import { getIcon } from "@/lib/utils/icons";
import { ArrowRight, FolderOpen } from "lucide-react";

export default async function CitasParentPage() {
  // --- Obtener permisos del usuario ---
  const userWithPermissions = await getUserWithPermissions();
  const userPermissions =
    userWithPermissions?.permissions?.map((p: { code: string }) => p.code) ||
    [];

  const { parent, children } = await getModuleWithChildren("contacts-parent");

  if (!parent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-custom-bg-primary">
        <p className="text-custom-text-tertiary">Módulo no encontrado</p>
      </div>
    );
  }

  const ParentIcon = getIcon(parent.icon);

  const permissionsMap: Record<string, string> = {
    "appointments": "menu:appointments",
  };

  // --- Filtrar los hijos según permisos usando el mapeo ---
  const filteredChildren = children.filter((child) => {
    const requiredPermission = permissionsMap[child.code];
    
    if (!requiredPermission) return true;
    
    return userPermissions.includes(requiredPermission);
  });

  return (
    <div className="min-h-screen bg-[#F5F1E8] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header del módulo padre */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-white rounded-xl border border-[#E5E1D8]">
              <ParentIcon className="w-8 h-8 text-[#c6a365]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">
                {parent.name}
              </h1>
              <p className="text-gray-500 mt-1">{parent.description}</p>
            </div>
          </div>
        </div>

        {/* Grid de módulos hijos */}
        {filteredChildren.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredChildren.map((child) => {
              const ChildIcon = getIcon(child.icon);
              return (
                <Link key={child.id} href={`/dashboard${child.path}`} className="group">
                  <div className="bg-white rounded-2xl p-6 border border-[#e6dcc9] hover:bg-[#faf8f3] hover:border-[#c6a365] hover:shadow-lg hover:shadow-[#c6a365]/20 transition-all duration-200 h-full flex flex-col relative">
                    <div className="absolute top-6 right-6">
                      <ArrowRight className="w-5 h-5 text-[#c6a365] group-hover:text-[#b59454] group-hover:translate-x-1 transition-all duration-200" />
                    </div>

                    {/* Ícono */}
                    <div className="mb-4">
                      <div className="inline-flex p-3 bg-[#faf8f3] rounded-xl group-hover:bg-[#f5efe6] transition-colors">
                        <ChildIcon className="w-7 h-7 text-[#c6a365] group-hover:text-[#b59454] transition-colors" />
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 pr-8">
                      <h3 className="text-xl font-semibold text-neutral-900 mb-2 group-hover:text-[#c6a365] transition-colors">
                        {child.name}
                      </h3>
                      <p className="text-sm text-neutral-600 leading-relaxed group-hover:text-neutral-700 transition-colors">
                        {child.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 border border-[#E5E1D8] text-center">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay módulos disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
}
