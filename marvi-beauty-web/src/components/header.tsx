"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import React from "react";
import { AuthButton } from "./auth - supabse/auth-button";
import { getImageUrl } from "@/lib/supabase/upload-image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navLinks = [
  { href: "/#services", label: "Servicios" },
  { href: "/#areas", label: "Áreas" },
  { href: "/about-us", label: "Nosotros" },
  { href: "/#contact-section", label: "Contacto" },
];

export const HeroHeader = () => {
  const [mounted, setMounted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<any>(null);

  const supabase = createClient();
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);

    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);

    const fetchLogo = async () => {
      try {
        const logo = await getImageUrl("logo", "logo");
        setLogoUrl(logo);
      } catch (error) {
        console.error("Error cargando logo:", error);
      }
    };

    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    fetchLogo();
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMobileMenuOpen(false);
    router.push("/auth/login");
  };

  const renderLogo = () => {
    if (logoUrl) {
      return (
        <img
          src={logoUrl}
          alt="MarVi"
          className="h-14 md:h-16 w-auto object-contain"
        />
      );
    }
    return (
      <div className="h-22 md:h-28 flex items-center justify-center">
        <span className="font-bold text-[#987E71]">MarVi</span>
      </div>
    );
  };

  if (!mounted) {
    return (
      <header className="w-full bg-[#E3E2DD] border-b border-[#d6c9c0] sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center px-4">
          <div className="h-22 md:h-28 flex items-center justify-center">
            <span className="font-bold text-[#987E71]">MarVi</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      style={{ backgroundColor: "#E3E2DD" }}
      className={`w-full sticky top-0 z-50 transition-all duration-300 bg-[#E3E2DD]${
        isScrolled
          ? " md:bg-[#E3E2DD]/95 md:backdrop-blur border-b border-[#d6c9c0] shadow-sm"
          : ""
      }`}
    >
      <div className="container mx-auto flex h-16 items-center px-10 justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          {renderLogo()}
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-8 ml-auto mr-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-bold text-[#987E71] hover:text-[#40222D] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Perfil + reservar + hamburguesa */}
        <div className="flex items-center gap-4">

          {/* Auth desktop */}
          <div className="hidden md:block">
            <AuthButton />
          </div>

          {/* Reservar cita desktop — solo si hay sesión */}
          {session && (
            <button
              onClick={() => window.open("/cliente-cita", "_blank")}
              className="hidden md:block bg-[#987E71] text-white px-4 py-2 rounded-full hover:bg-[#40222D] transition text-sm font-bold"
            >
              Reservar cita
            </button>
          )}

          {/* Hamburguesa */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-[#987E71]/10"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-[#987E71]" />
            ) : (
              <Menu className="h-5 w-5 text-[#987E71]" />
            )}
          </button>
        </div>
      </div>

      {/* MENÚ MÓVIL */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Panel lateral */}
          <div className="fixed top-0 right-0 h-full w-[300px] sm:w-[400px] bg-[#E3E2DD] border-l border-[#d6c9c0] z-50 md:hidden flex flex-col">

            {/* Cabecera fija */}
            <div className="flex items-center justify-between p-6 pb-4 shrink-0">
              {renderLogo()}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md hover:bg-[#987E71]/10"
              >
                <X className="h-5 w-5 text-[#987E71]" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">

              {/* Links */}
              <nav className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-[#987E71] hover:text-[#40222D] transition-colors border-b border-[#d6c9c0] pb-2"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Auth */}
              <div className="mt-8 pt-6 border-t border-[#d6c9c0] flex flex-col gap-4">

                {/* Auth: si hay sesión muestra AuthButton, si no "Iniciar sesión" */}
                {session ? (
                  <AuthButton mobileView />
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center border border-[#987E71] text-[#987E71] px-4 py-2 rounded-full hover:bg-[#40222D] hover:text-white transition text-sm font-bold"
                  >
                    Iniciar sesión
                  </Link>
                )}

                {/* Reservar cita móvil */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.open("/cliente-cita", "_blank");
                  }}
                  className="w-full bg-[#987E71] text-white px-4 py-2 rounded-full hover:bg-[#40222D] transition text-sm font-bold"
                >
                  Reservar cita
                </button>

              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};