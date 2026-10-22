"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getOneModule,
  getParentModules,
  updateModule,
} from "@/lib/actions/module.actions";
import { type Module, type NewModulePayload } from "@/lib/definitions";
import { toast } from "sonner";
import { ModuleFormSkeleton } from "@/components/dashboard/modulos/module-form-skeleton";
import ModuleForm from "@/components/dashboard/modulos/module-form";

export default function EditModulePage() {
  const router = useRouter();
  const { id: idParams } = useParams();
  const [loading, setLoading] = useState(false);
  const [parentModules, setParentModules] = useState<
    Pick<Module, "id" | "name" | "icon" | "path">[]
  >([]);
  const [formData, setFormData] = useState<NewModulePayload>({
    code: "",
    name: "",
    path: "",
    description: "",
    icon: "",
    parent_module_id: "null",
    active: true,
  });
  const [hasChildren, setHasChildren] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loadedStatus, setLoadedStatus] = useState("loading");
  const [fullPath, setFullPath] = useState("");

  useEffect(() => {
    if (!idParams) {
      setLoadedStatus("failed");
      return;
    }

    const loadData = async () => {
      try {
        const id = Array.isArray(idParams) ? idParams[0] : idParams;

        const module = await getOneModule(id);
        if (!module.id) throw new Error("No se encontró el módulo");

        let { children, ...moduleData } = module;
        const pathParts = moduleData.path.split("/");
        moduleData = {
          ...moduleData,
          path: pathParts.length > 2 ? `/${pathParts[2]}` : moduleData.path,
        };

        setFormData(moduleData);
        setHasChildren(
          children && Array.isArray(children) && children.length > 0
        );

        const modules = await getParentModules(
          moduleData.parent_module_id || undefined
        );
        const filteredModules = modules.filter((m) => m.id !== id);
        setParentModules(filteredModules);

        setLoadedStatus("loaded");
      } catch (error) {
        console.error(error);
        toast.error(
          "No se pudo cargar el módulo, recargue la página o intentelo más tarde."
        );
        setLoadedStatus("failed");
      }
    };

    loadData();
  }, [idParams]);

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
      parent_module_id:
        formData.parent_module_id === "null" ? null : formData.parent_module_id,
      description: formData.description || null,
      icon: formData.icon || null,
      path: fullPath,
    };

    try {
      if (!idParams) return;
      const id = Array.isArray(idParams) ? idParams[0] : idParams;
      const result = await updateModule(id, dataToSubmit);

      if (result.success) {
        toast.success("¡Módulo actualizado con éxito!");
        setTimeout(() => {
          router.push("/dashboard/seguridad/modulos");
        }, 1500);
      } else {
        setErrors({ [result.field]: result.message });
        toast.error(result.message);
        setLoading(false);
      }
    } catch (error) {
      toast.error("Error inesperado al actualizar el módulo");
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, parent_module_id: value }));
  };

  const handleToggleActive = () => {
    setFormData((prev) => ({ ...prev, active: !prev.active }));
  };

  return (
    <div className="min-h-screen bg-custom-bg-primary">
      {/* Header con botón volver */}
     <div className="mb-6 p-4">
        <a
          href="/dashboard/seguridad/modulos"
          className="inline-flex items-center text-yellow-800 hover:text-yellow-600 p-2 hover:bg-yellow-100 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-yellow-800">Editar Módulo</h1>
        </div>

        {/* Estados de carga */}
        {loadedStatus === "loading" ? (
          <ModuleFormSkeleton />
        ) : loadedStatus === "failed" ? (
          <div className="text-center py-12">
            <p className="text-custom-text-tertiary">
              No se encontró el módulo específicado.
            </p>
          </div>
        ) : (
          <ModuleForm
            handleSubmit={handleSubmit}
            formData={formData}
            hasChildren={hasChildren}
            handleChange={handleChange}
            errors={errors}
            handleSelectChange={handleSelectChange}
            parentModules={parentModules}
            handleToggleActive={handleToggleActive}
            buttonText="Actualizar"
            buttonLoadingText="Actualizando..."
            loading={loading}
            onPathChange={setFullPath}
          />
        )}
      </div>
    </div>
  );
}