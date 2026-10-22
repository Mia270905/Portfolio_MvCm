"use server";

import twilio from 'twilio';

// ─── Singleton Twilio Client (lazy init) ─────────────────────────────────────
let cachedClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient(): ReturnType<typeof twilio> | null {
  if (cachedClient) return cachedClient;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) return null;

  cachedClient = twilio(sid, token);
  return cachedClient;
}

// ─── Mapa centralizado de errores de Twilio ───────────────────────────────────
const TWILIO_ERROR_MESSAGES: Record<number, string> = {
  21211: 'Número inválido. Asegúrate de usar 10 dígitos mexicanos.',
  21608: 'El número debe unirse al sandbox primero. Envía "join [código]" al sandbox.',
  63007: 'Error con el número de Twilio. Verifica la configuración del sandbox.',
};

// ─── Validación y formateo con Regex estricta ────────────────────────────────
/**
 * Limpia y valida un número mexicano de 10 dígitos.
 * Retorna `521<10 dígitos>` (13 chars) o `null` si el número es inválido.
 */
function formatMexicanPhoneForTwilio(phone: string): string | null {
  if (!phone) return null;

  // Elimina cualquier carácter que no sea dígito
  const digits = phone.replace(/\D/g, '');

  // Valida exactamente 10 dígitos numéricos
  if (!/^\d{10}$/.test(digits)) return null;

  // Prefijo estándar para México en Twilio: 521 + 10 dígitos = 13 chars
  return `521${digits}`;
}

// ─── Server Action ────────────────────────────────────────────────────────────
export async function sendWhatsAppMessage({
  to,
  message,
}: {
  to: string;
  message: string;
}) {
  try {
    const client = getTwilioClient();
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!client || !twilioWhatsAppNumber) {
      return {
        success: false,
        error: 'Twilio no está configurado correctamente.',
      };
    }

    const formattedTo = formatMexicanPhoneForTwilio(to);

    if (!formattedTo) {
      return {
        success: false,
        error: 'Número inválido. Se requieren exactamente 10 dígitos mexicanos.',
      };
    }

    const result = await client.messages.create({
      from: twilioWhatsAppNumber,
      to: `whatsapp:+${formattedTo}`,
      body: message,
    });

    return {
      success: true,
      messageId: result.sid,
      status: result.status,
      toFormatted: formattedTo,
      toTwilio: result.to,
    };
  } catch (error: any) {
    const code: number | undefined = error?.code;

    // Log seguro: sin número de teléfono ni datos sensibles
    console.error('[sendWhatsAppMessage] Error de Twilio — código:', code ?? 'desconocido');

    const errorMessage =
      (code !== undefined && TWILIO_ERROR_MESSAGES[code]) ||
      (error?.message?.includes('not a valid phone number')
        ? 'Número no válido. Formato esperado: 10 dígitos mexicanos.'
        : 'Error al enviar el mensaje.');

    return {
      success: false,
      error: errorMessage,
      code,
      details: error?.message,
    };
  }
}