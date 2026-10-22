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
      toast.info("Se han recuperado los datos de tu reserva temporal");
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
    <div className="bg-custom-bg-tertiary rounded-xl border border-custom-border-secondary p-6">
      {/* Título */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-custom-text-primary">
            Tus datos de contacto
          </h2>
          {dataSource === "temporal" && (
            <div className="flex items-center gap-2 px-3 py-1 bg-info-bg border border-info-bg/30 rounded-full">
              <Info className="w-3 h-3 text-info-text" />
              <span className="text-xs text-info-text">Datos temporales recuperados</span>
            </div>
          )}
        </div>
        <p className="text-custom-text-secondary">
          Completa tus datos para confirmar la reserva
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre completo */}
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-custom-text-secondary flex items-center gap-2">
            <User className="w-4 h-4 text-custom-accent-primary" />
            Nombre completo *
          </Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Ej: Juan Pérez Rodríguez"
            className={`bg-custom-bg-secondary border-custom-border-primary text-custom-text-primary ${
              errors.full_name ? 'border-destructive focus:border-destructive' : 'focus:border-custom-accent-primary'
            }`}
          />
          {errors.full_name && (
            <p className="text-sm text-destructive">{errors.full_name}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-custom-text-secondary flex items-center gap-2">
            <Mail className="w-4 h-4 text-custom-text-muted" />
            Correo electrónico *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Ej: juan@correo.com"
            className={`bg-custom-bg-secondary border-custom-border-primary text-custom-text-primary ${
              errors.email ? 'border-destructive focus:border-destructive' : 'focus:border-custom-accent-primary'
            }`}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-custom-text-secondary flex items-center gap-2">
            <Phone className="w-4 h-4 text-custom-accent-primary" />
            Número de teléfono *
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="Ej: 555-123-4567"
            className={`bg-custom-bg-secondary border-custom-border-primary text-custom-text-primary ${
              errors.phone ? 'border-destructive focus:border-destructive' : 'focus:border-custom-accent-primary'
            }`}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone}</p>
          )}
          <p className="text-xs text-custom-text-muted">
            Formato: 10 dígitos (XXX-XXX-XXXX)
          </p>
        </div>

        {/* Notas adicionales */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-custom-text-secondary flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-custom-text-muted" />
            Notas adicionales (opcional)
          </Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes || ""}
            onChange={handleChange}
            placeholder="Comparte cualquier información relevante para tu atención (opcional)"
            className={`min-h-[100px] bg-custom-bg-secondary border-custom-border-primary text-custom-text-primary resize-none ${
              errors.notes ? 'border-destructive focus:border-destructive' : 'focus:border-custom-accent-primary'
            }`}
          />
          {errors.notes && (
            <p className="text-sm text-destructive">{errors.notes}</p>
          )}
          <div className="flex justify-between text-xs text-custom-text-muted">
            <span>Máximo 500 caracteres</span>
            <span>{formData.notes?.length || 0}/500</span>
          </div>
        </div>

        {/* Información importante */}
        <div className="bg-custom-accent-primary/10 border border-custom-accent-primary/20 rounded-lg p-4">
          <p className="text-sm text-custom-accent-primary">
            <strong>Importante:</strong> Las notas adicionales son opcionales pero pueden ayudar al profesional a brindarte un mejor servicio.
          </p>
        </div>

        {/* Botones de navegación */}
        <div className="flex gap-3 pt-4 border-t border-custom-border-secondary">
          <Button
            type="button"
            onClick={onBack}
            variant="outline"
            className="flex-1 border-custom-border-primary text-custom-text-secondary hover:bg-custom-bg-secondary hover:text-custom-text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-custom-accent-primary to-custom-accent-secondary hover:from-custom-accent-secondary hover:to-custom-accent-primary text-white"
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