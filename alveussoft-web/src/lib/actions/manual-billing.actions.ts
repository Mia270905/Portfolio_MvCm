"use server"

import { createClient } from "@/lib/supabase/server"

export interface Product {
  id: string
  code: string
  name: string
  description: string | null
  cost_price: number
  taxes: Array<{
    id: string
    name: string
    rate: number
    tax_type: string
    sat_tax_type: string
  }>
}

export interface ImpuestoCalculado {
  id: string
  name: string
  rate: number
  amount: number
  tax_type: string
}

export interface ProductoConImpuestos {
  id: string
  productCode: string
  nombre: string
  cantidad: number
  precioUnitario: number
  descuento: number
  subtotal: number
  total: number
  tieneImpuestos: boolean
  impuestos?: ImpuestoCalculado[]
}

export interface ManualInvoiceData {
  paymentType: string
  rfc: string
  razonSocial: string
  calle: string
  colonia: string
  numeroInterior: string
  numeroExterior: string
  ciudad: string
  codigoPostalFiscal: string
  usoCFDI: string
  regimenFiscal: string
  costoEnvio: number

  company?: string
  descuentoGeneral?: number

  productos: ProductoConImpuestos[]

  // 🔹 AGREGAR ESTO
  logo_url?: string

  sucursal?: {
    id?: string
    name: string
    street?: string
    address_number?: string
    colony?: string
    city?: string
    state?: string
    zip_code?: string
    phone?: string
    cellphone?: string
    logo_url?: string
  } | null
}

export interface DraftInvoice {
  company_id: string | null
  id: string
  rfc: string
  name: string
  tax_regime: string
  cfdi_use: string
  street: string
  exterior_number: string
  interior_number: string | null
  neighborhood: string
  city: string
  zip_code: string
  payment_type: "efectivo" | "transferencia"
  shipping_cost: number
  subtotal: number
  total: number
  id_facturama: string | null
  created_at: string
  created_by: string
  updated_at: string | null
  updated_by: string | null
}

export async function getDraftInvoices() {
  try {
    const supabase = await createClient()

    // 1️⃣ Primero obtenemos todas las facturas manuales
    const { data: invoices, error: invError } = await supabase
      .from("manual_billing")
      .select("*")
      .order("created_at", { ascending: false })

    if (invError) throw invError

    // 2️⃣ Obtenemos los nombres de todas las compañías para poder mapearlos
    const { data: companies, error: compError } = await supabase
      .from("companies")
      .select("id, name")

    if (compError) {
      console.error("Error al obtener compañías:", compError)
      // Si fallan las compañías, devolvemos las facturas solas para no romper la app
      return {
        success: true,
        drafts: invoices as DraftInvoice[],
      }
    }

    // 3️⃣ Unimos los datos manualmente (Mapeo)
    // Creamos un objeto donde la llave es el ID de la empresa para que sea ultra rápido
    const draftsWithCompany = invoices.map((invoice) => {
      const companyInfo = companies.find((c) => c.id === invoice.company_id);
      return {
        ...invoice,
        company: companyInfo ? { name: companyInfo.name } : { name: "" }
      }
    })

    return {
      success: true,
      drafts: draftsWithCompany as DraftInvoice[],
    }

  } catch (error) {
    console.error("Error fetching invoices:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener las facturas",
      drafts: [],
    }
  }
}

