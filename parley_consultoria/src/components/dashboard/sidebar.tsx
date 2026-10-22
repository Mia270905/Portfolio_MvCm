"use client";

import Link from "next/link";
import { User as UserIcon, ChevronDown, ChevronRight } from "lucide-react";
import { type ModulesHierarchy } from "@/lib/definitions";
import { type User } from "@/lib/actions/user.actions";
import { getIcon } from "@/lib/utils/icons";
import { useEffect, useState } from "react";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import { getImageUrl } from "@/lib/supabase/upload-image";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  modules: ModulesHierarchy;
  currentUser: User;
}

export default function Sidebar({
  isOpen,
  onToggle,
  modules,
  currentUser,
}: SidebarProps) {
  const userEmail = currentUser.email;
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const pathname = usePathname();

  const permissionsMap: Record<string, string> = {
    "/sitio-web/logos": "menu:logo",
    "/sitio-web/numero_whatsapp": "menu:number_whatsapp",
    "/sitio-web/redes_sociales": "menu:social-media",
    "/sitio-web/habilitar_reservaciones": "menu:enable-reservations",
    "/seguridad/usuarios": "menu:users",
    "/seguridad/permisos": "menu:permissions",
    "/seguridad/perfiles": "menu:profiles",
    "/seguridad/modulos": "menu:modules",
    "/productos/categorias": "menu:categories",
    "/productos/producto": "menu:product_details",
    "/productos/unidades-medida": "menu:categories",
    "/envios/zonas": "menu:zones",
    "/ventas/pedidos_en_linea": "menu:online_orders",
    "/ventas/entregas": "menu:deliveries",
    "/reportes/pedidos_en_linea": "menu:online_orders_reports",
    "/reportes/repartidores": "menu:delivery_driver",
    "/contacts-parent/contacts":"menu:contacts",
    "/platforms-parent/platforms":"menu:platforms",
    "/empresas-padre/empresas":"menu:empresas",
    "/citas/gestion":"menu:appointments",
    "/citas/configuracion":"menu:appointments-configuration",
    "/citas/slug":"menu:appointments-configuration",
    "/contacts-parent/grupo-contactos":"menu:contact-group",
    "/inventarios/historial": "menu:record",
    "/inventarios/almacenes":"menu:management",
    "/inventarios/reporte_inventario": "menu:inventories_reports",
    "/lista_de_precios/gestion": "menu:price_management",
    "/impuestos/gestion": "menu:tax_management",
    "/checador-padre/historial": "menu:historial",
    "/checador-padre/usuarios-checador": "menu:users-checkin",
    "/cotizaciones-padre/cotizaciones": "menu:quotation",
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      const userWithPermissions = await getUserWithPermissions();
      setUserPermissions(
        userWithPermissions?.permissions?.map(
          (p: { code: string }) => p.code
        ) || []
      );
    };

    const fetchLogo = async () => {
      const url = await getImageUrl("logo", "logo");
      setLogoUrl(url);
    };

    fetchPermissions();
    fetchLogo();
  }, []);

  // Cerrar sidebar cuando cambia la ruta en móvil
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      onToggle();
    }
  }, [pathname]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  // Función para manejar clic en enlaces
  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onToggle(); 
    }
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-[#0a0c19] text-white z-30
          transition-transform duration-300 ease-in-out
          w-64
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo y perfil */}
          <div className="h-18 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center w-full">
              {logoUrl ? (
                <a href="/dashboard"><img
                  src={logoUrl}
                  alt="Logo"
                  className="max-h-14 w-auto object-contain"
                /></a>
              ) : (
                <a href="/dashboard">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-2 h-2 bg-[#020309] rounded-full"></div>
                    <div className="w-2 h-2 bg-[#020309] rounded-full"></div>
                    <div className="w-2 h-2 bg-[#020309] rounded-full"></div>
                    <div className="w-2 h-2 bg-[#020309] rounded-full"></div>
                  </div>
                </div>
                </a>
              )}
            </div>
          </div>

          {/* Menú de navegación */}
          <nav className="flex-1 overflow-y-auto py-4">
            {modules.map((parent) => {
              const ParentIcon = getIcon(parent.icon);
              const isExpanded = expandedModules.has(parent.id);
              const hasChildren = parent.children && parent.children.length > 0;

              // Filtramos los hijos según permisos
              const filteredChildren =
                parent.children?.filter((child) => {
                  const requiredPermission = permissionsMap[child.path];
                  return requiredPermission
                    ? userPermissions.includes(requiredPermission)
                    : true;
                }) || [];

              if (filteredChildren.length === 0) {
                return null;
              }

              return (
                <div key={parent.id} className="mb-2">
                  {/* Módulo padre */}
                  <div className="px-4">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/dashboard${parent.path}`}
                        className="flex items-center gap-2 flex-1 group hover:text-yellow-400 transition-colors py-2"
                        onClick={handleLinkClick}
                      >
                        <ParentIcon className="w-4 h-4 group-hover:text-yellow-400 transition-colors" />
                        <div className="flex-1">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider group-hover:text-yellow-400 transition-colors">
                            {parent.name}
                          </h3>
                          {parent.description && (
                            <p className="text-xs text-gray-500 mt-1 group-hover:text-yellow-300 transition-colors">
                              {parent.description}
                            </p>
                          )}
                        </div>
                      </Link>

                      {hasChildren && (
                        <button
                          onClick={() => toggleModule(parent.id)}
                          className="p-1 hover:bg-yellow-400/10 rounded-sm transition-colors group"
                          aria-label={isExpanded ? "Contraer" : "Expandir"}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 group-hover:text-yellow-400 transition-colors" />
                          ) : (
                            <ChevronRight className="w-4 h-4 group-hover:text-yellow-400 transition-colors" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Módulos hijos */}
                  {hasChildren && isExpanded && (
                    <ul className="space-y-1 mt-1">
                      {filteredChildren.map((child) => {
                        const ChildIcon = getIcon(child.icon);
                        return (
                          <li key={child.id}>
                            <Link
                              href={`/dashboard${child.path}`}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-yellow-400/10 transition-colors group ml-4"
                              onClick={handleLinkClick}
                            >
                              <ChildIcon className="w-5 h-5 flex-shrink-0 group-hover:text-yellow-400 transition-colors" />
                              <span className="text-sm group-hover:text-yellow-400 transition-colors">
                                {child.name}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}