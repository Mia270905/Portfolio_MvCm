"use client";

import Link from "next/link";
import { Facebook } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { getSocialMediaConfigs } from "@/lib/actions/configuration.actions";
import Image from "next/image";

const footerLinks = [
  {
    group: "Servicios:",
    items: [
      { name: "¿Qué hacemos?", href: "/#services" },
      { name: "Agendar cita", href: "/cliente-cita" },
    ],
  },
  {
    group: "Somos:",
    items: [
      { name: "Sobre nosotros", href: "/about-us" },
      { name: "Aviso de privacidad", href: "/legal/privacy" },
      // { name: "Términos", href: "/legal/terms" },
    ],
  },
];

export default function FooterSection() {
  const [socialData, setSocialData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [contactItems, setContactItems] = useState<{ title: string; href: string }[]>([]);

  useEffect(() => {
    fetchSocialMediaData();
  }, []);

  const fetchSocialMediaData = async () => {
    try {
      const data = await getSocialMediaConfigs();
      if (data.success && data.data) {
        setSocialData(data.data as Record<string, string>);
        
        // Actualizar items de contacto con datos dinámicos
        const newContactItems = [];
        
        // Email de la base de datos
        const emailData = (data.data as Record<string, string>).email;
        if (emailData && emailData.trim() !== "") {
          newContactItems.push({
            title: emailData,
            href: `mailto:${emailData}`,
          });
        }
        
        // Teléfono de la base de datos (phone_number_social_media_tab)
        const phoneData = (data.data as Record<string, string>).phone_number_social_media_tab;
        if (phoneData && phoneData.trim() !== "") {
          // Limpiar el número de teléfono (quitar caracteres no numéricos)
          const cleaned = phoneData.replace(/\D/g, "");
          
          // Formatear número para mostrar (formato mexicano)
          let formattedPhone = phoneData;
          if (cleaned.length === 10) {
            formattedPhone = `+52 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
          } else if (cleaned.length > 0) {
            // Si tiene más dígitos, mantener el formato original pero asegurar el prefijo +52
            formattedPhone = phoneData;
          }
          
          newContactItems.push({
            title: formattedPhone,
            href: `tel:+52${cleaned}`,
          });
        }
        
        setContactItems(newContactItems);
      }
    } catch (error) {
      console.error("Error al cargar redes sociales:", error);
    } finally {
      setLoading(false);
    }
  };

  // Solo mostrar íconos que tienen URL configurada
  const tieneRedSocial = (key: string) => {
    const url = socialData[key];
    return url && url.trim() !== "";
  };

  // Verificar si hay redes sociales configuradas
  const redesConDatos = [
    { key: "facebook_url", icon: "facebook" },
    { key: "linkedin_url", icon: "linkedin" },
    { key: "instagram_url", icon: "instagram" },
    { key: "twitter_url", icon: "twitter" },
    { key: "tiktok_url", icon: "tiktok" },
    { key: "whatsapp_url", icon: "whatsapp" },
    { key: "email", icon: "Mail" },
    { key: "phone_number_social_media_tab", icon: "Phone" },
  ].filter(red => tieneRedSocial(red.key));

  return (
    <footer className="relative bg-[#6f6f6f] pt-16 text-white">
      {/* Línea superior */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#b2914a]" />

      <div className="container mx-auto px-5">
        <div className="grid gap-10 grid-cols-2 md:grid-cols-4">

          {/* Logo con imagen */}
          <div className="col-span-2 md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="relative h-20 md:h-24 w-52">
              <Image
                src="/assets/landing/logo-narvbarparley.png"
                alt="Parley Consultoría Integral"
                fill
                priority
                className="object-contain scale-150" 
                sizes="(max-width: 768px) 208px, 256px"
              />
            </div>

            <p className="mt-4 max-w-sm text-sm text-gray-200 leading-relaxed text-center md:text-left">
              <span className="block font-semibold text-white">
                Parley
              </span>
              <span className="block text-gray-300">
                “Soluciones legales para todas tus necesidades”.
              </span>
            </p>

            {/* Redes */}
            <div className="mt-6 flex gap-5 justify-center md:justify-start">
              {loading ? (
                // Placeholders de carga
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-6 w-6 bg-gray-300 rounded animate-pulse" />
                  ))}
                </>
              ) : redesConDatos.length === 0 ? (
                // Si no hay redes configuradas, mostrar enlaces estáticos originales
                <>
                  <Link
                    href="https://facebook.com/parleyconsultoria"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      p-2 rounded-lg
                      text-gray-300
                      hover:text-[#b2914a]
                      hover:bg-white/5
                      transition-all duration-300
                    "
                  >
                    <Facebook className="w-5 h-5" />
                  </Link>
                </>
              ) : (
                // Mostrar redes sociales dinámicas configuradas
                <>
                  {/* LinkedIn */}
                  {tieneRedSocial("linkedin_url") && (
                    <Link
                      href={socialData.linkedin_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="LinkedIn"
                      aria-label="LinkedIn"
                      className="p-1 rounded-lg
                        text-gray-300
                        hover:text-[#b2914a]
                        hover:bg-white/5
                        transition-all duration-300"
                    >
                      <svg
                        className="size-6"
                        xmlns="http://www.w3.org/2000/svg"
                        width="1em"
                        height="1em"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z"
                        />
                      </svg>
                    </Link>
                  )}

                  {/* Facebook */}
                  {tieneRedSocial("facebook_url") && (
                    <Link
                      href={socialData.facebook_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Facebook"
                      aria-label="Facebook"
                      className="p-1 rounded-lg
                        text-gray-300
                        hover:text-[#b2914a]
                        hover:bg-white/5
                        transition-all duration-300"
                    >
                      <svg
                        className="size-6"
                        xmlns="http://www.w3.org/2000/svg"
                        width="1em"
                        height="1em"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95"
                        />
                      </svg>
                    </Link>
                  )}

                  {/* Instagram */}
                  {tieneRedSocial("instagram_url") && (
                    <Link
                      href={socialData.instagram_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Instagram"
                      aria-label="Instagram"
                      className="p-1 rounded-lg
                        text-gray-300
                        hover:text-[#b2914a]
                        hover:bg-white/5
                        transition-all duration-300"
                    >
                      <svg
                        className="size-6"
                        xmlns="http://www.w3.org/2000/svg"
                        width="1em"
                        height="1em"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3"
                        />
                      </svg>
                    </Link>
                  )}

                  {/* Twitter/X */}
                  {tieneRedSocial("twitter_url") && (
                    <Link
                      href={socialData.twitter_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="X (Twitter)"
                      aria-label="X (Twitter)"
                      className="p-1 rounded-lg
                        text-gray-300
                        hover:text-[#b2914a]
                        hover:bg-white/5
                        transition-all duration-300"
                    >
                      <svg
                        className="size-6"
                        xmlns="http://www.w3.org/2000/svg"
                        width="1em"
                        height="1em"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z"
                        />
                      </svg>
                    </Link>
                  )}

                  {/* TikTok */}
                  {tieneRedSocial("tiktok_url") && (
                    <Link
                      href={socialData.tiktok_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="TikTok"
                      aria-label="TikTok"
                      className="p-1 rounded-lg
                        text-gray-300
                        hover:text-[#b2914a]
                        hover:bg-white/5
                        transition-all duration-300"
                    >
                      <svg
                        className="size-6"
                        xmlns="http://www.w3.org/2000/svg"
                        width="1em"
                        height="1em"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64c0 3.33 2.76 5.7 5.69 5.7c3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48"
                        />
                      </svg>
                    </Link>
                  )}

                  {/* WhatsApp */}
                  {tieneRedSocial("whatsapp_url") && (
                    <Link
                      href={socialData.whatsapp_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp"
                      aria-label="WhatsApp"
                      className="p-1 rounded-lg
                        text-gray-300
                        hover:text-[#b2914a]
                        hover:bg-white/5
                        transition-all duration-300"
                    >
                      <svg
                        className="size-6"
                        xmlns="http://www.w3.org/2000/svg"
                        width="1em"
                        height="1em"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M12 2a9.9 9.9 0 0 0-8.48 15.14L2 22l4.97-1.45A9.9 9.9 0 1 0 12 2Zm0 18a8.08 8.08 0 0 1-4.1-1.13l-.29-.17l-2.95.86l.87-2.87l-.19-.3A8.1 8.1 0 1 1 12 20Zm4.61-5.63c-.25-.13-1.48-.73-1.7-.82s-.39-.12-.56.13s-.64.82-.78.99s-.29.19-.54.06a6.6 6.6 0 0 1-1.94-1.2a7.27 7.27 0 0 1-1.34-1.67c-.14-.25 0-.39.11-.52s.25-.29.38-.45s.17-.25.25-.42s.04-.32-.02-.45s-.56-1.34-.77-1.83s-.41-.42-.56-.43h-.48a.93.93 0 0 0-.67.32c-.23.25-.88.86-.88 2.1s.9 2.43 1.02 2.6a9.46 9.46 0 0 0 3.3 3.11a11.3 11.3 0 0 0 1.13.42a2.7 2.7 0 0 0 1.23.08c.38-.06 1.17-.48 1.34-.94s.17-.85.12-.94s-.22-.16-.47-.29Z"
                        />
                      </svg>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Links - Servicios y Somos */}
          {footerLinks.map((section) => (
            <div
              key={section.group}
              className="text-center md:text-left"
            >
              <span className="block font-semibold tracking-wide text-[#b2914a] uppercase text-xs mb-4">
                {section.group}
              </span>

              <ul className="space-y-3 text-sm">
                {section.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        item.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="
                        block text-gray-300
                        hover:text-white
                        transition-colors duration-200
                        break-words leading-snug
                      "
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Sección de Contacto dinámica */}
          <div className="text-center md:text-left">
            <span className="block font-semibold tracking-wide text-[#b2914a] uppercase text-xs mb-4">
              Contacto:
            </span>

            <ul className="space-y-3 text-sm">
              {loading ? (
                // Placeholders de carga
                <>
                  <li><div className="h-4 w-32 bg-gray-400 rounded animate-pulse" /></li>
                  <li><div className="h-4 w-24 bg-gray-400 rounded animate-pulse" /></li>
                </>
              ) : contactItems.length > 0 ? (
                // Mostrar items de contacto desde la base de datos
                contactItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className="
                        block text-gray-300
                        hover:text-white
                        transition-colors duration-200
                        break-words leading-snug
                      "
                    >
                      {item.title}
                    </Link>
                  </li>
                ))
              ) : (
                // No mostrar nada si no hay datos de contacto
                null
              )}
              
              {/* Dirección física */}
              <li>
                <Link
                  href="https://maps.app.goo.gl/6qbERgTMtkVkY6XL9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    block text-gray-300
                    hover:text-white
                    transition-colors duration-200
                    break-words leading-snug
                  "
                >
                  Querétaro Sur 71-sur, Centro, 63000 Tepic, Nay.
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 py-6 text-center sm:text-left">
          <p className="text-xs text-gray-300">
            © {new Date().getFullYear()} Parley Consultoría Integral. Todos los
            derechos reservados.
          </p>

          <span className="text-xs text-gray-400">
            Powered by{" "}
            <a
              href="https://www.alveussoft.com"
              className="font-semibold hover:text-white transition-colors"
            >
              Alveus Soft
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}