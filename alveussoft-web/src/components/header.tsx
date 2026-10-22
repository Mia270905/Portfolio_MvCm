"use client";
import Link from "next/link";
import { Menu, X, ChevronRight } from "lucide-react";
import React from "react";
import { AuthButton } from "./auth/auth-button";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/supabase/upload-image";

const menuItems = [
  { name: "Servicios", href: "/#services", target: "", title: "Servicios" },
  { name: "Beneficios", href: "/#benefits", target: "", title: "Beneficios" },
  { name: "Sobre nosotros", href: "/about-us", target: "", title: "Sobre nosotros" },
  { name: "Portafolio", href: "/portafolio", target: "", title: "Portafolio" },
  { name: "Hablemos ya!", href: "/cliente-cita", target: "_blank", title: "Contacto por WhatsApp" },
];

export const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [logoMiniUrl, setLogoMiniUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);

    const fetchLogos = async () => {
      try {
        const logo = await getImageUrl("logo", "logo");
        setLogoUrl(logo);
        const logoMini = await getImageUrl("logo", "miniLogo");
        setLogoMiniUrl(logoMini);
      } catch (error) {
        console.error("Error cargando logos:", error);
      }
    };

    fetchLogos();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = menuState ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuState]);

  const renderLogo = (isMini: boolean = false) => {
    const url = isMini ? logoMiniUrl : logoUrl;

    if (url) {
      return (
        <img
          src={url}
          alt="Logo"
          className="h-16 w-auto object-contain transition-all duration-300"
          style={{ maxHeight: isMini ? "48px" : "64px" }}
        />
      );
    }

    return (
      <div className="h-16 w-32 flex items-center justify-center">
        <span className="text-white font-bold text-sm">Alveus Soft</span>
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <header className="relative z-[100]">
      <nav
        className={cn(
          "fixed z-[100] w-full px-4 transition-all duration-500",
          isScrolled ? "pt-3" : "pt-6"
        )}
      >
        <div
          className={cn(
            "mx-auto max-w-6xl transition-all duration-500",
            isScrolled
              ? "bg-black/70 border border-white/10 backdrop-blur-md rounded-full px-6 py-2 shadow-xl"
              : "bg-transparent px-2"
          )}
        >
          <div className="flex items-center justify-between">
            <Link href="/" className="relative z-[110]">
              {renderLogo(isScrolled)}
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      target={item.target}
                      className="text-zinc-400 hover:text-white transition"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Desktop Auth */}
            <div className="hidden lg:block">
              <AuthButton />
            </div>

            {/* Mobile Trigger */}
            <button
              onClick={() => setMenuState(!menuState)}
              className="relative z-[110] flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white lg:hidden"
            >
              {menuState ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[105] bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          menuState ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMenuState(false)}
      />

      {/* Panel lateral móvil */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-[106] w-[280px] bg-zinc-950 border-l border-white/10 p-6 transition-transform duration-500 ease-out lg:hidden max-h-screen overflow-y-auto",
          menuState ? "translate-x-0" : "translate-x-full"
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex flex-col min-h-full pt-16">
          <nav className="flex flex-col gap-1 flex-1">
            <p className="px-4 mb-4 text-[11px] font-medium uppercase tracking-widest text-zinc-500">
              Menú
            </p>

            {menuItems.map((item, idx) => (
              <Link
                key={item.name}
                href={item.href}
                target={item.target}
                onClick={() => setMenuState(false)}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-4 py-3 text-lg text-zinc-300 transition-all active:bg-white/5",
                  menuState ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                )}
                style={{ transitionDelay: `${idx * 70}ms` }}
              >
                {item.name}
                <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-white transition-colors" />
              </Link>
            ))}
          </nav>

          <div
            className={cn(
              "pt-6 border-t border-white/10 transition-all duration-700",
              menuState ? "opacity-100" : "opacity-0"
            )}
          >
            <AuthButton mobileView={true} />
            <p className="mt-6 text-center text-[10px] text-zinc-600">
              Alveus Soft © 2026
            </p>
          </div>
        </div>
      </aside>
    </header>
  );
};