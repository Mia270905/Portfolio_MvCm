"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Globe, Save, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getSocialMediaConfigs,
  updateMultipleSocialMediaConfigs,
} from "@/lib/actions/configuration.actions";
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

export default function EditSocialMediaPage() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    fetchSocialMediaData();
  }, []);

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
      placeholder: "https://facebook.com/tu-empresa",
      descripcion: "URL del perfil de Facebook",
      tipo: "url",
    },
    {
      key: "instagram_url",
      nombre: "Instagram",
      icono: Instagram,
      color: "text-pink-600",
      placeholder: "https://instagram.com/tu-empresa",
      descripcion: "URL del perfil de Instagram",
      tipo: "url",
    },
    {
      key: "linkedin_url",
      nombre: "LinkedIn",
      icono: Linkedin,
      color: "text-blue-700",
      placeholder: "https://linkedin.com/company/tu-empresa",
      descripcion: "URL del perfil de LinkedIn",
      tipo: "url",
    },
    {
      key: "twitter_url",
      nombre: "X (Twitter)",
      icono: XIcon,
      color: "text-foreground",
      placeholder: "https://twitter.com/tu-empresa",
      descripcion: "URL del perfil de X (Twitter)",
      tipo: "url",
    },
    {
      key: "tiktok_url",
      nombre: "TikTok",
      icono: TikTokIcon,
      color: "text-foreground",
      placeholder: "https://tiktok.com/@tu-empresa",
      descripcion: "URL del perfil de TikTok",
      tipo: "url",
    },
    {
      key: "whatsapp_url",
      nombre: "WhatsApp",
      icono: WhatsappIcon,
      color: "text-green-600",
      placeholder: "https://wa.me/5211234567890",
      descripcion: "Enlace directo a WhatsApp",
      tipo: "whatsapp",
    },
    {
      key: "email",
      nombre: "Correo Electrónico",
      icono: Mail,
      color: "text-red-600",
      placeholder: "contacto@tuempresa.com",
      descripcion: "Correo de contacto principal",
      tipo: "email",
    },
        {
      key: "phone_number",
      nombre: "Teléfono de Contacto",
      icono: Phone,
      color: "text-green-600",
      placeholder: "311-123-4567",
      descripcion: "Teléfono de contacto principal",
      tipo: "number",
    },
  ];

  const fetchSocialMediaData = async () => {
    try {
      const data = await getSocialMediaConfigs();
      if (data.success && data.data) {
        const rawData = data.data as Record<string, string>;

        // Aplicar formato al phone_number si existe
        if (rawData.phone_number) {
          const cleaned = rawData.phone_number.replace(/\D/g, "");
          if (cleaned.length === 10) {
            rawData.phone_number = `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
          }
        }

        setFormData(rawData);
      }
    } catch (error) {
      toast.error("Error al cargar redes sociales: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    let newValue = value;
    
    // Aplicar formato automático al número de teléfono
    if (key === "phone_number") {
      // Permitir solo dígitos y guiones
      let cleanedValue = value.replace(/[^\d-]/g, "");

      // Aplicar formato automáticamente mientras el usuario escribe
      const digitsOnly = cleanedValue.replace(/\D/g, "");

      if (digitsOnly.length <= 3) {
        cleanedValue = digitsOnly;
      } else if (digitsOnly.length <= 6) {
        cleanedValue = `${digitsOnly.substring(0, 3)}-${digitsOnly.substring(3)}`;
      } else {
        cleanedValue = `${digitsOnly.substring(0, 3)}-${digitsOnly.substring(3, 6)}-${digitsOnly.substring(6, 10)}`;
      }

      newValue = cleanedValue;
    }

    setFormData((prev) => ({
      ...prev,
      [key]: newValue,
    }));

    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const urlRegex = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]{2,}(\/.*)?$/i;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const whatsappRegex = /^(https?:\/\/)?(wa\.me\/|whatsapp\.com\/)/i;

    redesSociales.forEach((field) => {
      const value = formData[field.key] || "";

      if (value.trim() !== "") {
        if (field.tipo === "email") {
          if (!emailRegex.test(value)) {
            newErrors[field.key] = "Ingresa un correo electrónico válido";
          }
        } else if (field.tipo === "whatsapp") {
          if (!whatsappRegex.test(value) && !urlRegex.test(value)) {
            newErrors[field.key] =
              "Formato inválido. Usa: https://wa.me/5211234567890";
          }
        } else if (field.tipo === "url") {
          if (!urlRegex.test(value)) {
            newErrors[field.key] =
              "Ingresa una URL válida (comienza con https://)";
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const configsArray = Object.entries(formData)
        .filter(([_, value]) => value && value.trim() !== "")
        .map(([key, value]) => ({
          key,
          value: key === "phone_number" ? value.replace(/\D/g, "") : value,
        }));

      const result = await updateMultipleSocialMediaConfigs(
        configsArray,
        user.id
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success("Redes sociales actualizadas correctamente");
      router.push("/dashboard/sitio-web/redes_sociales");
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error("Error al guardar: " + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const estaConfigurado = (key: string) => {
    const valor = formData[key] || "";
    return valor && valor.trim() !== "";
  };

  const contarConfigurados = () => {
    return redesSociales.filter((red) => estaConfigurado(red.key)).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="mb-6 p-4">
          <Link
            href="/dashboard/sitio-web/redes_sociales"
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
                  className="flex items-start justify-between py-6 border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-32 mb-4"></div>
                      <div className="h-10 bg-muted rounded w-full"></div>
                    </div>
                  </div>
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
    <div className="min-h-screen bg-background">
      <div className="mb-6 p-4">
        <Link
          href="/dashboard/sitio-web/redes_sociales"
          className="inline-flex items-center text-foreground hover:text-primary p-2 hover:bg-muted rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3 mb-2">
            <Globe className="w-8 h-8 text-primary" />
            Editar Redes Sociales
          </h1>
          <div className="bg-muted rounded-lg border border-border p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Estado actual:</p>
                <p className="font-semibold text-foreground">
                  {totalConfigurados} de {redesSociales.length} configuradas
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  totalConfigurados > 0
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-accent text-accent-foreground border-border"
                }`}
              >
                {totalConfigurados > 0
                  ? `${totalConfigurados} activas`
                  : "Sin configurar"}
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-sm"
        >
          <div className="space-y-1">
            {redesSociales.map((red) => {
              const valor = formData[red.key] || "";
              const configurado = estaConfigurado(red.key);
              const Icono = red.icono;
              const error = errors[red.key];

              return (
                <div
                  key={red.key}
                  className="py-6 px-3 border-b border-border last:border-b-0 hover:bg-muted transition-colors rounded-lg"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Icono */}
                    <div
                      className={`p-2 rounded-lg bg-muted ${red.color} flex-shrink-0`}
                    >
                      <Icono className="w-5 h-5" />
                    </div>

                    {/* Contenido principal */}
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <div>
                          <h3 className="font-semibold text-card-foreground">
                            {red.nombre}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {red.descripcion}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium self-start sm:self-center ${
                            configurado
                              ? "bg-green-100 text-green-800"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {configurado ? "Configurado" : "No configurado"}
                        </span>
                      </div>

                      {/* Campo de entrada */}
                      <div className="relative">
                        <input
                          type="text"
                          value={valor}
                          onChange={(e) =>
                            handleChange(red.key, e.target.value)
                          }
                          placeholder={red.placeholder}
                          className={`w-full border ${
                            error ? "border-destructive" : "border-input"
                          } rounded-lg px-3 py-2 focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-200 bg-background text-foreground placeholder-muted-foreground pr-10`}
                        />

                        {configurado && (
                          <a
                            href={valor}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary/80 transition-colors"
                            title="Visitar enlace"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      {/* Mensaje de error */}
                      {error && (
                        <p className="text-destructive text-sm mt-2">{error}</p>
                      )}

                      {/* Ejemplo de formato */}
                      <p className="text-xs text-muted-foreground mt-2">
                        Ejemplo: {red.placeholder}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mensaje de error general */}
          {errors.submit && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mt-6">
              <p className="text-destructive text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-8 mt-6 border-t border-border gap-4">
            <div className="text-sm text-muted-foreground">
              <p>Guarda los cambios cuando hayas terminado.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link href="/dashboard/sitio-web/redes_sociales" className="w-full sm:w-auto">
                <button
                  type="button"
                  className="w-full sm:w-auto px-6 py-2 border border-input text-foreground font-medium rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50"
                  disabled={saving}
                >
                  Cancelar
                </button>
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}