"use client"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Calendar, 
  X, 
  MapPin, 
  AlertCircle, 
  Building, 
  Search, 
  Loader2,
  ChevronDown,
  Plus,
  Check,
  Edit2
} from "lucide-react"
import { SelectContactModal } from "./select-contact-modal"
import { CreateContactModal } from "@/components/contacts/create-contact-modal"
import { type Contact } from "@/lib/actions/contact.actions"
import { getContactAddresses } from "@/lib/actions/address.actions"
import AddAddressModal from "./add-address-modal"
import { toast } from "sonner"

interface AddressData {
  id: string
  street: string
  exterior_number: string
  interior_number?: string
  neighborhood: string
  postal_code: string
  isTemporary?: boolean // Marca si es una dirección temporal que aún no se guarda en BD
}

interface QuotationDetailsProps {
  formData: {
    clientName: string
    clientEmail?: string
    clientPhone?: string
    validFrom: string
    validUntil: string
    vendor: string
    deliveryAddress: string
    notes: string
    company: string
    contactId?: string
  }
  onFieldChange: (field: string, value: string) => void
  onClearClient?: () => void
  onPendingAddressesChange?: (address: AddressData | null) => void // Solo la dirección seleccionada actual
  currentUser?: {
    full_name?: string
    email?: string
    user_code?: string
    id?: string
  } | null
  companies?: Array<{
    id: string
    name: string
    rfc: string | null
  }>
  isLoadingUser?: boolean
  isLoadingCompanies?: boolean
  errors?: { [key: string]: string }
}

