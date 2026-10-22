"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Globe,
  Edit,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  getSocialMediaConfigs,
  type SocialMediaData,
} from "@/lib/actions/configuration.actions";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import { toast } from "sonner";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Music,
  MessageCircle,
  Mail,
  Phone,
} from "lucide-react";

export default function RedesSocialesPage() {
  const [socialData, setSocialData] = useState<SocialMediaData>({});
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getSocialMediaConfigs();

      if (data.success) {
        setSocialData(data.data || {});
      } else {
        setSocialData({});
        toast.warning(data.message);
      }

      const userWithPermissions = await getUserWithPermissions();
      const userPermissions =
        userWithPermissions?.permissions?.map(
          (p: { code: string }) => p.code
        ) || [];

      setCanEdit(userPermissions.includes("update:social-media"));
    } catch (error) {
      toast.warning("Error al cargar datos: " + error);
    } finally {
      setLoading(false);
    }
  };

  const TikTokIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      className="bi bi-tiktok"
      viewBox="0 0 16 16"
    >
      <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z" />
    </svg>
  );

  const XIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      className="bi bi-twitter-x"
      viewBox="0 0 16 16"
    >
      <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
    </svg>
  );

  const WhatsappIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      className="bi bi-whatsapp"
      viewBox="0 0 16 16"
    >
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
    </svg>
  );

  const redesSociales = [
    {
      key: "facebook_url",
      nombre: "Facebook",
      icono: Facebook,
      color: "text-blue-600",
      placeholder: "No configurado",
      descripcion: "URL del perfil de Facebook",
    },
    {
      key: "instagram_url",
      nombre: "Instagram",
      icono: Instagram,
      color: "text-pink-600",
      placeholder: "No configurado",
      descripcion: "URL del perfil de Instagram",
    },
    {
      key: "linkedin_url",
      nombre: "LinkedIn",
      icono: Linkedin,
      color: "text-blue-700",
      placeholder: "No configurado",
      descripcion: "URL del perfil de LinkedIn",
    },
    {
      key: "twitter_url",
      nombre: "X (Twitter)",
      icono: XIcon,
      color: "text-foreground",
      placeholder: "No configurado",
      descripcion: "URL del perfil de X (Twitter)",
    },
    {
      key: "tiktok_url",
      nombre: "TikTok",
      icono: TikTokIcon,
      color: "text-foreground",
      placeholder: "No configurado",
      descripcion: "URL del perfil de TikTok",
    },
    {
      key: "whatsapp_url",
      nombre: "WhatsApp",
      icono: WhatsappIcon,
      color: "text-green-600",
      placeholder: "No configurado",
      descripcion: "Enlace directo a WhatsApp",
    },
    {
      key: "email",
      nombre: "Correo Electrónico",
      icono: Mail,
      color: "text-red-600",
      placeholder: "No configurado",
      descripcion: "Correo de contacto principal",
    },
    {
      key: "phone_number",
      nombre: "Teléfono de Contacto",
      icono: Phone,
      color: "text-green-600",
      placeholder: "No configurado",
      descripcion: "Teléfono de contacto principal",
    },
  ];

  const obtenerValor = (key: string) => {
    const valor = socialData[key as keyof SocialMediaData] || "";

    // Formatear número de teléfono
    if (key === "phone_number" && valor) {
      const cleaned = valor.replace(/\D/g, "");
      if (cleaned.length === 10) {
        return `+52 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
      }
    }

    return valor;
  };

  const estaConfigurado = (key: string) => {
    const valor = obtenerValor(key);
    return valor && valor.trim() !== "";
  };

  const contarConfigurados = () => {
    return redesSociales.filter((red) => estaConfigurado(red.key)).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mb-6 p-4">
          <Link
            href="/dashboard/sitio-web"
            className="inline-flex items-center text-foreground hover:text-primary p-2 hover:bg-muted rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="bg-card rounded-lg border border-border p-6">
              {/* Lista de carga */}
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-4 border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-muted rounded-full"></div>
                    <div>
                      <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-32"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-muted rounded w-48"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalConfigurados = contarConfigurados();

  return (
    <div className="min-h-screen">
      <div className="mb-6 p-4">
        <Link
          href="/dashboard/sitio-web"
          className="inline-flex items-center text-foreground hover:text-primary p-2 hover:bg-muted rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3 mb-2">
              <Globe className="w-8 h-8 text-primary" />
              Redes Sociales
            </h1>
            <p className="text-muted-foreground">
              Gestiona todos los enlaces de tus redes sociales desde un solo lugar
            </p>
          </div>

          {canEdit && (
            <Link href="/dashboard/sitio-web/redes_sociales/editar" className="shrink-0">
              <Button className="inline-flex items-center px-3 md:px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all duration-300">
                <Edit className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">Editar Redes Sociales</span>
              </Button>
            </Link>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border p-4 sm:p-6 mb-8 shadow-sm">
          {/* Lista de redes sociales */}
          <div className="space-y-1">
            {redesSociales.map((red) => {
              const valor = obtenerValor(red.key);
              const configurado = estaConfigurado(red.key);
              const Icono = red.icono;

              return (
                <div
                  key={red.key}
                  className="flex items-center justify-between py-4 px-3 hover:bg-muted rounded-lg transition-all duration-200 border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg bg-muted ${red.color} shrink-0`}>
                      <Icono className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <h3 className="font-semibold text-card-foreground truncate">
                          {red.nombre}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                            configurado
                              ? "bg-green-100 text-green-800"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {configurado ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <p 
                        className="text-sm text-muted-foreground break-all md:break-words md:truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px]"
                        title={configurado ? valor : red.placeholder}
                      >
                        {configurado ? valor : red.placeholder}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-2">
                    {configurado && (
                      <a
                        href={valor}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
                        title="Visitar enlace"
                      >
                        <ExternalLink className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Visitar</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}