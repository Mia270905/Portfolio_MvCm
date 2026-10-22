'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Info } from 'lucide-react';
import { createModule, getParentModules } from '@/lib/actions/module.actions';
import { type Module, type NewModulePayload } from '@/lib/definitions';
import { toast } from 'sonner';
import ModuleForm from '@/components/dashboard/modulos/module-form';

export default function CreateModulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [parentModules, setParentModules] = useState<Pick<Module, 'id' | 'name' | 'icon' | 'path' >[]>([]);
  const [formData, setFormData] = useState<NewModulePayload>({
    code: '',
    name: '',
    path: '',
    description: '',
    icon: '',
    parent_module_id: 'null',
    active: true
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadParentModules = async () => {
      try {
        const modules = await getParentModules();
        setParentModules(modules);
      } catch (error) {
        toast.error("No se pudieron cargar los módulos padre.")
      }
    };
    loadParentModules();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { [key: string]: string } = {};
    if (!formData.code.trim()) newErrors.code = "El código es requerido.";
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido.";
    if (!formData.path.trim()) newErrors.path = "La ruta es requerida.";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const dataToSubmit: NewModulePayload = {
      ...formData,
      parent_module_id: formData.parent_module_id === 'null' ? null : formData.parent_module_id,
      description: formData.description || null,
      icon: formData.icon || null,
      path: fullPath
    };

    try {
      const result = await createModule(dataToSubmit);
      
      if (result.success) {
        toast.success('¡Módulo creado con éxito!');
        setTimeout(() => router.push('/dashboard/seguridad/modulos'), 1500);
      } else {
        setErrors({ [result.field]: result.message });
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error inesperado al crear el módulo');
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

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, parent_module_id: value }))
  }

  const handleToggleActive = () => {
    setFormData(prev => ({ ...prev, active: !prev.active }))
  }

  const parentModule = parentModules.find(m => m.id === formData.parent_module_id);;
  const fullPath = formData.path && parentModule
    ? `${parentModule.path}${formData.path}`
    : `${formData.path}`;

  return (
    <div >
      <div className="mb-6 p-4">
        <a
          href="/dashboard/seguridad"
          className="inline-flex items-center text-yellow-800 hover:text-yellow-600 p-2 hover:bg-yellow-100 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-yellow-900">Crear Módulo</h1>
        </div>
        <ModuleForm
          handleSubmit={handleSubmit}
          formData={formData}
          hasChildren={false}
          handleChange={handleChange}
          errors={errors}
          handleSelectChange={handleSelectChange}
          parentModules={parentModules}
          handleToggleActive={handleToggleActive}
          buttonText='Guardar'
          buttonLoadingText='Guardando...'
          loading={loading}
        />
      </div>
    </div>
  )
}