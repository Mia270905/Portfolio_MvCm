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
    professional?: {
      name?: string;
      email?: string;
    } | null;
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
  isTempData = false
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

  // Determinar fuente de datos y mostrar mensaje
  useEffect(() => {
    if (isTempData && initialData.full_name) {
      setDataSource("temporal");
      toast.info("Se han recuperado los datos de tu reserva temporal", {
        style: {
          backgroundColor: '#e8f4fd', 
          border: '1px solid #bbdefb',
          color: '#1565c0',
        },
      });
    } else if (user && initialData.full_name) {
      setDataSource("usuario");
    } else {
      setDataSource("nuevo");
    }
  }, [isTempData, user, initialData]);

  // Pre-cargar datos del usuario SOLO si no hay datos temporales
  useEffect(() => {
    if (user && !isTempData && !initialData.full_name) {
      console.log("Cargando datos del usuario en info-step");
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
        full_name: user.user_metadata?.full_name || prev.full_name,
      }));
    }
  }, [user, isTempData, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo
    if (errors[name as keyof ClientInfo]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ClientInfo> = {};

    // Validar nombre completo
    if (!formData.full_name.trim()) {
      newErrors.full_name = "El nombre completo es obligatorio";
    } else if (formData.full_name.trim().length < 3) {
      newErrors.full_name = "El nombre debe tener al menos 3 caracteres";
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Ingresa un correo electrónico válido";
    }

    // Validar teléfono
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = "El número de teléfono es obligatorio";
    } else if (phoneDigits.length !== 10) {
      newErrors.phone = "El teléfono debe tener 10 dígitos";
    }

    // Validar notas (máximo 500 caracteres)
    if (formData.notes && formData.notes.trim().length > 500) {
      newErrors.notes = "Las notas no deben exceder los 500 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    setLoading(true);
    
    // Simular procesamiento
    setTimeout(() => {
      onContinue(formData);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="bg-white rounded-xl border border-[#f5efe6] p-6 shadow-sm">
      {/* Título */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-serif font-semibold text-neutral-900">
            Tus datos de contacto
          </h2>
          {dataSource === "temporal" && (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#e8f4fd] border border-[#bbdefb] rounded-full">
              <Info className="w-3 h-3 text-[#1565c0]" />
              <span className="text-xs text-[#1565c0]">Datos temporales recuperados</span>
            </div>
          )}
        </div>
        <p className="text-neutral-600">
          Completa tus datos para confirmar la reserva
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre completo */}
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-neutral-900 flex items-center gap-2">
            <User className="w-4 h-4 text-[#c6a365]" />
            Nombre completo *
          </Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Ej: Juan Pérez Rodríguez"
            className={`bg-white border-[#f5efe6] text-neutral-900 ${
              errors.full_name ? 'border-[#c62828] focus:border-[#c62828]' : 'focus:border-[#c6a365]'
            }`}
          />
          {errors.full_name && (
            <p className="text-sm text-[#c62828]">{errors.full_name}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-neutral-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#c6a365]" />
            Correo electrónico *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Ej: juan@correo.com"
            className={`bg-white border-[#f5efe6] text-neutral-900 ${
              errors.email ? 'border-[#c62828] focus:border-[#c62828]' : 'focus:border-[#c6a365]'
            }`}
          />
          {errors.email && (
            <p className="text-sm text-[#c62828]">{errors.email}</p>
          )}
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-neutral-900 flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#c6a365]" />
            Número de teléfono *
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="Ej: 555-123-4567"
            className={`bg-white border-[#f5efe6] text-neutral-900 ${
              errors.phone ? 'border-[#c62828] focus:border-[#c62828]' : 'focus:border-[#c6a365]'
            }`}
          />
          {errors.phone && (
            <p className="text-sm text-[#c62828]">{errors.phone}</p>
          )}
          <p className="text-xs text-neutral-600">
            Formato: 10 dígitos (XXX-XXX-XXXX)
          </p>
        </div>

        {/* Notas adicionales */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-neutral-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#c6a365]" />
            Notas adicionales (opcional)
          </Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes || ""}
            onChange={handleChange}
            placeholder="¿Alguna información adicional que debamos conocer?"
            className={`min-h-[100px] bg-white border-[#f5efe6] text-neutral-900 resize-none ${
              errors.notes ? 'border-[#c62828] focus:border-[#c62828]' : 'focus:border-[#c6a365]'
            }`}
          />
          {errors.notes && (
            <p className="text-sm text-[#c62828]">{errors.notes}</p>
          )}
          <div className="flex justify-between text-xs text-neutral-600">
            <span>Máximo 500 caracteres</span>
            <span>{formData.notes?.length || 0}/500</span>
          </div>
        </div>

        {/* Información importante */}
        <div className="bg-[#f5efe6] border border-[#e6dcc9] rounded-lg p-4">
          <p className="text-sm text-[#c6a365]">
            <strong>Importante:</strong> Las notas adicionales son opcionales pero pueden ayudar al profesional a brindarte un mejor servicio.
          </p>
        </div>

        {/* Botones de navegación */}
        <div className="flex gap-3 pt-4 border-t border-[#f5efe6]">
          <Button
            type="button"
            onClick={onBack}
            variant="outline"
            className="flex-1 border-[#e6dcc9] text-neutral-700 hover:bg-[#f5efe6] hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#c6a365] hover:bg-[#b59555] text-white"
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