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

interface RegistrationTemplateProps {
  name: string; // Nombre del destinatario (cliente o admin)
  serviceName?: string;
  time?: string;
  date?: string;
  status: AppointmentStatus;
  isAdmin?: boolean;
  clientName?: string; // Nombre del cliente (para emails a admin)
  clientEmail?: string; // Email del cliente (para emails a admin)
  clientPhone?: string; // Teléfono del cliente (para emails a admin)
}

type AppointmentStatus =
  | "PENDIENTE"
  | "CONFIRMADA"
  | "CANCELADA"
  | "FINALIZADA"
  | "PERDIDA"
  | "RESERVADA"
  | "DISPONIBLE";

export default function RegistrationTemplate({
  name,
  serviceName,
  time,
  date,
  status,
  isAdmin = false,
  clientName,
  clientEmail,
  clientPhone,
}: RegistrationTemplateProps) {
  // Colores del tema - oscuro con naranja
  const theme = {
    background: "#0F172A",
    surface: "#1E293B",
    primary: "#F59E0B",
    primaryHover: "#D97706",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textTertiary: "#64748B",
    border: "#334155",
    success: "#10B981",
    error: "#EF4444",
  };

  const statusStyles: Record<
    AppointmentStatus,
    { backgroundColor: string; color: string; borderColor: string }
  > = {
    PENDIENTE: {
      backgroundColor: "#78350F20",
      color: "#FCD34D",
      borderColor: "#92400E",
    },
    CONFIRMADA: {
      backgroundColor: "#064E3B20",
      color: "#6EE7B7",
      borderColor: "#065F46",
    },
    CANCELADA: {
      backgroundColor: "#7F1D1D20",
      color: "#FCA5A5",
      borderColor: "#991B1B",
    },
    FINALIZADA: {
      backgroundColor: "#1E3A8A20",
      color: "#93C5FD",
      borderColor: "#1E40AF",
    },
    PERDIDA: {
      backgroundColor: "#11182720",
      color: "#D1D5DB",
      borderColor: "#1F2937",
    },
    RESERVADA: {
      backgroundColor: "#4C1D9520",
      color: "#C4B5FD",
      borderColor: "#5B21B6",
    },
    DISPONIBLE: {
      backgroundColor: "#064E3B20",
      color: "#6EE7B7",
      borderColor: "#047857",
    },
  };

  // Mensajes personalizados por estado
  const getStatusMessage = (
    status: AppointmentStatus, 
    isAdmin: boolean, 
    clientName?: string
  ) => {
    const messages = {
      // Mensajes para CLIENTE
      client: {
        PENDIENTE:
          "Tu cita ha sido registrada exitosamente. Espera la confirmación por parte de Parley Consultoría.",
        CONFIRMADA:
          "¡Tu cita ha sido confirmada! Ya puedes asistir en la fecha y hora programadas.",
        RESERVADA:
          "Tu cita ha sido reservada exitosamente. Pronto recibirás la confirmación definitiva.",
        CANCELADA:
          "Has cancelado tu cita exitosamente. Si fue por error o deseas reprogramar, contáctanos.",
        FINALIZADA:
          "Tu cita ha sido marcada como finalizada. ¡Gracias por confiar en nosotros!",
        PERDIDA:
          "Tu cita ha sido marcada como perdida. Si deseas reprogramar, contáctanos.",
        DISPONIBLE: "Un espacio ha quedado disponible para ti.",
      },
      // Mensajes para ADMIN
      admin: {
        PENDIENTE: `Nueva cita pendiente de confirmar del cliente ${clientName || name}`,
        CONFIRMADA: `Cita confirmada para el cliente ${clientName || name}`,
        RESERVADA: `Nueva cita reservada por el cliente ${clientName || name}`,
        CANCELADA: `El cliente ${clientName || name} ha cancelado su cita.`,
        FINALIZADA: `Cita finalizada con el cliente ${clientName || name}`,
        PERDIDA: `Cita marcada como perdida del cliente ${clientName || name}`,
        DISPONIBLE: `Espacio disponible creado`,
      },
    };

    return isAdmin ? messages.admin[status] : messages.client[status];
  };

  // Títulos personalizados por estado
  const getStatusTitle = (status: AppointmentStatus, isAdmin: boolean) => {
    const titles = {
      client: {
        PENDIENTE: "📅 Cita Pendiente de Confirmación",
        CONFIRMADA: "✅ Cita Confirmada",
        RESERVADA: "📅 Cita Reservada",
        CANCELADA: "❌ Cita Cancelada",
        FINALIZADA: "✅ Cita Finalizada",
        PERDIDA: "⚠️ Cita Perdida",
        DISPONIBLE: "📅 Espacio Disponible",
      },
      admin: {
        PENDIENTE: "📅 Nueva Cita Pendiente",
        CONFIRMADA: "✅ Cita Confirmada",
        RESERVADA: "📅 Nueva Cita Reservada",
        CANCELADA: "❌ Cita Cancelada por Cliente",
        FINALIZADA: "✅ Cita Finalizada",
        PERDIDA: "⚠️ Cita Perdida",
        DISPONIBLE: "📅 Nuevo Espacio Disponible",
      },
    };

    return isAdmin ? titles.admin[status] : titles.client[status];
  };

  const getStatusStyle = (status: AppointmentStatus) => {
    return statusStyles[status];
  };

  const statusMessage = getStatusMessage(status, isAdmin, clientName);
  const statusTitle = getStatusTitle(status, isAdmin);

  return (
    <Html>
      <Head />
      <Preview>
        {isAdmin
          ? `${statusTitle} - Alveussoft`
          : status === "CONFIRMADA"
            ? `✅ Tu cita ha sido confirmada - Alveussoft`
            : status === "RESERVADA"
              ? `📅 Tu cita ha sido reservada - Alveussoft`
              : status === "CANCELADA"
                ? `❌ Cita cancelada - Alveussoft`
                : `Tu cita está ${status.toLowerCase()} - Alveussoft`}
      </Preview>
      <Body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          backgroundColor: theme.background,
          margin: 0,
          padding: "20px",
          color: theme.textPrimary,
        }}
      >
        <Container
          style={{
            backgroundColor: theme.surface,
            borderRadius: "12px",
            maxWidth: "600px",
            margin: "0 auto",
            overflow: "hidden",
            border: `1px solid ${theme.border}`,
          }}
        >
          {/* Header con gradiente naranja */}
          <Section
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
              padding: "32px 24px",
              textAlign: "center" as const,
            }}
          >
            <Text
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#FFFFFF",
                margin: 0,
                textShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              Parley Consultoría
            </Text>
            <Text
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#FFFFFF",
                margin: "8px 0 0 0",
                opacity: 0.9,
              }}
            >
              {statusTitle}
            </Text>
          </Section>

          {/* Contenido principal */}
          <Section style={{ padding: "32px 24px" }}>
            {/* Saludo */}
            <Text
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: theme.textPrimary,
                margin: "0 0 16px 0",
              }}
            >
              {isAdmin ? `Hola ${name},` : `Hola ${name},`}
            </Text>

            <Text
              style={{
                fontSize: "16px",
                lineHeight: "24px",
                color: theme.textSecondary,
                margin: "0 0 32px 0",
              }}
            >
              {statusMessage}
            </Text>

            {/* Tarjeta de detalles de la cita */}
            <Section
              style={{
                backgroundColor: "rgba(30, 41, 59, 0.5)",
                borderRadius: "8px",
                border: `1px solid ${theme.border}`,
                padding: "24px",
                marginBottom: "32px",
              }}
            >
              <Text
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: theme.textPrimary,
                  margin: "0 0 20px 0",
                  textAlign: "center" as const,
                }}
              >
                {isAdmin ? "Detalles de la cita" : "Detalles de tu cita"}
              </Text>

              <Hr style={{ borderColor: theme.border, margin: "20px 0" }} />

              {/* Información del cliente (solo para admin en cancelaciones) */}
              {isAdmin && status === "CANCELADA" && clientName && (
                <Section style={{ marginBottom: "20px" }}>
                  <Text
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: theme.textPrimary,
                      margin: "0 0 10px 0",
                    }}
                  >
                    Cliente que canceló:
                  </Text>
                  <Text
                    style={{
                      fontSize: "15px",
                      color: theme.textSecondary,
                      margin: "0 0 5px 0",
                    }}
                  >
                    👤 {clientName}
                  </Text>
                  {clientEmail && (
                    <Text
                      style={{
                        fontSize: "15px",
                        color: theme.textSecondary,
                        margin: "0 0 5px 0",
                      }}
                    >
                      📧 {clientEmail}
                    </Text>
                  )}
                  {clientPhone && (
                    <Text
                      style={{
                        fontSize: "15px",
                        color: theme.textSecondary,
                        margin: "0 0 10px 0",
                      }}
                    >
                      📞 {clientPhone}
                    </Text>
                  )}
                </Section>
              )}

              {/* Fecha y hora */}
              {(date || time) && (
                <Section
                  style={{ display: "flex", gap: "24px", marginBottom: "16px" }}
                >
                  {date && (
                    <div style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: theme.textTertiary,
                          margin: "0 0 4px 0",
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.5px",
                        }}
                      >
                        Fecha
                      </Text>
                      <Text
                        style={{
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: theme.textPrimary,
                          margin: 0,
                        }}
                      >
                        {date}
                      </Text>
                    </div>
                  )}

                  {time && (
                    <div style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: theme.textTertiary,
                          margin: "0 0 4px 0",
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.5px",
                        }}
                      >
                        Hora
                      </Text>
                      <Text
                        style={{
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: theme.textPrimary,
                          margin: 0,
                        }}
                      >
                        {time}
                      </Text>
                    </div>
                  )}
                </Section>
              )}

              {/* Estado */}
              <Section
                style={{ marginTop: "20px", textAlign: "center" as const }}
              >
                <Text
                  style={{
                    display: "inline-block",
                    padding: "8px 20px",
                    borderRadius: "9999px",
                    border: `1px solid ${getStatusStyle(status).borderColor}`,
                    color: getStatusStyle(status).color,
                    backgroundColor: getStatusStyle(status).backgroundColor,
                    fontWeight: "bold",
                    fontSize: "14px",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.5px",
                  }}
                >
                  Estatus: {status}
                </Text>
              </Section>
            </Section>

            {/* Información importante - solo para estados activos del cliente */}
            {!isAdmin &&
              (status === "CONFIRMADA" ||
                status === "RESERVADA" ||
                status === "PENDIENTE") && (
                <Section
                  style={{
                    backgroundColor: `${theme.primary}10`,
                    border: `1px solid ${theme.primary}30`,
                    borderRadius: "8px",
                    padding: "20px",
                    marginBottom: "24px",
                  }}
                >
                  <Hr
                    style={{
                      borderColor: `${theme.primary}30`,
                      margin: "16px 0",
                    }}
                  />
                  <Text
                    style={{
                      fontSize: "14px",
                      lineHeight: "20px",
                      color: theme.textSecondary,
                      margin: "8px 0 0 0",
                    }}
                  >
                    Si necesitas modificar o cancelar tu cita, visita{" "}
                    <Link
                      href="https://www.alveussoft.com"
                      style={{ color: theme.primary }}
                    >
                      www.alveussoft.com
                    </Link>
                  </Text>
                </Section>
              )}

            {/* Mensaje de seguridad */}
            <Section
              style={{ textAlign: "center" as const, marginTop: "24px" }}
            >
              <Text
                style={{
                  fontSize: "12px",
                  color: theme.textTertiary,
                  margin: "0",
                  lineHeight: "18px",
                }}
              >
                {isAdmin
                  ? "Esta notificación ha sido generada automáticamente por el sistema de gestión."
                  : "Si no reconoces esta reserva, por favor ignora este mensaje."}
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              padding: "24px",
              borderTop: `1px solid ${theme.border}`,
              textAlign: "center" as const,
            }}
          >
            <Text
              style={{
                fontSize: "14px",
                color: theme.textTertiary,
                margin: "0 0 8px 0",
              }}
            >
              © {new Date().getFullYear()} Parley Consultoría Integral. Todos los derechos
              reservados.
            </Text>

            <Text
              style={{
                fontSize: "12px",
                color: theme.textTertiary,
                margin: "8px 0 0 0",
                fontStyle: "italic",
              }}
            >
              Este es un correo automático, por favor no responder directamente.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}