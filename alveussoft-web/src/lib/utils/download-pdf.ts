"use client"

export function downloadInvoicePDF(pdfBase64: string, orderNumber: string) {
  try {
    const pdfBlob = new Blob([Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0))], { type: "application/pdf" })
    const pdfUrl = URL.createObjectURL(pdfBlob)
    const aPdf = document.createElement("a")
    aPdf.href = pdfUrl
    aPdf.download = `factura-${orderNumber}.pdf`
    aPdf.click()
    URL.revokeObjectURL(pdfUrl)

    return { ok: true }
  } catch (err: any) {
    console.error("Error descargar factura PDF:", err)
    return { ok: false, error: "Error al descargar PDF" }
  }
}
