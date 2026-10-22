"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserCircle,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Edit2,
  Check,
  X,
  KeyRound
} from "lucide-react";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import {
  UserProfile,
  fetchUserProfile,
  updateUser,
  canUserChangePassword,
} from "@/lib/actions/user.actions";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { ChangePasswordModal } from "@/components/profile/change-password-modal";

export default function ProfilePage() {
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [checkingPasswordPermissions, setCheckingPasswordPermissions] =
    useState(false);

  useEffect(() => {
    const load = async () => {
      const { user, profile, error } = await fetchUserProfile();

      if (error === "NO_SESSION" || !user) {
        router.push("/auth/login");
        return;
      }

      setUserProfile(profile);
      setEditingName(profile?.full_name || "");
      setLoading(false);
    };

    load();
  }, [router]);

  const handleSaveName = async () => {
    if (!userProfile || !editingName.trim()) return;

    setIsUpdating(true);

    const { success, error } = await updateUser(userProfile.id, {
      full_name: editingName.trim(),
    });

    if (success) {
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: editingName.trim(),
              updated_at: new Date().toISOString(),
            }
          : null
      );

      setIsEditing(false);
      toast.success("Nombre actualizado correctamente");
    } else {
      toast.error(error || "Error al actualizar el nombre");
    }

    setIsUpdating(false);
  };

  const handleCancelEdit = () => {
    setEditingName(userProfile?.full_name || "");
    setIsEditing(false);
  };

  const getDaysSinceCreation = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleOpenPasswordModal = async () => {
    setCheckingPasswordPermissions(true);

    try {
      const { canChange, message } = await canUserChangePassword();

      if (canChange) {
        setShowPasswordModal(true);
      } else {
        toast.info(message || "No puedes cambiar la contraseña");
      }
    } catch (error) {
      toast.error("Error al verificar permisos");
    } finally {
      setCheckingPasswordPermissions(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-20">
        <Card className="p-8 max-w-md text-center border-2 shadow-lg">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Error al cargar el perfil</h2>
          <p className="text-muted-foreground">
            No se pudo cargar la información de tu perfil.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <HeroHeader />
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-24">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Header Card */}
          <Card className="p-8 mb-8 border-2 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shrink-0 shadow-xl">
                <span className="text-3xl font-bold text-white">
                  {getInitials(userProfile.full_name)}
                </span>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <h1 className="text-3xl font-bold text-foreground">
                    {userProfile.full_name || "Usuario sin nombre"}
                  </h1>
                  {userProfile.active ? (
                    <Badge className="w-fit bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="w-fit">
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Inactivo
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{userProfile.email}</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Days Active Card */}
            <Card className="p-6 border-2 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {getDaysSinceCreation(userProfile.created_at)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Días en la plataforma
                  </p>
                </div>
              </div>
            </Card>

            {/* Account Status Card */}
            <Card className="p-6 border-2 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${userProfile.active ? "bg-green-500/10" : "bg-red-500/10"}`}
                >
                  {userProfile.active ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {userProfile.active ? "Activa" : "Inactiva"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Estado de cuenta
                  </p>
                </div>
              </div>
            </Card>

            {/* Profile Role Card */}
            <Card className="p-6 border-2 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground leading-tight">
                    {userProfile.profile_name || "Sin perfil"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tipo de usuario
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information Card */}
            <Card className="p-6 border-2 shadow-md">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-amber-500" />
                Información Personal
              </h2>

              <div className="space-y-4">
                {/* Nombre Completo con edición */}
                <div className="p-4 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Nombre Completo
                    </p>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-amber-500 hover:text-amber-600 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        placeholder="Ingresa tu nombre completo"
                        disabled={isUpdating}
                      />
                      <div className="mt-4 flex gap-2">
                        <Button
                          onClick={handleSaveName}
                          disabled={isUpdating || !editingName.trim()}
                          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          {isUpdating ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Guardar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-base font-semibold text-foreground">
                      {userProfile.full_name || "No especificado"}
                    </p>
                  )}
                </div>

                {/* Email (no editable) */}
                <div className="p-4 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Correo Electrónico
                  </p>
                  <p className="text-base font-semibold text-foreground break-all">
                    {userProfile.email || "No especificado"}
                  </p>
                </div>

                {/* Perfil (no editable) */}
                <div className="p-4 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Perfil de Usuario
                  </p>
                  <p className="text-base font-semibold text-foreground">
                    {userProfile.profile_name || "No asignado"}
                  </p>
                </div>

                {/* Cambiar contraseña */}
                <div className="flex items-start justify-between p-4 bg-muted/50 hover:bg-muted/80 transition-colors rounded-lg">
                  <div className="flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenPasswordModal}
                      disabled={checkingPasswordPermissions}
                      className="h-8 px-3 flex items-center gap-2 text-amber-500 hover:text-amber-600 hover:bg-amber-500/5"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      {checkingPasswordPermissions
                        ? "Verificando..."
                        : "Cambiar Contraseña"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Activity Timeline Card */}
            <Card className="p-6 border-2 shadow-md">
              <h2 className="text-xl font-bold text-foreground mb-8 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-500" />
                Actividad de la Cuenta
              </h2>

              <div className="space-y-6">
                {/* Creation Event */}
                <div className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="w-0.5 h-full bg-border mt-2" />
                  </div>
                  <div className="pb-6 flex-1">
                    <p className="font-semibold text-foreground mb-1">
                      Cuenta Creada
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(userProfile.created_at).toLocaleDateString(
                        "es-ES",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(userProfile.created_at).toLocaleTimeString(
                        "es-ES",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>

                {/* Last Update Event */}
                <div className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 border-2 border-blue-500 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">
                      Última Actualización
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {userProfile.updated_at
                        ? new Date(userProfile.updated_at).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "--:--"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {userProfile.updated_at
                        ? new Date(userProfile.updated_at).toLocaleTimeString(
                            "es-ES",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "--:--"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <FooterSection />
    </>
  );
}