"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Registrar fuentes
Font.register({
  family: "Helvetica",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold",
    },
  ],
});

// Estilos COMPACTOS para impresora térmica (80mm) - SOLO BLANCO Y NEGRO
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 8,
    fontFamily: "Helvetica",
    fontSize: 8,
    lineHeight: 1.2,
    width: "80mm",
  },
  header: {
    marginBottom: 4,
    borderBottom: "1pt solid #000",
    paddingBottom: 3,
  },
  companyName: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 1,
    color: "#000",
  },
  companySubtitle: {
    fontSize: 7,
    textAlign: "center",
    marginBottom: 1,
    color: "#000",
  },
  ticketTitle: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 3,
    marginTop: 3,
    color: "#000",
    textTransform: "uppercase",
  },
  movementInfo: {
    marginBottom: 4,
  },
  movementNumber: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 1,
    color: "#000",
  },
  movementDate: {
    fontSize: 7,
    textAlign: "center",
    marginBottom: 2,
    color: "#000",
  },
  section: {
    marginBottom: 4,
    paddingBottom: 2,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 2,
    borderBottom: "1pt solid #000",
    paddingBottom: 1,
    color: "#000",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  label: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#000",
    width: "35%",
  },
  value: {
    fontSize: 7,
    flex: 1,
    textAlign: "left",
    lineHeight: 1.3,
    color: "#000",
  },
  productRow: {
    marginBottom: 3,
    paddingBottom: 2,
    borderBottom: "0.5pt dashed #000",
  },
  productInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  productName: {
    fontSize: 7,
    fontWeight: "bold",
    flex: 1,
    color: "#000",
  },
  productCode: {
    fontSize: 6,
    color: "#000",
    border: "0.5pt solid #000",
    paddingHorizontal: 2,
    paddingVertical: 0.5,
  },
  productDetails: {
    fontSize: 6,
    color: "#000",
    marginBottom: 1,
  },
  productQuantity: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000",
    marginLeft: 8,
  },
  quantityPrice: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 1,
  },
  typeBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
    marginBottom: 3,
  },
  notesSection: {
    padding: 3,
    marginTop: 2,
    fontSize: 6,
    lineHeight: 1.3,
    color: "#000",
  },
  footer: {
    marginTop: 6,
    paddingTop: 4,
    borderTop: "1pt dashed #000",
    fontSize: 6,
    color: "#000",
    textAlign: "center",
    lineHeight: 1.2,
  },
  separator: {
    borderBottom: "1pt dashed #000",
    marginVertical: 3,
  },
  badgeContainer: {
    border: "1pt solid #000",
    padding: 3,
    marginBottom: 3,
    alignItems: "center",
    marginHorizontal: 10,
  },
  quantityHighlight: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000",
    border: "1pt solid #000",
    paddingHorizontal: 4,
    paddingVertical: 1,
    textAlign: "center",
    marginBottom: 2,
  },
  productSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 1,
  },
  summaryBox: {
    border: "1pt solid #000",
    padding: 3,
    marginBottom: 3,
  },
  summaryText: {
    fontSize: 7,
    color: "#000",
    textAlign: "center",
    fontWeight: "bold",
  },
});

// Función auxiliar para obtener la etiqueta en español
const getTypeLabel = (type: string) => {
  const labels: { [key: string]: string } = {
    purchase: "COMPRA",
    sale: "VENTA",
    transfer: "TRANSFERENCIA",
    adjustment: "AJUSTE",
    loss: "PÉRDIDA",
    return: "DEVOLUCIÓN",
    initial: "STOCK INICIAL",
  };
  return labels[type] || type.toUpperCase();
};

interface MovementGroup {
  id: string;
  reference_id: string | null;
  movements: any[];
  latest_movement: any;
  created_at: string;
  total_quantity: number;
  total_products: number;
  notes: string | null;
}

interface MovementTicketPDFProps {
  movement: any;
  group?: MovementGroup;
  companyInfo?: {
    name: string;
    subtitle?: string;
    address?: string;
    phone?: string;
    website?: string;
  };
}

