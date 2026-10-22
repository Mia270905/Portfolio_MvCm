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
    clientRfc?: string;      // <--- AGREGA ESTO
    taxRegime?: string;
    cfdiUse?: string;
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

export const ManualInvoicePDF = ({ quotationData }: QuotationPDFProps) => {
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
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {quotationData.companyLogo && <Image src={quotationData.companyLogo} style={styles.companyLogo} />}
            <View style={styles.companyTextContainer}>
              <Text style={styles.companyName}>{quotationData.companyName || "ALVEUS SOFT"}</Text>
              <Text style={[styles.quotationTitle, { color: '#EAB308', fontWeight: 'bold' }]}>COMPROBANTE DE PAGO</Text>
              <Text style={styles.companyInfo}>{quotationData.companyAddress}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.quotationNumber}>FOLIO: {quotationData.quotationNumber}</Text>
            <Text style={styles.companyInfo}>Fecha: {quotationData.validFrom}</Text>
          </View>
        </View>

        {/* INFORMACIÓN FISCAL (RFC, RÉGIMEN Y MÉTODO) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Cliente</Text>
          <View style={{ border: '1pt solid #E5E7EB', padding: 10, borderRadius: 4, backgroundColor: '#F9FAFB' }}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre/Razón Social:</Text>
              <Text style={[styles.infoValue, { fontWeight: 'bold' }]}>{quotationData.clientName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>RFC:</Text>
              <Text style={styles.infoValue}>{quotationData.clientRfc || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Régimen / Uso CFDI:</Text>
              <Text style={styles.infoValue}>{quotationData.taxRegime || '608'} - {quotationData.cfdiUse || 'G03'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Método de Pago:</Text>
              <Text style={styles.infoValue}>{quotationData.vendor || 'Transferencia'}</Text>
            </View>
          </View>
        </View>

            {/* TABLA DE PRODUCTOS DESGLOSADA */}
            <View style={styles.table}>
            <View style={[styles.tableHeader, { backgroundColor: '#1F2937' }]}>
                <Text style={[styles.tableColHeader, { width: '10%', color: '#FFF' }]}>Cant.</Text>
                <Text style={[styles.tableColHeader, { width: '45%', color: '#FFF' }]}>Descripción</Text>
                <Text style={[styles.tableColHeader, { width: '20%', textAlign: 'right', color: '#FFF' }]}>Precio Unit.</Text>
                <Text style={[styles.tableColHeader, { width: '25%', textAlign: 'right', color: '#FFF' }]}>Importe</Text>
            </View>

            {/* Iteramos sobre TODOS los productos que vienen en la data */}
            {quotationData.products && quotationData.products.length > 0 ? (
                quotationData.products
                .filter(p => !p.isDiscount && !p.id?.toString().startsWith('tax-'))
                .map((item, index) => (
                    <View key={item.id || index} style={styles.tableRow}>
                    <Text style={{ width: '10%' }}>{item.quantity}</Text>
                    <View style={{ width: '45%' }}>
                        <Text style={{ fontWeight: 'bold' }}>{item.product?.name || 'Producto'}</Text>
                        {item.product?.description && (
                        <Text style={{ fontSize: 7, color: '#6B7280' }}>{item.product.description}</Text>
                        )}
                    </View>
                    <Text style={{ width: '20%', textAlign: 'right' }}>
                        {formatCurrency(item.unitPrice)}
                    </Text>
                    <Text style={{ width: '25%', textAlign: 'right', fontWeight: 'bold' }}>
                        {/* Calculamos el total de la línea: Cantidad * Precio */}
                        {formatCurrency(item.quantity * item.unitPrice)}
                    </Text>
                    </View>
                ))
            ) : (
                <View style={styles.tableRow}>
                <Text style={{ width: '100%', textAlign: 'center' }}>No hay productos para mostrar</Text>
                </View>
            )}
            </View>

        {/* TOTALES FINALES */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(quotationData.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Impuestos:</Text>
              <Text style={styles.totalValue}>{formatCurrency(quotationData.taxAmount || 0)}</Text>
            </View>
            <View style={[styles.grandTotalRow, { backgroundColor: '#EAB308', padding: 5, borderRadius: 2 }]}>
              <Text style={[styles.grandTotalLabel, { color: '#000' }]}>TOTAL:</Text>
              <Text style={[styles.grandTotalValue, { color: '#000' }]}>{formatCurrency(quotationData.total)}</Text>
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Alveus Soft - Comprobante de Control Interno</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
