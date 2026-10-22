import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { getProductTaxes } from "@/lib/utils/quotationTaxes";

// Registrar fuentes (opcional, puedes usar las predeterminadas)
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
      fontWeight: 300,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
      fontWeight: 500,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Roboto",
    fontSize: 10,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#EAB308",
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  companyLogo: {
    width: 50,
    height: 50,
    objectFit: "contain",
  },
  companyTextContainer: {
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  companyName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1F2937",
    marginBottom: 5,
  },
  quotationTitle: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: 500,
  },
  companyInfo: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
    lineHeight: 1.4,
  },
  quotationNumber: {
    fontSize: 12,
    fontWeight: 700,
    color: "#EAB308",
    marginTop: 3,
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1F2937",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  infoLabel: {
    width: 120,
    fontSize: 10,
    color: "#6B7280",
    fontWeight: 500,
  },
  infoValue: {
    flex: 1,
    fontSize: 10,
    color: "#1F2937",
  },
  table: {
    width: "100%",
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 2,
    borderBottomColor: "#EAB308",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tableColHeader: {
    fontSize: 10,
    fontWeight: 700,
    color: "#374151",
  },
  tableCol: {
    fontSize: 9,
    color: "#1F2937",
    textAlign: "left"
  },
  col1: {
    width: "10%",
    textAlign: "left"
  },
  col2: {
    width: "30%",
    textAlign: "left"
  },
  col3: {
    width: "13%",
    textAlign: "right",
  },
  col4: {
    width: "14%",
    textAlign: "right",
  },
  col5: {
    width: "13%",
    textAlign: "right",
  },
  col6: {
    width: "12%",
    textAlign: "right",
  },
  col7: {
    width: "10%",
    textAlign: "right",
  },
  totalsSection: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalsBox: {
    width: 250,
    backgroundColor: "#F9FAFB",
    padding: 15,
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 10,
    color: "#6B7280",
  },
  totalValue: {
    fontSize: 10,
    color: "#1F2937",
    fontWeight: 500,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#EAB308",
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1F2937",
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#EAB308",
  },
  notesSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#F9FAFB",
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#1F2937",
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: "#6B7280",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#9CA3AF",
  },
  discountRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#FEF3C7",
    backgroundColor: "#FFFBEB",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  discountText: {
    color: "#92400E",
    fontWeight: 500,
  },
  taxRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#FED7AA",
    backgroundColor: "#FFF7ED",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  taxText: {
    color: "#C2410C",
    fontWeight: 500,
  },
});

interface Tax {
  id: string;
  name: string;
  rate: number;
  tax_type: 'percentage' | 'fixed_amount';
  description?: string | null;
}

interface Product {
  id: string;
  product: {
    name: string;
    description?: string;
  };
  quantity: number;
  unitPrice: number;
  discount: number;
  notes: string;
  isDiscount?: boolean;
  discountTitle?: string;
  // Campos de descuento específico por producto
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  // Campos de impuesto
  hasTax?: boolean;
  taxTitle?: string;
  taxType?: string;
  taxValue?: number;
  taxAmount?: number;
  // Soporte para múltiples impuestos
  product_taxes?: Tax[];
  tax?: Tax;
  tax_id?: string;
}

interface QuotationPDFProps {
  quotationData: {
    quotationNumber?: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    validFrom: string;
    validUntil: string;
    vendor: string;
    deliveryAddress?: string;
    notes?: string;
    products: Product[];
    subtotal: number;
    discountAmount?: number;
    taxAmount?: number;
    total: number;
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyWebsite?: string;
    companyLogo?: string;
    status: 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted_to_order' | 'cancelled'
  };
}

