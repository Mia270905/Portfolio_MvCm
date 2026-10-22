import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";
import { getUserWithPermissions } from "../actions/user.actions";
import { isUserInAttendanceList } from "../actions/attendance.actions";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const url = request.nextUrl.clone();

  const checkReservationsEnabled = async () => {
    try {
      const { data: config } = await supabase
        .from("configurations")
        .select("value")
        .eq("key", "enable_reservations")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return config?.value !== "false";
    } catch (error) {
      console.error("Error checking reservation config:", error);
      return true;
    }
  };

  if (request.nextUrl.pathname.startsWith("/cliente-cita")) {
    const reservationsEnabled = await checkReservationsEnabled();
    
    if (!reservationsEnabled) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/auth/login") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/portafolio") &&
    !request.nextUrl.pathname.startsWith("/about-us") &&
    !request.nextUrl.pathname.startsWith("/cliente-cita") &&
    !request.nextUrl.pathname.startsWith("/legal/privacy") 
  ) {
    // no user, potentially respond by redirecting the user to the login page
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: userData, error } = await supabase
      .from("users")
      .select("active, profile_id")
      .eq("id", user.sub)
      .single();

    if (error || !userData || userData.active !== true) {
      await supabase.auth.signOut();

      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // Proteger ruta de checador
    if (request.nextUrl.pathname.startsWith("/checador")) {
      const isInAttendanceList = await isUserInAttendanceList(user.sub);
      if (!isInAttendanceList) {
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }

    const userWithPermissions = await getUserWithPermissions();
    const userPermissions =
      userWithPermissions?.permissions?.map((p: { code: string }) => p.code) ||
      [];

  
  

    const protectedRoutes: { path: string; permission: string }[] = [
      { path: "/dashboard", permission: "access:dashboard" },
      { path: "/dashboard/seguridad/usuarios", permission: "menu:users" },
      { path: "/dashboard/seguridad/permisos", permission: "menu:permissions" },
      { path: "/dashboard/seguridad/perfiles", permission: "menu:profiles" },
      { path: "/dashboard/seguridad/modulos", permission: "menu:modules" },
      { path: "/dashboard/productos/categorias", permission: "menu:product" },
      { path: "/dashboard/envios/zonas", permission: "menu:shipment" },
      { path: "/dashboard/sitio-web/logos", permission: "menu:logo" },
      { path: "/dashboard/citas/gestion", permission: "menu:appointments" },
      { path: "/dashboard/citas/reservas", permission: "menu:reservations" },
      { path: "/dashboard/citas/slug", permission: "menu:slug-code" },
      { path: "/dashboard/sitio-web/numero_whatsapp", permission: "menu:number_whatsapp" },
      {
        path: "/dashboard/sitio-web/redes_sociales",
        permission: "menu:social-media",
      },
      { path: "/dashboard/ventas/entregas", permission: "menu:deliveries" },
      {
        path: "/dashboard/ventas/pedidos_en_linea",
        permission: "menu:online_orders",
      },
      {
        path: "/dashboard/reportes/pedidos_en_linea",
        permission: "menu:online_orders_reports",
      },
      {
        path: "/dashboard/reportes/repartidores",
        permission: "menu:delivery_driver",
      },
      {
        path: "/dashboard/inventarios/historial/entradas/crear",
        permission: "create_entry:record",
      },
      {
        path: "/dashboard/inventarios/historial/salidas/crear",
        permission: "create_departure:record",
      },
      { path: "/dashboard/inventarios/historial", permission: "menu:record" },
      { path: "/dashboard/almacenes/gestion", permission: "menu:management" },
      {
        path: "/dashboard/compras/categorias",
        permission: "menu:shopping_categories",
      },
      {
        path: "/dashboard/inventarios/reportes_inventario",
        permission: "menu:inventory_reports",
      },
      {
        path: "/dashboard/configuraciones/horario",
        permission: "menu:working_hours",
      },
      {
        path: "/dashboard/inventarios/reportes_inventario",
        permission: "read:inventory_reports",
      },
      { path: "/dashboard/contacts-parent/grupo-contactos", permission: "menu:contact-group"},
      { path: "/dashboard/inventarios/almacenes", permission: "menu:management" },
      { path: "/dashboard/sitio-web/reservas", permission: "menu:reservations" },
      { path: "/dashboard/impuestos/gestion", permission: "menu:tax_management",}
    ];

    for (const route of protectedRoutes) {
      if (
        request.nextUrl.pathname.startsWith(route.path) &&
        !userPermissions.includes(route.permission)
      ) {
        if (route.path === "/dashboard") {
          url.pathname = "/";
        } else {
          url.pathname = "/dashboard";
        }
        return NextResponse.redirect(url);
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}