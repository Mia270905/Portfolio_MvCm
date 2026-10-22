'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { NewProfilePayload } from '@/lib/definitions';
import { toast } from 'sonner';
import { createProfile } from '@/lib/actions/profile.actions';
import { getUserWithPermissions } from '@/lib/actions/user.actions';
import ProfileForm from '@/components/dashboard/perfiles/profile-form';

export default function CreateProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [formData, setFormData] = useState<NewProfilePayload>({
    code: '',
    name: '',
    hierarchy: 0,
    active: true,
    is_write_protected: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        setLoadingPermissions(true);
        const user = await getUserWithPermissions();
        const perms = Array.isArray(user?.permissions)
          ? user.permissions.map((p: any) => p.code)
          : [];

        setUserPermissions(perms);
        setCanCreate(perms.includes('create:profiles'));
      } catch (error) {
        console.error('Error al obtener permisos del usuario', error);
        setCanCreate(false);
      } finally {
        setLoadingPermissions(false);
      }
    };

    fetchUserPermissions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!formData.code.trim()) newErrors.code = "El código es requerido.";
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const result = await createProfile(formData);

      if (result.success) {
        toast.success('¡Perfil creado con éxito!');
        setTimeout(() => router.push('/dashboard/seguridad/perfiles'), 1500);
      } else {
        setErrors({ [result.field]: result.message });
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error inesperado al crear el perfil');
    } finally {
      setLoading(false);
    }
  };

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
  };

  const handleToggleActive = () => {
    setFormData(prev => ({ ...prev, active: !prev.active }));
  };

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
          <h1 className="text-3xl font-bold text-yellow-800">Crear Perfil</h1>
        </div>

        {loadingPermissions ? (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-300 rounded-sm w-3/4"></div>
            <div className="h-6 bg-gray-300 rounded-sm w-full"></div>
            <div className="h-6 bg-gray-300 rounded-sm w-full"></div>
            <div className="h-10 bg-gray-300 rounded-sm w-32"></div>
          </div>
        ) : canCreate ? (
          <ProfileForm
            handleSubmit={handleSubmit}
            formData={formData}
            handleChange={handleChange}
            errors={errors}
            handleToggleActive={handleToggleActive}
            buttonText='Guardar'
            buttonLoadingText='Guardando...'
            loading={loading}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-red-600">
            No tienes permisos para crear perfiles.
          </div>
        )}
      </div>
    </div>
  );
}