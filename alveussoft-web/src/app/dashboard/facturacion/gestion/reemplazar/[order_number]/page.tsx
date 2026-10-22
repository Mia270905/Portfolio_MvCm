import CancelInvoiceForm from "./cancel-invoice-form"
import { getOrderBasicInfo } from "@/lib/actions/cancel-invoice.actions"
import { notFound } from "next/navigation"

interface CancelInvoicePageProps {
  params: Promise<{
    order_number: string
  }>
}

export default async function CancelInvoicePage({ params }: CancelInvoicePageProps) {
  // Desestructurar los params después de await
  const { order_number } = await params
  const orderNumber = order_number
  
  // Verificar que la orden existe y está facturada
  const orderInfo = await getOrderBasicInfo(orderNumber)
  
  
  
  if (!orderInfo) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cancelar Factura - Orden #{orderNumber}</h1>
        <p className="text-gray-600 mt-2">
          Complete el formulario para remplazar la factura. Todos los campos son requeridos.
        </p>
      </div>
      
      <CancelInvoiceForm 
        orderNumber={orderNumber}
      />
    </div>
  )
}