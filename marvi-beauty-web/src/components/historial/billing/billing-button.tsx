import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle2 } from "lucide-react"
import { BillingDataForm } from "@/components/historial/billing/billing-data-form"
import { toast } from "sonner"
import { getBillingData, saveBillingInfo } from "@/lib/actions/billing.actions"

interface BillingData {
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

interface BillingButtonProps {
  orderId: string
  userID: string
  className?: string
}

export function BillingButton({ orderId, userID, className }: BillingButtonProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [isRequestingInvoice, setIsRequestingInvoice] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar datos desde Supabase
  useEffect(() => {
    if (!userID) return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const data = await getBillingData(userID)
        if (data) setBillingData(data)
      } catch (err) {
        toast.error("No se pudieron cargar los datos de facturación")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [userID])

  const handleSaveBillingData = async (data: BillingData) => {
    try {
      await saveBillingInfo(userID, data)
      setBillingData(data)
      toast.success("Datos de facturación guardados correctamente")
    } catch {
      toast.error("No se pudieron guardar los datos de facturación")
    }
  }

  const handleRequestInvoice = async () => {
    if (!billingData) return
    setIsRequestingInvoice(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success("Factura solicitada correctamente", {
        description: "Recibirás tu factura en tu correo electrónico en las próximas horas.",
      })
      localStorage.setItem(`invoice_requested_${orderId}`, "true")
    } catch (error) {
      console.error(error)
      toast.error("Error al solicitar la factura", {
        description: "Por favor, intenta nuevamente más tarde.",
      })
    } finally {
      setIsRequestingInvoice(false)
    }
  }

  const hasRequestedInvoice = () => {
    return localStorage.getItem(`invoice_requested_${orderId}`) === "true"
  }

  if (isLoading) {
  return (
    <div className="w-full flex justify-center items-center p-4">
      <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
    </div>
  )
}


  return (
    <>
      {!billingData ? (
        <Button
          variant="outline"
          className={`w-full border-neutral-300 hover:bg-neutral-100 transition-colors ${className}`}
          onClick={() => setIsFormOpen(true)}
        >
          <FileText className="w-4 h-4 mr-2" />
          Agregar Datos de Facturación
        </Button>
      ) : hasRequestedInvoice() ? (
        <div className="w-full p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Factura solicitada</p>
              <p className="text-xs text-green-700 mt-1">
                Tu factura será enviada a <span className="font-semibold">{billingData.email}</span>
              </p>
            </div>
          </div>
          <Button
            variant="link"
            className="w-full mt-2 text-green-700 hover:text-green-800 text-xs h-auto p-0"
            onClick={() => setIsFormOpen(true)}
          >
            Editar datos de facturación
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            className={`w-full bg-primary hover:bg-primary/90 text-primary-foreground ${className}`}
            onClick={handleRequestInvoice}
            disabled={isRequestingInvoice}
          >
            <FileText className="w-4 h-4 mr-2" />
            {isRequestingInvoice ? "Solicitando..." : "Solicitar Factura"}
          </Button>
          <Button
            variant="link"
            className="w-full text-neutral-600 hover:text-neutral-800 text-xs h-auto p-0"
            onClick={() => setIsFormOpen(true)}
          >
            Editar datos de facturación
          </Button>
        </div>
      )}

      <BillingDataForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveBillingData}
        initialData={billingData}
        userID={userID}
      />
    </>
  )
}