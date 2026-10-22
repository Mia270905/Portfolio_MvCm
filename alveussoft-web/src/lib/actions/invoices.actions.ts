"use server";
import { createClient } from "@/lib/supabase/server";
import { facturama } from "../facturama/facturama";
import { getSaleOrderDetail } from "./sale_order.actions";
import {
  getBillingDataByOrder,
  updateBillingInfoWithFactura,
  createBillingFromLatest,
} from "./billing.actions";

const PAYMENT_METHOD_MAP = {
  efectivo: "01",
  transferencia: "03",
} as const;

export interface ImpuestoCalculado {
  id: string;
  name: string;
  rate: number;
  amount: number;
  tax_type: string;
}

export interface ProductoConImpuestos {
  id: string;
  productCode: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
  total: number;
  tieneImpuestos: boolean;
  impuestos?: ImpuestoCalculado[];
}

export interface ManualInvoiceData {
  paymentType: string;
  rfc: string;
  razonSocial: string;
  calle: string;
  colonia: string;
  numeroInterior: string;
  numeroExterior: string;
  ciudad: string;
  codigoPostalFiscal: string;
  usoCFDI: string;
  regimenFiscal: string;
  costoEnvio: number;
  productos: ProductoConImpuestos[];
  descuentoGeneral?: number;
  company?: string; // Agregado para seleccionar la compañía emisora
}

const fix = (n: number, decimals = 6) => Number(n.toFixed(decimals));

export async function createInvoice(
  orderId: string,
  userId: string,
  orderNumber: string,
) {
  const fix = (n: number, decimals = 6) => Number(n.toFixed(decimals));

  try {
    const order = await getSaleOrderDetail(orderId);
    if (!order) throw new Error("Pedido no encontrado");

    let billing = await getBillingDataByOrder(userId, orderNumber);
    if (!billing) {
      billing = await createBillingFromLatest(userId, orderNumber);
    }

    if (!billing) throw new Error("No hay datos de facturación");

    const cfdiData = {
      CfdiType: "I",
      ExpeditionPlace: "42501",
      Issuer: {
        Rfc: "EKU9003173C9",
        Name: "ESCUELA KEMPER URGATE",
        FiscalRegime: "601",
      },
      Receiver: {
        Rfc: billing.rfc,
        Name: billing.name,
        CfdiUse: billing.cfdi_use,
        FiscalRegime: billing.tax_regime,
        TaxZipCode: billing.zip_code,
        Address: {
          Street: billing.street,
          ExteriorNumber: billing.exterior_number,
          InteriorNumber: billing.interior_number,
          Neighborhood: billing.neighborhood,
          ZipCode: billing.zip_code,
          Locality: billing.locality,
          Municipality: billing.municipality,
          State: "Nayarit",
          Country: "México",
        },
      },
      Items: [
        ...order.details.map((item: any) => {
          const subtotal = fix(item.product_price * item.quantity);
          const taxObject = item.product_tax_object_sat || "01";

          // Si el objeto de impuesto es "02", entonces debe llevar IVA 16%
          const shouldApplyIVA = taxObject === "02";
          const ivaRate = 0.16;
          const ivaAmount = shouldApplyIVA ? subtotal * ivaRate : 0;

          return {
            ProductCode: item.product_code_sat,
            UnitCode: "H87",
            Description: item.product_name,
            Quantity: item.quantity,
            UnitPrice: fix(item.product_price),
            Subtotal: subtotal,
            Total: shouldApplyIVA ? subtotal + ivaAmount : subtotal,
            TaxObject: taxObject,
            ...(shouldApplyIVA && {
              Taxes: [
                {
                  Name: "IVA",
                  Rate: ivaRate,
                  Base: subtotal,
                  Total: ivaAmount,
                },
              ],
            }),
          };
        }),

        ...(order.shipping_cost
          ? [
              {
                ProductCode: "78101800", // Servicios de mensajería (SAT estándar)
                UnitCode: "E48",
                Description: "Costo de envío",
                Quantity: 1,
                UnitPrice: order.shipping_cost,
                Subtotal: order.shipping_cost,
                Total: order.shipping_cost,
                TaxObject: "01",
              },
            ]
          : []),
      ],
      PaymentForm: "01",
      PaymentMethod: "PUE",
      Currency: "MXN",
    };

    const response = await facturama.post("/3/cfdis", cfdiData);

    if (response.data.Id && billing.id) {
      await updateBillingInfoWithFactura(billing.id, response.data.Id);
    }

    return { ok: true, cfdiId: response.data.Id };
  } catch (err: any) {
    console.error("Error crear factura:", err?.response?.data || err);

    // Retornar el error completo de Facturama para que pueda ser parseado en el frontend
    return {
      ok: false,
      error: err?.response?.data || err?.message || "Error al crear factura",
    };
  }
}

