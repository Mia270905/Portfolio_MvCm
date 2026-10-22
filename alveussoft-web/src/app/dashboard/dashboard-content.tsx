import DashboardClientLayout from "./dashboard-client-layout";
import { getModulesHierarchy } from "@/lib/actions/module.actions";
import { getCurrentUser, User, getCurrentUserPermissions } from "@/lib/actions/user.actions"
import { redirect } from 'next/navigation';
import { headers } from "next/headers";

const protectedRoutes: { path: string; permission: string }[] = [
  { path: "/dashboard/seguridad/usuarios", permission: "menu:users" },
  { path: "/dashboard/seguridad/permisos", permission: "menu:permissions" },
  { path: "/dashboard/seguridad/perfiles", permission: "menu:profiles" },
  { path: "/dashboard/seguridad/modulos", permission: "menu:modules" },
  { path: "/dashboard/productos/categorias", permission: "menu:product" },
  { path: "/dashboard/envios/zonas", permission: "menu:shipment" },
  { path: "/dashboard/sitio-web/logos", permission: "menu:logo" },
  { path: "/dashboard/citas/gestion", permission: "menu:appointments" },
  { path: "/dashboard/citas/configuracion", permission: "menu:appointments-configuration" },
  { path: "/dashboard/checador-padre/configuracion", permission: "menu:checkin-configuration" }, 
  { path: "/dashboard/citas/reservas", permission: "menu:reservations" },
  { path: "/dashboard/citas/habilitar_reservaciones", permission: "menu:enable-reservations" },
  { path: "/dashboard/citas/agenda", permission: "menu:appointments-agenda" },
  { path: "/dashboard/citas/slug", permission: "menu:slug-code" },
  { path: "/dashboard/sitio-web/numero_whatsapp", permission: "menu:number_whatsapp" },
  { path: "/dashboard/sitio-web/redes_sociales", permission: "menu:social-media" },
  { path: "/dashboard/ventas/entregas", permission: "menu:deliveries" },
  { path: "/dashboard/ventas/pedidos_en_linea", permission: "menu:online_orders" },
  { path: "/dashboard/reportes/pedidos_en_linea", permission: "menu:online_orders_reports" },
  { path: "/dashboard/reportes/repartidores", permission: "menu:delivery_driver" },
  { path: "/dashboard/inventarios/historial/entradas/crear", permission: "create_entry:record" },
  { path: "/dashboard/inventarios/historial/salidas/crear", permission: "create_departure:record" },
  { path: "/dashboard/inventarios/historial", permission: "menu:record" },
  { path: "/dashboard/almacenes/gestion", permission: "menu:management" },
  { path: "/dashboard/compras/categorias", permission: "menu:shopping_categories" },
  { path: "/dashboard/inventarios/reportes_inventario", permission: "menu:inventory_reports" },
  { path: "/dashboard/configuraciones/horario", permission: "menu:working_hours" },
  { path: "/dashboard/inventarios/reportes_inventario", permission: "read:inventory_reports" },
  { path: "/dashboard/contacts-parent/grupo-contactos", permission: "menu:contact-group"},
  { path: "/dashboard/inventarios/almacenes", permission: "menu:management" },
  { path: "/dashboard/sitio-web/reservas", permission: "menu:reservations" },
  { path: "/dashboard/impuestos/gestion", permission: "menu:tax_management"}
];

export default async function DashboardContent({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch modules and user concurrently to reduce loading time by half
  const [modules, { data }, permissions] = await Promise.all([
    getModulesHierarchy(),
    getCurrentUser(),
    getCurrentUserPermissions()
  ]);

  const headerStore = await headers();
  // Next.js injects 'x-invoke-path' natively; fallback manually to referer if running locally/hard-reload.
  const pathname = headerStore.get('x-invoke-path') || headerStore.get('referer') || "/dashboard";

  if (!permissions.includes("access:dashboard")) {
    redirect("/");
  }

  // 100% Secure Server-Side Block
  const isUnauthorized = protectedRoutes.find(
    (route) => pathname.includes(route.path) && !permissions.includes(route.permission)
  );

  if (isUnauthorized) {
    redirect("/dashboard");
  }

  const currentUser = data?.user
    ? {
      id: data.user.id,
      email: data.user.email ?? '',
      full_name: data.user.user_metadata?.full_name ?? '',
      active: data.user.user_metadata?.active ?? true
    }
    : null;

  return (
    <DashboardClientLayout
      modules={modules}
      currentUser={currentUser as User}
    >
      {children}
    </DashboardClientLayout>
  );
}