"use client";

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Registrar fuentes
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ],
});

// Estilos optimizados para ticket de pollería (80mm) con descripción completa
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 8,
    fontFamily: 'Helvetica',
    fontSize: 8,
    lineHeight: 1.1,
    width: '80mm',
  },
  header: {
    marginBottom: 6,
    borderBottom: '1pt solid #000',
    paddingBottom: 3,
  },
  restaurantName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 1,
  },
  restaurantSubtitle: {
    fontSize: 7,
    textAlign: 'center',
    marginBottom: 1,
    color: '#666',
  },
  website: {
    fontSize: 6,
    textAlign: 'center',
    marginBottom: 2,
    color: '#888',
  },
  orderInfo: {
    marginBottom: 5,
  },
  orderNumber: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 1,
  },
  orderDate: {
    fontSize: 6,
    textAlign: 'center',
    marginBottom: 3,
    color: '#666',
  },
  section: {
    marginBottom: 5,
    paddingBottom: 2,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 2,
    borderBottom: '0.5pt solid #333',
    paddingBottom: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
    alignItems: 'flex-start',
    minHeight: 10,
  },
  productRow: {
    flexDirection: 'column',
    marginBottom: 4,
    paddingBottom: 3,
    borderBottom: '0.3pt solid #ddd',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  productCode: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 1,
  },
  productMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  productDescription: {
    flex: 3,
    marginRight: 3,
  },
  productName: {
    fontSize: 7,
    fontWeight: 'bold',
    marginBottom: 1,
    lineHeight: 1.0,
  },
  productFullDescription: {
    fontSize: 6,
    color: '#555',
    marginBottom: 1,
    lineHeight: 1.1,
    fontStyle: 'italic',
  },
  productDetails: {
    fontSize: 6,
    color: '#666',
    marginBottom: 1,
    lineHeight: 1.0,
  },
  productQuantity: {
    flex: 1,
    fontSize: 7,
    textAlign: 'center',
    fontWeight: 'bold',
    paddingTop: 1,
  },
  productPrice: {
    flex: 2,
    fontSize: 7,
    textAlign: 'right',
    fontWeight: 'bold',
    paddingTop: 1,
  },
  productTotalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '0.3pt solid #eee',
    paddingTop: 2,
    marginTop: 2,
  },
  label: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#333',
    width: '35%',
  },
  value: {
    fontSize: 7,
    flex: 1,
    textAlign: 'left',
    lineHeight: 1.0,
  },
  valueLong: {
    fontSize: 6.5,
    flex: 1,
    textAlign: 'left',
    lineHeight: 1.0,
  },
  instructions: {
    backgroundColor: '#f8f8f8',
    padding: 3,
    marginTop: 2,
    fontSize: 6,
    borderLeft: '1pt solid #ff6b35',
    lineHeight: 1.1,
  },
  totalsSection: {
    marginTop: 6,
    paddingTop: 4,
    borderTop: '1pt double #000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    paddingBottom: 1,
  },
  totalLabel: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
    paddingTop: 3,
    borderTop: '1pt solid #000',
  },
  grandTotalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 8,
    paddingTop: 4,
    borderTop: '0.5pt solid #666',
    fontSize: 5,
    color: '#888',
    textAlign: 'center',
    lineHeight: 1.1,
  },
  driverInfo: {
    backgroundColor: '#f0f8f0',
    padding: 3,
    marginTop: 3,
    border: '0.5pt solid #4CAF50',
  },
  noDriverInfo: {
    backgroundColor: '#fff8e1',
    padding: 3,
    marginTop: 3,
    border: '0.5pt solid #ffa000',
    fontSize: 7,
    textAlign: 'center',
  },
  urgent: {
    backgroundColor: '#fff0f0',
    padding: 3,
    marginBottom: 4,
    border: '0.5pt solid #ff4444',
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#d32f2f',
  },
  separator: {
    borderBottom: '0.5pt dashed #ccc',
    marginVertical: 3,
  },
  addressBox: {
    backgroundColor: '#f5f5f5',
    padding: 3,
    marginTop: 2,
    border: '0.3pt solid #ddd',
    fontSize: 6,
    lineHeight: 1.1,
  },
  multiLineText: {
    fontSize: 6.5,
    lineHeight: 1.1,
    marginBottom: 1,
  }
});

interface OrderComandaPDFProps {
  order: any;
}

