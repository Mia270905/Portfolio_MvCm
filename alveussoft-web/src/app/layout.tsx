import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { CompanyProvider } from "./providers/company-provider";
import { AuthProvider } from "./providers/auth-provider";
import { benedict } from "@/fonts/benedict";
import { createClient } from "@/lib/supabase/server";
import { areReservationsEnabled } from "@/lib/actions/configuration.actions";
import { isUserInAttendanceList } from "@/lib/actions/attendance.actions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alveus Soft",
  description:
    "En Alveus Soft transformamos ideas en soluciones digitales que mejoran procesos, aumentan la eficiencia y potencian negocios. Creamos herramientas personalizadas que se adaptan a tus necesidades y evolucionan contigo.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  let initialDashboardAccess = false;
  let initialReservationsEnabled = false;
  let initialIsInAttendanceList = false;

  if (session?.user) {
    const [accessResult, enabled, inList] = await Promise.all([
      supabase
        .from('users')
        .select(`
          profiles!users_profile_id_fkey!inner(
            permissions_profiles!inner(
              active,
              permissions!inner(code)
            )
          )
        `)
        .eq('id', session.user.id)
        .eq('profiles.permissions_profiles.permissions.code', 'access:dashboard')
        .eq('profiles.permissions_profiles.active', true)
        .limit(1)
        .maybeSingle(),
      areReservationsEnabled(),
      isUserInAttendanceList(session.user.id)
    ]);

    initialDashboardAccess = !!accessResult.data;
    initialReservationsEnabled = enabled;
    initialIsInAttendanceList = inList;
  }

  return (
    <html lang="es" suppressHydrationWarning className={`${benedict.variable}`}>
      <head>
        <meta
          name="keywords"
          content="soluciones digitales, automatización de procesos, eficiencia empresarial, herramientas personalizadas, transformación digital, desarrollo de software, optimización operativa, odoo, n8n, angular, nestjs, next.js"
        ></meta>
        <meta name="author" content="Alveus Soft"></meta>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider 
          initialUser={session?.user || null}
          initialDashboardAccess={initialDashboardAccess}
          initialReservationsEnabled={initialReservationsEnabled}
          initialIsInAttendanceList={initialIsInAttendanceList}
        >
          <CompanyProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem={false}
              disableTransitionOnChange
            >
              {children}
              <Toaster richColors position="top-right" />
            </ThemeProvider>
          </CompanyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
