"use server";

import { createClient } from "@/lib/supabase/server";
import { saveBillingInfoV2 } from "./billing.actions";
import { createInvoiceV2, cancelInvoice } from "./invoices.actions";
import { softDeleteBillingByFacturamaId } from "./billing.actions";
import { facturama } from "@/lib/facturama/facturama";

interface InvoiceDetails {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  rfc: string;
  razonSocial: string;
  calle: string;
  colonia: string;
  numeroExterior: string;
  numeroInterior?: string;
  ciudad: string;
  codigoPostal: string;
  usoCFDI: string;
  regimenFiscal: string;
  fechaFactura: string;
  id_facturama: string;
  subtotal: number;
  impuestos: number;
  costoEnvio: number;
  total: number;
  productos: Producto[];
}

interface Producto {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  subtotal: number;
  total: number;
}

interface BillingAddress {
  id: string;
  user_id: string;
  rfc: string;
  name: string;
  cfdi_use: string;
  fiscal_regime: string;
  tax_zip_code: string;
  street?: string;
  exterior_number?: string;
  interior_number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  is_active: boolean;
  created_at: string;
}

interface SaleOrderData {
  id: string;
  order_number: number;
  status: string;
  created_at: string;
  shipping_cost: number;
  subtotal: number;
  total: number;
  user_id: string;
  user_name?: string;
  user_email?: string;
}

interface SaleOrderDetail {
  id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  product_price: number;
  product_price_with_discount?: number;
  discount_application?: number;
}

/**
 * Obtiene los detalles completos de una factura a cancelar
 */
export async function getInvoiceDetails(
  orderNumber: string,
): Promise<InvoiceDetails | null> {
  try {
    const supabase = await createClient();

    // 1. Obtener la orden
    const { data: order, error: orderError } = await supabase
      .from("sale_orders")
      .select(
        `
        id,
        order_number,
        status,
        created_at,
        shipping_cost,
        subtotal,
        total,
        user_id,
        users!sale_orders_user_id_fkey (
          full_name,
          email
        )
      `,
      )
      .eq("order_number", orderNumber)
      .eq("status", "Entregado")
      .single();

    if (orderError || !order) {
      console.error("Error obteniendo orden:", orderError);
      return null;
    }

    // 2. Obtener la información de facturación (billing_info)
    const { data: billingInfo, error: billingError } = await supabase
      .from("billing_info")
      .select("*")
      .eq("order_number", orderNumber.toString())
      .is("deleted_at", null)
      .single();

    if (billingError) {
      console.error(
        "Error obteniendo información de facturación:",
        billingError,
      );
      return null;
    }

    if (!billingInfo) {
      console.error(
        "No se encontró información de facturación para esta orden",
      );
      return null;
    }

    // 3. Obtener los productos de la orden
    const { data: orderDetails, error: detailsError } = await supabase
      .from("sale_order_details")
      .select(
        `
        id,
        product_id,
        quantity,
        product_price,
        product_price_with_discount,
        discount_application,
        products (
          name,
          image_url
        )
      `,
      )
      .eq("sale_order_id", order.id);

    if (detailsError) {
      console.error("Error obteniendo detalles de la orden:", detailsError);
      return null;
    }

    // 4. Obtener información del usuario
    const user = Array.isArray(order.users) ? order.users[0] : order.users;

    // 5. Mapear los productos
    const productos: Producto[] = (orderDetails || []).map((detail: any) => {
      const product = Array.isArray(detail.products)
        ? detail.products[0]
        : detail.products;
      const precioFinal =
        detail.product_price_with_discount || detail.product_price;
      const subtotalProducto = precioFinal * detail.quantity;

      return {
        id: detail.product_id,
        nombre: product?.name || "Producto sin nombre",
        cantidad: detail.quantity,
        precioUnitario: precioFinal,
        descuento: detail.discount_application || 0,
        subtotal: subtotalProducto,
        total: subtotalProducto, // En este caso el total es igual al subtotal (sin impuestos adicionales)
      };
    });

    // 6. Calcular totales (pueden venir de la orden o calcularlos)
    const subtotal =
      order.subtotal || productos.reduce((sum, p) => sum + p.subtotal, 0);
    const shippingCost = order.shipping_cost || 0;
    const total = order.total || subtotal + shippingCost;

    // 7. Obtener impuestos si están disponibles en sale_order_product_taxes
    let impuestos = 0;
    const { data: taxesData, error: taxesError } = await supabase
      .from("sale_order_product_taxes")
      .select("product_tax")
      .eq("sale_order_id", order.id);

    if (!taxesError && taxesData) {
      impuestos = taxesData.reduce(
        (sum, tax) => sum + (tax.product_tax || 0),
        0,
      );
    }

    return {
      id: billingInfo.id,
      orderNumber: order.order_number.toString(),
      customerName: user?.full_name || "Cliente",
      customerEmail: user?.email || "",
      rfc: billingInfo.rfc,
      razonSocial: billingInfo.name,
      calle: billingInfo.street || "",
      colonia: billingInfo.neighborhood || "",
      numeroExterior: billingInfo.exterior_number || "",
      numeroInterior: billingInfo.interior_number || "",
      ciudad: billingInfo.locality || billingInfo.municipality || "",
      codigoPostal: billingInfo.tax_zip_code,
      usoCFDI: billingInfo.cfdi_use,
      regimenFiscal: billingInfo.tax_regime,
      fechaFactura: billingInfo.created_at,
      id_facturama: billingInfo.id_facrutama,
      subtotal: subtotal,
      impuestos: impuestos,
      costoEnvio: shippingCost,
      total: total,
      productos: productos,
    };
  } catch (error) {
    console.error("Error en getInvoiceDetails:", error);
    return null;
  }
}

