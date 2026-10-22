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
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    active: true,
    profile_id: "",
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [targetUser, setTargetUser] = useState<any>(null);
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
          profile_id: user.profile_id || "",
        });
        
        // Obtener usuario actual (quien está editando)
        const cUser = await getCurrentUser();
        const dataUser = await getUserWithHierarchy(cUser?.data?.user?.id!);
        setCurrentUser(dataUser);

        // Obtener el usuario objetivo (quien está siendo editado) con su jerarquía
        const targetUserData = await getUserWithHierarchy(id);
        setTargetUser(targetUserData);

        // Validar si puede editar este usuario
        const currentHierarchy = (dataUser as any)?.profiles?.hierarchy ?? 999;
        const targetHierarchy = (targetUserData as any)?.profiles?.hierarchy ?? 999;

        // Si la jerarquía del usuario actual es MAYOR (peor rango) que la del objetivo, no puede editar
        if (currentHierarchy > targetHierarchy) {
          toast.error("No tienes permisos para editar este usuario (jerarquía insuficiente)");
          setLoadedStatus("failed");
          return;
        }

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
    <div className="min-h-screen">
      {/* Botón volver */}
      <div className="mb-6 p-4 lg:p-6">
        <button
          onClick={() => router.push("/dashboard/seguridad/usuarios")}
          className="inline-flex items-center text-neutral-600 hover:text-[#c6a365] p-2 hover:bg-[#f5efe6] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Editar Usuario</h1>
          <p className="text-neutral-600 mt-2">
            Modifica los datos del usuario
          </p>
        </div>

        {loadedStatus === "loading" ? (
          <div className="space-y-6" role="status">
            <div className="h-10 bg-[#f5efe6] rounded-md animate-pulse w-full"></div>
            <div className="h-10 bg-[#f5efe6] rounded-md animate-pulse w-full"></div>
            <div className="h-10 bg-[#f5efe6] rounded-md animate-pulse w-full"></div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-11 bg-[#f5efe6] rounded-full animate-pulse"></div>
              <div className="h-4 w-16 bg-[#f5efe6] rounded-sm animate-pulse"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-24 bg-[#f5efe6] rounded-md animate-pulse"></div>
              <div className="h-10 w-32 bg-[#f5efe6] rounded-md animate-pulse"></div>
            </div>
          </div>
        ) : loadedStatus === "failed" ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl border border-[#f5efe6] p-8 max-w-md mx-auto shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#fdeaea] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#c62828]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                No tienes permisos suficientes
              </h3>
              <p className="text-neutral-600 mb-6">
                No puedes editar este usuario porque tiene una jerarquía superior a la tuya.
              </p>
              <button
                onClick={() => router.push("/dashboard/seguridad/usuarios")}
                className="inline-flex items-center text-[#c6a365] hover:text-[#b59555]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Usuarios
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white border border-[#f5efe6] p-6 rounded-lg shadow-sm"
          >
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                readOnly
                className="mt-1 block w-full border border-[#CFC7B8] rounded-lg px-3 py-2 bg-[#faf8f3] text-neutral-600 cursor-not-allowed transition-all duration-200"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-1">
                Correo
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                className="mt-1 block w-full border border-[#CFC7B8] rounded-lg px-3 py-2 bg-[#faf8f3] text-neutral-600 cursor-not-allowed transition-all duration-200"
              />
            </div>

            {/* Perfil */}
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-1">
                Perfil
              </label>
              <select
                name="profile_id"
                value={formData.profile_id}
                onChange={handleChange}
                className="mt-1 block w-full border border-[#CFC7B8] rounded-lg px-3 py-2 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:border-transparent transition-all duration-200"
              >
                <option value="">Selecciona un perfil</option>
                {roles.map((role) => (
                  <option
                    key={role.id}
                    value={role.id}
                    disabled={(currentUser as any)?.profiles?.hierarchy > role.hierarchy}
                    className="text-neutral-900 disabled:text-neutral-400"
                  >
                    {role.name}
                  </option>
                ))}
              </select>
              {errors.profile_id && (
                <p className="text-[#c62828] text-sm mt-1">{errors.profile_id}</p>
              )}
            </div>

            {/* Estado */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-900">Estado:</span>
              <button
                type="button"
                onClick={handleToggleActive}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c6a365] ${
                  formData.active ? "bg-green-500" : "bg-red-400"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform bg-white rounded-full transition-all duration-200 ${
                    formData.active ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${
                  formData.active ? "text-green-600" : "text-red-600"
                }`}
              >
                {formData.active ? "Activo" : "Inactivo"}
              </span>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[#f5efe6]">
              {/* Cancelar */}
              <button
                type="button"
                onClick={() => router.push("/dashboard/seguridad/usuarios")}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white hover:bg-[#f5efe6] text-neutral-700 font-medium rounded-lg border border-[#CFC7B8] hover:border-[#c6a365] transition-all duration-200"
              >
                Cancelar
              </button>

              {/* Actualizar */}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-[#a78447] to-[#c6a365] hover:from-[#b59555] hover:to-[#d4b24c] text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? "Actualizando..." : "Actualizar Usuario"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}