export async function getDraftInvoiceById(id: string) {
  try {
    const supabase = await createClient()

    const { data: draft, error: draftError } = await supabase
      .from("manual_billing")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (draftError) {
      console.error("❌ Error manual_billing:", draftError)
      return { success: false, error: draftError.message, draft: null, invoiceData: null }
    }

    if (!draft) {
      console.warn("⚠️ No se encontró el borrador")
      return { success: false, error: "Borrador no encontrado", draft: null, invoiceData: null }
    }

    console.log("Draft company_id:", draft.company_id)

    // OBTENER EMPRESA
    let companyData = null

    if (draft.company_id) {
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select(`
          id,
          name,
          logo_url,
          street,
          address_number,
          colony,
          city,
          state,
          zip_code,
          phone,
          cellphone
        `)
        .eq("id", draft.company_id)
        .maybeSingle()

      if (companyError) {
        console.error("⚠️ Error company:", companyError)
      } else {
        companyData = company
      }
    }

    console.log("Company encontrada:", companyData)

    // PRODUCTOS
    const { data: draftProducts, error: productsError } = await supabase
      .from("manual_billing_product")
      .select(`
        *,
        products:product_id (
          id,
          code,
          name,
          description
        )
      `)
      .eq("id_manual_billing", id)

    if (productsError) {
      console.error("❌ Error productos:", productsError)
      throw productsError
    }

    const productsWithTaxes = await Promise.all(
      (draftProducts || []).map(async (dp: any) => {
        const { data: productTaxes } = await supabase
          .from("product_taxes")
          .select(`
            taxes:tax_id (
              id,
              name,
              rate,
              tax_type,
              sat_tax_type,
              is_active
            )
          `)
          .eq("product_id", dp.product_id)
          .is("deleted_at", null)

        const taxes =
          productTaxes
            ?.map((pt: any) => pt.taxes)
            .filter((tax: any) => tax && tax.is_active !== false) || []

        const subtotal = dp.subtotal || 0
        const quantity = dp.quantity || 0

        return {
          id: dp.product_id,
          productCode: dp.products?.code || "",
          nombre: dp.products?.name || "",
          cantidad: quantity,
          precioUnitario: dp.unit_price || 0,
          descuento: dp.discount || 0,
          subtotal: subtotal,
          total: dp.total || 0,
          tieneImpuestos: taxes.length > 0,
          impuestos: taxes.map((tax: any) => ({
            id: tax.id,
            name: tax.name,
            rate: tax.rate,
            amount:
              tax.tax_type === "percentage"
                ? subtotal * (tax.rate / 100)
                : (tax.rate || 0) * quantity,
            tax_type: tax.tax_type,
          })),
        }
      })
    )

    const invoiceData = {
      company: draft.company_id || "",

      // ESTA ES LA QUE USA EL PDF
      sucursal: companyData,

      logo_url: companyData?.logo_url || "",

      paymentType: draft.payment_type || "",
      rfc: draft.rfc || "",
      razonSocial: draft.name || "",
      calle: draft.street || "",
      colonia: draft.neighborhood || "",
      numeroInterior: draft.interior_number || "",
      numeroExterior: draft.exterior_number || "",
      ciudad: draft.city || "",
      codigoPostalFiscal: draft.zip_code || "",
      usoCFDI: draft.cfdi_use || "",
      regimenFiscal: draft.tax_regime || "",
      costoEnvio: Number(draft.shipping_cost) || 0,

      productos: productsWithTaxes,
    }

    console.log(
      "✅ Factura armada. Dirección:",
      companyData?.street,
      "Logo:",
      invoiceData.logo_url ? "Presente" : "Ausente"
    )

    return {
      success: true,
      draft,
      invoiceData,
    }
  } catch (error: any) {
    console.error("💥 Error crítico:", error)

    return {
      success: false,
      error: error.message || "Error inesperado",
      draft: null,
      invoiceData: null,
    }
  }
}

