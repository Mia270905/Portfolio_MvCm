'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getModulesHierarchy } from '@/lib/actions/module.actions';
import { getOnePermission, updatePermission } from '@/lib/actions/permission.actions';
import { type ModuleWithChildren, type NewPermissionPayload } from '@/lib/definitions';
import { toast } from 'sonner';

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
  const [loadedStatus, setLoadedStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');

  useEffect(() => {
    if (!idParams) {
      setLoadedStatus('failed');
      return;
    }

    const loadModules = async () => {
      try {
        const activeModules = await getModulesHierarchy();
        setModules(activeModules);
      } catch {
        toast.error("No se pudieron cargar los módulos.");
        setLoadedStatus('failed');
      }
    };

    const loadSelectedPermission = async () => {
      try {
        const id = Array.isArray(idParams) ? idParams[0] : idParams;
        const permission = await getOnePermission(id);
        if (!permission.id) throw new Error('No se encontró el permiso');
        const code_prefix = permission.code.split(':')[0];
        setFormData({
          ...permission,
          code_prefix
        });
        setLoadedStatus('loaded');
      } catch {
        toast.error("No se pudo cargar el permiso, recargue la página o intentelo más tarde.");
        setLoadedStatus('failed');
      }
    };

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
      if (!idParams) return;
      const id = Array.isArray(idParams) ? idParams[0] : idParams;
      const result = await updatePermission(id, formData);
      
      if (result.success) {
        toast.success('¡Permiso actualizado con éxito!');
        setTimeout(() => router.push('/dashboard/seguridad/permisos'), 1500);
      } else {
        setErrors({ [String(result.field)]: result.message });
        toast.error(result.message);
        setLoading(false);
      }
    } catch {
      toast.error('Error inesperado al actualizar el permiso');
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

  const handleModuleChange = (value: string) => {
    setFormData(prev => ({ ...prev, module_id: value }));
    if (errors.module_id) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.module_id;
        return newErrors;
      });
    }
  };

  const handleToggleActive = () => {
    setFormData(prev => ({ ...prev, active: !prev.active }));
  };

  return (
    <div className="min-h-screen">
      {/* Botón de regresar */}
      <div className="mb-6 p-4 lg:p-6">
        <button
          onClick={() => router.push("/dashboard/seguridad/permisos")}
          className="inline-flex items-center text-neutral-600 hover:text-[#c6a365] p-2 hover:bg-[#f5efe6] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </button>
      </div>

      {/* Contenedor principal */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Editar Permiso</h1>
          <p className="text-neutral-600 mt-2">
            Modifica los datos del permiso
          </p>
        </div>

        {/* Estado de carga */}
        {loadedStatus === 'loading' && (
          <div className="bg-white rounded-lg border border-[#f5efe6] p-6 shadow-sm">
            <div className="animate-pulse space-y-6">
              <div className="h-20 bg-[#f5efe6] rounded"></div>
              <div className="h-12 bg-[#f5efe6] rounded"></div>
              <div className="h-12 bg-[#f5efe6] rounded"></div>
              <div className="h-24 bg-[#f5efe6] rounded"></div>
            </div>
          </div>
        )}

        {loadedStatus === 'failed' && (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl border border-[#f5efe6] p-8 max-w-md mx-auto shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#fdeaea] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#c62828]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                {!idParams ? 'ID no proporcionado' : 'Error al cargar datos'}
              </h3>
              <p className="text-neutral-600 mb-6">
                {!idParams 
                  ? 'No se proporcionó un ID válido para el permiso.'
                  : 'No se pudieron cargar los datos del permiso.'}
              </p>
              <button
                onClick={() => router.push('/dashboard/seguridad/permisos')}
                className="inline-flex items-center text-[#c6a365] hover:text-[#b59555]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Permisos
              </button>
            </div>
          </div>
        )}

        {/* Formulario */}
        {loadedStatus === 'loaded' && (
          <div className="bg-white rounded-lg border border-[#f5efe6] p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Módulo */}
              <div>
                <label className="block font-medium text-neutral-900 mb-2">
                  Módulo <span className="text-[#c62828]">*</span>
                </label>
                <select
                  value={formData.module_id}
                  onChange={(e) => handleModuleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 transition-all duration-200"
                >
                  <option value="">Seleccione un módulo</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id} className="text-neutral-900">{m.name}</option>
                  ))}
                </select>
                {errors.module_id && <p className="text-[#c62828] text-sm mt-1">{errors.module_id}</p>}
              </div>

              {/* Código */}
              <div>
                <label className="block font-medium text-neutral-900 mb-2">
                  Código del permiso <span className="text-[#c62828]">*</span>
                </label>
                <input
                  type="text"
                  name="code_prefix"
                  value={formData.code_prefix}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 placeholder-neutral-500 transition-all duration-200"
                  placeholder="Ej: create, read, update, delete"
                />
                {errors.code_prefix && <p className="text-[#c62828] text-sm mt-1">{errors.code_prefix}</p>}
              </div>

              {/* Nombre */}
              <div>
                <label className="block font-medium text-neutral-900 mb-2">
                  Nombre <span className="text-[#c62828]">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 placeholder-neutral-500 transition-all duration-200"
                  placeholder="Ej: Crear usuario"
                />
                {errors.name && <p className="text-[#c62828] text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Descripción */}
              <div>
                <label className="block font-medium text-neutral-900 mb-2">Descripción</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 placeholder-neutral-500 transition-all duration-200"
                  placeholder="Describe la funcionalidad de este permiso"
                />
              </div>

              {/* Activo / Inactivo */}
              <div>
                <label className="block font-medium text-neutral-900 mb-3">Estado</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleActive}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c6a365] ${
                      formData.active ? 'bg-green-500' : 'bg-red-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 ${
                        formData.active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      formData.active
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}
                  >
                    {formData.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[#f5efe6]">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/seguridad/permisos')}
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-white hover:bg-[#f5efe6] text-neutral-700 font-medium rounded-lg border border-[#CFC7B8] hover:border-[#c6a365] transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-[#a78447] to-[#c6a365] hover:from-[#b59555] hover:to-[#d4b24c] text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? 'Actualizando...' : 'Actualizar Permiso'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}