const OrderComandaPDF = ({ order }: OrderComandaPDFProps) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);

  const formatDate = (date: string) => 
    new Date(date).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const isUrgent = order.delivery_time && order.delivery_time < 30;

  // Información de la pollería
  const restaurantInfo = {
    name: "POLLERÍA GRIS",
    subtitle: "Los mejores pollos de la región",
    address: "C. Villa de la Torre #39, Vistas de La Cantera, Vistas de la Cantera Etapa 1",
    phone: "Tel: +52 1 311-198-2683",
    website: "polleriagris-web.alveussoft.com"
  };

  // Función para dividir texto largo en múltiples líneas
  const splitLongText = (text: string, maxLineLength: number): string[] => {
    if (!text) return [''];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + ' ' + word).length <= maxLineLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word.length > maxLineLength 
          ? word.substring(0, maxLineLength - 3) + '...' 
          : word;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Función para determinar el estilo del valor basado en la longitud
  const getValueStyle = (value: string) => {
    return value && value.length > 30 ? styles.valueLong : styles.value;
  };

  return (
    <Document>
      <Page size={[226.77, 841.89]} style={styles.page}>
        {/* Encabezado del restaurante */}
        <View style={styles.header}>
          <Text style={styles.restaurantName}>{restaurantInfo.name}</Text>
          <Text style={styles.website}>{restaurantInfo.website}</Text>
          <Text style={styles.orderDate}>{restaurantInfo.address}</Text>
          <Text style={styles.orderDate}>{restaurantInfo.phone}</Text>
        </View>

        {/* Información del pedido */}
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>ORDEN #{order.order_number}</Text>
          <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
        </View>

        <View style={styles.separator} />

        {/* Información del cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cliente:</Text>
            <View style={{ flex: 1 }}>
              {splitLongText(order.user_name || 'Cliente no especificado', 35).map((line, index) => (
                <Text key={index} style={getValueStyle(line)}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
          {order.user_phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Teléfono:</Text>
              <Text style={styles.value}>{order.user_phone}</Text>
            </View>
          )}
        </View>

        {/* Dirección de entrega */}
        {order.user_address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DIRECCIÓN DE ENTREGA</Text>
            <View style={styles.addressBox}>
              {splitLongText(order.user_address, 45).map((line, index) => (
                <Text key={index} style={styles.multiLineText}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
        )}

        <View style={styles.separator} />

        {/* Repartidor asignado */}
        {order.assigned_driver && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>REPARTIDOR ASIGNADO</Text>
            <View style={styles.driverInfo}>
              <View style={styles.row}>
                <Text style={styles.label}>Nombre:</Text>
                <Text style={[styles.value, { fontWeight: 'bold' }]}>
                  {order.assigned_driver.full_name}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.separator} />

        {/* Productos - Estilo ticket con descripción completa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRODUCTOS</Text>
          
          {/* Encabezado de la tabla de productos */}
          <View style={[styles.productRow, { borderBottom: '1pt solid #000', paddingBottom: 1, flexDirection: 'row' }]}>
            <View style={styles.productDescription}>
              <Text style={[styles.productName, { fontSize: 7 }]}>DESCRIPCIÓN</Text>
            </View>
            <Text style={[styles.productQuantity, { fontSize: 7 }]}>CANT</Text>
            <Text style={[styles.productPrice, { fontSize: 7 }]}>IMPORTE</Text>
          </View>

          {/* Lista de productos */}
          {order.details.map((item: any, index: number) => (
            <View key={item.id} style={styles.productRow}>
              {/* Código del producto */}
              {item.product_code && item.product_code !== "N/A" && (
                <View style={styles.productHeader}>
                  <Text style={styles.productCode}>{item.product_code}</Text>
                </View>
              )}
              
              {/* Información principal del producto */}
              <View style={styles.productMainInfo}>
                <View style={styles.productDescription}>
                  <Text style={styles.productName}>
                    {item.product_name}
                  </Text>
                  
                  {/* Descripción completa del producto
                  {item.product_description && (
                    <View style={{ marginTop: 1 }}>
                      {splitLongText(item.product_description, 40).map((line, descIndex) => (
                        <Text key={descIndex} style={styles.productFullDescription}>
                          {line}
                        </Text>
                      ))}
                    </View>
                  )} */}
                  
                  <Text style={styles.productDetails}>
                    {formatCurrency(item.product_price)} c/u
                  </Text>
                </View>
                <Text style={styles.productQuantity}>{item.quantity}</Text>
                <Text style={styles.productPrice}>
                  {formatCurrency(item.quantity * item.product_price)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.separator} />

        {/* Instrucciones especiales */}
        {(order.special_instructions || order.delivery_instructions) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INSTRUCCIONES ESPECIALES</Text>
            {order.special_instructions && (
              <View style={styles.instructions}>
                <Text style={{ fontWeight: 'bold', fontSize: 6, marginBottom: 1 }}>
                  Instrucciones del cliente:
                </Text>
                {splitLongText(order.special_instructions, 50).map((line, index) => (
                  <Text key={index} style={{ fontSize: 6, lineHeight: 1.1 }}>
                    {line}
                  </Text>
                ))}
              </View>
            )}
            {order.delivery_instructions && (
              <View style={styles.instructions}>
                <Text style={{ fontWeight: 'bold', fontSize: 6, marginBottom: 1 }}>
                  Instrucciones de entrega:
                </Text>
                {splitLongText(order.delivery_instructions, 50).map((line, index) => (
                  <Text key={index} style={{ fontSize: 6, lineHeight: 1.1 }}>
                    {line}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.separator} />

        {/* Totales - Estilo ticket */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>SUBTOTAL:</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.subtotal)}</Text>
          </View>
          
          {order.shipping_cost && order.shipping_cost > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>COSTO DE ENVÍO:</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.shipping_cost)}</Text>
            </View>
          )}
          
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(order.total)}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Footer */}
        <View style={styles.footer}>
          <Text>¡Gracias por su preferencia!</Text>
          <Text>Orden generada el {new Date().toLocaleString('es-MX')}</Text>
          <Text>{restaurantInfo.website} • {restaurantInfo.phone}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default OrderComandaPDF;