"use server";
import { createClient } from "@/lib/supabase/server";
import { facturama } from "@/lib/facturama/facturama";
import type { ManualInvoiceData } from "@/lib/actions/manual-billing.actions";

// Función auxiliar para formatear números
const fix = (n: number, decimals = 6) => Number(n.toFixed(decimals));

// Mapeo de tipos de pago
const PAYMENT_METHOD_MAP = {
  efectivo: "01",
  transferencia: "03",
} as const;

export async function createManualInvoiceFromForm(
  manualBillingId: string,
  invoiceData: ManualInvoiceData,
) {
  try {
    const supabase = await createClient();

    // Obtener datos de manual_billing
    const { data: manualBilling, error: billingError } = await supabase
      .from("manual_billing")
      .select("*")
      .eq("id", manualBillingId)
      .single();

    if (billingError || !manualBilling) {
      throw new Error("Datos de facturación manual no encontrados");
    }

    // Obtener productos de manual_billing_product
    const { data: billingProducts, error: productsError } = await supabase
      .from("manual_billing_product")
      .select("*")
      .eq("id_manual_billing", manualBillingId);

    if (productsError) {
      throw new Error("Error al obtener productos de la factura manual");
    }

    if (!billingProducts || billingProducts.length === 0) {
      throw new Error("No se encontraron productos en la factura manual");
    }

    // Obtener información adicional de los productos
    const productIds = billingProducts.map((bp: any) => bp.product_id);
    const { data: products, error: productsInfoError } = await supabase
      .from("products")
      .select("id, name, product_code_sat, description")
      .in("id", productIds);

    if (productsInfoError) {
      throw new Error("Error al obtener información de productos");
    }

    // Crear un mapa de productos para fácil acceso
    const productsMap = new Map();
    products?.forEach((p: any) => {
      productsMap.set(p.id, p);
    });

    // Obtener impuestos de los productos
    const productsWithTaxes = await Promise.all(
      billingProducts.map(async (bp: any) => {
        const productInfo = productsMap.get(bp.product_id);

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
          .eq("product_id", bp.product_id)
          .is("deleted_at", null);

        const taxes =
          productTaxes
            ?.map((pt: any) => pt.taxes)
            .filter((tax: any) => tax && tax.is_active !== false) || [];

        return {
          ...bp,
          productInfo,
          taxes,
        };
      }),
    );

    // Construir ítems para Facturama
    const items = productsWithTaxes.map((product: any) => {
      const subtotal = fix(
        Number(product.unit_price) * Number(product.quantity),
      );
      const discount = product.discount || 0;
      const base = subtotal - discount;

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
            Rate: taxRate, // Ahora será 0.16 para IVA 16%
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
        UnitPrice: fix(Number(product.unit_price)),
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

    // Agregar costo de envío solo una vez
    if (manualBilling.shipping_cost && manualBilling.shipping_cost > 0) {
      items.push({
        ProductCode: "78101800",
        Description: "Costo de envío",
        IdentificationNumber: "SHIPPING001",
        UnitCode: "E48",
        UnitPrice: fix(Number(manualBilling.shipping_cost)),
        Quantity: 1,
        Subtotal: fix(Number(manualBilling.shipping_cost)),
        Discount: 0,
        Total: fix(Number(manualBilling.shipping_cost)),
        TaxObject: "01",
      });
    }

    // Construir datos para Facturama
    const cfdiData = {
      CfdiType: "I",
      ExpeditionPlace: "42501",
      PaymentForm:
        PAYMENT_METHOD_MAP[
          manualBilling.payment_type as keyof typeof PAYMENT_METHOD_MAP
        ] || "01",
      PaymentMethod: "PUE",
      Currency: "MXN",
      Issuer: {
        Rfc: "EKU9003173C9",
        Name: "ESCUELA KEMPER URGATE",
        FiscalRegime: "601",
      },
      Receiver: {
        Rfc: manualBilling.rfc,
        Name: manualBilling.name,
        CfdiUse: manualBilling.cfdi_use,
        FiscalRegime: manualBilling.tax_regime,
        TaxZipCode: manualBilling.zip_code,
        Address: {
          Street: manualBilling.street || "",
          ExteriorNumber: manualBilling.exterior_number || "",
          InteriorNumber: manualBilling.interior_number || "",
          Neighborhood: manualBilling.neighborhood || "",
          ZipCode: manualBilling.zip_code,
          Locality: manualBilling.city || "",
          Municipality: manualBilling.city || "",
          State: "Nayarit",
          Country: "México",
        },
      },
      Items: items,
    };

    // Llamar a Facturama
    const response = await facturama.post("/3/cfdis", cfdiData);

    if (response.data.Id) {
      // Actualizar manual_billing con el ID de Facturama
      const { error: updateError } = await supabase
        .from("manual_billing")
        .update({
          id_facturama: response.data.Id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", manualBillingId);

      if (updateError) {
        console.error("Error updating manual billing:", updateError);
      }
    }

    return { ok: true, cfdiId: response.data.Id };
  } catch (err: any) {
    console.error("Error crear factura manual:", err?.response?.data || err);

    // Retornar el error completo de Facturama para que pueda ser parseado en el frontend
    // Esto permite que parseFacturamaErrors procese correctamente el Message y ModelState
    return {
      ok: false,
      error:
        err?.response?.data || err?.message || "Error al crear factura manual",
    };
  }
}
