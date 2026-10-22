/**
 * Utilidades para calcular impuestos en cotizaciones
 */

export type Tax = {
  id: string;
  name: string;
  rate: number;
  tax_type: 'percentage' | 'fixed_amount';
  description?: string | null;
};

export type ProductWithTaxes = {
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  // Soporte para múltiples impuestos
  product_taxes?: Tax[];
  tax?: Tax;
  tax_id?: string;
};

/**
 * Calcula los impuestos de un producto
 * @param product Producto con información de impuestos
 * @returns Información calculada de impuestos
 */
export function getProductTaxes(product: ProductWithTaxes) {
  const itemSubtotal = (product.quantity || 0) * (product.unitPrice || 0);
  const itemDiscountAmount = product.discountAmount || 0;
  const taxableBase = itemSubtotal - itemDiscountAmount;

  // Soportar múltiples impuestos (product_taxes) o impuesto único (tax)
  const taxes: Tax[] =
    Array.isArray(product.product_taxes) && product.product_taxes.length > 0
      ? product.product_taxes
      : (product.tax_id && product.tax) ? [product.tax] : [];

  const totalTaxAmount = taxes.reduce((sum, tax) => {
    if (tax.tax_type === 'percentage') {
      return sum + (taxableBase * (Number(tax.rate) || 0)) / 100;
    }
    // fixed_amount
    return sum + (Number(tax.rate) || 0);
  }, 0);

  return {
    taxes,
    taxesCount: taxes.length,
    taxableBase,
    totalTaxAmount,
  };
}

/**
 * Formatea la información de impuestos para mostrar en UI
 * @param product Producto con información de impuestos
 * @param formatCurrency Función para formatear moneda
 * @returns String formateado con información de impuestos
 */
export function formatProductTaxDisplay(
  product: ProductWithTaxes,
  formatCurrency: (amount: number) => string
): string {
  const { taxesCount, totalTaxAmount } = getProductTaxes(product);
  
  if (taxesCount === 0) {
    return '-';
  }
  
  return `${formatCurrency(totalTaxAmount)} (${taxesCount})`;
}
