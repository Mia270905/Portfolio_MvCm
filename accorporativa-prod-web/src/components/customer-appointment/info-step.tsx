"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, MessageSquare, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ClientInfo {
  full_name: string;
  email: string;
  phone: string;
  notes?: string;
}

interface InfoStepProps {
  user: any;
  appointmentDetails: {
    slotId: string;
    dateTime: Date;
    professional?: { name?: string; email?: string } | null;
  } | null;
  onBack: () => void;
  onContinue: (clientInfo: ClientInfo) => void;
  initialData?: Partial<ClientInfo>;
  isTempData?: boolean;
}

export default function InfoStep({
  user,
  appointmentDetails,
  onBack,
  onContinue,
  initialData = {},
  isTempData = false,
}: InfoStepProps) {
  const [formData, setFormData] = useState<ClientInfo>({
    full_name: initialData.full_name || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    notes: initialData.notes || "",
  });
  const [errors, setErrors] = useState<Partial<ClientInfo>>({});
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<string>("");

  // Determinar la fuente de los datos y mostrar mensaje si son temporales
  useEffect(() => {
    if (isTempData && initialData.full_name) {
      setDataSource("temporal");
      toast.info("Se han recuperado los datos de tu reserva temporal");
    } else if (user && initialData.full_name) {
      setDataSource("usuario");
    } else {
      setDataSource("nuevo");
    }
  }, [isTempData, user, initialData]);

  // Pre-cargar datos del usuario si no hay datos temporales
  useEffect(() => {
    if (user && !isTempData && !initialData.full_name) {
      setFormData((prev) => ({
        ...prev,
        full_name: user.user_metadata?.full_name || prev.full_name,
        email: user.email || prev.email,
      }));
    }
  }, [user, isTempData, initialData]);

  // Manejo de cambios en inputs y textarea
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof ClientInfo]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Formatear teléfono automáticamente
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData((prev) => ({ ...prev, phone: formatted }));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
  };

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: Partial<ClientInfo> = {};

    if (!formData.full_name.trim()) newErrors.full_name = "El nombre completo es obligatorio";
    else if (formData.full_name.trim().length < 3)
      newErrors.full_name = "El nombre debe tener al menos 3 caracteres";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = "El correo electrónico es obligatorio";
    else if (!emailRegex.test(formData.email)) newErrors.email = "Ingresa un correo electrónico válido";

    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim()) newErrors.phone = "El número de teléfono es obligatorio";
    else if (phoneDigits.length !== 10) newErrors.phone = "El teléfono debe tener 10 dígitos";

    if (formData.notes && formData.notes.trim().length > 500)
      newErrors.notes = "Las notas no deben exceder los 500 caracteres";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejo de envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    setLoading(true);

    try {
      // 🔹 Aquí puedes agregar la lógica de:
      // 1. Verificar si existe contacto por email o phone
      // 2. Crear contacto si no existe
      // 3. Continuar con la cita
      onContinue(formData);
    } catch (err) {
      console.error("Error al crear o vincular contacto:", err);
      toast.error("No se pudo crear el contacto. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 min-w-0">
      {/* Título */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-white">Tus datos de contacto</h2>
          {dataSource === "temporal" && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
              <Info className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-400">Datos temporales recuperados</span>
            </div>
          )}
        </div>
        <p className="text-gray-400">Completa tus datos para confirmar la reserva</p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre completo */}
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-white flex items-center gap-2">
            <User className="w-4 h-4 text-amber-500" /> Nombre completo *
          </Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Ej: Juan Pérez Rodríguez"
            className={`bg-gray-800 border-gray-700 text-white ${
              errors.full_name ? "border-red-500 focus:border-red-500" : "focus:border-amber-500"
            }`}
          />
          {errors.full_name && <p className="text-sm text-red-400">{errors.full_name}</p>}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-500" /> Correo electrónico *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Ej: juan@correo.com"
            className={`bg-gray-800 border-gray-700 text-white ${
              errors.email ? "border-red-500 focus:border-red-500" : "focus:border-amber-500"
            }`}
          />
          {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-white flex items-center gap-2">
            <Phone className="w-4 h-4 text-amber-500" /> Número de teléfono *
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="Ej: 555-123-4567"
            className={`bg-gray-800 border-gray-700 text-white ${
              errors.phone ? "border-red-500 focus:border-red-500" : "focus:border-amber-500"
            }`}
          />
          {errors.phone && <p className="text-sm text-red-400">{errors.phone}</p>}
          <p className="text-xs text-gray-400">Formato: 10 dígitos (XXX-XXX-XXXX)</p>
        </div>

        {/* Notas adicionales */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-500" /> Notas adicionales (opcional)
          </Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes || ""}
            onChange={handleChange}
            placeholder="Comparte cualquier información relevante para tu atención (opcional)."
            className={`min-h-[100px] bg-gray-800 border-gray-700 text-white resize-none ${
              errors.notes ? "border-red-500 focus:border-red-500" : "focus:border-amber-500"
            }`}
          />
          {errors.notes && <p className="text-sm text-red-400">{errors.notes}</p>}
          <div className="flex justify-between text-xs text-gray-400">
            <span>Máximo 500 caracteres</span>
            <span>{formData.notes?.length || 0}/500</span>
          </div>
        </div>
        
               {/* Información importante */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
          <p className="text-sm text-amber-400">
            <strong>Importante:</strong> Las notas adicionales son opcionales pero pueden ayudar al profesional a brindarte un mejor servicio.
          </p>
        </div>
        {/* Botones */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <Button
            type="button"
            onClick={onBack}
            variant="outline"
            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Procesando...
              </>
            ) : (
              "Continuar"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
