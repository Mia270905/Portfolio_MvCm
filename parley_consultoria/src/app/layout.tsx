import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { CompanyProvider } from "./providers/company-provider";
import { benedict } from "@/fonts/benedict";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parley | Abogado en Tepic | Abogados",
  description:
    "Asesoría para personas y empresas en todas las áreas legales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${benedict.variable}`}>
      <head>
        <meta
          name="keywords"
          content="Parley Consultoría, consultoría jurídica integral, despacho jurídico, abogados, asesoría legal empresarial, servicios legales para empresas, litigio nacional, juicios, contratos, dictámenes jurídicos, derecho inmobiliario, contratos inmobiliarios, viabilidad de proyecto, adquisición de inmuebles, propiedad intelectual, registro de marca, inscripción de marcas, propiedad industrial, patentes, diseño industrial, derecho laboral, contratos laborales, STPS, IMSS, NOM, litigio laboral, derecho administrativo, PROFECO, CONDUSEF, trámites gubernamentales, litigio contencioso administrativo, derecho mercantil, contratos mercantiles, cobranza judicial, cobranza extrajudicial, asambleas societarias, sociedades mercantiles, derecho fiscal, contabilidad fiscal, recuperación de impuestos, litigio fiscal, consultoría legal en México"
        ></meta>
        <meta name="author" content="Alveus Soft"></meta>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
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
      </body>
    </html>
  );
}
