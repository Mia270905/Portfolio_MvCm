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

export default function ReminderTemplate({
  name,
  time,
  date, 
}: {
  name: string;
  time: string;
  date?: string; 
}) {
  return (
    <Html>
      <Head />
      <Preview>Recordatorio de tu cita</Preview>
      <Body
        style={{
          fontFamily: "Arial, sans-serif",
          backgroundColor: "#E3E2DD",
          padding: "20px",
          color: "#8B807D",
        }}
      >
        <Container
          style={{
            backgroundColor: "#F5F2ED",
            padding: "24px",
            borderRadius: "10px",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <Text
            style={{ fontSize: "18px", fontWeight: "bold", color: "#8B807D" }}
          >
            Hola {name},
          </Text>

          <Text style={{ marginBottom: "10px" }}>
            Este es un recordatorio de tu cita de hoy.  
            Te esperamos con gusto.
            Recuerda confirmar tu asistencia mediante WhatsApp
          </Text>

          <Section
            style={{
              backgroundColor: "#F5F2ED",
              border: "1px solid #D8D5D2",
              borderRadius: "10px",
              padding: "20px",
              marginTop: "20px",
              textAlign: "center",
              color: "#8B807D",
            }}
          >
            {date && ( 
              <Text style={{ fontSize: "14px", marginBottom: "8px" }}>
                Fecha: {date}
              </Text>
            )}
            <Text style={{ fontSize: "14px", marginBottom: "10px" }}>
              Horario: {time}
            </Text>
            <Text
              style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: "9999px",
                border: "1px solid #6EE7B7",
                color: "#065F46",
                backgroundColor: "#D1FAE5",
                fontWeight: 600,
              }}
            >
              ¡Nos vemos pronto!
            </Text>
          </Section>

          <Text style={{ marginTop: "20px", fontSize: "13px" }}>
            Si ya asististe o cancelaste, puedes ignorar este mensaje.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}