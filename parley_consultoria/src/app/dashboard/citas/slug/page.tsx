"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  User,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  fetchUserProfile,
  getUserWithPermissions,
} from "@/lib/actions/user.actions";
import { toast } from "sonner";
import ShareButton from "@/components/share-button";

export default function UserCodePage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Obtener perfil del usuario
      const { user, profile, error } = await fetchUserProfile();

      if (error === "NO_SESSION") {
        toast.error("No hay sesión activa. Por favor, inicia sesión.");
        setUserProfile(null);
      } else if (error) {
        toast.error("Error al cargar el perfil del usuario");
        console.error("Error al cargar perfil:", error);
        setUserProfile(null);
      } else {
        setUserProfile(profile);
      }

      const userWithPermissions = await getUserWithPermissions();
      const userPermissions =
        userWithPermissions?.permissions?.map(
          (p: { code: string }) => p.code
        ) || [];

      setCanEdit(userPermissions.includes("update:slug-code"));
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.warning("Error al cargar la información del usuario");
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    if (!userProfile?.full_name) return "Usuario";
    return userProfile.full_name;
  };

  const getUserCode = () => {
    if (!userProfile?.user_code) return null;
    return userProfile.user_code;
  };

  const isActive = () => {
    return userProfile?.active || false;
  };

  const handleCopyCode = () => {
    const userCode = getUserCode();
    if (userCode) {
      navigator.clipboard.writeText(userCode);
      setCopied(true);
      toast.success("Código copiado al portapapeles");

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f3]">
        <div className="mb-6 p-4 lg:p-6">
          <Link
            href="/dashboard/citas"
            className="inline-flex items-center text-[#c6a365] hover:text-[#b59555] p-2 hover:bg-[#f5efe6] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-[#f5efe6] rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border border-[#f5efe6] p-6">
              <div className="h-6 bg-[#faf8f3] rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-[#faf8f3] rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userCode = getUserCode();
  const displayName = getDisplayName();
  const active = isActive();
  const hasUserCode = !!userCode;

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="min-h-screen bg-[#faf8f3]">
      <div className="mb-6 p-4 lg:p-6">
        <Link
          href="/dashboard/citas"
          className="inline-flex items-center text-[#c6a365] hover:text-[#b59555] p-2 hover:bg-[#f5efe6] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 flex items-center gap-3">
            <User className="w-8 h-8 text-[#c6a365]" />
            Mi Código de Usuario
          </h1>

          {canEdit && (
            <Link href="/dashboard/citas/slug/editar">
              <Button className="inline-flex items-center px-3 md:px-6 py-2 bg-[#c6a365] hover:bg-[#b59555] text-white font-medium rounded-lg transition duration-300 hover:shadow-lg hover:shadow-[#c6a365]/20">
                <Edit className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">Editar Código</span>
              </Button>
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[#f5efe6] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#f5efe6]">
            <div>
              <h2 className="text-lg font-serif font-semibold text-neutral-900">
                Información del Usuario
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                Visualiza y gestiona tu identificador único en el sistema
              </p>
            </div>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                active
                  ? "bg-[#e8f5e8] text-[#2e7d32] border-[#c8e6c9]"
                  : "bg-[#fdeaea] text-[#c62828] border-[#ffcdd2]"
              }`}
            >
              {active ? (
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

          <div className="py-6 space-y-6">
            {/* Código de usuario */}
            <div className="space-y-2 max-w-md">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">
                  Código de Usuario
                </label>
              </div>

              <div
                className={`p-4 rounded-lg border ${
                  hasUserCode
                    ? "bg-[#faf8f3] border-[#c6a365]"
                    : "bg-[#faf8f3] border-[#f5efe6]"
                }`}
              >
                {hasUserCode ? (
                  <div>
                    <p className="text-2xl font-bold text-neutral-900 font-mono">
                      {userCode}
                    </p>
                    <p className="text-sm text-neutral-600 mt-1">
                      Este es tu identificador único en el sistema
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-[#c6a365]" />
                    <div>
                      <p className="text-neutral-900 font-medium">
                        No tienes un código asignado
                      </p>
                      <p className="text-sm text-neutral-600 mt-1">
                        Tu cuenta no tiene un código de usuario asignado.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {hasUserCode && (
              <div className="mt-6 flex flex-col gap-4">
                {/* Contenedor de Enlace y Botón de Copiar */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex-1 w-full p-3 bg-[#faf8f3] border border-[#f5efe6] rounded-lg overflow-hidden">
                    <p className="text-sm text-[#1565c0] truncate font-mono">
                      {`${shareUrl}/cliente-cita/${userCode}`}
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => {
                      const url = `${shareUrl}/cliente-cita/${userCode}`;
                      navigator.clipboard.writeText(url);
                      setCopied(true);
                      toast.success("Enlace copiado al portapapeles");
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    variant="outline"
                    className="w-full sm:w-auto border-[#e6dcc9] bg-white text-neutral-700 hover:bg-[#faf8f3] hover:text-neutral-900"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 mr-2 text-[#2e7d32]" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copied ? "Copiado" : "Copiar Enlace"}
                  </Button>
                </div>

                {/* Botón de Compartir existente */}
                <div className="flex justify-center mt-2">
                  <div className="transform scale-110">
                    <ShareButton
                      shareUrl={`${shareUrl}/cliente-cita/${userCode}`}
                      shareTitle="Agenda tu cita"
                      shareText="¡Agenda tu cita fácilmente! Haz clic en el enlace para programar tu visita."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#e8f4fd] border border-[#bbdefb] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1565c0] mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Información Importante
            </h3>
            <ul className="text-[#1565c0] text-sm space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#1565c0] mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Código único:</strong> Cada usuario tiene un
                  identificador exclusivo
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}