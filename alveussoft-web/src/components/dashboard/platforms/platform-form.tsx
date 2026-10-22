"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getContacts, Contact } from "@/lib/actions/contact.actions";

export interface PlatformPayload {
  code: string;
  name: string;
  description: string;
  domain: string;
  contact_id: string | null;
  is_write_protected?: boolean;
}

interface PlatformFormProps {
  platform?: PlatformPayload & { id?: string };
  handleSubmit: (e: React.FormEvent) => void;
  formData: PlatformPayload;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  errors: Record<string, string>;
  buttonText?: string;
  buttonLoadingText?: string;
  loading: boolean;
  isEditing?: boolean;
}

export function PlatformForm({
  platform,
  handleSubmit,
  formData,
  handleChange,
  errors,
  buttonText = "Crear Plataforma",
  buttonLoadingText = "Creando...",
  loading,
  isEditing = false,
}: PlatformFormProps) {
  const router = useRouter();
  
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [contactSearchResults, setContactSearchResults] = useState<Contact[]>([]);
  const [isContactSearching, setIsContactSearching] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(false);

  // Función para cargar un contacto por ID
  const loadContactById = useCallback(async (contactId: string) => {
    try {
      const response = await getContacts(1, 10, "");
      const contact = response.contacts.find(c => c.id === contactId);
      
      if (contact) {
        setSelectedContact(contact);
        setContactSearchQuery(contact.full_name);
      } else {
        console.log('Contacto no encontrado, buscando específicamente...');
        try {
          const searchResponse = await getContacts(1, 1, contactId);
          const foundContact = searchResponse.contacts.find(c => c.id === contactId);
          if (foundContact) {
            setSelectedContact(foundContact);
            setContactSearchQuery(foundContact.full_name);
          } else {
            console.log('Contacto aún no encontrado, mostrando ID');
            setContactSearchQuery(`Contacto ID: ${contactId}`);
          }
        } catch (searchError) {
          console.error('Error en búsqueda específica:', searchError);
          setContactSearchQuery(`Contacto ID: ${contactId}`);
        }
      }
    } catch (error) {
      console.error('Error cargando contacto:', error);
      setContactSearchQuery(`Contacto ID: ${contactId}`);
    }
  }, []);

  // Inicializar contacto seleccionado
  useEffect(() => {

    // Solo ejecutar una vez al montar o cuando cambie el contact_id
    if (!initialLoadRef.current && formData.contact_id) {
      initialLoadRef.current = true;
      loadContactById(formData.contact_id);
    }
    
    // Limpiar si no hay contact_id
    if (!formData.contact_id && selectedContact) {
      setSelectedContact(null);
      setContactSearchQuery("");
    }
  }, [formData.contact_id, loadContactById, selectedContact]);

  useEffect(() => {
    if (platform?.contact_id && !selectedContact && !initialLoadRef.current) {
      initialLoadRef.current = true;
      loadContactById(platform.contact_id);
    }
  }, [platform?.contact_id, loadContactById, selectedContact]);

  const handleContactSearch = async (query: string) => {
    setContactSearchQuery(query);

    if (errors.contact_id) {
      // Limpiar error del campo
      const newErrors = { ...errors };
      delete newErrors.contact_id;
    }
    
    // Si se borra el texto, limpiar selección
    if (query === "" && selectedContact) {
      handleClearContact();
      return;
    }
    
    if (query.length < 2) {
      setContactSearchResults([]);
      setShowContactDropdown(false);
      return;
    }

    setIsContactSearching(true);
    try {
      const response = await getContacts(1, 10, query);
      setContactSearchResults(response.contacts);
      setShowContactDropdown(response.contacts.length > 0);
    } catch (error) {
      console.error("Error buscando contactos:", error);
      setContactSearchResults([]);
      setShowContactDropdown(false);
    } finally {
      setIsContactSearching(false);
    }
  };

  // Seleccionar contacto
  const handleSelectContact = (contact: Contact) => {
    console.log('Contacto seleccionado:', contact);
    setSelectedContact(contact);
    
    // Actualizar el formData del padre
    const fakeEvent = {
      target: {
        name: 'contact_id',
        value: contact.id
      }
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(fakeEvent);
    
    setContactSearchQuery(contact.full_name);
    setShowContactDropdown(false);
    setContactSearchResults([]);
    initialLoadRef.current = true; 
  };

  // Limpiar selección de contacto
  const handleClearContact = () => {
    console.log('Limpiando contacto seleccionado');
    setSelectedContact(null);
    
    // Actualizar el formData del padre
    const fakeEvent = {
      target: {
        name: 'contact_id',
        value: ""
      }
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(fakeEvent);
    
    setContactSearchQuery("");
    setShowContactDropdown(false);
    setContactSearchResults([]);
    initialLoadRef.current = false;
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowContactDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Función para manejar el submit del formulario
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('PlatformForm: Enviando formulario...');
    
    // Validar que handleSubmit sea una función
    if (typeof handleSubmit === 'function') {
      console.log('PlatformForm: Llamando handleSubmit del padre');
      handleSubmit(e);
    } else {
      console.error('PlatformForm: handleSubmit no es una función');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleFormSubmit} className="space-y-6 bg-[#0A0F17] rounded-lg border border-gray-800 p-6">
        {/* Información Básica */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Información Básica</h2>
          
          {/* Código */}
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium text-gray-300">
              Código *
            </label>
            <input
              id="code"
              name="code"
              type="text"
              value={formData.code}
              onChange={handleChange}
              disabled={formData.is_write_protected}
              placeholder="Ej: plat01, mi-plataforma, sistema123"
              className="w-full border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 text-white bg-[#070B14] placeholder-gray-500 lowercase disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ textTransform: 'lowercase' }}
            />
            {errors.code && <p className="text-red-400 text-sm">{errors.code}</p>}
            <p className="text-xs text-gray-400">
              Solo letras minúsculas, números y guiones. Ej: plat01, mi-plataforma, sistema123
            </p>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-300">
              Nombre *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              disabled={formData.is_write_protected}
              placeholder="Ej: Plataforma Principal"
              className="w-full border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 text-white bg-[#070B14] placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-300">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={formData.is_write_protected}
              placeholder="Descripción de la plataforma..."
              rows={3}
              className="w-full border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 text-white bg-[#070B14] placeholder-gray-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Dominio */}
          <div className="space-y-2">
            <label htmlFor="domain" className="text-sm font-medium text-gray-300">
              Dominio *
            </label>
            <input
              id="domain"
              name="domain"
              type="text"
              value={formData.domain}
              onChange={handleChange}
              disabled={formData.is_write_protected}
              placeholder="Ej: miplataforma.com o https://miplataforma.com"
              className="w-full border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 text-white bg-[#070B14] placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.domain && <p className="text-red-400 text-sm">{errors.domain}</p>}
          </div>

          {/* Contacto relacionado */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Contacto relacionado
            </label>
            <div className="relative" ref={dropdownRef}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={contactSearchQuery}
                  onChange={(e) => handleContactSearch(e.target.value)}
                  onFocus={() => {
                    if (contactSearchResults.length > 0 && contactSearchQuery.length >= 2) {
                      setShowContactDropdown(true);
                    }
                  }}
                  disabled={formData.is_write_protected}
                  placeholder="Escribe para buscar contactos (mínimo 2 caracteres)..."
                  className="flex-1 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 text-white bg-[#070B14] placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {selectedContact && (
                  <button
                    type="button"
                    onClick={handleClearContact}
                    disabled={formData.is_write_protected}
                    className="px-3 py-2 text-red-400 border border-red-700 rounded-lg hover:bg-red-400/10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              
              {/* Dropdown de resultados */}
              {showContactDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-[#0A0F17] border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {isContactSearching ? (
                    <div className="px-3 py-2 text-gray-400 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                      Buscando contactos...
                    </div>
                  ) : contactSearchResults.length === 0 ? (
                    <div className="px-3 py-2 text-gray-400">
                      {contactSearchQuery.length < 2 
                        ? "Escribe al menos 2 caracteres para buscar" 
                        : "No se encontraron contactos"
                      }
                    </div>
                  ) : (
                    contactSearchResults.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => handleSelectContact(contact)}
                        className="w-full px-3 py-2 text-left hover:bg-yellow-400/10 focus:bg-yellow-400/10 focus:outline-none border-b border-gray-700 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-white">{contact.full_name}</div>
                        <div className="text-sm text-gray-400">{contact.email}</div>
                        {contact.job_position && (
                          <div className="text-xs text-gray-500 mt-1">
                            Posición: {contact.job_position}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {errors.contact_id && (
              <p className="text-red-400 text-sm mt-1">{errors.contact_id}</p>
            )}
            
            {selectedContact && (
              <div className="p-3 bg-green-400/10 border border-green-700 rounded-lg">
                <p className="text-sm text-green-400">
                  <strong>Contacto seleccionado:</strong> {selectedContact.full_name} ({selectedContact.email})
                </p>
              </div>
            )}
            {formData.contact_id && !selectedContact && !isContactSearching && contactSearchQuery.length === 0 && (
              <p className="text-sm text-amber-400">
                ID de contacto relacionado: {formData.contact_id}
              </p>
            )}
          </div>
        </div>

        {/* Módulo (placeholder para futura funcionalidad) */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Módulo</h2>
          
          <div className="space-y-2">
            <label htmlFor="module" className="text-sm font-medium text-gray-300">
              Configuración del Módulo
            </label>
            <input
              id="module"
              name="module"
              type="text"
              placeholder="Campo para configuración futura del módulo..."
              className="w-full border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 text-white bg-[#070B14] placeholder-gray-500"
              disabled
            />
            <p className="text-sm text-gray-400">
              Esta sección estará disponible en futuras actualizaciones.
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="px-4 py-2 text-gray-300 bg-[#070B14] border border-gray-700 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || formData.is_write_protected}
            className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium disabled:cursor-not-allowed"
            onClick={() => console.log('Botón de submit clickeado')}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                {buttonLoadingText}
              </>
            ) : (
              buttonText
            )}
          </button>
        </div>

        {formData.is_write_protected && (
          <span className="block mt-4 text-center md:text-right text-sm text-gray-400">
            La plataforma se encuentra protegida contra escritura
          </span>
        )}
      </form>
    </div>
  );
}