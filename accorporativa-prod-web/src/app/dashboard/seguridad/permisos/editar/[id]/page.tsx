'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getModulesHierarchy } from '@/lib/actions/module.actions'
import { getOnePermission, updatePermission } from '@/lib/actions/permission.actions';
import { type ModuleWithChildren, type NewPermissionPayload } from '@/lib/definitions';
import { toast } from 'sonner';
import PermissionForm from '@/components/dashboard/permisos/permission-form';

export default function UpdatePermissionPage() {
  const router = useRouter();
  const { id: idParams } = useParams();
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<ModuleWithChildren[]>([]);
  const [formData, setFormData] = useState<NewPermissionPayload>({
    code_prefix: '',
    name: '',
    description: '',
    module_id: '',
    active: true
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loadedStatus, setLoadedStatus] = useState('loading');

  useEffect(() => {
    if(!idParams){
      setLoadedStatus('failed');
      return;
    }

    const loadModules = async () => {
      try {
        const activeModules = await getModulesHierarchy();
        setModules(activeModules);
        setLoadedStatus('loaded');
      } catch (error) {
        toast.error("No se pudieron cargar los módulos.");
        setLoadedStatus('failed');
      }
    };

    const loadSelectedPermission = async () => {
      try{
        const id = Array.isArray(idParams) ? idParams[0] : idParams;
        const permission = await getOnePermission(id);
        if (!permission.id) throw new Error('No se encontró el permiso');
        const code_prefix = permission.code.split(':')[0];
        setFormData({
          ...permission,
          code_prefix
        });
        setLoadedStatus('loaded');
      } catch ( error ) {
        toast.error("No se pudo cargar el módulo, recargue la página o intentelo más tarde.");
        setLoadedStatus('failed');
      } 
    }

    loadModules();
    loadSelectedPermission();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { [key: string]: string } = {};
    if (!formData.module_id) newErrors.module_id = "Debe seleccionar un módulo.";
    if (!formData.code_prefix.trim()) newErrors.code_prefix = "El código del permiso es requerido.";
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido.";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if(!idParams) return;
      const id = Array.isArray(idParams) ? idParams[0] : idParams;
      const result = await updatePermission(id, formData);
      
      if (result.success) {
        toast.success('¡Permiso actualizado con éxito!');
        setTimeout(() => { router.push('/dashboard/seguridad/permisos'); }, 1500);
      } else {
        setErrors({ [String(result.field)]: result.message });
        toast.error(result.message);
        setLoading(false);
      }
    } catch (error) {
      toast.error('Error inesperado al actualizar el permiso');
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

  const handleModuleChange = (value: string) => {
    setFormData(prev => ({ ...prev, module_id: value }));
    if (errors.module_id) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.module_id;
        return newErrors;
      });
    }
  }

  const handleToggleActive = () => {
    setFormData(prev => ({ ...prev, active: !prev.active }))
  }

  return (
    <div>
      <div className="mb-6">
        <a 
          href="/dashboard/seguridad/permisos" 
          className="inline-flex items-center text-custom-text-primary hover:text-custom-accent-primary p-2 hover:bg-custom-accent-hover rounded-lg transition-all duration-200"
>
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-custom-text-primary">Editar Permiso</h1>
        </div>
        
        {loadedStatus === 'loading' ? (
          <div className="bg-custom-bg-secondary  rounded-lg shadow-xs border border-custom-border-primary p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-20 bg-custom-bg-tertiary rounded"></div>
              <div className="h-12 bg-custom-bg-tertiary rounded"></div>
              <div className="h-12 bg-custom-bg-tertiary rounded"></div>
              <div className="h-24 bg-custom-bg-tertiary rounded"></div>
            </div>
          </div>
        ) : loadedStatus === 'failed' ? (
          <div className="text-center py-12">
            <p className="text-custom-text-muted">No se pudieron cargar los módulos. Por favor, recargue la página.</p>
          </div>
        ) : (
          <PermissionForm
            handleSubmit={handleSubmit}
            formData={formData}
            handleChange={handleChange}
            errors={errors}
            handleModuleChange={handleModuleChange}
            modules={modules}
            handleToggleActive={handleToggleActive}
            buttonText='Actualizar'
            buttonLoadingText='Actualizando...'
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}