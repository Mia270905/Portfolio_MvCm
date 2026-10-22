"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Key,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import {
  changePassword,
  canUserChangePassword,
} from "@/lib/actions/user.actions";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [checkingProvider, setCheckingProvider] = useState(true);
  const [canChange, setCanChange] = useState(false);
  const [providerInfo, setProviderInfo] = useState<{
    canChange: boolean;
    provider?: string;
    message?: string;
  } | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    server?: string;
  }>({});

  // Verificar proveedor al abrir el modal
  useEffect(() => {
    const checkProvider = async () => {
      if (isOpen) {
        setCheckingProvider(true);
        const result = await canUserChangePassword();
        setProviderInfo(result);
        setCanChange(result.canChange);
        setCheckingProvider(false);

        if (!result.canChange && result.message) {
          toast.info(result.message, { duration: 5000 });
        }
      }
    };

    checkProvider();
  }, [isOpen]);

  const passwordsMatch = formData.newPassword === formData.confirmPassword;
  const newPasswordValid = formData.newPassword.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.currentPassword.trim()) {
      setErrors({ currentPassword: "La contraseña actual es requerida" });
      return;
    }

    if (!newPasswordValid) {
      setErrors({
        newPassword: "La contraseña debe tener al menos 6 caracteres",
      });
      return;
    }

    if (!passwordsMatch) {
      setErrors({ confirmPassword: "Las contraseñas no coinciden" });
      return;
    }

    setLoading(true);
    setErrors({});

    const { success, error } = await changePassword(
      formData.currentPassword,
      formData.newPassword,
    );

    if (success) {
      toast.success("Contraseña cambiada exitosamente");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onClose();
    } else {
      const fieldError = error?.toLowerCase().includes("incorrecta")
        ? "currentPassword"
        : "server";

      setErrors({
        [fieldError]: error || "Error al cambiar la contraseña",
        server: error,
      });

      if (fieldError === "currentPassword") {
        toast.error("Contraseña actual incorrecta");
      } else {
        toast.error(error || "Error al cambiar la contraseña");
      }
    }

    setLoading(false);
  };

  // Resetear el formulario
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});
      setCheckingProvider(false);
      setCanChange(false);
      setProviderInfo(null);
    }
  }, [isOpen]);

  // Estados de carga - CORREGIDO: Ahora incluye DialogTitle
  if (checkingProvider) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Key className="h-5 w-5" />
              Cambiar Contraseña
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-4" />
            <p className="text-muted-foreground">Verificando permisos...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Vista para usuarios que no pueden cambiar
  if (!canChange && providerInfo) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Key className="h-5 w-5" />
              Cambiar Contraseña
            </DialogTitle>
            <DialogDescription>
              Información sobre tu método de autenticación
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg border ${
                providerInfo.provider === "google"
                  ? "bg-red-50 border-red-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {providerInfo.provider === "google" ? (
                  <Globe className="h-6 w-6 text-red-500 mt-0.5" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-amber-500 mt-0.5" />
                )}
                <div>
                  <p className="text-sm text-foreground">
                    {providerInfo.message}
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={onClose} className="w-full">
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Formulario normal
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Key className="h-5 w-5" />
            Cambiar Contraseña
          </DialogTitle>
          <DialogDescription>
            Ingresa tu contraseña actual y la nueva contraseña que deseas usar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contraseña Actual */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Contraseña Actual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                placeholder="Contraseña actual"
                className={`pr-10 ${errors.currentPassword ? "border-red-500" : ""}`}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-red-500">{errors.currentPassword}</p>
            )}
          </div>

          {/* Nueva Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                placeholder="Nueva contraseña (mín. 6 caracteres)"
                className={`pr-10 ${errors.newPassword ? "border-red-500" : ""}`}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-red-500">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Confirma la nueva contraseña"
                className={`pr-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
            {!errors.confirmPassword &&
              formData.confirmPassword &&
              !passwordsMatch && (
                <p className="text-sm text-amber-600">
                  Las contraseñas no coinciden
                </p>
              )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-500/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cambiando...
                </>
              ) : (
                "Cambiar Contraseña"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