export const QuotationPDF = ({ quotationData }: QuotationPDFProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    // Parsear la fecha evitando problemas de zona horaria
    // Si es formato ISO (YYYY-MM-DD), extraer componentes directamente
    const parts = dateString.split("T")[0].split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Meses son 0-indexed
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const calculateProductTotal = (product: Product) => {
    const subtotal = product.quantity * product.unitPrice;
    let total = subtotal;
    
    // Si tiene descuento específico aplicado, restarlo
    if (product.discountAmount && product.discountAmount > 0) {
      total -= product.discountAmount;
    }
    
    // Calcular impuestos usando el helper
    const { totalTaxAmount } = getProductTaxes(product);
    total += totalTaxAmount;
    
    return total;
  };

  const regularProducts = quotationData.products.filter((p) => !p.isDiscount && !(typeof p.id === 'string' && p.id.startsWith('tax-')));
  const discountProduct = quotationData.products.find((p) => p.isDiscount);
  // Impuestos generales añadidos como productos con id 'tax-...'
  const taxProducts = quotationData.products.filter((p) => typeof p.id === 'string' && p.id.startsWith('tax-'));

  // Calcular impuestos aplicados por producto (product-level) usando el helper
  const productLevelTaxTotal = regularProducts.reduce((sum, product) => {
    const { totalTaxAmount } = getProductTaxes(product);
    return sum + totalTaxAmount;
  }, 0);

  const generalTaxTotal = taxProducts.reduce((sum, p) => {
    const amt = Math.abs(Number(p.unitPrice ?? (p as any).taxAmount ?? (p as any).tax_amount ?? 0) || 0);
    return sum + amt;
  }, 0);

  const taxTotal = productLevelTaxTotal + generalTaxTotal;

  // Descuentos específicos aplicados por producto (excluye descuentos generales y items tax-...)
  const productLevelDiscountTotal = quotationData.products.reduce((sum, p) => {
    if (!p) return sum;
    if (p.isDiscount) return sum;
    if (typeof p.id === 'string' && p.id.startsWith('tax-')) return sum;
    const d = Math.abs(Number((p as any).discountAmount ?? (p as any).discount_amount ?? 0) || 0);
    return sum + d;
  }, 0);

  // Calcular subtotal base desde los productos (sin impuestos)
  const calculatedSubtotal = regularProducts.reduce((sum, p) => {
    return sum + (p.quantity * p.unitPrice) - (p.discountAmount || 0);
  }, 0);

  // Calcular el total final
  const finalTotal = calculatedSubtotal + taxTotal - (quotationData.discountAmount ?? 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Logo de la empresa (si existe) */}
            {quotationData.companyLogo && (
              <Image 
                src={quotationData.companyLogo} 
                style={styles.companyLogo}
              />
            )}
            
            {/* Información de la empresa */}
            <View style={styles.companyTextContainer}>
              <Text style={styles.companyName}>
                {quotationData.companyName || "ALVEUSSOFT"}
              </Text>
              <Text style={styles.quotationTitle}>Soluciones Empresariales</Text>
              {quotationData.companyAddress && (
                <Text style={styles.companyInfo}>{quotationData.companyAddress}</Text>
              )}
              {quotationData.companyPhone && (
                <Text style={styles.companyInfo}>Tel: {quotationData.companyPhone}</Text>
              )}
              {quotationData.companyWebsite && (
                <Text style={styles.companyInfo}>{quotationData.companyWebsite}</Text>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            {quotationData.status === "accepted" ?(
              <Text style={styles.quotationTitle}>ORDEN DE VENTA</Text>
            ):(
              <View>
                <Text style={styles.quotationTitle}>COTIZACIÓN</Text>               
              </View>
            )}
            <Text style={styles.quotationNumber}>
                  #{quotationData.quotationNumber || "0001"}
            </Text>
          </View>
        </View>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Cliente</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cliente:</Text>
            <Text style={styles.infoValue}>{quotationData.clientName}</Text>
          </View>
          {quotationData.clientEmail && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{quotationData.clientEmail}</Text>
            </View>
          )}
          {quotationData.clientPhone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono:</Text>
              <Text style={styles.infoValue}>{quotationData.clientPhone}</Text>
            </View>
          )}
          {quotationData.deliveryAddress && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dirección:</Text>
              <Text style={styles.infoValue}>
                {quotationData.deliveryAddress}
              </Text>
            </View>
          )}
        </View>

        {/* Quotation Details */}
        <View style={styles.section}>
          {quotationData.status === "accepted" ?(
            <View>
              <Text style={styles.sectionTitle}>Detalles de orden de venta</Text>
              <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Generado a partir de:</Text>
                <Text style={styles.infoValue}>
                  Cotización #{(quotationData.quotationNumber)}
                </Text>
                </View>
            </View>
          ):(
            <View>
              <Text style={styles.sectionTitle}>Detalles de la cotizacion</Text>
              <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de emisión:</Text>
            <Text style={styles.infoValue}>
              {formatDate(quotationData.validFrom)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Válido hasta:</Text>
            <Text style={styles.infoValue}>
              {formatDate(quotationData.validUntil)}
            </Text>
          </View>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Atendido por:</Text>
            <Text style={styles.infoValue}>{quotationData.vendor}</Text>
          </View>
        </View>

        {/* Products Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableColHeader, styles.col1]}>#</Text>
            <Text style={[styles.tableColHeader, styles.col2]}>Producto</Text>
            <Text style={[styles.tableColHeader, styles.col3]}>Cantidad</Text>
            <Text style={[styles.tableColHeader, styles.col4]}>
              Precio Unit.
            </Text>
            <Text style={[styles.tableColHeader, styles.col5]}>Descuento</Text>
            <Text style={[styles.tableColHeader, styles.col6]}>Impuesto</Text>
            <Text style={[styles.tableColHeader, styles.col7]}>Total</Text>
          </View>

          {regularProducts.map((product, index) => (
            <View key={product.id} style={styles.tableRow}>
              <Text style={[styles.tableCol, styles.col1]}>{index + 1}</Text>
              <View style={styles.col2}>
                <Text style={[styles.tableCol, { fontWeight: 500 }]}>
                  {product.product.name}
                </Text>
                {product.notes && (
                  <Text
                    style={[
                      styles.tableCol,
                      { fontSize: 8, color: "#6B7280", marginTop: 2 },
                    ]}
                  >
                    {product.notes}
                  </Text>
                )}
              </View>
              <Text style={[styles.tableCol, styles.col3]}>
                {product.quantity}
              </Text>
              <Text style={[styles.tableCol, styles.col4]}>
                {formatCurrency(product.unitPrice)}
              </Text>
              <Text style={[styles.tableCol, styles.col5]}>
                {product.discountAmount && product.discountAmount > 0
                  ? (product.discountTitle
                      ? `${product.discountTitle} ${product.discountType === 'PERCENTAGE' ? `(${Number(product.discountValue).toFixed(2)}%)` : `(${formatCurrency(product.discountAmount)})`}`
                      : (product.discountType === 'PERCENTAGE'
                          ? `${product.discountValue}%`
                          : formatCurrency(product.discountAmount)))
                  : '-'}
              </Text>
              <Text style={[styles.tableCol, styles.col6]}>
                {(() => {
                  const { taxesCount, totalTaxAmount } = getProductTaxes(product);

                  if (taxesCount === 0) {
                    return '-';
                  }

                  //return `${formatCurrency(totalTaxAmount)} (${taxesCount})`;
                  return `${formatCurrency(totalTaxAmount)}`;
                })()}
              </Text>
              <Text style={[styles.tableCol, styles.col7]}>
                {formatCurrency(calculateProductTotal(product))}
              </Text>
            </View>
          ))}

          {/* Discount Row */}
          {/* {discountProduct && (
            <View style={styles.discountRow}>
              <Text style={[styles.tableCol, styles.col1, styles.discountText]}>
                -
              </Text>
              <View style={styles.col2}>
                <Text style={[styles.tableCol, styles.discountText]}>
                  {discountProduct.discountTitle || "Descuento Aplicado"}
                </Text>
              </View>
              <Text style={[styles.tableCol, styles.col3, styles.discountText]}>
                -
              </Text>
              <Text style={[styles.tableCol, styles.col4, styles.discountText]}>
                -
              </Text>
              <Text style={[styles.tableCol, styles.col5, styles.discountText]}>
                -
              </Text>
              <Text style={[styles.tableCol, styles.col7, styles.discountText]}>
                -{formatCurrency(Math.abs(discountProduct.unitPrice))}
              </Text>
            </View>
          )} */}

          {/* Tax Rows: renderizar todos los impuestos generales añadidos como productos 'tax-...' */}
          {taxProducts.map((tp) => (
            <View key={tp.id} style={styles.taxRow}>
              <Text style={[styles.tableCol, styles.col1, styles.taxText]}>-</Text>
              <View style={styles.col2}>
                <Text style={[styles.tableCol, styles.taxText]}>
                  {tp.taxTitle || tp.product?.name || "Impuesto Aplicado"}
                </Text>
              </View>
              <Text style={[styles.tableCol, styles.col3, styles.taxText]}>-</Text>
              <Text style={[styles.tableCol, styles.col4, styles.taxText]}>-</Text>
              <Text style={[styles.tableCol, styles.col5, styles.taxText]}>-</Text>
              <Text style={[styles.tableCol, styles.col7, styles.taxText]}>+{formatCurrency(Math.abs(tp.unitPrice ?? (tp as any).taxAmount ?? 0))}</Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(calculatedSubtotal)}
              </Text>
            </View>

            {quotationData.discountAmount && quotationData.discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Descuento:</Text>
                <Text style={[styles.totalValue, { color: "#EAB308" }]}>
                  -{formatCurrency(quotationData.discountAmount)}
                </Text>
              </View>
            )}

            {/* {productLevelDiscountTotal > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Descuentos de productos:</Text>
                <Text style={[styles.totalValue, { color: "#EAB308" }]}>
                  -{formatCurrency(productLevelDiscountTotal)}
                </Text>
              </View>
            )} */}

            {taxTotal > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Impuesto:</Text>
                <Text style={[styles.totalValue, { color: "#FB923C" }]}>
                  +{formatCurrency(taxTotal)}
                </Text>
              </View>
            )}

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL:</Text>
              <Text style={styles.grandTotalValue}>
                  {formatCurrency(finalTotal)}
                </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {quotationData.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notas:</Text>
            <Text style={styles.notesText}>{quotationData.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Documento generado el {new Date().toLocaleDateString("es-MX")}
          </Text>
          <Text style={styles.footerText}>
            {quotationData.companyName || "ALVEUSSOFT"}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