export default function QuotationDetails({ 
  formData, 
  onFieldChange, 
  onClearClient,
  onPendingAddressesChange,
  //onAddContact,
  currentUser,
  companies = [],
  isLoadingUser = false,
  isLoadingCompanies = false,
  errors = {}
}: QuotationDetailsProps) {
  const [showContactModal, setShowContactModal] = useState(false)
  // Estados para manejo de direcciones
  const [clientAddresses, setClientAddresses] = useState<AddressData[]>([])
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)
  const [showAddressDropdown, setShowAddressDropdown] = useState(false)
  const [showAddAddressModal, setShowAddAddressModal] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [isEditingManually, setIsEditingManually] = useState(false)
  const [pendingAddresses, setPendingAddresses] = useState<AddressData[]>([]) // Direcciones temporales
  const [addressToEdit, setAddressToEdit] = useState<AddressData | null>(null) // Dirección en modo edición
  const [showCreateContactModal, setShowCreateContactModal] = useState(false)

  const [userCompanies, setUserCompanies] = useState<Array<{ id: string; name: string; rfc: string | null }>>([])

  const handleDateChange = (field: string, value: string) => {
    if (field === 'validUntil' && formData.validFrom && value < formData.validFrom) {
      alert("La fecha de vencimiento no puede ser anterior a la fecha de inicio")
      return
    }
    onFieldChange(field, value)
  }

  // Cargar direcciones cuando se selecciona un contacto
  useEffect(() => {
    const loadAddresses = async () => {
      if (formData.contactId) {
        setIsLoadingAddresses(true)
        try {
          const { addresses, error } = await getContactAddresses(formData.contactId)
          if (!error) {
            setClientAddresses(addresses || [])
            // Si hay direcciones y NO hay dirección actual, seleccionar la primera por defecto
            if (addresses && addresses.length > 0 && !formData.deliveryAddress) {
              const firstAddress = addresses[0]
              const fullAddress = `${firstAddress.street} #${firstAddress.exterior_number}${
                firstAddress.interior_number ? ` Int. ${firstAddress.interior_number}` : ''
              }, ${firstAddress.neighborhood}, CP: ${firstAddress.postal_code}`
              
              onFieldChange("deliveryAddress", fullAddress)
              setSelectedAddressId(firstAddress.id)
            }
          } else {
            setClientAddresses([])
          }
        } catch (error) {
          console.error("Error cargando direcciones:", error)
          setClientAddresses([])
        } finally {
          setIsLoadingAddresses(false)
        }
      } else {
        setClientAddresses([])
        setSelectedAddressId(null)
        setIsEditingManually(false)
      }
    }

    const loadUsersCompanies = () => {
      const userCompaniesRaw = localStorage.getItem("selectedCompanies");     
      if (!userCompaniesRaw) {
        setUserCompanies([])
        return
      }

      try {
        const parsed = JSON.parse(userCompaniesRaw);

        // Normalizar a array de ids (puede venir como array de objetos, objeto o string)
        let selectedIds: string[] = [];
        if (Array.isArray(parsed)) {
          selectedIds = parsed.map((p: any) => p?.id ?? p?._id ?? String(p));
        } else if (parsed && typeof parsed === "object") {
          selectedIds = [parsed.id ?? parsed._id].filter(Boolean) as string[];
        } else if (typeof parsed === "string") {
          selectedIds = [parsed];
        }

        if (selectedIds.length === 0) {
          setUserCompanies([])
          return
        }

        const filteredCompanies = companies.filter((c) =>
          selectedIds.includes(c.id) || ((c as any)._id && selectedIds.includes((c as any)._id))
        );
        setUserCompanies(filteredCompanies)

        // Auto-seleccionar la primera compañía si:
        // - No hay ninguna seleccionada, O
        // - La actual no está en la lista filtrada
        const currentCompanyInList = filteredCompanies.some(c => c.id === formData.company)
        if (filteredCompanies.length > 0 && (!formData.company || !currentCompanyInList)) {
          onFieldChange("company", filteredCompanies[0].id)
        }
      } catch (err) {
        console.error("Error parsing selectedCompanies from localStorage:", err);
        setUserCompanies([])
      }
    }

    loadAddresses()
    loadUsersCompanies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.contactId, companies])

  // Listener para cambios en localStorage (tiempo real entre tabs y misma tab)
  useEffect(() => {
    const handleCompaniesChange = (selectedIds?: string[]) => {
      if (!selectedIds || selectedIds.length === 0) {
        setUserCompanies([])
        return
      }

      const filteredCompanies = companies.filter((c) =>
        selectedIds.includes(c.id) || ((c as any)._id && selectedIds.includes((c as any)._id))
      );
      setUserCompanies(filteredCompanies)

      // Auto-seleccionar si la actual no está en la nueva lista
      const currentCompanyInList = filteredCompanies.some(c => c.id === formData.company)
      if (filteredCompanies.length > 0 && (!formData.company || !currentCompanyInList)) {
        onFieldChange("company", filteredCompanies[0].id)
      }
    }

    // Listener para cambios en la misma tab (custom event)
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent
      
      let selectedIds: string[] = [];
      const detail = customEvent.detail
      
      if (Array.isArray(detail)) {
        selectedIds = detail.map((p: any) => typeof p === 'string' ? p : (p?.id ?? p?._id ?? String(p)));
      } else if (detail && typeof detail === "object") {
        selectedIds = [detail.id ?? detail._id].filter(Boolean) as string[];
      } else if (typeof detail === "string") {
        selectedIds = [detail];
      }

      handleCompaniesChange(selectedIds)
    }

    // Listener para cambios entre tabs (storage event)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "selectedCompanies" && companies.length > 0) {
        
        const userCompaniesRaw = e.newValue;
        if (!userCompaniesRaw) {
          setUserCompanies([])
          return
        }

        try {
          const parsed = JSON.parse(userCompaniesRaw);
          let selectedIds: string[] = [];
          
          if (Array.isArray(parsed)) {
            selectedIds = parsed.map((p: any) => p?.id ?? p?._id ?? String(p));
          } else if (parsed && typeof parsed === "object") {
            selectedIds = [parsed.id ?? parsed._id].filter(Boolean) as string[];
          } else if (typeof parsed === "string") {
            selectedIds = [parsed];
          }

          handleCompaniesChange(selectedIds)
        } catch (err) {
          console.error("Error in storage listener:", err);
          setUserCompanies([])
        }
      }
    }

    window.addEventListener("selectedCompaniesChanged", handleCustomEvent)
    window.addEventListener("storage", handleStorageChange)
    
    return () => {
      window.removeEventListener("selectedCompaniesChanged", handleCustomEvent)
      window.removeEventListener("storage", handleStorageChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, formData.company])

  const handleContactSelect = async (contact: Contact) => {
    setShowContactModal(false)
    
    // Actualizar datos del contacto
    onFieldChange("clientName", contact.full_name)
    onFieldChange("contactId", contact.id)
    if (contact.email) {
      onFieldChange("clientEmail", contact.email)
    }
    if (contact.phone || contact.mobile) {
      onFieldChange("clientPhone", contact.phone || contact.mobile || "")
    }

    // Cargar direcciones automáticamente
    setIsLoadingAddresses(true)
    try {
      const { addresses, error } = await getContactAddresses(contact.id)
      if (!error && addresses && addresses.length > 0) {
        setClientAddresses(addresses)
        // Seleccionar la primera dirección automáticamente
        const firstAddress = addresses[0]
        const fullAddress = `${firstAddress.street} #${firstAddress.exterior_number}${
          firstAddress.interior_number ? ` Int. ${firstAddress.interior_number}` : ''
        }, ${firstAddress.neighborhood}, CP: ${firstAddress.postal_code}`
        
        onFieldChange("deliveryAddress", fullAddress)
        setSelectedAddressId(firstAddress.id)
        setIsEditingManually(false)
        
        // Notificar si la dirección es temporal
        if (firstAddress.isTemporary && onPendingAddressesChange) {
          onPendingAddressesChange(firstAddress)
        } else if (onPendingAddressesChange) {
          onPendingAddressesChange(null)
        }
      } else {
        setClientAddresses([])
        setIsEditingManually(true)
      }
    } catch (error) {
      console.error("Error cargando direcciones:", error)
      setClientAddresses([])
      setIsEditingManually(true)
    } finally {
      setIsLoadingAddresses(false)
    }
  }

  const handleClearClient = () => {
    if (onClearClient) {
      onClearClient()
    }
    onFieldChange("contactId", "")
    onFieldChange("clientEmail", "")
    onFieldChange("clientPhone", "")
    setClientAddresses([])
    setSelectedAddressId(null)
    onFieldChange("deliveryAddress", "")
    setIsEditingManually(false)
  }

  const handleAddressAdded = (address: {
    id: string
    street: string
    exterior_number: string
    interior_number?: string
    neighborhood: string
    postal_code: string
    full_address: string
  }) => {
    // Si estamos editando una dirección existente
    if (addressToEdit) {
      const updatedAddress: AddressData = {
        id: addressToEdit.id, // Mantener el mismo ID
        street: address.street,
        exterior_number: address.exterior_number,
        interior_number: address.interior_number,
        neighborhood: address.neighborhood,
        postal_code: address.postal_code,
        isTemporary: addressToEdit.isTemporary, // Mantener el estado temporal
      }
      
      // Actualizar en la lista de direcciones visibles
      setClientAddresses(prev => 
        prev.map(addr => addr.id === addressToEdit.id ? updatedAddress : addr)
      )
      
      // Actualizar en las direcciones pendientes si es temporal
      if (addressToEdit.isTemporary) {
        const updatedPending = pendingAddresses.map(addr => 
          addr.id === addressToEdit.id ? updatedAddress : addr
        )
        setPendingAddresses(updatedPending)
        
        // Notificar al padre solo si esta es la dirección seleccionada
        if (selectedAddressId === addressToEdit.id && onPendingAddressesChange) {
          onPendingAddressesChange(updatedAddress)
        }
      }
      
      // Si la dirección editada era la seleccionada, actualizar el campo
      if (selectedAddressId === addressToEdit.id) {
        onFieldChange("deliveryAddress", address.full_address)
      }
      
      setAddressToEdit(null)
    } else {
      // Crear nueva dirección temporal (no guardada en BD aún)
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newAddress: AddressData = {
        id: tempId,
        street: address.street,
        exterior_number: address.exterior_number,
        interior_number: address.interior_number,
        neighborhood: address.neighborhood,
        postal_code: address.postal_code,
        isTemporary: true,
      }
      
      // Agregar a la lista de direcciones temporales
      const updatedPending = [...pendingAddresses, newAddress]
      setPendingAddresses(updatedPending)
      
      // Notificar al componente padre (esta es la dirección seleccionada)
      if (onPendingAddressesChange) {
        onPendingAddressesChange(newAddress)
      }
      
      // Agregar a la lista visible
      setClientAddresses(prev => [newAddress, ...prev])
      setSelectedAddressId(tempId)
      onFieldChange("deliveryAddress", address.full_address)
    }
    
    setShowAddressDropdown(false)
    setIsEditingManually(false)
  }

  const handleSelectAddress = (address: AddressData) => {
    const fullAddress = `${address.street} #${address.exterior_number}${
      address.interior_number ? ` Int. ${address.interior_number}` : ''
    }, ${address.neighborhood}, CP: ${address.postal_code}`
    
    setSelectedAddressId(address.id)
    onFieldChange("deliveryAddress", fullAddress)
    setShowAddressDropdown(false)
    setIsEditingManually(false)
    
    // Notificar al padre si es una dirección temporal
    if (address.isTemporary && onPendingAddressesChange) {
      onPendingAddressesChange(address)
    } else if (onPendingAddressesChange) {
      // Si no es temporal, no hay nada que guardar
      onPendingAddressesChange(null)
    }
  }

  const handleEditManually = () => {
    // Encontrar la dirección seleccionada
    const selectedAddress = clientAddresses.find(addr => addr.id === selectedAddressId)
    if (selectedAddress) {
      setAddressToEdit(selectedAddress)
      setShowAddAddressModal(true)
      setShowAddressDropdown(false)
    }
  }

  const handleManualAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange("deliveryAddress", e.target.value)
    setSelectedAddressId(null) // Cuando editas manualmente, no hay dirección seleccionada
  }

  // Función para renderizar la vista de dirección actual
  const renderAddressDisplay = () => {
    if (isLoadingAddresses && formData.contactId) {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando direcciones...
        </div>
      )
    }

    if (!formData.deliveryAddress || isEditingManually) {
      return (
        <div className="text-sm text-gray-400">
          {formData.contactId ? "Seleccionar dirección..." : "Escribe la dirección..."}
        </div>
      )
    }

    return (
      <div className="space-y-1">
        <p className="text-sm text-gray-200 truncate">{formData.deliveryAddress}</p>
        {selectedAddressId && (
          <p className="text-xs text-yellow-400 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Dirección guardada
          </p>
        )}
      </div>
    )
  }

  // Renderizar controles de dirección según el estado
  const renderAddressControls = () => {
    // Si hay contacto seleccionado y direcciones disponibles
    if (formData.contactId && clientAddresses.length > 0 && !isEditingManually) {
      return (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAddressDropdown(!showAddressDropdown)}
            className="w-full flex items-center justify-between p-3 border border-yellow-400/30 bg-yellow-400/5 hover:bg-yellow-400/10 rounded-lg text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <MapPin className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {renderAddressDisplay()}
              </div>
            </div>
            
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
              showAddressDropdown ? 'rotate-180' : ''
            }`} />
          </button>

          {/* Dropdown de direcciones */}
          {showAddressDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-[#0A0F17] border border-gray-700 rounded-lg shadow-xl max-h-50 overflow-y-auto">
              <div className="p-2">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-sm font-medium text-gray-300">
                    Direcciones guardadas
                  </span>
                  <div className="flex gap-2">
                    {/* <button
                      onClick={() => {
                        onFieldChange("deliveryAddress", "")
                        setSelectedAddressId(null)
                        setShowAddressDropdown(false)
                      }}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Borrar
                    </button> */}
                    <button
                      onClick={handleEditManually}
                      className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Editar
                    </button>
                  </div>
                </div>
                {clientAddresses.map((address) => (
                  <button
                    key={address.id}
                    onClick={() => handleSelectAddress(address)}
                    className={`w-full text-left p-2 rounded text-sm transition-colors hover:bg-yellow-400/10 ${
                      selectedAddressId === address.id
                        ? "bg-yellow-400/20 text-yellow-300"
                        : "text-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-4 h-4 rounded-full border mt-0.5 flex-shrink-0 ${
                        selectedAddressId === address.id
                          ? "border-yellow-400 bg-yellow-400"
                          : "border-gray-600"
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {address.street} #{address.exterior_number}
                          {address.interior_number && ` Int. ${address.interior_number}`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {address.neighborhood}, CP: {address.postal_code}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400" />
          <Input
            type="text"
            value={formData.deliveryAddress}
            onChange={handleManualAddressChange}
            placeholder={isEditingManually ? "Escribe la dirección de entrega..." : "No hay direcciones aún"}
            disabled={!isEditingManually}
            className="pl-10 bg-[#0A0F17] border-gray-700 text-gray-200 placeholder-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        
        {formData.contactId && clientAddresses.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsEditingManually(false)}
              className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Cancelar edición
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Cliente - Ahora con modal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">
              Cliente <span className="text-red-400">*</span>
            </label>
            {formData.clientName && onClearClient && (
              <button
                type="button"
                onClick={handleClearClient}
                className="text-gray-400 hover:text-red-400 transition-colors p-1"
                title="Limpiar cliente"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="relative">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className={`flex-1 text-left flex items-center gap-2 px-3 py-2 bg-[#0A0F17] border rounded-lg transition-colors ${
                  errors.clientName 
                    ? 'border-red-500 hover:border-red-400' 
                    : 'border-gray-700 hover:border-yellow-400'
                }`}
              >
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {formData.clientName ? (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-200 truncate">
                      {formData.clientName}
                    </div>
                    {(formData.clientEmail || formData.clientPhone) && (
                      <div className="text-xs text-gray-400 truncate">
                        {formData.clientEmail} {formData.clientPhone && '•'} {formData.clientPhone}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-500">
                    Buscar cliente...
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowCreateContactModal(true)}
                title="Agregar cliente"
                className="inline-flex items-center justify-center p-2 rounded-md bg-yellow-400/10 hover:bg-yellow-400/20 border border-transparent text-yellow-300 hover:text-yellow-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {errors.clientName && (
              <p className="text-sm text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                {errors.clientName}
              </p>
            )}
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Válida Desde
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="date"
                value={formData.validFrom}
                onChange={(e) => handleDateChange("validFrom", e.target.value)}
                className="pl-10 bg-[#0A0F17] border-gray-700 text-gray-200 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Válida Hasta <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="date"
                value={formData.validUntil}
                onChange={(e) => handleDateChange("validUntil", e.target.value)}
                placeholder="Seleccionar fecha"
                className={`pl-10 bg-[#0A0F17] border-gray-700 text-gray-200 placeholder-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 ${
                  errors.validUntil ? 'border-red-500' : ''
                }`}
                min={formData.validFrom}
              />
            </div>
            {errors.validUntil && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.validUntil}
              </p>
            )}
          </div>
        </div>

        {/* Sucursal */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            Sucursal <span className="text-red-400">*</span>
          </label>
          
          {isLoadingCompanies ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0A0F17] border border-gray-700 rounded-lg">
              {/* <div className="w-4 h-4 bg-gray-700 rounded animate-pulse"></div> */}
              <Loader2 className="animate animate-spin text-amber-400"></Loader2>
              <span className="text-sm text-gray-400">Cargando sucursales...</span>
            </div>
          ) : (
            <>
              {(() => {
                const displayedCompanies = userCompanies.length > 0 ? userCompanies : companies
                return (
                  <Select 
                    value={formData.company} 
                    onValueChange={(value) => onFieldChange("company", value)}
                    disabled={displayedCompanies.length === 0}
                  >
                    <SelectTrigger className={`w-full py-6 bg-[#0A0F17] border-gray-700 text-gray-200 hover:bg-[#0F172A] hover:border-gray-600 disabled:opacity-50 ${
                      errors.company ? 'border-red-500' : ''
                    }`}>
                      <SelectValue placeholder={displayedCompanies.length === 0 ? "No hay compañías disponibles" : "Seleccionar compañía..."} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0F17] border-gray-700 max-h-60 w-full">
                      {displayedCompanies.map((company) => (
                        <SelectItem 
                          key={company.id} 
                          value={company.id}
                          className="text-gray-300 hover:bg-yellow-400/10 hover:text-yellow-300 focus:bg-yellow-400/20 focus:text-yellow-300"
                        >
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-medium truncate max-w-full">{company.name}</span>
                              {company.rfc && (
                                <span className="text-xs text-gray-400">RFC: {company.rfc}</span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              })()}
              
              {companies.length === 0 && !isLoadingCompanies && (
                <p className="text-sm text-yellow-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  No hay compañías disponibles. Contacta al administrador.
                </p>
              )}
              
              {errors.company && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.company}
                </p>
              )}
            </>
          )}
        </div>

        {/* Dirección de Entrega - CON SELECTOR DE DIRECCIONES */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">
              Dirección de Entrega <span className="text-red-400">*</span>
            </label>
            <button
              type="button"
              onClick={() => {
                if (!formData.contactId) {
                  toast.error("Primero debes seleccionar un cliente")
                  return
                }
                setShowAddAddressModal(true)
              }}
              className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              {formData.deliveryAddress ? "Nuevo" : "Agregar"}
            </button>
          </div>
          
          {renderAddressControls()}

          {!formData.contactId && formData.deliveryAddress && (
            <p className="text-xs text-gray-400">
              Dirección guardada localmente (no vinculada a un contacto)
            </p>
          )}

          {errors.deliveryAddress && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.deliveryAddress}
            </p>
          )}
        </div>
      </div>

      {/* Modal para seleccionar contacto */}
      <SelectContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        onSelectContact={handleContactSelect}
      />

      {/* Modal para agregar dirección */}
      {formData.contactId && (
        <AddAddressModal
          isOpen={showAddAddressModal}
          onClose={() => {
            setShowAddAddressModal(false)
            setAddressToEdit(null)
          }}
          contactId={formData.contactId}
          contactName={formData.clientName}
          contactPhone={formData.clientPhone}
          contactEmail={formData.clientEmail}
          onAddressAdded={handleAddressAdded}
          initialAddress={addressToEdit ? {
            street: addressToEdit.street,
            exterior_number: addressToEdit.exterior_number,
            interior_number: addressToEdit.interior_number,
            neighborhood: addressToEdit.neighborhood,
            postal_code: addressToEdit.postal_code,
          } : undefined}
        />
      )}
      {/* Modal para crear contacto */}
      <CreateContactModal
        isOpen={showCreateContactModal}
        onClose={() => setShowCreateContactModal(false)}
        onCreated={(contact) => {
          onFieldChange("clientName", contact.full_name)
          onFieldChange("contactId", contact.id)
          if (contact.email) onFieldChange("clientEmail", contact.email)
          if (contact.phone || contact.mobile) onFieldChange("clientPhone", contact.phone || contact.mobile || "")
        }}
      />
    </>
  )
}