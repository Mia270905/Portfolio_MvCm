"use client"

export function downloadInvoiceXML(xmlBase64: string, orderNumber: string) {
  try {
    const xmlBlob = new Blob([Uint8Array.from(atob(xmlBase64), (c) => c.charCodeAt(0))], { type: "text/xml" })
    const xmlUrl = URL.createObjectURL(xmlBlob)
    const aXml = document.createElement("a")
    aXml.href = xmlUrl
    aXml.download = `factura-${orderNumber}.xml`
    aXml.click()
    URL.revokeObjectURL(xmlUrl)

    return { ok: true }
  } catch (err: any) {
    console.error("Error descargar XML:", err)
    return { ok: false, error: "Error al descargar XML" }
  }
}
