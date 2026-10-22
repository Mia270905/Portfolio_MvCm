"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getContactById, updateContact } from "@/lib/actions/contact.actions";
import { getUsers, User, getUserById } from "@/lib/actions/user.actions";

interface EditContactFormProps {
  contactId: string;
}

interface FormData {
  full_name: string;
  job_position: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  title: string;
  rfc: string;
  curp: string;
  notes: string;
  birth_date: string;
  related_user_id: string | null;
}

export function EditContactForm({ contactId }: EditContactFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    job_position: "",
    phone: "",
    mobile: "",
    email: "",
    website: "",
    title: "",
    rfc: "",
    curp: "",
    notes: "",
    birth_date: "",
    related_user_id: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [isUserSearching, setIsUserSearching] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar datos del contacto
  useEffect(() => {
    const loadContact = async () => {
      try {
        const contact = await getContactById(contactId);

        if (!contact) {
          toast.error("Contacto no encontrado");
          router.push("/dashboard/contacts-parent/contacts");
          return;
        }

        // Formatear la fecha para el input date (YYYY-MM-DD)
        const formattedBirthDate = contact.birth_date 
          ? contact.birth_date.split('T')[0] // Extraer solo la parte de la fecha
          : "";

        setFormData({
          full_name: contact.full_name || "",
          job_position: contact.job_position || "",
          phone: contact.phone || "",
          mobile: contact.mobile || "",
          email: contact.email || "",
          website: contact.website || "",
          title: contact.title || "",
          rfc: contact.rfc || "",
          curp: contact.curp || "",
          notes: contact.notes || "", // NUEVO CAMPO
          birth_date: formattedBirthDate || "", // NUEVO CAMPO formateado
          related_user_id: contact.related_user_id || null,
        });

        // Si hay un usuario relacionado, cargar sus datos usando getUserById
        if (contact.related_user_id) {
          try {
            const user = await getUserById(contact.related_user_id);
            if (user) {
              setSelectedUser(user);
              setUserSearchQuery(user.full_name);
            }
          } catch (error) {
            console.error("Error al cargar usuario relacionado:", error);
            setUserSearchQuery("Usuario relacionado (cargando...)");
          }
        }
      } catch (error) {
        console.error("Error al cargar contacto:", error);
        toast.error("Error al cargar los datos del contacto");
        router.push("/dashboard/contacts-parent/contacts");
      } finally {
        setInitialLoading(false);
      }
    };

    if (contactId) {
      loadContact();
    }
  }, [contactId, router]);

  const handleUserSearch = async (query: string) => {
    setUserSearchQuery(query);

    if (errors.related_user_id) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.related_user_id;
        return newErrors;
      });
    }

    if (query.length < 2) {
      setUserSearchResults([]);
      setShowUserDropdown(false);
      return;
    }

    setIsUserSearching(true);
    try {
      const response = await getUsers(1, 10, query, '', "full_name", "asc");
      setUserSearchResults(response.users);
      setShowUserDropdown(response.users.length > 0);
    } catch (error) {
      console.error("Error buscando usuarios:", error);
      setUserSearchResults([]);
      setShowUserDropdown(false);
    } finally {
      setIsUserSearching(false);
    }
  };

  // Seleccionar usuario
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setFormData((prev) => ({ ...prev, related_user_id: user.id }));
    setUserSearchQuery(user.full_name);
    setShowUserDropdown(false);
    setUserSearchResults([]);

    if (errors.related_user_id) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.related_user_id;
        return newErrors;
      });
    }
  };

  // Limpiar selección de usuario
  const handleClearUser = () => {
    setSelectedUser(null);
    setFormData((prev) => ({ ...prev, related_user_id: null }));
    setUserSearchQuery("");
    setShowUserDropdown(false);
    setUserSearchResults([]);

    if (errors.related_user_id) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.related_user_id;
        return newErrors;
      });
    }
  };

  // Limpiar fecha de nacimiento
  const handleClearBirthDate = () => {
    setFormData((prev) => ({ ...prev, birth_date: "" }));
    if (errors.birth_date) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.birth_date;
        return newErrors;
      });
    }
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Función para formatear números de teléfono
  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(
        6
      )}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(
        6,
        10
      )}`;
    }
  };

  // Función para normalizar URLs
  const normalizeWebsite = (url: string): string => {
    if (!url) return "";
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      if (url.includes(".") && !url.includes(" ")) {
        return `https://${url}`;
      }
      return url;
    }
    return url;
  };

  // Manejar cambios de inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Aplicar formato automático para teléfonos
    if (name === "phone" || name === "mobile") {
      processedValue = formatPhoneNumber(value);
    }

    // Convertir RFC y CURP a mayúsculas
    if (name === "rfc" || name === "curp") {
      processedValue = value.toUpperCase();
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.full_name?.trim()) {
      newErrors.full_name = "El nombre completo es requerido";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El formato del correo electrónico no es válido";
    }

    // Validación opcional para teléfonos
    if (formData.phone && !/^[\d-]+$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "El formato del teléfono no es válido";
    }

    if (
      formData.mobile &&
      !/^[\d-]+$/.test(formData.mobile.replace(/\s/g, ""))
    ) {
      newErrors.mobile = "El formato del celular no es válido";
    }

    // Validación opcional para RFC (formato básico)
    if (
      formData.rfc &&
      formData.rfc.trim() &&
      !/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(formData.rfc)
    ) {
      newErrors.rfc = "El formato del RFC no es válido";
    }

    // Validación opcional para CURP (formato básico)
    if (
      formData.curp &&
      formData.curp.trim() &&
      !/^[A-Z]{4}[0-9]{6}[A-Z]{6}[0-9A-Z]{2}$/.test(formData.curp)
    ) {
      newErrors.curp = "El formato de la CURP no es válido";
    }

    // Validación de fecha de nacimiento (si se proporciona)
    if (formData.birth_date && formData.birth_date.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.birth_date)) {
        newErrors.birth_date = "Formato de fecha inválido. Use AAAA-MM-DD";
      } else {
        const date = new Date(formData.birth_date);
        if (isNaN(date.getTime())) {
          newErrors.birth_date = "Fecha no válida";
        } else if (date > new Date()) {
          newErrors.birth_date = "La fecha de nacimiento no puede ser futura";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    setLoading(true);

    try {
      const normalizedWebsite = normalizeWebsite(formData.website);

      const updateData = {
        full_name: formData.full_name,
        job_position: formData.job_position,
        phone: formData.phone,
        mobile: formData.mobile,
        email: formData.email,
        website: normalizedWebsite,
        title: formData.title,
        rfc: formData.rfc,
        curp: formData.curp,
        notes: formData.notes,
        birth_date: formData.birth_date || null, 
        related_user_id: formData.related_user_id,
      };

      const result = await updateContact(contactId, updateData);

      if (result.success) {
        toast.success("¡Contacto actualizado con éxito!");
        router.push("/dashboard/contacts-parent/contacts");
      } else {
        if (result.message?.includes("ya está relacionado con el contacto")) {
          setErrors((prev) => ({
            ...prev,
            related_user_id:
              result.message ||
              "El usuario ya está relacionado con otro contacto",
          }));
        } else {
          toast.error(result.message || "Error al actualizar el contacto");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error inesperado al actualizar el contacto");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
           <div className="max-w-2xl mx-auto">
          <div className="animate-pulse bg-[#3A320C] rounded-lg border border-[#E3C169] p-6 space-y-4">
            <div className="h-8 bg-[#4A3F10] rounded w-1/3"></div>

            <div className="space-y-3">
              <div className="h-4 bg-[#4A3F10] rounded"></div>
              <div className="h-10 bg-[#4A3F10] rounded"></div>

              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-[#4A3F10] rounded"></div>
                <div className="h-10 bg-[#4A3F10] rounded"></div>
              </div>
            </div>
          </div>
        </div>

    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form
        onSubmit={handleSubmit}
       className="space-y-6 bg-white rounded-xl border border-[#E5E1D8] p-6"
      >
        {/* Información Básica */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Información Básica
          </h2>

          {/* Nombre completo */}
          <div className="space-y-2">
            <label
              htmlFor="full_name"
              className="text-sm font-medium text-gray-700"
            >
              Nombre completo *
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez García"
              className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2
          bg-[#F5F1E8] text-gray-900 placeholder-gray-400
          focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
            />
            {errors.full_name && (
              <p className="text-red-400 text-sm">{errors.full_name}</p>
            )}
          </div>

          {/* Usuario relacionado */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Usuario relacionado
            </label>
            <div className="relative" ref={dropdownRef}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  onFocus={() => {
                    if (
                      userSearchResults.length > 0 &&
                      userSearchQuery.length >= 2
                    ) {
                      setShowUserDropdown(true);
                    }
                  }}
                  placeholder="Escribe para buscar usuarios (mínimo 2 caracteres)..."
                  className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2 bg-[#F5F1E8] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
                />
                {(selectedUser || userSearchQuery) && (
                  <button
                    type="button"
                    onClick={handleClearUser}
                    className="px-3 py-2 text-red-400 border border-red-700 rounded-lg hover:bg-red-400/10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors whitespace-nowrap"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Dropdown de resultados */}
              {showUserDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-[#0A0F17] border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {isUserSearching ? (
                    <div className="px-3 py-2 text-gray-400 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                      Buscando usuarios...
                    </div>
                  ) : userSearchResults.length === 0 ? (
                    <div className="px-3 py-2 text-gray-400">
                      {userSearchQuery.length < 2
                        ? "Escribe al menos 2 caracteres para buscar"
                        : "No se encontraron usuarios"}
                    </div>
                  ) : (
                    userSearchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className="w-full px-3 py-2 text-left hover:bg-yellow-400/10 focus:bg-yellow-400/10 focus:outline-none border-b border-gray-700 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-white">
                          {user.full_name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Estado: {user.active ? "Activo" : "Inactivo"}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {errors.related_user_id && (
              <p className="text-red-400 text-sm mt-1">
                {errors.related_user_id}
              </p>
            )}

            {/* Información del usuario seleccionado */}
            {selectedUser ? (
              <div className="p-3 bg-green-400/10 border border-green-700 rounded-lg">
                <p className="text-sm text-green-400">
                  <strong>Usuario seleccionado:</strong>{" "}
                  {selectedUser.full_name} ({selectedUser.email})
                  {!selectedUser.active && (
                    <span className="text-amber-400 ml-2">• Inactivo</span>
                  )}
                </p>
              </div>
            ) : formData.related_user_id && !selectedUser ? (
              <div className="p-3 bg-amber-400/10 border border-amber-700 rounded-lg">
                <p className="text-sm text-amber-400">
                  <strong>Usuario relacionado cargando...</strong> ID:{" "}
                  {formData.related_user_id}
                </p>
              </div>
            ) : (
              !formData.related_user_id && (
                <div className="p-3 bg-[#F5F1E8] border border-[#E5E1D8] rounded-lg">
                  <p className="text-sm text-gray-400">
                    No hay usuario relacionado seleccionado
                  </p>
                </div>
              )
            )}
          </div>

          {/* Posición de trabajo y Título */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="job_position"
                className="text-sm font-medium text-gray-700"
              >
                Posición de trabajo
              </label>
              <input
                id="job_position"
                name="job_position"
                type="text"
                value={formData.job_position}
                onChange={handleChange}
                placeholder="Ej: Sales Director"
                className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2
          bg-[#F5F1E8] text-gray-900 placeholder-gray-400
          focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-gray-700"
              >
                Título
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ej: Licenciado en Administración"
                className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2
          bg-[#F5F1E8] text-gray-900 placeholder-gray-400
          focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>
          </div>

          {/* NUEVO: Fecha de nacimiento */}
          <div className="space-y-2">
            <label
              htmlFor="birth_date"
              className="text-sm font-medium text-gray-700"
            >
              Fecha de nacimiento
            </label>
            <div className="flex gap-2">
              <input
                id="birth_date"
                name="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={handleChange}
                className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2 bg-[#F5F1E8] text-gray-900 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
                max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
              />
              {formData.birth_date && (
                <button
                  type="button"
                  onClick={handleClearBirthDate}
                  className="px-3 py-2 text-red-400 border border-red-700 rounded-lg hover:bg-red-400/10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors whitespace-nowrap"
                >
                  Limpiar
                </button>
              )}
            </div>
            {errors.birth_date && (
              <p className="text-red-400 text-sm">{errors.birth_date}</p>
            )}
            <p className="text-xs text-gray-400">
              Formato: AAAA-MM-DD
            </p>
          </div>

          {/* NUEVO: Notas */}
          <div className="space-y-2">
            <label
              htmlFor="notes"
              className="text-sm font-medium text-gray-700"
            >
              Notas / Observaciones
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Notas adicionales sobre el contacto..."
              rows={4}
              className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2 bg-[#F5F1E8] text-gray-900 placeholder-gray-400 resize-y  focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
            />
            <p className="text-xs text-gray-400">
              Información adicional que puede ser útil
            </p>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            Información de Contacto
          </h2>

         

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Correo electrónico *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ej: juan.perez@empresa.com"
                className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2
          bg-[#F5F1E8] text-gray-900 placeholder-gray-400
          focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
              {errors.email && (
                <p className="text-red-400 text-sm">{errors.email}</p>
              )}
            </div>

            {/* Sitio web */}
            <div className="space-y-2">
              <label
                htmlFor="website"
                className="text-sm font-medium text-gray-700"
              >
                Sitio web
              </label>
              <input
                id="website"
                name="website"
                type="text"
                value={formData.website}
                onChange={handleChange}
                placeholder="Ej: empresa.com o https://empresa.com"
                className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2
          bg-[#F5F1E8] text-gray-900 placeholder-gray-400
          focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="text-sm font-medium text-gray-700"
              >
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ej: 555-123-4567"
                maxLength={12}
                className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2
          bg-[#F5F1E8] text-gray-900 placeholder-gray-400
          focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
              {errors.phone && (
                <p className="text-red-400 text-sm">{errors.phone}</p>
              )}
            </div>

            {/* Celular */}
            <div className="space-y-2">
              <label
                htmlFor="mobile"
                className="text-sm font-medium text-gray-700"
              >
                Celular
              </label>
              <input
                id="mobile"
                name="mobile"
                type="text"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Ej: 555-987-6543"
                maxLength={12}
                className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2
          bg-[#F5F1E8] text-gray-900 placeholder-gray-400
          focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
              {errors.mobile && (
                <p className="text-red-400 text-sm">{errors.mobile}</p>
              )}
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            Información Adicional
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RFC */}
            <div className="space-y-2">
              <label
                htmlFor="rfc"
                className="text-sm font-medium text-gray-700"
              >
                RFC
              </label>
              <input
                id="rfc"
                name="rfc"
                type="text"
                value={formData.rfc}
                onChange={handleChange}
                placeholder="Ej: XAXX010101000"
                 className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2 bg-[#F5F1E8] text-gray-900 placeholder-gray-400 uppercase focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
                style={{ textTransform: "uppercase" }}
              />
              {errors.rfc && (
                <p className="text-red-400 text-sm">{errors.rfc}</p>
              )}
            </div>

            {/* CURP */}
            <div className="space-y-2">
              <label
                htmlFor="curp"
                className="text-sm font-medium text-gray-700"
              >
                CURP
              </label>
              <input
                id="curp"
                name="curp"
                type="text"
                value={formData.curp}
                onChange={handleChange}
                placeholder="Ej: XAXX010101HDFXXX00"
                className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2 bg-[#F5F1E8] text-gray-900 placeholder-gray-400 uppercase focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
                style={{ textTransform: "uppercase" }}
              />
              {errors.curp && (
                <p className="text-red-400 text-sm">{errors.curp}</p>
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#E3C169]">
  <button
    type="button"
    onClick={() => router.back()}
    disabled={loading}
    className="
      px-4 py-2
      text-[#3A2A00]
      bg-[#F6E7B8]
      border border-[#E3C169]
      rounded-lg
      hover:bg-[#EAD9A5]
      focus:outline-none
      focus:ring-2
      focus:ring-[#C9A23F]
      focus:ring-opacity-50
      disabled:opacity-50
      transition-colors
    "
  >
    Cancelar
  </button>

  <button
    type="submit"
    disabled={loading}
    className="
      px-4 py-2
      bg-[#C9A23F]
      text-[#3A2A00]
      rounded-lg
      hover:bg-[#E1B955]
      focus:outline-none
      focus:ring-2
      focus:ring-[#C9A23F]
      focus:ring-opacity-50
      disabled:opacity-50
      transition-colors
      flex items-center gap-2
      font-semibold
    "
  >
    {loading ? (
      <>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3A2A00]"></div>
        Actualizando...
      </>
    ) : (
      "Actualizar Contacto"
    )}
  </button>
</div>

      </form>
    </div>
  );
}