'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { NewProfilePayload } from '@/lib/definitions';
import { toast } from 'sonner';
import { getOneProfile, updateProfile } from '@/lib/actions/profile.actions';
import ProfileForm from '@/components/dashboard/perfiles/profile-form';
import { ProfileFormSkeleton } from '@/components/dashboard/perfiles/profile-skeleton';
import { fetchUserProfile } from "@/lib/actions/user.actions";

export default function EditProfilePage() {
  const router = useRouter();
  const { id: idParams } = useParams();
  const [loading, setLoading] = useState(false);
  const [actualHierarchy, setActualHierarchy] = useState(0)
  const [userProfileId, setUserProfileId] = useState("")
  const [formData, setFormData] = useState<NewProfilePayload>({
    code: '',
    name: '',
    hierarchy: 0,
    active: true,
    is_write_protected: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loadedStatus, setLoadedStatus] = useState('loading');

  useEffect(() => {
    if (!idParams) {
      setLoadedStatus('failed');
      return;
    }
    const loadSelectedProfile = async () => {
      try {
        const id = Array.isArray(idParams) ? idParams[0] : idParams;
        const profile = await getOneProfile(id);

        if (!profile.id) throw new Error('No se encontró el perfil');

        const user = await fetchUserProfile();
        setUserProfileId(user.profile?.profile_id??'')
        setActualHierarchy(profile.hierarchy)
        setFormData(profile);
        setLoadedStatus('loaded');
      } catch (error) {
        toast.error("No se pudo cargar el perfil, recargue la página o intentelo más tarde.");
        setLoadedStatus('failed');
      }
    }
    loadSelectedProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const id = Array.isArray(idParams) ? idParams[0] : idParams;
    const newErrors: { [key: string]: string } = {};
    if (!formData.code.trim()) newErrors.code = "El código es requerido.";
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido.";
    if (formData.hierarchy < actualHierarchy && id == userProfileId) newErrors.hierarchy = "Un usuario no puede incrementar la jerarquía de su propio perfil";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (!idParams) return;
      const id = Array.isArray(idParams) ? idParams[0] : idParams;
      const result = await updateProfile(id, formData);

      if (result.success) {
        toast.success('¡Perfil actualizado con éxito!');
        setTimeout(() => router.push('/dashboard/seguridad/perfiles'), 1500);
      } else {
        setErrors({ [result.field]: result.message });
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error inesperado al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }

  const handleToggleActive = () => {
    setFormData(prev => ({ ...prev, active: !prev.active }))
  }

  return (
    <div className="bg-custom-bg-primary">
      <div className="mb-6 p-4">
        <a
          href="/dashboard/seguridad/perfiles"
          className="inline-flex items-center text-yellow-800 hover:text-yellow-600 p-2 hover:bg-yellow-100 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Actualizar Perfil</h1>
        </div>
        {loadedStatus === 'loading'
          ?
          <ProfileFormSkeleton />
          :
          loadedStatus === 'failed'
            ?
            <div className="text-center py-12">
              <p className="text-custom-text-secondary">No se encontró el perfil específicado.</p>
            </div>
            :
            <ProfileForm
              handleSubmit={handleSubmit}
              formData={formData}
              handleChange={handleChange}
              errors={errors}
              handleToggleActive={handleToggleActive}
              buttonText='Actualizar'
              buttonLoadingText='Actualizando...'
              loading={loading}
            />
        }
      </div>
    </div>
  )
}