"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Phone, PhoneCall, Edit, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { WhatsAppConfig } from "@/lib/actions/configuration.actions";
import { getWhatsAppConfig, getPhoneConfig } from "@/lib/actions/configuration.actions";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import { toast } from "sonner";

export default function WhatsAppConfigPage() {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [phoneConfig, setPhoneConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [canEditPhone, setCanEditPhone] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
     //Obtener configuración de WhatsApp
      const configData = await getWhatsAppConfig();
      
      if (configData.success) {
        setConfig(configData.data);
      } else {
        setConfig(null);
        if (configData.message !== "No se encontró una configuración activa de WhatsApp.") {
          toast.warning(configData.message);
        }
      }
      // Obtener configuración de Teléfono
      const phoneData = await getPhoneConfig();
      
      if (phoneData.success) {
        setPhoneConfig(phoneData.data);
      } else {
        setPhoneConfig(null);
        if (phoneData.message !== "No se encontró una configuración activa de Teléfono.") {
          toast.warning(phoneData.message);
        }
      }

      const userWithPermissions = await getUserWithPermissions();
      const userPermissions =
        userWithPermissions?.permissions?.map(
          (p: { code: string }) => p.code
        ) || [];

      setCanEdit(userPermissions.includes("update:number_whatsapp"));
      setCanEditPhone(userPermissions.includes("update:number_whatsapp"));
    } catch (error) {
      toast.warning("Error al cargar datos: " + error);
    } finally {
      setLoading(false);
    }
  };

  const getWhatsAppNumber = () => {
    return config?.value || "";
  };

  const getPhoneNumber = () => {
    return phoneConfig?.value || "";
  };
  
  const isWhatsAppActive = () => {
    return config?.active || false;
  };

  const isPhoneActive = () => {
    return phoneConfig?.active || false;
  };


  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "No configurado";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10)
      return `${cleaned.substring(0, 3)}-${cleaned.substring(
        3,
        6
      )}-${cleaned.substring(6)}`;
    if (cleaned.length === 11)
      return `${cleaned.substring(1, 4)}-${cleaned.substring(
        4,
        7
      )}-${cleaned.substring(7)}`;
    return cleaned;
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <Link
            href="/dashboard/sitio-web"
            className="inline-flex items-center text-custom-text-primary hover:text-custom-text-secondary p-2 hover:bg-custom-bg-hover rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-custom-bg-secondary rounded w-1/3 mb-6"></div>
            <div className="bg-custom-bg-secondary rounded-lg shadow-xs border border-custom-border-secondary p-6">
              <div className="h-6 bg-custom-bg-tertiary rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-custom-bg-tertiary rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const whatsappNumber = getWhatsAppNumber();
  const phoneNumber = getPhoneNumber();
  const whatsappActive = isWhatsAppActive();
  const phoneActive = isPhoneActive();

  return (
  <div className="min-h-screen bg-[#F5F1E8]">
    {/* Back */}
    <div className="mb-6 p-4 sm:p-6">
      <Link
        href="/dashboard/sitio-web"
        className="inline-flex items-center text-gray-600 hover:text-custom-accent-primary p-2 hover:bg-[#FAF7F2] rounded-lg transition-all duration-200"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
      </Link>
    </div>

    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Phone className="w-8 h-8 text-green-600" />
          WhatsApp Business
        </h1>

        {canEdit && (
          <Link href="/dashboard/sitio-web/numero_whatsapp/editar">
            <Button className="inline-flex items-center px-4 py-2 bg-custom-accent-primary hover:bg-custom-accent-secondary text-[#1F1A17] font-medium rounded-lg transition-all duration-300 hover:shadow-lg">
              <Edit className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">
                {config ? "Editar Configuración" : "Configurar WhatsApp"}
              </span>
            </Button>
          </Link>
        )}
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        {/* Estado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-200">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-lg font-semibold text-gray-900">
              Estado de la Configuración
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona tu número de WhatsApp para ventas y soporte
            </p>
          </div>

          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
              whatsappActive
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-red-100 text-red-700 border-red-200"
            }`}
          >
            {whatsappActive ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                Activo
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-1" />
                Inactivo
              </>
            )}
          </div>
        </div>

        {/* Número */}
        <div className="py-6">
          <div className="space-y-2 max-w-md">
            <label className="text-sm font-medium text-gray-700">
              Número de WhatsApp
            </label>
            <div className="p-4 bg-[#FAF7F2] rounded-lg border border-gray-300">
              <p className="text-xl font-semibold text-gray-900">
                {formatPhoneNumber(whatsappNumber)}
              </p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-[#FFF7E0] border border-custom-accent-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-custom-accent-primary mb-2">
            Información Importante
          </h3>
          <ul className="text-gray-700 text-sm space-y-1">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-custom-accent-primary mt-0.5" />
              <span>El número debe ser un WhatsApp Business activo</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-custom-accent-primary mt-0.5" />
              <span>
                Los clientes podrán contactarte directamente desde la tienda
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-custom-accent-primary mt-0.5" />
              <span>Usa un número dedicado para tu negocio</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
    {/* Sección de Teléfono Fijo/Móvil */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <PhoneCall className="w-8 h-8 text-blue-600" />
              Teléfono de Contacto
            </h1>

            {canEditPhone && (
              <Link href="/dashboard/sitio-web/numero_whatsapp/editar-telefono">
                <Button className="inline-flex items-center px-4 md:px-6 py-2 bg-custom-accent-primary hover:bg-custom-accent-secondary text-[#1F1A17] font-medium rounded-lg transition-all duration-300 hover:shadow-lg">
                  <Edit className="w-5 h-5 md:mr-2" />
                  <span className="hidden md:inline">
                    {phoneConfig ? "Editar Teléfono" : "Editar configuración"}
                  </span>
                </Button>
              </Link>
            )}
          </div>
          {/* Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            {/* Estado */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-200">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  Estado de la Configuración
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Gestiona tu número telefónico para consultas y soporte
                </p>
              </div>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                  phoneActive
                    ? "bg-green-400/20 text-green-400 border-green-400/30"
                    : "bg-red-400/20 text-red-400 border-red-400/30"
                }`}
              >
                {phoneActive ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Activo
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    Inactivo
                  </>
                )}
              </div>
            </div>

            <div className="py-6">
              <div className="space-y-2 max-w-md">
                <label className="text-sm font-medium text-gray-700">
                  Número de Teléfono
                </label>
                <div className="p-4 bg-[#FAF7F2] rounded-lg border border-gray-300">
                  <p className="text-xl font-semibold text-gray-900">
                    {formatPhoneNumber(phoneNumber)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">
                Información Importante
              </h3>
              <ul className="text-gray-700 text-sm space-y-1">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Usa un número fijo o móvil para atención telefónica</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>
                    Los clientes podrán llamarte para consultas generales
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Especifica el horario de atención en tu sitio web</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
);

}