const MovementTicketPDF = ({
  movement,
  group,
  companyInfo,
}: MovementTicketPDFProps) => {
  // Información por defecto de la empresa
  const defaultCompanyInfo = {
    name: "POLLERÍA GRIS",
    subtitle: "Sistema de Inventarios",
    address: "C. Villa de la Torre #39, Vistas de La Cantera",
    phone: "Tel: +52 1 311-198-2683",
    website: "polleriagris-web.alveussoft.com",
  };

  const company = companyInfo || defaultCompanyInfo;
  const typeLabel = getTypeLabel(movement.movement_type);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const formatReference = (reference: string | null) => {
    if (!reference) return "N/A";
    // Mostrar solo los primeros y últimos caracteres para ahorrar espacio
    if (reference.length > 20) {
      return `${reference.substring(0, 8)}...${reference.substring(reference.length - 5)}`;
    }
    return reference;
  };

  // Determinar si es un grupo o movimiento individual
  const isGroup = group && group.movements && group.movements.length > 1;
  const movements = isGroup ? group.movements : [movement];

  return (
    <Document>
      <Page size={[226.77, 841.89]} style={styles.page}>
        {/* Encabezado de la empresa */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{company.name}</Text>
          <Text style={styles.companySubtitle}>{company.subtitle}</Text>
          {company.website && (
            <Text style={styles.companySubtitle}>{company.website}</Text>
          )}
        </View>

        {/* Título del ticket */}
        <Text style={styles.ticketTitle}>
          {isGroup ? "GRUPO DE MOVIMIENTOS" : "MOVIMIENTO DE INVENTARIO"}
        </Text>

        {/* Información del movimiento/grupo */}
        <View style={styles.movementInfo}>
          <Text style={styles.movementDate}>
            {formatDate(movement.created_at)}
          </Text>

          <Text style={styles.typeBadge}>{typeLabel}</Text>

          {/* Resumen si es un grupo */}
          {isGroup && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>
                {group.total_products} producto
                {group.total_products !== 1 ? "s" : ""} • Total:{" "}
                {group.total_quantity} unidades
              </Text>
            </View>
          )}
        </View>

        <View style={styles.separator} />

        {/* Sección de ubicaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UBICACIONES</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Origen:</Text>
            <Text style={styles.value}>
              {movement.from_location_data?.name ||
                movement.from_location ||
                "N/A"}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Destino:</Text>
            <Text style={styles.value}>
              {movement.to_location_data?.name || movement.to_location || "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Sección de productos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isGroup ? `PRODUCTOS (${movements.length})` : "PRODUCTO"}
          </Text>

          {movements.map((mov: any, index: number) => (
            <View key={`${mov.id}-${index}`} style={styles.productRow}>
              {/* Información principal del producto */}
              <View style={styles.productSummary}>
                <Text style={styles.productName}>
                  {isGroup && `${index + 1}. `}
                  {mov.product?.name || "Producto no especificado"}
                </Text>
                <Text style={styles.productQuantity}>{mov.quantity}</Text>
              </View>

              {/* Detalles del producto */}
              <View style={{ marginTop: 1 }}>
                <Text style={styles.productDetails}>
                  Código: {mov.product?.code || "N/A"}
                </Text>

                {/* Mostrar código de barras si existe */}
                {mov.product?.bar_code && mov.product?.bar_code !== "N/A" && (
                  <Text style={styles.productDetails}>
                    CB: {mov.product.bar_code}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Notas */}
        {(movement.notes || group?.notes) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOTAS</Text>
            <View style={styles.notesSection}>
              <Text>{movement.notes || group?.notes}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Documento generado el {new Date().toLocaleString("es-MX")}
          </Text>
          {company.address && <Text>{company.address}</Text>}
          {company.phone && <Text>{company.phone}</Text>}
          <Text>www.polleriagris.com</Text>
        </View>
      </Page>
    </Document>
  );
};

export default MovementTicketPDF;
