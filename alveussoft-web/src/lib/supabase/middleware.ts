import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";
import { getUserWithPermissions } from "../actions/user.actions";
import { isUserInAttendanceList } from "../actions/attendance.actions";
import { getRequireAccountForReservation } from "../actions/configuration.actions"; 


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

if (
  request.method === "POST" &&
  request.nextUrl.pathname.startsWith("/cliente-cita")
) {
  return supabaseResponse;
}

  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/auth/login") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/portafolio") &&
    !request.nextUrl.pathname.startsWith("/about-us") &&
    !request.nextUrl.pathname.startsWith("/cliente-cita") &&
    !request.nextUrl.pathname.startsWith("/legal/privacy") &&
    !request.nextUrl.pathname.startsWith("/historial_cotizaciones") &&
    

    // CAMBIO: Se permite acceso sin autenticación a /appointments/history
    // porque los contactos (no autenticados) necesitan ver sus citas
    // La protección se hace a nivel de componente, no middleware
    !request.nextUrl.pathname.startsWith("/appointments/history") 
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