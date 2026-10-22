"use client";

import { useState } from "react";
import { X, LogIn, UserPlus, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type?: "login" | "register"; // 'login' o 'register'
  professionalCode?: string;
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  type = "login",
  professionalCode 
}: AuthModalProps) {
  const [authType, setAuthType] = useState<"login" | "register">(type);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (authType === "register") {
        // Validaciones para registro
        if (password !== confirmPassword) {
          throw new Error("Las contraseñas no coinciden");
        }
        if (password.length < 6) {
          throw new Error("La contraseña debe tener al menos 6 caracteres");
        }

        // Registrar usuario
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        
        if (authError) throw authError;

        // Iniciar sesión automáticamente
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) throw signInError;

        toast.success("¡Cuenta creada exitosamente!");
      } else {
        // Login
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (loginError) throw loginError;
        
        toast.success("¡Sesión iniciada exitosamente!");
      }

      // Cerrar modal y notificar éxito
      onSuccess();
      onClose();
      
    } catch (error: any) {
      setError(error.message || "Error en la autenticación");
      console.error("Error de autenticación:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const translateError = (errorMessage: string): string => {
    const translations: { [key: string]: string } = {
      "Invalid login credentials": "Credenciales inválidas",
      "Email not confirmed": "Correo electrónico no confirmado",
      "User already registered": "El usuario ya está registrado",
      "Invalid email": "Correo electrónico inválido",
      "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres",
      "Too many requests": "Demasiados intentos. Por favor, espere un momento.",
      "Usuario desactivado": "Su cuenta se encuentra inactiva",
    };
    return translations[errorMessage] || errorMessage;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative p-6 border-b border-gray-800">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                {authType === "login" ? (
                  <LogIn className="w-5 h-5 text-white" />
                ) : (
                  <UserPlus className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {authType === "login" ? "Iniciar sesión" : "Crear cuenta"}
                </h2>
                <p className="text-sm text-gray-400">
                  {authType === "login" 
                    ? "Ingresa tus credenciales" 
                    : "Completa el formulario para registrarte"}
                </p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {authType === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-300">
                    Nombre completo
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Tu nombre completo"
                    required={authType === "register"}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white pl-10"
                    placeholder="tucorreo@ejemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white pl-10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {authType === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300">
                    Confirmar contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white pl-10"
                      placeholder="••••••••"
                      required={authType === "register"}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{translateError(error)}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                {isLoading ? "Procesando..." : 
                  authType === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthType(authType === "login" ? "register" : "login")}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {authType === "login" 
                    ? "¿No tienes cuenta? Regístrate aquí" 
                    : "¿Ya tienes cuenta? Inicia sesión aquí"}
                </button>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="p-4 bg-gray-800/50 border-t border-gray-800">
            <p className="text-xs text-gray-400 text-center">
              Al {authType === "login" ? "iniciar sesión" : "registrarte"}, aceptas nuestros términos y condiciones
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}