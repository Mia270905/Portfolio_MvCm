import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export interface BillingData {
  rfc: string
  name: string
  cfdi_use: string
  tax_regime: string
  zip_code: string
  email: string
  street?: string
  exterior_number?: string
  interior_number?: string
  neighborhood?: string
  locality?: string
  municipality?: string
  state?: string
  country: string
  num_reg_id_trib?: string
  tax_residence?: string
}

interface BillingDataFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: BillingData) => void
  initialData?: BillingData | null
  userID: string
}

const CFDI_USES = [
  { value: "G01", label: "G01 - Adquisición de mercancías" },
  { value: "G02", label: "G02 - Devoluciones, descuentos o bonificaciones" },
  { value: "G03", label: "G03 - Gastos en general" },
  { value: "I01", label: "I01 - Construcciones" },
  { value: "I02", label: "I02 - Mobilario y equipo de oficina" },
  { value: "I03", label: "I03 - Equipo de transporte" },
  { value: "I04", label: "I04 - Equipo de cómputo" },
  { value: "I05", label: "I05 - Dados, troqueles, moldes" },
  { value: "I06", label: "I06 - Comunicaciones telefónicas" },
  { value: "I07", label: "I07 - Comunicaciones satelitales" },
  { value: "I08", label: "I08 - Otra maquinaria y equipo" },
  { value: "D01", label: "D01 - Honorarios médicos" },
  { value: "D02", label: "D02 - Gastos médicos por incapacidad" },
  { value: "D03", label: "D03 - Gastos funerales" },
  { value: "D04", label: "D04 - Donativos" },
  { value: "D05", label: "D05 - Intereses reales por créditos hipotecarios" },
  { value: "D06", label: "D06 - Aportaciones voluntarias al SAR" },
  { value: "D07", label: "D07 - Primas por seguros de gastos médicos" },
  { value: "D08", label: "D08 - Gastos de transportación escolar" },
  { value: "D09", label: "D09 - Depósitos en cuentas para el ahorro" },
  { value: "D10", label: "D10 - Pagos por servicios educativos" },
  { value: "P01", label: "P01 - Por definir" },
]