/**
 * Obtiene las direcciones de facturación del usuario (user_billing_info)
 */
export async function getUserBillingAddresses(
  userId: string,
): Promise<BillingAddress[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_billing_info")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo direcciones de facturación:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error en getUserBillingAddresses:", error);
    return [];
  }
}

/**
 * Crea una nueva dirección de facturación (user_billing_info)
 */
export async function createUserBillingAddress(
  userId: string,
  data: Omit<BillingAddress, "id" | "user_id" | "is_active" | "created_at">,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Usuario no autenticado" };

    const { data: newAddress, error } = await supabase
      .from("user_billing_info")
      .insert([
        {
          user_id: userId,
          rfc: data.rfc,
          name: data.name,
          cfdi_use: data.cfdi_use,
          fiscal_regime: data.fiscal_regime,
          tax_zip_code: data.tax_zip_code,
          street: data.street,
          exterior_number: data.exterior_number,
          interior_number: data.interior_number,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          country: data.country || "México",
          zip_code: data.zip_code,
          is_active: true,
          created_by: user.id,
          updated_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creando dirección de facturación:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: newAddress.id };
  } catch (error) {
    console.error("Error en createUserBillingAddress:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al crear dirección de facturación",
    };
  }
}

/**
 * Actualiza una dirección de facturación existente (user_billing_info)
 */
export async function updateUserBillingAddress(
  addressId: string,
  data: Partial<Omit<BillingAddress, "id" | "user_id" | "created_at">>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Usuario no autenticado" };

    const { error } = await supabase
      .from("user_billing_info")
      .update({
        ...data,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", addressId);

    if (error) {
      console.error("Error actualizando dirección de facturación:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error en updateUserBillingAddress:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al actualizar dirección de facturación",
    };
  }
}

/**
 * Obtiene información básica de la orden (para validación)
 */
export async function getOrderBasicInfo(
  orderNumber: string,
): Promise<SaleOrderData | null> {
  try {
    const supabase = await createClient();

    const { data: order, error } = await supabase
      .from("sale_orders")
      .select(
        `
        id,
        order_number,
        status,
        created_at,
        shipping_cost,
        subtotal,
        total,
        user_id,
        users!sale_orders_user_id_fkey (
          full_name,
          email
        )
      `,
      )
      .eq("order_number", orderNumber)
      .single();

    if (error || !order) {
      console.error("Error obteniendo información básica de la orden:", error);
      return null;
    }

    const user = Array.isArray(order.users) ? order.users[0] : order.users;

    return {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      created_at: order.created_at,
      shipping_cost: order.shipping_cost || 0,
      subtotal: order.subtotal || 0,
      total: order.total || 0,
      user_id: order.user_id,
      user_name: user?.full_name,
      user_email: user?.email,
    };
  } catch (error) {
    console.error("Error en getOrderBasicInfo:", error);
    return null;
  }
}

export async function processInvoiceReplacement(params: {
  orderNumber: string;
  userId: string;
  originalFacturamaId: string;
  newBillingData: {
    rfc: string;
    name: string;
    cfdi_use: string;
    fiscal_regime: string;
    tax_zip_code: string;
    street?: string;
    exterior_number?: string;
    interior_number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    country?: string;
    zip_code?: string;
  };
  updateAddress: boolean;
}) {
  let newBillingId: string | null = null;
  let newFacturamaId: string | null = null;
  let originalCancelled = false;
  let originalDeleted = false;

  try {
    const supabase = await createClient();

    // Obtener usuario autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado");

    // PASO 1: Guardar nueva información en billing_info
    const billingPayload = {
      ...params.newBillingData,
      tax_regime: params.newBillingData.fiscal_regime,
      tax_zip_code: params.newBillingData.tax_zip_code,
      email: user.email || "",
      city: params.newBillingData.city || "",
      state: params.newBillingData.state || "Nayarit",
      country: params.newBillingData.country || "MEX",
      zip_code: params.newBillingData.zip_code || undefined,
    };

    const saveResult = await saveBillingInfoV2(
      params.userId,
      params.orderNumber,
      billingPayload,
    );

    if (!saveResult.success || !saveResult.id) {
      throw new Error(
        "❌ Error al guardar la nueva información de facturación",
      );
    }

    newBillingId = saveResult.id;

    // PASO 2: Crear la nueva factura
    if (!newBillingId) {
      throw new Error("No se obtuvo el ID de la información de facturación");
    }

    const invoiceResult = await createInvoiceV2(newBillingId);

    if (!invoiceResult.ok || !invoiceResult.cfdiId) {
      throw new Error(
        `Error al crear nueva factura: ${invoiceResult.error || "Sin detalles"}`,
      );
    }

    newFacturamaId = invoiceResult.cfdiId;

    // Obtener UUID de la nueva factura para la sustitución
    if (!newFacturamaId) {
      throw new Error("No se obtuvo el ID de Facturama para la nueva factura");
    }

    let newInvoiceUuid = await getInvoiceUuidFromFacturama(newFacturamaId);

    if (!newInvoiceUuid) {
      newInvoiceUuid = newFacturamaId;
    }
    try {
      // La ruta correcta según tu función cancelInvoice parece ser simplemente /cfdi/{id}
      // Sin el "/33/" en medio
      const response = await facturama.get(`/cfdi/${newFacturamaId}`, {
        params: {
          type: "issued", // O el tipo que corresponda
        },
      });

      // Intentar encontrar el UUID en diferentes estructuras posibles
      const data = response.data;

      // Opción 1: En el Complemento/TimbreFiscalDigital
      if (data?.Complemento?.TimbreFiscalDigital?.UUID) {
        newInvoiceUuid = data.Complemento.TimbreFiscalDigital.UUID;
      }
      // Opción 2: Directamente en la raíz
      else if (data?.Uuid) {
        newInvoiceUuid = data.Uuid;
      }
      // Opción 3: En otra propiedad
      else if (data?.uuid) {
        newInvoiceUuid = data.uuid;
      }
      // Opción 4: Buscar recursivamente
      else {
        // Función para buscar recursivamente
        const findUuid = (obj: any): string | null => {
          if (!obj || typeof obj !== "object") return null;

          if (obj.UUID || obj.Uuid || obj.uuid) {
            return obj.UUID || obj.Uuid || obj.uuid;
          }

          for (const key in obj) {
            if (key.toLowerCase().includes("uuid")) {
              return obj[key];
            }
            const found = findUuid(obj[key]);
            if (found) return found;
          }

          return null;
        };

        newInvoiceUuid = findUuid(data);
      }
    } catch (uuidError: any) {
      console.warn(
        "⚠️ No se pudo obtener datos de la factura:",
        uuidError.message,
      );
      console.warn("Usando ID de Facturama como UUID de sustitución...");
      newInvoiceUuid = newFacturamaId;
    }

    // Intentar cancelar con motivo 01 (con sustitución)
    if (newInvoiceUuid) {
      const cancelResult01 = await cancelInvoice(
        params.originalFacturamaId,
        "01", // Motivo 01: Comprobante con errores con relación
        "issued",
        newInvoiceUuid,
      );

      if (cancelResult01.ok) {
        originalCancelled = true;
      } else {
        console.warn(
          `⚠️ No se pudo cancelar con motivo 01: ${cancelResult01.error}`,
        );

        const cancelResult02 = await cancelInvoice(
          params.originalFacturamaId,
          "02", // Motivo 02: Comprobante con errores sin relación
        );

        if (cancelResult02.ok) {
          originalCancelled = true;
        } else {
          console.error(
            `❌ No se pudo cancelar con motivo 02: ${cancelResult02.error}`,
          );

          // Intentar otros motivos si los anteriores fallan
          const otherMotives = ["03", "04"];
          for (const motive of otherMotives) {
            const cancelResult = await cancelInvoice(
              params.originalFacturamaId,
              motive,
            );

            if (cancelResult.ok) {
              originalCancelled = true;
              break;
            } else {
              console.warn(
                `⚠️ No se pudo cancelar con motivo ${motive}: ${cancelResult.error}`,
              );
            }
          }
        }
      }
    }

    const deleteResult = await softDeleteBillingByFacturamaId(
      params.originalFacturamaId,
      user.id,
    );

    if (deleteResult.ok) {
      originalDeleted = true;
    } else {
      console.warn(
        `⚠️ No se pudo marcar como eliminada: ${deleteResult.error}`,
      );
    }

    // PASO 5: Actualizar la nueva factura con su ID de Facturama
    // En processInvoiceReplacement, reemplaza la actualización con:
    if (newBillingId && newFacturamaId) {
      try {
        const { error } = await supabase
          .from("billing_info")
          .update({
            id_facrutama: newFacturamaId,
            // Solo actualizar columnas que existan
            // Si no tienes has_invoice, omítelo
            //invoice_date: new Date().toISOString(),
            // Si tienes un campo para estado, úsalo
            // invoice_status: 'ACTIVA' // Comenta si no existe
          })
          .eq("id", newBillingId);

        if (error) {
          console.error("❌ Error al actualizar nueva factura:", error);

          // Intentar con menos campos
          const { error: simpleError } = await supabase
            .from("billing_info")
            .update({
              id_facrutama: newFacturamaId,
            })
            .eq("id", newBillingId);

          if (simpleError) {
            console.error(
              "❌ Error incluso con actualización simple:",
              simpleError,
            );
          }
        }
      } catch (updateError) {
        console.error("❌ Error al actualizar nueva factura:", updateError);
      }
    }

    // PASO 6: Actualizar dirección del cliente si se seleccionó
    if (params.updateAddress) {
      try {
        await updateCustomerBillingAddress(user.id, params.newBillingData);
      } catch (addressError) {
        console.warn(
          "⚠️ Error al actualizar dirección del cliente:",
          addressError,
        );
      }
    }

    return {
      ok: true,
      message: "Factura reemplazada exitosamente",
      data: {
        newBillingId,
        newFacturamaId,
        newInvoiceUuid,
        originalCancelled,
        originalDeleted,
      },
    };
  } catch (error: any) {
    console.error("\n❌ ERROR EN PROCESO:", error);

    // Rollback en caso de error
    if (newBillingId && !newFacturamaId) {
      try {
        const supabase = await createClient();
        await supabase.from("billing_info").delete().eq("id", newBillingId);
      } catch (rollbackError) {
        console.error("❌ Error en rollback:", rollbackError);
      }
    }

    return {
      ok: false,
      error: error.message || "Error en el proceso de reemplazo",
      data: {
        newBillingId,
        newFacturamaId,
        originalCancelled,
        originalDeleted,
      },
    };
  }
}

/**
 * Función auxiliar para obtener UUID de factura
 */
async function getInvoiceUuid(facturamaId: string): Promise<string | null> {
  try {
    const { facturama } = await import("@/lib/facturama/facturama");
    const response = await facturama.get(`/cfdi/${facturamaId}?type=issued`);
    return response.data?.Complemento?.TimbreFiscalDigital?.UUID || null;
  } catch (error) {
    console.error("Error obteniendo UUID:", error);
    return null;
  }
}

/**
 * Actualizar dirección de facturación del cliente
 */
async function updateCustomerBillingAddress(userId: string, billingData: any) {
  try {
    const supabase = await createClient();

    // Buscar billing_info activo más reciente
    const { data: activeBilling } = await supabase
      .from("billing_info")
      .select("id")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (activeBilling) {
      // Actualizar el existente
      const { error } = await supabase
        .from("billing_info")
        .update({
          rfc: billingData.rfc,
          name: billingData.name,
          cfdi_use: billingData.cfdi_use,
          tax_regime: billingData.fiscal_regime,
          tax_zip_code: billingData.tax_zip_code,
          street: billingData.street,
          exterior_number: billingData.exterior_number,
          interior_number: billingData.interior_number,
          neighborhood: billingData.neighborhood,
          locality: billingData.city,
          municipality: billingData.city,
          state: billingData.state,
          country: billingData.country || "MEX",
          zip_code: billingData.zip_code,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeBilling.id);

      if (error) throw error;
    }

    return { ok: true };
  } catch (error) {
    console.error("Error actualizando dirección del cliente:", error);
    return { ok: false };
  }
}

/**
 * Obtiene el UUID de una factura en Facturama
 */
async function getInvoiceUuidFromFacturama(
  facturamaId: string,
): Promise<string | null> {
  try {
    // Intentar diferentes rutas posibles
    const endpoints = [
      `/cfdi/${facturamaId}`,
      `/cfdi/33/${facturamaId}`,
      `/cfdi/issued/${facturamaId}`,
      `/cfdi/${facturamaId}?type=issued`,
    ];

    let response = null;
    let lastError = null;

    // Probar diferentes endpoints
    for (const endpoint of endpoints) {
      try {
        response = await facturama.get(endpoint);
        break;
      } catch (error: any) {
        lastError = error;
        continue;
      }
    }

    if (!response) {
      console.warn("Todos los endpoints fallaron, usando ID como fallback");
      return facturamaId;
    }

    // Buscar UUID en la respuesta
    const searchUuid = (obj: any, path: string = ""): string | null => {
      if (!obj || typeof obj !== "object") return null;

      // Buscar en keys obvias
      const uuidKeys = ["UUID", "Uuid", "uuid", "Folio"];
      for (const key of uuidKeys) {
        if (obj[key] && typeof obj[key] === "string") {
          return obj[key];
        }
      }

      // Buscar recursivamente
      for (const key in obj) {
        const found = searchUuid(obj[key], `${path}.${key}`);
        if (found) return found;
      }

      return null;
    };

    const uuid = searchUuid(response.data);

    if (uuid) {
      return uuid;
    } else {
      console.warn(
        "⚠️ No se encontró UUID en la respuesta, usando ID de Facturama",
      );
      return facturamaId;
    }
  } catch (error: any) {
    console.error(
      `❌ Error obteniendo UUID para ${facturamaId}:`,
      error.message,
    );
    return facturamaId; // Fallback al ID de Facturama
  }
}

/**
 * Procesa la cancelación pura de una factura (sin sustitución)
 * Motivos: 02 (Comprobante con errores sin relación) o 03 (No se llevó a cabo la operación)
 */
export async function processPureCancelInvoice(params: {
  orderNumber: string;
  originalFacturamaId: string;
  motive: "02" | "03"; // Solo motivos que no requieren sustitución
  cancellationReason?: string; // Razón adicional para el SAT
}) {
  let originalCancelled = false;
  let originalDeleted = false;

  try {
    const supabase = await createClient();

    // Obtener usuario autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado");

    console.log(` Iniciando cancelación pura con motivo ${params.motive}...`);

    // Validar que el motivo sea válido para cancelación pura
    if (!["02", "03"].includes(params.motive)) {
      throw new Error("Motivo inválido para cancelación pura. Use 02 o 03.");
    }

    // PASO 1: Intentar cancelar en Facturama
    console.log(` Cancelando factura ${params.originalFacturamaId} en Facturama...`);
    const cancelResult = await cancelInvoice(
      params.originalFacturamaId,
      params.motive,
      "issued"
    );

    if (!cancelResult.ok) {
      console.error(` Error al cancelar en Facturama: ${cancelResult.error}`);
      throw new Error(`No se pudo cancelar la factura: ${cancelResult.error}`);
    }

    originalCancelled = true;
    console.log("Factura cancelada exitosamente en Facturama");

    // PASO 2: Marcar como eliminada en la base de datos (soft delete)
    console.log(" Marcando factura como eliminada en base de datos...");
    const deleteResult = await softDeleteBillingByFacturamaId(
      params.originalFacturamaId,
      user.id
    );

    if (deleteResult.ok) {
      originalDeleted = true;
      console.log("Factura marcada como eliminada en base de datos");
    } else {
      console.warn(` No se pudo marcar como eliminada: ${deleteResult.error}`);
    }

    // PASO 3: Registrar la cancelación en un log/auditoría (opcional)
    // try {
    //   await supabase
    //     .from("invoice_cancellations") // Crea esta tabla si no existe
    //     .insert({
    //       facturama_id: params.originalFacturamaId,
    //       order_number: params.orderNumber,
    //       cancellation_motive: params.motive,
    //       cancellation_reason: params.cancellationReason || null,
    //       cancelled_by: user.id,
    //       cancelled_at: new Date().toISOString(),
    //       cancelled_successfully: true,
    //       replacement_required: false,
    //     });
    //   console.log(" Cancelación registrada en log de auditoría");
    // } catch (logError) {
    //   console.warn(" No se pudo registrar en log de auditoría:", logError);
    // }

    return {
      ok: true,
      message: `Factura cancelada exitosamente con motivo ${params.motive}`,
      data: {
        facturamaId: params.originalFacturamaId,
        orderNumber: params.orderNumber,
        motive: params.motive,
        cancelledAt: new Date().toISOString(),
        originalCancelled,
        originalDeleted,
      },
    };
  } catch (error: any) {
    console.error("\n ERROR EN PROCESO DE CANCELACIÓN PURA:", error);

    return {
      ok: false,
      error: error.message || "Error en el proceso de cancelación",
      data: {
        originalCancelled,
        originalDeleted,
      },
    };
  }
}