export async function getInvoicePDF(cfdiId: string) {
  try {
    const pdfRes = await facturama.get(`/cfdi/pdf/issued/${cfdiId}`);
    const pdfBase64 = pdfRes.data.Content;

    return { ok: true, pdfBase64 };
  } catch (err: any) {
    console.error("Error obtener PDF factura:", err?.response?.data || err);
    return { ok: false, error: err?.response?.data || "Error al obtener PDF" };
  }
}

export async function getInvoiceXML(cfdiId: string) {
  try {
    const xmlRes = await facturama.get(`/cfdi/xml/issued/${cfdiId}`);
    const xmlBase64 = xmlRes.data.Content;

    return { ok: true, xmlBase64 };
  } catch (err: any) {
    console.error("Error obtener XML factura:", err?.response?.data || err);
    return { ok: false, error: err?.response?.data || "Error al obtener XML" };
  }
}

export async function createInvoiceFromBillingInfo(
  orderId: string,
  billingInfoId: string,
) {
  const fix = (n: number, decimals = 6) => Number(n.toFixed(decimals));

  try {
    const supabase = await createClient();

    // Obtener orden
    const order = await getSaleOrderDetail(orderId);
    if (!order) throw new Error("Pedido no encontrado");

    // Obtener datos de billing_info
    const { data: billingInfo, error: billingError } = await supabase
      .from("billing_info")
      .select("*")
      .eq("id", billingInfoId)
      .single();

    if (billingError || !billingInfo) {
      throw new Error("Datos de facturación no encontrados");
    }

    const cfdiData = {
      CfdiType: "I",
      ExpeditionPlace: "42501",
      Issuer: {
        Rfc: "EKU9003173C9",
        Name: "ESCUELA KEMPER URGATE",
        FiscalRegime: "601",
      },
      Receiver: {
        Rfc: billingInfo.rfc,
        Name: billingInfo.name,
        CfdiUse: billingInfo.cfdi_use,
        FiscalRegime: billingInfo.tax_regime,
        TaxZipCode: billingInfo.tax_zip_code,
        Address: {
          Street: billingInfo.street || "",
          ExteriorNumber: billingInfo.exterior_number || "",
          InteriorNumber: billingInfo.interior_number || "",
          Neighborhood: billingInfo.neighborhood || "",
          ZipCode: billingInfo.zip_code || billingInfo.tax_zip_code,
          Locality: billingInfo.locality || "",
          Municipality: billingInfo.municipality || "",
          State: billingInfo.state || "Nayarit",
          Country: "México",
        },
      },
      Items: [
        ...order.details.map((item: any) => {
          const subtotal = fix(item.product_price * item.quantity);
          const taxObject = item.product_tax_object_sat || "01";

          const shouldApplyIVA = taxObject === "02";
          const ivaRate = 0.16;
          const ivaAmount = shouldApplyIVA ? subtotal * ivaRate : 0;

          return {
            ProductCode: item.product_code_sat,
            UnitCode: item.unspsc_code,
            Description: item.product_name,
            Quantity: item.quantity,
            UnitPrice: fix(item.product_price),
            Subtotal: subtotal,
            Total: shouldApplyIVA ? subtotal + ivaAmount : subtotal,
            TaxObject: taxObject,
            ...(shouldApplyIVA && {
              Taxes: [
                {
                  Name: "IVA",
                  Rate: ivaRate,
                  Base: subtotal,
                  Total: ivaAmount,
                },
              ],
            }),
          };
        }),

        ...(order.shipping_cost
          ? [
              {
                ProductCode: "78101800",
                UnitCode: "E48",
                Description: "Costo de envío",
                Quantity: 1,
                UnitPrice: order.shipping_cost,
                Subtotal: order.shipping_cost,
                Total: order.shipping_cost,
                TaxObject: "01",
              },
            ]
          : []),
      ],
      PaymentForm: "01",
      PaymentMethod: "PUE",
      Currency: "MXN",
    };

    const response = await facturama.post("/3/cfdis", cfdiData);

    if (response.data.Id) {
      // Actualizar billing_info con el id de facturama
      const { error: updateError } = await supabase
        .from("billing_info")
        .update({
          id_facrutama: response.data.Id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", billingInfoId);

      if (updateError) {
        console.error("Error updating billing info:", updateError);
      }
    }

    return { ok: true, cfdiId: response.data.Id };
  } catch (err: any) {
    console.error("Error crear factura:", err?.response?.data || err);

    // Retornar el error completo de Facturama para que pueda ser parseado en el frontend
    // Esto permite que parseFacturamaErrors procese correctamente el ModelState
    return {
      ok: false,
      error: err?.response?.data || err?.message || "Error al crear factura",
    };
  }
}

export async function cancelInvoice(
  cfdiId: string,
  motive: string = "01",
  type: string = "issued",
  uuidReplacement?: string,
) {
  try {
    // Validar que el motivo sea uno de los permitidos por el SAT
    const validMotives = ["01", "02", "03", "04"];
    if (!validMotives.includes(motive)) {
      throw new Error("Motivo de cancelación inválido. Use: 01, 02, 03 o 04");
    }

    // Validar que el tipo sea válido
    const validTypes = ["issued", "payroll", "issuedLite"];
    if (!validTypes.includes(type)) {
      throw new Error(
        "Tipo de comprobante inválido. Use: issued, payroll o issuedLite",
      );
    }

    // Construir la URL con los parámetros
    let url = `/cfdi/${cfdiId}?type=${type}&motive=${motive}`;

    // Agregar uuidReplacement si se proporciona
    if (uuidReplacement) {
      url += `&uuidReplacement=${uuidReplacement}`;
    }

    // Realizar la petición DELETE para cancelar
    const response = await facturama.delete(url);

    // Verificar si la cancelación fue exitosa
    if (response.status === 200) {
      return {
        ok: true,
        message: "CFDI cancelado exitosamente",
        data: response.data,
      };
    } else {
      return {
        ok: false,
        error: "No se pudo cancelar el CFDI",
        data: response.data,
      };
    }
  } catch (err: any) {
    console.error("Error al cancelar factura:", err?.response?.data || err);

    // Manejar errores específicos
    let errorMessage = "Error al cancelar factura";
    let errorCode = "GENERAL_ERROR";

    if (err?.response?.status === 404) {
      errorMessage = "CFDI no encontrado";
      errorCode = "CFDI_NOT_FOUND";
    } else if (err?.response?.status === 400) {
      errorMessage = "Solicitud inválida. Verifique los parámetros";
      errorCode = "BAD_REQUEST";
    } else if (err?.response?.data) {
      // Extraer mensaje de error de la respuesta de Facturama
      const facturamaError = err.response.data;
      errorMessage = facturamaError.Message || JSON.stringify(facturamaError);
      errorCode = facturamaError.Code || "FACTURAMA_ERROR";
    }

    return {
      ok: false,
      error: errorMessage,
      errorCode: errorCode,
      details: err?.response?.data || err.message,
    };
  }
}

export async function createInvoiceV2(billingId: string) {
  try {
    const supabase = await createClient();

    // 1. Obtener datos de billing_info
    const { data: billing, error: billingError } = await supabase
      .from("billing_info")
      .select("*")
      .eq("id", billingId)
      .single();

    if (billingError || !billing) {
      throw new Error("Datos de facturación no encontrados en billing_info");
    }

    // 2. Obtener la orden de venta
    const { data: saleOrder, error: saleOrderError } = await supabase
      .from("sale_orders")
      .select("id, shipping_cost, total, subtotal")
      .eq("order_number", billing.order_number)
      .single();

    if (saleOrderError || !saleOrder) {
      throw new Error("Orden de venta no encontrada");
    }

    // 3. Obtener detalles de la orden con toda la información necesaria
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
        discount_type,
        products:product_id (
          id,
          name,
          product_code_sat
        )
      `,
      )
      .eq("sale_order_id", saleOrder.id);

    if (detailsError) {
      throw new Error("Error al obtener detalles de la orden");
    }

    if (!orderDetails || orderDetails.length === 0) {
      throw new Error("No se encontraron productos en la orden");
    }

    // 4. Para cada producto, obtener sus impuestos
    const productsWithTaxes = await Promise.all(
      orderDetails.map(async (detail: any) => {
        // Obtener impuestos del producto
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
              sat_tax_type,
              is_active
            )
          `,
          )
          .eq("product_id", detail.product_id)
          .is("deleted_at", null);

        const taxes =
          productTaxes
            ?.map((pt: any) => pt.taxes)
            .filter((tax: any) => tax && tax.is_active !== false) || [];

        return {
          ...detail,
          productInfo: detail.products,
          taxes,
        };
      }),
    );

    // 5. Construir ítems para Facturama
    const items = productsWithTaxes.map((product: any) => {
      // Usar el precio con descuento si está disponible, sino el precio normal
      const unitPrice =
        product.product_price_with_discount || product.product_price;
      const subtotal = fix(Number(unitPrice) * Number(product.quantity));

      // Calcular descuento
      let discount = 0;
      if (product.discount_amount) {
        discount = product.discount_amount;
      } else if (
        product.discount_application === "percentage" &&
        product.discount_type
      ) {
        // Si el descuento es porcentaje
        discount = fix(subtotal * (Number(product.discount_type) / 100));
      }

      const base = fix(subtotal - discount);

      let taxes = [];
      let totalImpuestos = 0;
      let hasTaxes = false;
      let hasIVA = false;

      // Si el producto tiene impuestos configurados
      if (product.taxes && product.taxes.length > 0) {
        hasTaxes = true;

        // Verificar si tiene IVA
        hasIVA = product.taxes.some((tax: any) => tax.sat_tax_type === "iva");

        taxes = product.taxes.map((tax: any) => {
          let taxAmount = 0;
          let taxRate = 0;

          if (tax.tax_type === "percentage") {
            taxRate = Number(tax.rate) / 100; // Convertir a decimal (16 → 0.16)
            taxAmount = fix(base * taxRate);
          } else if (tax.tax_type === "fixed_amount") {
            // Monto fijo por unidad
            taxAmount = fix(Number(tax.rate) * Number(product.quantity));
            taxRate = Number(tax.rate); // Para montos fijos, Rate es el monto
          }

          totalImpuestos += taxAmount;

          const isRetention = tax.sat_tax_type === "isr";
          const isQuota = tax.tax_type === "fixed_amount";

          return {
            Total: fix(taxAmount),
            Name: tax.sat_tax_type === "iva" ? "IVA" : tax.name || "Impuesto",
            Base: fix(base),
            Rate: taxRate,
            IsRetention: isRetention,
            IsQuota: isQuota,
            TaxObject: hasIVA ? "02" : "01",
          };
        });
      }

      const total = fix(base + totalImpuestos);

      // Determinar TaxObject basado en si tiene impuestos IVA
      const taxObject = hasIVA ? "02" : "01";

      // Construir el objeto del ítem
      const item: any = {
        ProductCode: product.productInfo?.product_code_sat || "01010101",
        Description: product.productInfo?.name || "Producto",
        IdentificationNumber: product.product_id,
        UnitCode: "H87",
        UnitPrice: fix(Number(unitPrice)),
        Quantity: Number(product.quantity),
        Subtotal: fix(subtotal),
        Discount: fix(discount),
        Total: total,
        TaxObject: taxObject,
      };

      // Solo agregar Taxes si hay impuestos
      if (hasTaxes) {
        item.Taxes = taxes;
      }

      return item;
    });

    // 6. Agregar costo de envío si existe
    if (saleOrder.shipping_cost && saleOrder.shipping_cost > 0) {
      items.push({
        ProductCode: "78101800",
        Description: "Costo de envío",
        IdentificationNumber: "SHIPPING001",
        UnitCode: "E48",
        UnitPrice: fix(Number(saleOrder.shipping_cost)),
        Quantity: 1,
        Subtotal: fix(Number(saleOrder.shipping_cost)),
        Discount: 0,
        Total: fix(Number(saleOrder.shipping_cost)),
        TaxObject: "01",
        // NO incluir Taxes para envío
      });
    }

    // 7. Construir datos para Facturama
    const cfdiData = {
      CfdiType: "I",
      ExpeditionPlace: "42501",
      PaymentForm: "01",
      PaymentMethod: "PUE",
      Currency: "MXN",
      Issuer: {
        Rfc: "EKU9003173C9",
        Name: "ESCUELA KEMPER URGATE",
        FiscalRegime: "601",
      },
      Receiver: {
        Rfc: billing.rfc,
        Name: billing.name,
        CfdiUse: billing.cfdi_use,
        FiscalRegime: billing.tax_regime,
        TaxZipCode: billing.tax_zip_code,
        Address: {
          Street: billing.street || "",
          ExteriorNumber: billing.exterior_number || "",
          InteriorNumber: billing.interior_number || "",
          Neighborhood: billing.neighborhood || "",
          ZipCode: billing.zip_code,
          Locality: billing.locality || billing.city || "",
          Municipality: billing.municipality || billing.city || "",
          State: billing.state || "Nayarit",
          Country: billing.country || "México",
        },
      },
      Items: items,
    };

    // 8. Llamar a Facturama
    const response = await facturama.post("/3/cfdis", cfdiData);

    if (response.data.Id) {
      // 9. Actualizar billing_info con el ID de Facturama
      const { error: updateError } = await supabase
        .from("billing_info")
        .update({
          id_facrutama: response.data.Id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", billingId);

      if (updateError) {
        console.error("Error updating billing_info:", updateError);
      }
    }

    return { ok: true, cfdiId: response.data.Id };
  } catch (err: any) {
    console.error("Error crear factura:", err?.response?.data || err);

    // Retornar el error completo de Facturama para que pueda ser parseado en el frontend
    return {
      ok: false,
      error: err?.response?.data || err?.message || "Error al crear factura",
    };
  }
}