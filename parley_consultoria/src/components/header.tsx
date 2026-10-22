"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import React from "react";
import { AuthButton } from "./auth/auth-button";
import { getImageUrl } from "@/lib/supabase/upload-image";

const navLinks = [
  { href: "/#services", label: "Servicios" },
  { href: "/#areas", label: "Áreas" },
  { href: "/about-us", label: "Nosotros" },
  { href: "/#contact-section", target: "", label: "Contacto"},
];

export const HeroHeader = () => {
  const [mounted, setMounted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);

    const onScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", onScroll);
    
    const fetchLogo = async () => {
      try {
        const logo = await getImageUrl("logo", "logo");
        setLogoUrl(logo);
      } catch (error) {
        console.error("Error cargando logo:", error);
      }
    };
    
    fetchLogo();
    
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const renderLogo = () => {
    if (logoUrl) {
      return (
        <img
          src={logoUrl}
          alt="Parley"
          className="h-14 md:h-16 w-auto object-contain"
        />
      );
    }
    
    // Fallback mientras carga o si hay error
    return (
      <div className="h-22 md:h-28 flex items-center justify-center">
        <span className="font-bold text-[#555]">Parley</span>
      </div>
    );
  };

  if (!mounted) {
    return (
      <header className="w-full bg-[#e5e0df] border-b border-black/10 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center px-4">
          <div className="h-22 md:h-28 flex items-center justify-center">
            <span className="font-bold text-[#555]">Parley</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
       style={{ backgroundColor: "#e5e0df" }}
      className={`w-full sticky top-0 z-50 transition-all duration-300 bg-[#e5e0df]${
        isScrolled
          ? "md:bg-[#e5e0df]/95 md:backdrop-blur border-b border-black/20 shadow-sm"
          : ""
      }`}
    >
      <div className="container mx-auto flex h-16 items-center px-4 justify-between">

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
              target={link.target || undefined}
              className="text-sm font-medium text-[#555] hover:text-black transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* PERFIL + hamburguesa */}
        <div className="flex items-center gap-4">

          {/* PERFIL DESKTOP */}
          <div className="hidden md:block">
            <AuthButton />
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-black/10"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-[#777]" />
            ) : (
              <Menu className="h-5 w-5 text-[#777]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed top-0 right-0 h-full w-[300px] sm:w-[400px] bg-[#d9d9d9] border-l border-black/10 z-50 md:hidden">
            <div className="flex h-full flex-col p-6">

              <div className="flex items-center justify-between mb-8">
                {renderLogo()}

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-md hover:bg-black/10"
                >
                  <X className="h-5 w-5 text-[#777]" />
                </button>
              </div>

              <nav className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    target={link.target || undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-[#555] hover:text-black transition-colors border-b border-black/10 pb-2"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* PERFIL MOBILE */}
              <div className="mt-auto pt-6 border-t border-black/10">
                <AuthButton mobileView />
              </div>

            </div>
          </div>
        </>
      )}
    </header>
  );
};