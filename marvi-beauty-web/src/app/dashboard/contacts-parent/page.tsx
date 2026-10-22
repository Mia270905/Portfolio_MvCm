import { getModuleWithChildren } from "@/lib/actions/module.actions";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import Link from "next/link";
import { getIcon } from "@/lib/utils/icons";
import { ArrowRight, FolderOpen } from "lucide-react";

export default async function ContactsParentPage() {
  // --- Obtener permisos del usuario ---
  const userWithPermissions = await getUserWithPermissions();
  const userPermissions =
    userWithPermissions?.permissions?.map((p: { code: string }) => p.code) ||
    [];

  const { parent, children } = await getModuleWithChildren("contacts-parent");

  if (!parent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E3E2DD]">
        <p className="text-gray-400">Módulo no encontrado</p>
      </div>
    );
  }

  const ParentIcon = getIcon(parent.icon);

  const permissionsMap: Record<string, string> = {
    "contacts": "menu:contacts",
    "contact-group": "menu:contact-group",
  };

  // --- Filtrar los hijos según permisos usando el mapeo ---
  const filteredChildren = children.filter((child) => {
    const requiredPermission = permissionsMap[child.code];
    
    if (!requiredPermission) return true;
    
    return userPermissions.includes(requiredPermission);
  });

  return (
    <div className="min-h-screen bg-custom-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header del módulo padre */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-custom-bg-tertiary rounded-xl border border-custom-border-secondary">
              <ParentIcon className="w-8 h-8 text-custom-accent-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-custom-accent-primary">
                {parent.name}
              </h1>
              <p className="text-custom-text-tertiary mt-1">{parent.description}</p>
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
                  <div className="bg-custom-bg-secondary rounded-2xl p-6 border border-custom-border-secondary hover:bg-custom-bg-hover hover:border-custom-accent-border hover:shadow-lg hover:shadow-custom-accent-border transition-all duration-200 h-full flex flex-col relative">
                    <div className="absolute top-6 right-6">
                      <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all duration-200" />
                    </div>

                    {/* Ícono */}
                    <div className="mb-4">
                      <div className="inline-flex p-3 bg-custom-bg-tertiary rounded-xl group-hover:bg-custom-accent-hover transition-colors">
                        <ChildIcon className="w-7 h-7 text-custom-accent-primary group-hover:text-custom-accent-secondary transition-colors" />
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 pr-8">
                      <h3 className="text-xl font-semibold text-custom-text-primary mb-2 group-hover:text-custom-accent-primary transition-colors">
                        {child.name}
                      </h3>
                      <p className="text-sm text-custom-text-tertiary leading-relaxed group-hover:text-custom-text-secondary transition-colors">
                        {child.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-custom-bg-secondary rounded-2xl p-12 border border-custom-border-secondary text-center">
            <FolderOpen className="w-16 h-16 text-custom-text-disabled mx-auto mb-4" />
            <p className="text-custom-text-muted">No hay módulos disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
}