const TAX_REGIMES = [
  { value: "601", label: "601 - General de Ley Personas Morales" },
  { value: "603", label: "603 - Personas Morales con Fines no Lucrativos" },
  { value: "605", label: "605 - Sueldos y Salarios e Ingresos Asimilados a Salarios" },
  { value: "606", label: "606 - Arrendamiento" },
  { value: "607", label: "607 - Régimen de Enajenación o Adquisición de Bienes" },
  { value: "608", label: "608 - Demás ingresos" },
  { value: "610", label: "610 - Residentes en el Extranjero sin Establecimiento Permanente en México" },
  { value: "611", label: "611 - Ingresos por Dividendos (socios y accionistas)" },
  { value: "612", label: "612 - Personas Físicas con Actividades Empresariales y Profesionales" },
  { value: "614", label: "614 - Ingresos por intereses" },
  { value: "615", label: "615 - Régimen de los ingresos por obtención de premios" },
  { value: "616", label: "616 - Sin obligaciones fiscales" },
  { value: "620", label: "620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos" },
  { value: "621", label: "621 - Incorporación Fiscal" },
  { value: "622", label: "622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
  { value: "623", label: "623 - Opcional para Grupos de Sociedades" },
  { value: "624", label: "624 - Coordinados" },
  { value: "625", label: "625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas" },
  { value: "626", label: "626 - Régimen Simplificado de Confianza" },
]

export function BillingDataForm({ isOpen, onClose, onSave, initialData, userID }: BillingDataFormProps) {
  const [formData, setFormData] = useState<BillingData>(
    initialData || {
      rfc: "",
      name: "",
      cfdi_use: "G03",
      tax_regime: "612",
      zip_code: "",
      email: "",
      street: "",
      exterior_number: "",
      interior_number: "",
      neighborhood: "",
      locality: "",
      municipality: "",
      state: "",
      country: "MEX",
      num_reg_id_trib: "",
      tax_residence: "",
    }
  )

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Campos obligatorios
    if (!formData.rfc.trim()) {
      newErrors.rfc = "El RFC es obligatorio"
    } else if (formData.rfc.length < 12 || formData.rfc.length > 13) {
      newErrors.rfc = "El RFC debe tener 12 o 13 caracteres"
    }

    if (!formData.name.trim()) {
      newErrors.name = "El nombre/razón social es obligatorio"
    }

    if (!formData.cfdi_use) {
      newErrors.cfdi_use = "El uso de CFDI es obligatorio"
    }

    if (!formData.tax_regime) {
      newErrors.tax_regime = "El régimen fiscal es obligatorio"
    }

    if (!formData.zip_code.trim()) {
      newErrors.zip_code = "El código postal es obligatorio"
    } else if (!/^\d{5}$/.test(formData.zip_code)) {
      newErrors.zip_code = "El código postal debe tener 5 dígitos"
    }

    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El correo electrónico no es válido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (validateForm()) {
    try {
      // Opcional: actualizar estado en el componente padre
      onSave(formData)
      onClose()
    } catch (err) {
      console.error(err)
    }
  }
}


  const handleChange = (field: keyof BillingData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Limpiar error del campo al editarlo
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Datos de Facturación</DialogTitle>
          <DialogDescription>
            Ingresa tus datos fiscales para poder solicitar tu factura. Todos los campos marcados con * son
            obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos Fiscales Principales */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">Datos Fiscales Principales</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rfc" className="text-neutral-700">
                  RFC *
                </Label>
                <Input
                  id="rfc"
                  value={formData.rfc}
                  onChange={(e) => handleChange("rfc", e.target.value.toUpperCase())}
                  placeholder="XAXX010101000"
                  maxLength={13}
                  className={errors.rfc ? "border-red-500" : ""}
                />
                {errors.rfc && <p className="text-sm text-red-600">{errors.rfc}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-700">
                  Correo Electrónico *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-neutral-700">
                Nombre / Razón Social *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Nombre completo o razón social"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cfdi_use" className="text-neutral-700">
                  Uso de CFDI *
                </Label>
                <Select value={formData.cfdi_use} onValueChange={(value) => handleChange("cfdi_use", value)}>
                  <SelectTrigger className={`${
      errors.cfdi_use ? "border-red-500" : ""
    } truncate w-full text-ellipsis whitespace-nowrap`}>
                    <SelectValue placeholder="Selecciona un uso" />
                  </SelectTrigger>
                  <SelectContent className="w-80 h-52">
                    {CFDI_USES.map((use) => (
                      <SelectItem key={use.value} value={use.value}>
                        {use.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cfdi_use && <p className="text-sm text-red-600">{errors.cfdi_use}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_regime" className="text-neutral-700">
                  Régimen Fiscal *
                </Label>
                <Select value={formData.tax_regime} onValueChange={(value) => handleChange("tax_regime", value)}>
                  <SelectTrigger className={`${
      errors.tax_regime ? "border-red-500" : ""
    } truncate w-full text-ellipsis whitespace-nowrap`}>
                    <SelectValue placeholder="Selecciona un régimen" />
                  </SelectTrigger>
                  <SelectContent className="w-80 h-52">
                    {TAX_REGIMES.map((regime) => (
                      <SelectItem key={regime.value} value={regime.value}>
                        {regime.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tax_regime && <p className="text-sm text-red-600">{errors.tax_regime}</p>}
              </div>
            </div>
          </div>

          <Separator />

          {/* Domicilio Fiscal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">Domicilio Fiscal</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zip_code" className="text-neutral-700">
                  Código Postal *
                </Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => handleChange("zip_code", e.target.value.replace(/\D/g, ""))}
                  placeholder="12345"
                  maxLength={5}
                  className={errors.zip_code ? "border-red-500" : ""}
                />
                {errors.zip_code && <p className="text-sm text-red-600">{errors.zip_code}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-neutral-700">
                  País
                </Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value.toUpperCase())}
                  placeholder="MEX"
                  maxLength={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="street" className="text-neutral-700">
                  Calle
                </Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleChange("street", e.target.value)}
                  placeholder="Nombre de la calle"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exterior_number" className="text-neutral-700">
                  Número Exterior
                </Label>
                <Input
                  id="exterior_number"
                  value={formData.exterior_number}
                  onChange={(e) => handleChange("exterior_number", e.target.value)}
                  placeholder="123"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interior_number" className="text-neutral-700">
                  Número Interior
                </Label>
                <Input
                  id="interior_number"
                  value={formData.interior_number}
                  onChange={(e) => handleChange("interior_number", e.target.value)}
                  placeholder="Depto. 4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood" className="text-neutral-700">
                  Colonia
                </Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => handleChange("neighborhood", e.target.value)}
                  placeholder="Nombre de la colonia"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locality" className="text-neutral-700">
                  Localidad
                </Label>
                <Input
                  id="locality"
                  value={formData.locality}
                  onChange={(e) => handleChange("locality", e.target.value)}
                  placeholder="Ciudad"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="municipality" className="text-neutral-700">
                  Municipio
                </Label>
                <Input
                  id="municipality"
                  value={formData.municipality}
                  onChange={(e) => handleChange("municipality", e.target.value)}
                  placeholder="Municipio"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-neutral-700">
                  Estado
                </Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="Estado"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Datos para Clientes Extranjeros */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">Datos para Clientes Extranjeros (Opcional)</h3>
            <p className="text-xs text-neutral-600">Solo completar si aplica para clientes fuera de México</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="num_reg_id_trib" className="text-neutral-700">
                  Número de Registro Fiscal
                </Label>
                <Input
                  id="num_reg_id_trib"
                  value={formData.num_reg_id_trib}
                  onChange={(e) => handleChange("num_reg_id_trib", e.target.value)}
                  placeholder="Registro fiscal extranjero"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_residence" className="text-neutral-700">
                  Residencia Fiscal
                </Label>
                <Input
                  id="tax_residence"
                  value={formData.tax_residence}
                  onChange={(e) => handleChange("tax_residence", e.target.value)}
                  placeholder="País de residencia"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Guardar Datos
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
