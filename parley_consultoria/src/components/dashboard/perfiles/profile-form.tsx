import { NewProfilePayload } from "@/lib/definitions";

interface ProfileFormProps {
  handleSubmit: (e: React.FormEvent) => void;
  formData: NewProfilePayload;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  errors: Record<string, string>;
  handleToggleActive: () => void;
  buttonText: string;
  buttonLoadingText: string;
  loading: boolean;
}

export default function ProfileForm({
  handleSubmit,
  formData,
  handleChange,
  errors,
  handleToggleActive,
  buttonText = "Guardar",
  buttonLoadingText = "Guardando...",
  loading,
}: ProfileFormProps) {
  return (
    <div className="bg-white rounded-lg border border-[#f5efe6] p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Código */}
        <div>
          <label
            htmlFor="code"
            className="block font-medium text-neutral-900 mb-2"
          >
            Código <span className="text-[#c62828]">*</span>
          </label>
          <input
            type="text"
            id="code"
            name="code"
            disabled={formData.is_write_protected}
            value={formData.code}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 placeholder-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            placeholder="users"
          />
          {errors.code && (
            <p className="text-[#c62828] text-sm mt-1">{errors.code}</p>
          )}
        </div>

        {/* Nombre */}
        <div>
          <label
            htmlFor="name"
            className="block font-medium text-neutral-900 mb-2"
          >
            Nombre <span className="text-[#c62828]">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            disabled={formData.is_write_protected}
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 placeholder-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            placeholder="Usuarios"
          />
          {errors.name && (
            <p className="text-[#c62828] text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Jerarquía */}
        <div>
          <label
            htmlFor="hierarchy"
            className="flex flex-row justify-between items-end mb-2"
          >
            <span className="block font-medium text-neutral-900">
              Jerarquía <span className="text-[#c62828]">*</span>
            </span>

            <span className="text-[12px] italic text-neutral-600 text-right leading-none pb-0.5 max-w-[70%]">
              La jerarquía determina el nivel de acceso del perfil. 
              Un número menor indica un nivel más alto.
            </span>
          </label>
          <input
            type="number"
            id="hierarchy"
            name="hierarchy"
            value={formData.hierarchy}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 placeholder-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            placeholder="0"
          />
          {errors.hierarchy && (
            <p className="text-[#c62828] text-sm mt-1">{errors.hierarchy}</p>
          )}
        </div>

        {/* Activo/Inactivo */}
        <div>
          <label className="block font-medium text-neutral-900 mb-3">
            Estado
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={formData.is_write_protected}
              onClick={handleToggleActive}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c6a365] disabled:opacity-50 disabled:cursor-not-allowed ${
                formData.active ? "bg-green-500" : "bg-red-400"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 ${
                  formData.active ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                formData.active
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-red-100 text-red-700 border border-red-200"
              }`}
            >
              {formData.active ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4">
          <a
            href="/dashboard/seguridad/perfiles"
            className="inline-flex items-center px-6 py-2 bg-white hover:bg-[#f5efe6] text-neutral-700 font-medium rounded-lg border border-[#CFC7B8] hover:border-[#c6a365] transition-all duration-200"
          >
            Cancelar
          </a>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2 bg-gradient-to-r bg-[#a78447]  hover:bg-[#b59555] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200"
          >
            {loading ? buttonLoadingText : buttonText}
          </button>
        </div>

        {formData.is_write_protected && (
          <span className="block mt-4 text-center md:text-right text-sm text-[#7a5a00]">
            El perfil se encuentra protegido contra escritura
          </span>
        )}
      </form>
    </div>
  );
}