export async function getProductsForInvoice() {
  try {
    const supabase = await createClient()

    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        id,
        code,
        name,
        description,
        cost_price,
        is_available
      `,
      )
      .eq("is_available", true)
      .is("deleted_at", null)

    if (error) throw error

    const productsWithTaxes = await Promise.all(
      products.map(async (product) => {
        const { data: productTaxes } = await supabase
          .from("product_taxes")
          .select(
            `
            tax_id,
            taxes:tax_id (
              id,
              name,
              rate,
              tax_type,
              sat_tax_type
            )
          `,
          )
          .eq("product_id", product.id)
          .is("deleted_at", null)

        const taxes =
          productTaxes?.map((pt: any) => pt.taxes).filter((tax: any) => tax && tax.is_active !== false) || []

        return {
          ...product,
          taxes,
        }
      }),
    )

    return {
      success: true,
      products: productsWithTaxes as Product[],
    }
  } catch (error) {
    console.error("Error fetching products:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener los productos",
      products: null,
    }
  }
}

export async function createManualInvoice(invoiceData: ManualInvoiceData) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: "Usuario no autenticado",
      }
    }

    // Calcular subtotal (suma de todos los subtotales de productos)
    const subtotal = invoiceData.productos.reduce((sum, p) => sum + p.subtotal, 0)
    
    // Calcular total (suma de todos los totales de productos + costo de envío)
    const total = invoiceData.productos.reduce((sum, p) => sum + p.total, 0) + invoiceData.costoEnvio

    // Insert into manual_billing table
    const { data: manualBilling, error: billingError } = await supabase
      .from("manual_billing")
      .insert({
        company_id: invoiceData.company || null, // Asociar factura a la compañía seleccionada  
        rfc: invoiceData.rfc,
        name: invoiceData.razonSocial,
        tax_regime: invoiceData.regimenFiscal,
        cfdi_use: invoiceData.usoCFDI,
        street: invoiceData.calle,
        exterior_number: invoiceData.numeroExterior,
        interior_number: invoiceData.numeroInterior || null,
        neighborhood: invoiceData.colonia,
        city: invoiceData.ciudad,
        zip_code: invoiceData.codigoPostalFiscal,
        payment_type: invoiceData.paymentType,
        shipping_cost: invoiceData.costoEnvio,
        subtotal, 
        total,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (billingError) throw billingError

    const productInserts = invoiceData.productos.map((producto) => ({
      id_manual_billing: manualBilling.id,
      product_id: producto.id,
      quantity: producto.cantidad,
      unit_price: producto.precioUnitario,
      discount: producto.descuento,
      subtotal: producto.subtotal,
      tax_price: producto.total - producto.subtotal, 
      total: producto.total, 
    }))

    const { error: productsError } = await supabase.from("manual_billing_product").insert(productInserts)

    if (productsError) throw productsError

    return {
      success: true,
      message: "Borrador guardado exitosamente",
      invoice: {
        id: manualBilling.id,
        ...invoiceData,
        subtotal,
        total,
      },
    }
  } catch (error) {
    console.error("Error creating manual invoice:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al guardar el borrador",
    }
  }
}

export async function updateManualInvoice(id: string, invoiceData: ManualInvoiceData) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: "Usuario no autenticado",
      }
    }

    // Calcular subtotal (suma de todos los subtotales de productos)
    const subtotal = invoiceData.productos.reduce((sum, p) => sum + p.subtotal, 0)
    
    // Calcular total (suma de todos los totales de productos + costo de envío)
    const total = invoiceData.productos.reduce((sum, p) => sum + p.total, 0) + invoiceData.costoEnvio

    // Update manual_billing table
    const { data: manualBilling, error: billingError } = await supabase
      .from("manual_billing")
      .update({
        company_id: invoiceData.company || null, // Actualizar compañía asociada a la factura
        rfc: invoiceData.rfc,
        name: invoiceData.razonSocial,
        tax_regime: invoiceData.regimenFiscal,
        cfdi_use: invoiceData.usoCFDI,
        street: invoiceData.calle,
        exterior_number: invoiceData.numeroExterior,
        interior_number: invoiceData.numeroInterior || null,
        neighborhood: invoiceData.colonia,
        city: invoiceData.ciudad,
        zip_code: invoiceData.codigoPostalFiscal,
        payment_type: invoiceData.paymentType,
        shipping_cost: invoiceData.costoEnvio,
        subtotal, 
        total,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .is("id_facturama", null)
      .select()
      .single()

    if (billingError) throw billingError

    // Delete existing products
    const { error: deleteError } = await supabase.from("manual_billing_product").delete().eq("id_manual_billing", id)

    if (deleteError) throw deleteError

    // Insert new products con los valores ya calculados
    const productInserts = invoiceData.productos.map((producto) => ({
      id_manual_billing: manualBilling.id,
      product_id: producto.id,
      quantity: producto.cantidad,
      unit_price: producto.precioUnitario,
      discount: producto.descuento,
      subtotal: producto.subtotal, 
      tax_price: producto.total - producto.subtotal, 
      total: producto.total, 
    }))

    const { error: productsError } = await supabase.from("manual_billing_product").insert(productInserts)

    if (productsError) throw productsError

    return {
      success: true,
      message: "Borrador actualizado exitosamente",
      invoice: {
        id: manualBilling.id,
        ...invoiceData,
        subtotal,
        total,
      },
    }
  } catch (error) {
    console.error("Error updating manual invoice:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar el borrador",
    }
  }
}
export async function getDraftInvoicesTest() {
  try {
    const supabase = await createClient()

    // 1️⃣ Obtener el usuario logueado para filtrar
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log("❌ [Auth] No hay usuario para filtrar");
      return { success: false, error: "Usuario no autenticado", drafts: [] }
    }

    console.log("------------------------------------------");
    console.log("🚀 MODO PRODUCCIÓN: Trayendo facturas de manual_billing para:", user.id);

    // 2️⃣ Traemos solo las facturas del usuario actual (.eq("created_by", user.id))
    const { data: invoices, error: invError } = await supabase
      .from("manual_billing")
      .select("*")
      .eq("created_by", user.id) // <--- EL FILTRO CRUCIAL
      .order("created_at", { ascending: false })

    if (invError) {
      console.error("❌ Error al obtener manual_billing:", invError);
      throw invError;
    }

    // 3️⃣ Obtenemos las compañías para el mapeo
    const { data: companies, error: compError } = await supabase
      .from("companies")
      .select("id, name")

    if (compError) {
      console.error("⚠️ Error al obtener compañías:", compError);
    }

    // 4️⃣ Mapeo de datos usando tu interfaz DraftInvoice
    const draftsWithCompany = (invoices || []).map((invoice) => {
      const companyInfo = companies?.find((c) => c.id === invoice.company_id);
      return {
        ...invoice,
        company: companyInfo ? { name: companyInfo.name } : { name: "Sin Empresa" }
      }
    })

    // LOGS DE CONTROL PARA TI
    console.log(`📊 Facturas del usuario encontradas: ${draftsWithCompany.length}`);
    console.log("------------------------------------------");

    return {
      success: true,
      drafts: draftsWithCompany as DraftInvoice[],
    }

  } catch (error) {
    console.error("💥 Error en el proceso:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener las facturas",
      drafts: [],
    }
  }
}
export async function getManualInvoiceDetails(id: string) {
  try {
    const supabase = await createClient();

    // 1. Obtener la factura principal (sin el join de companies que falla)
    const { data: invoice, error: invoiceError } = await supabase
      .from("manual_billing")
      .select("*")
      .eq("id", id)
      .single();

    if (invoiceError) throw invoiceError;

    // 2. Obtener la empresa por separado (esto evita el error de relación)
    let companyData = null;
    if (invoice.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("*")
        .eq("id", invoice.company_id)
        .single();
      companyData = company;
    }

    // 3. Obtener los productos vinculados
    const { data: products, error: productsError } = await supabase
      .from("manual_billing_product")
      .select(`
        *,
        products (id, code, name, description)
      `)
      .eq("id_manual_billing", id);

    if (productsError) throw productsError;

    // 4. Retornar todo estructurado
    return {
      success: true,
      data: {
        ...invoice,
        companies: companyData, // Lo inyectamos manualmente
        productos: products || []
      }
    };

  } catch (error: any) {
    console.error("❌ Error en getManualInvoiceDetails:", error.message);
    return { 
      success: false, 
      error: error.message || "Error al obtener los detalles" 
    };
  }
}