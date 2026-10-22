"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getUserById,
  updateUser,
  getProfiles,
  getCurrentUser,
  getUserWithHierarchy,
} from "@/lib/actions/user.actions";
import { toast } from "sonner";

export default function EditUserPage() {
  const router = useRouter();
  const { id: idParams } = useParams();

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<{
    hierarchy: number; id: string; name: string 
}[]>([]);
  const [formData, setFormData] = useState<{
    full_name: string;
    email: string;
    active: boolean;
    profile_id: string | null;
  }>({
    full_name: "",
    email: "",
    active: true,
    profile_id: null,
  });

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loadedStatus, setLoadedStatus] = useState<
    "loading" | "loaded" | "failed"
  >("loading");

  useEffect(() => {
    if (!idParams) {
      setLoadedStatus("failed");
      return;
    }

    const loadData = async () => {
      try {
        const id = Array.isArray(idParams) ? idParams[0] : idParams;
        const user = await getUserById(id);
        if (!user) throw new Error("Usuario no encontrado");

        setFormData({
          full_name: user.full_name,
          email: user.email,
          active: user.active,
          profile_id: user.profile_id ?? null,
        });
        const cUser = await getCurrentUser();
        const dataUser = await getUserWithHierarchy(cUser?.data?.user?.id!);
        setCurrentUser(dataUser);

        const profiles = await getProfiles();
        setRoles(profiles);

        setLoadedStatus("loaded");
      } catch (err) {
        console.error(err);
        toast.error("No se pudo cargar el usuario");
        setLoadedStatus("failed");
      }
    };

    loadData();
  }, [idParams]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

  const handleToggleActive = () => {
    setFormData((prev) => ({ ...prev, active: !prev.active }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!formData.full_name.trim())
      newErrors.full_name = "El nombre es requerido";
    if (!formData.email.trim()) newErrors.email = "El correo es requerido";
    if (!formData.profile_id) newErrors.profile_id = "Selecciona un perfil";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const id = Array.isArray(idParams) ? idParams[0] : idParams;
      if (!id) {
        toast.error("ID de usuario inválido");
        setLoading(false);
        return;
      }

      const result = await updateUser(id, {
        ...formData,
        profile_id: formData.profile_id || null,
      });

      if (result.success) {
        toast.success("Usuario actualizado correctamente");
        setTimeout(() => router.push("/dashboard/seguridad/usuarios"), 1000);
      } else {
        toast.error(result.error || "Error al actualizar el usuario");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado al actualizar el usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-custom-bg-primary">
      {/* Botón volver */}
      <div className="mb-6 p-4">
        <a
          href="/dashboard/seguridad/usuarios"
          className="inline-flex items-center text-custom-text-primary hover:text-custom-accent-primary p-2 hover:bg-custom-accent-hover rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-custom-text-primary">Editar Usuario</h1>
        </div>

        {loadedStatus === "loading" ? (
          <div className="space-y-6" role="status">
            <div className="h-10 bg-custom-bg-secondary rounded-md animate-pulse w-full"></div>
            <div className="h-10 bg-custom-bg-secondary rounded-md animate-pulse w-full"></div>
            <div className="h-10 bg-custom-bg-secondary rounded-md animate-pulse w-full"></div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-11 bg-custom-bg-secondary rounded-full animate-pulse"></div>
              <div className="h-4 w-16 bg-custom-bg-secondary rounded-sm animate-pulse"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-24 bg-custom-bg-secondary rounded-md animate-pulse"></div>
              <div className="h-10 w-32 bg-custom-bg-secondary rounded-md animate-pulse"></div>
            </div>
          </div>
        ) : loadedStatus === "failed" ? (
          <div className="text-center py-12">
            <p className="text-custom-text-tertiary">
              No se encontró el usuario especificado.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-custom-bg-secondary border border-custom-border-secondary p-4 sm:p-6 rounded-lg"
          >
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-custom-text-secondary">
                Nombre completo
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                readOnly
                className="mt-1 block w-full border border-custom-border-primary rounded-lg p-2 bg-custom-bg-tertiary text-custom-text-tertiary cursor-not-allowed transition-all duration-200"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-custom-text-secondary">
                Correo
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                className="mt-1 block w-full border border-custom-border-primary rounded-lg p-2 bg-custom-bg-tertiary text-custom-text-tertiary cursor-not-allowed transition-all duration-200"
              />
            </div>

            {/* Perfil */}
            <div>
              <label className="block text-sm font-medium text-custom-text-secondary">
                Perfil
              </label>
              <select
                name="profile_id"
                value={formData.profile_id ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    profile_id: e.target.value || null,
                  }))
                }
                className="mt-1 block w-full border border-custom-border-primary rounded-lg p-2 bg-custom-bg-tertiary text-custom-text-primary focus:outline-none focus:ring-2 focus:ring-custom-accent-primary focus:border-transparent transition-all duration-200"
              >
                <option value="">Selecciona un perfil</option>
                {roles.map((role) => (
                  <option 
                    key={role.id} 
                    value={role.id} 
                    disabled={currentUser?.profiles?.hierarchy > role.hierarchy}
                  >
                    {role.name}
                  </option>
                ))}
              </select>
              {errors.profile_id && (
                <p className="text-red-400 text-sm mt-1">{errors.profile_id}</p>
              )}
            </div>

            {/* Estado */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 gap-1">
              <span className="text-sm text-custom-text-secondary">Estado:</span>
              <button
                type="button"
                onClick={handleToggleActive}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${
                  formData.active ? "bg-green-500" : "bg-custom-text-tertiary"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform bg-white rounded-full transition-all duration-200 ${
                    formData.active ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className={`text-sm ${
                  formData.active ? "text-green-400" : "text-red-400"
                }`}
              >
                {formData.active ? "Activo" : "Inactivo"}
              </span>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row justify-start sm:justify-end gap-2 mt-4">
              {/* Cancelar */}
              <button
                type="button"
                onClick={() => router.push("/dashboard/seguridad/usuarios")}
                className="inline-flex items-center justify-center px-6 py-2 bg-custom-bg-tertiary hover:bg-custom-bg-hover text-custom-text-primary font-medium rounded-lg border border-custom-border-primary transition-all duration-200"
              >
                Cancelar
              </button>

              {/* Actualizar */}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center px-6 py-2 bg-custom-accent-primary hover:bg-custom-accent-secondary disabled:bg-custom-bg-tertiary text-custom-bg-primary font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Actualizando..." : "Actualizar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

}
