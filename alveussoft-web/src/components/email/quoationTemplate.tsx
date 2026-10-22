import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Section,
  Hr,
  Link,
} from "@react-email/components";
import * as React from "react";

// Definimos los estados específicos para cotizaciones
type QuotationStatus = 
  | "BORRADOR"
  | "ENVIADA"
  | "ACEPTADA"
  | "RECHAZADA"
  | "EXPIRADA";

interface QuotationTemplateProps {
  name: string;
  quotationId: string;
  date: string;
  status: QuotationStatus;
  isAdmin?: boolean;
  viewUrl?: string;
}

export default function QuotationTemplate({
  name,
  quotationId, // 👈 ESTE YA SERÁ EL FOLIO
  date,
  status,
  isAdmin = false,
  viewUrl,
}: QuotationTemplateProps) {

  const theme = {
    background: "#0F172A",
    surface: "#1E293B",
    primary: "#F59E0B",
    primaryHover: "#D97706",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textTertiary: "#64748B",
    border: "#334155",
  };

  const statusStyles = {
    BORRADOR: { backgroundColor: "#1E293B20", color: "#94A3B8", borderColor: "#334155" },
    ENVIADA: { backgroundColor: "#4C1D9520", color: "#C4B5FD", borderColor: "#5B21B6" },
    ACEPTADA: { backgroundColor: "#064E3B20", color: "#6EE7B7", borderColor: "#065F46" },
    RECHAZADA: { backgroundColor: "#7F1D1D20", color: "#FCA5A5", borderColor: "#991B1B" },
    EXPIRADA: { backgroundColor: "#11182720", color: "#D1D5DB", borderColor: "#1F2937" },
  };

  // 🎯 TÍTULO
  const statusTitle = isAdmin
    ? "📢 Actualización de Cotización"
    : "📄 Tu Cotización";

  // 🎯 MENSAJES DIFERENTES
  let statusMessage = "";

  if (isAdmin) {
    // 🧑‍💼 ADMIN
    if (status === "ACEPTADA") {
      statusMessage = `El contacto ${name} ha ACEPTADO la cotización #${quotationId}.`;
    } else if (status === "RECHAZADA") {
      statusMessage = `El contacto ${name} ha RECHAZADO la cotización #${quotationId}.`;
    } else if (status === "ENVIADA") {
      statusMessage = `Has enviado la cotización #${quotationId} al cliente ${name}.`;
    } else {
      statusMessage = `La cotización #${quotationId} cambió a estado ${status}.`;
    }
  } else {
    // 👤 CONTACTO
    if (status === "ENVIADA") {
      statusMessage = `Tu cotización #${quotationId} está lista. Puedes revisarla en el siguiente enlace.`;
    } else if (status === "ACEPTADA") {
      statusMessage = `Has aceptado la cotización #${quotationId}. Gracias por tu confianza.`;
    } else if (status === "RECHAZADA") {
      statusMessage = `Has rechazado la cotización #${quotationId}. Si necesitas cambios, contáctanos.`;
    } else {
      statusMessage = `Tu cotización #${quotationId} fue actualizada a ${status}.`;
    }
  }

  return (
    <Html>
      <Head />
      <Preview>📄 Cotización #{quotationId}</Preview>

      <Body style={{
        fontFamily: 'sans-serif',
        backgroundColor: theme.background,
        padding: "20px",
        color: theme.textPrimary,
      }}>
        <Container style={{
          backgroundColor: theme.surface,
          borderRadius: "12px",
          maxWidth: "600px",
          margin: "0 auto",
          border: `1px solid ${theme.border}`,
        }}>

          {/* HEADER */}
          <Section style={{
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
            padding: "32px",
            textAlign: "center",
          }}>
            <Text style={{ fontSize: "26px", fontWeight: "bold", color: "#fff" }}>
              Alveus soft
            </Text>
            <Text style={{ fontSize: "16px", color: "#fff" }}>
              {statusTitle}
            </Text>
          </Section>

          {/* CONTENIDO */}
          <Section style={{ padding: "24px" }}>
            <Text style={{ fontSize: "20px", fontWeight: "bold" }}>
              Hola {name},
            </Text>

            <Text style={{ color: theme.textSecondary }}>
              {statusMessage}
            </Text>

            {/* CARD */}
            <Section style={{
              marginTop: "20px",marginBottom: "20px",
              padding: "20px",
              border: `1px solid ${theme.border}`,
              borderRadius: "8px",
            }}>
              <Text style={{ fontSize: "12px", color: theme.textTertiary }}>
                Folio
              </Text>
              <Text style={{ fontSize: "16px", fontWeight: "bold" }}>
                #{quotationId}
              </Text>

              <Text style={{ fontSize: "12px", color: theme.textTertiary, marginTop: "10px" }}>
                Fecha de envio
              </Text>
              <Text>{date}</Text>
            </Section>

            {/* BOTÓN SOLO PARA CONTACTO */}
            {viewUrl && !isAdmin && (
              <Section style={{ marginTop: "20px",marginBottom: "20px", textAlign: "center" }}>
                <Link
                  href={viewUrl}
                  style={{
                    backgroundColor: theme.primary,
                    padding: "12px 20px",
                    borderRadius: "8px",
                    color: "#fff",
                    textDecoration: "none",
                  }}
                >
                  Ver Cotización
                </Link>
              </Section>
            )}
          </Section>
          {/* BOTÓN PARA ADMIN */}
            {isAdmin && (
            <Section style={{ marginTop: "20px",marginBottom: "20px", textAlign: "center" }}>
                <Link
                href="https://www.alveussoft.com/"
                style={{
                    backgroundColor: "#2563EB",
                    padding: "12px 20px",
                    borderRadius: "8px",
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: "bold",
                    display: "inline-block",
                }}
                >
                Ir al panel de Alveus
                </Link>
            </Section>
            )}

          {/* FOOTER */}
          <Section style={{
            padding: "16px",
            textAlign: "center",
            borderTop: `1px solid ${theme.border}`,
          }}>
            <Text style={{ fontSize: "12px", color: theme.textTertiary }}>
              © {new Date().getFullYear()} Alveus soft
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}