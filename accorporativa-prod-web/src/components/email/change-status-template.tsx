import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Section,
} from "@react-email/components";
import * as React from "react";

export default function ChangeStatusTemplate({
  name,
  serviceName,
  time,
  status,
  isAdmin,
}: {
  name: string;
  serviceName?: string;
  time?: string;
  status: "CONFIRMADA" | "CANCELADA";
  isAdmin?: boolean;
}) {
  // Estilos de status
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "CONFIRMADA":
        return {
          backgroundColor: "#D1FAE5",
          color: "#065F46",
          borderColor: "#6EE7B7",
        };
      case "CANCELADA":
        return {
          backgroundColor: "#FEE2E2",
          color: "#991B1B",
          borderColor: "#FCA5A5",
        };
      default:
        return {
          backgroundColor: "#F3F4F6",
          color: "#1F2937",
          borderColor: "#D1D5DB",
        };
    }
  };

  return (
    <Html>
      <Head />
      <Preview>Actualización de estatus</Preview>
      <Body
        style={{
          fontFamily: "Arial, sans-serif",
          backgroundColor: "#f4f4f4",
          padding: "20px",
        }}
      >
        <Container
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
          }}
        >

          <Section
            style={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              padding: "20px",
              marginTop: "20px",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
            </Text>

            <Text
              style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: "9999px",
                border: `1px solid ${getStatusStyle(status).borderColor}`,
                color: getStatusStyle(status).color,
                backgroundColor: getStatusStyle(status).backgroundColor,
                fontWeight: 600,
                marginBottom: "10px",
              }}
            >
              Estatus: {status}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
