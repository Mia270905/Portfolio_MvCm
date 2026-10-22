'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getPlatformById, updatePlatform } from '@/lib/actions/platform.actions';
import { PlatformForm } from '@/components/dashboard/platforms/platform-form';
import { PlatformSkeleton } from '@/components/dashboard/platforms/platform-skeleton';

interface FormData {
  code: string;
  name: string;
  description: string;
  domain: string;
  contact_id: string | null,
  is_write_protected: boolean; // Permitir null
}

export default function EditPlatformPage() {
  const router = useRouter();
  const { id: idParams } = useParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    description: '',
    domain: '',
    contact_id: null,
    is_write_protected: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loadedStatus, setLoadedStatus] = useState('loading');

  useEffect(() => {
    if (!idParams) {
      setLoadedStatus('failed');
      return;
    }
    
    const loadSelectedPlatform = async () => {
      try {
        const id = Array.isArray(idParams) ? idParams[0] : idParams;
        const platform = await getPlatformById(id);
        
        if (!platform) throw new Error('No se encontró la plataforma'); 
        
        setFormData({
          code: platform.code || '',
          name: platform.name || '',
          description: platform.description || '',
          domain: platform.domain || '',
          contact_id: platform.contact_id || null,
          is_write_protected: platform.is_write_protected || false,
        });
        setLoadedStatus('loaded');
      } catch (error) {
        console.error('Error loading platform:', error);
        toast.error("No se pudo cargar la plataforma, recargue la página o intentelo más tarde.");
        setLoadedStatus('failed');
      } 
    }
    
    loadSelectedPlatform();
  }, [idParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { [key: string]: string } = {};

    if (!formData.code?.trim()) {
      newErrors.code = "El código es requerido";
    } else if (formData.code.length < 2) {
      newErrors.code = "El código debe tener al menos 2 caracteres";
    } else if (!/^[a-z0-9-]+$/.test(formData.code)) {
      newErrors.code = "El código solo puede contener letras minúsculas, números y guiones";
    }

    if (!formData.name?.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!formData.domain?.trim()) {
      newErrors.domain = "El dominio es requerido";
    } else {
      // Validación más flexible de dominio
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-.]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      const cleanDomain = formData.domain.replace(/^https?:\/\//, '');
      if (!domainRegex.test(cleanDomain)) {
        newErrors.domain = "El formato del dominio no es válido";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (!idParams) {
        console.error('No hay ID de plataforma');
        return;
      }
      
      const id = Array.isArray(idParams) ? idParams[0] : idParams;
      
      const result = await updatePlatform(id, {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        domain: formData.domain,
        contact_id: formData.contact_id,
      });
      
      if (result.success) {
        toast.success('¡Plataforma actualizada con éxito!');
        setTimeout(() => router.push('/dashboard/platforms-parent/platforms'), 1500);
      } else {
        toast.error(result.message || 'Error al actualizar la plataforma');
      }
    } catch (error) {
      console.error('Error updating platform:', error);
      toast.error('Error inesperado al actualizar la plataforma');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Convertir código a minúsculas y solo permitir letras minúsculas, números y guiones
    if (name === 'code') {
      processedValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#04060B]">
      <div className="mb-6 bg-[#04060B] py-4">
        <button 
          onClick={() => router.push('/dashboard/platforms-parent/platforms')}
          className="inline-flex items-center text-gray-400 hover:text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver a Plataformas
        </button>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Actualizar Plataforma</h1>
          <p className="text-gray-400 mt-2">
            Modifica la información de la plataforma según sea necesario.
          </p>
        </div>
        
        {loadedStatus === 'loading' ? (
          <PlatformSkeleton />
        ) : loadedStatus === 'failed' ? (
          <div className="text-center py-12">
            <p className="text-gray-200">No se encontró la plataforma específicada.</p>
            <button
              onClick={() => router.push('/dashboard/platforms-parent/platforms')}
              className="mt-4 inline-flex items-center text-yellow-400 hover:text-yellow-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Plataformas
            </button>
          </div>
        ) : (
          <PlatformForm
            platform={formData}
            handleSubmit={handleSubmit}
            formData={formData}
            handleChange={handleChange}
            errors={errors}
            loading={loading}
            isEditing={true}
            buttonText="Actualizar Plataforma"
            buttonLoadingText="Actualizando..."
          />
        )}
      </div>
    </div>
  )
}