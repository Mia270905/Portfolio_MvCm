"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Globe,
  Edit,
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
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z" />
    </svg>
  );

  const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
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
    { key: "facebook_url", nombre: "Facebook", icono: Facebook, color: "text-blue-600", placeholder: "No configurado" },
    { key: "instagram_url", nombre: "Instagram", icono: Instagram, color: "text-pink-600", placeholder: "No configurado" },
    { key: "linkedin_url", nombre: "LinkedIn", icono: Linkedin, color: "text-blue-700", placeholder: "No configurado" },
    { key: "twitter_url", nombre: "X (Twitter)", icono: XIcon, color: "text-gray-800", placeholder: "No configurado" },
    { key: "tiktok_url", nombre: "TikTok", icono: TikTokIcon, color: "text-gray-800", placeholder: "No configurado" },
    { key: "whatsapp_url", nombre: "WhatsApp", icono: WhatsappIcon, color: "text-green-600", placeholder: "No configurado" },
    { key: "email", nombre: "Correo Electrónico", icono: Mail, color: "text-red-600", placeholder: "No configurado" },
    { key: "phone_number_social_media_tab", nombre: "Teléfono de Contacto", icono: Phone, color: "text-green-600", placeholder: "No configurado" },
  ];

  const obtenerValor = (key: string) => {
    const valor = socialData[key as keyof SocialMediaData] || "";
    if (key === "phone_number_social_media_tab" && valor) {
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

 if (loading) {
  return (
    <div className="min-h-screen bg-[#F5F1E8]"> {/* Fondo normal */}
      <div className="mb-6 p-4">
        <div className="inline-flex items-center p-2 rounded-lg bg-gray-300 animate-pulse w-10 h-10"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Título skeleton */}
        <div className="animate-pulse mb-6">
          <div className="h-8 bg-gray-400 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>

        {/* Lista de redes sociales skeleton */}
        <div className="bg-[#FAF7F2] rounded-lg border border-gray-500 p-6 space-y-4">
          {redesSociales.map((_, i) => (
            <div
              key={i}
              className="flex justify-between items-center py-4 px-3 rounded-lg border-b border-gray-500 last:border-b-0 animate-pulse"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Icono skeleton */}
                <div className="h-10 w-10 bg-gray-400 rounded-lg"></div>
                {/* Nombre + URL skeleton */}
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-400 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
              {/* Botón skeleton */}
              <div className="h-4 bg-gray-400 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="mb-6 p-4">
        <Link
          href="/dashboard/sitio-web"
          className="inline-flex items-center text-[#1F2937] hover:text-[#111827] p-2 hover:bg-[#FAF7F2] rounded-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2937] flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-600" />
              Redes Sociales
            </h1>
            <p className="text-[#4B5563] mt-2">
              Gestiona todos los enlaces de tus redes sociales
            </p>
          </div>

          {canEdit && (
            <Link href="/dashboard/sitio-web/redes_sociales/editar">
              <Button className="bg-[#16A34A] hover:bg-[#15803D] text-white font-medium rounded-lg transition-all transform hover:scale-105">
                <Edit className="w-5 h-5 mr-2" />
                Editar
              </Button>
            </Link>
          )}
        </div>

        <div className="bg-[#FAF7F2] rounded-lg border border-[#E5E7EB] p-6">
          {redesSociales.map((red) => {
            const valor = obtenerValor(red.key);
            const configurado = estaConfigurado(red.key);
            const Icono = red.icono;

            return (
              <div
                key={red.key}
                className="flex justify-between items-center py-4 border-b border-[#E5E7EB] last:border-b-0 hover:bg-white rounded-lg px-3 transition"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-white ${red.color}`}>
                    <Icono className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1F2937]">{red.nombre}</h3>
                    <p className="text-sm text-[#6B7280]">
                      {configurado ? valor : red.placeholder}
                    </p>
                  </div>
                </div>

                {configurado && (
                  <a
                    href={valor}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visitar
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
