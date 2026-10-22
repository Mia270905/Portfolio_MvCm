// "use server";

// import twilio from 'twilio';

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// const twilioClient = accountSid && authToken 
//   ? twilio(accountSid, authToken) 
//   : null;

// // Función CORREGIDA para números mexicanos
// function formatMexicanPhoneForTwilio(phone: string): string {
//   if (!phone) return '';
  
//   // 1. Remover todo excepto números
//   const clean = phone.replace(/\D/g, '');
  
//   // 2. Validar longitud
//   if (clean.length !== 10) {
//     console.error("El número debe tener 10 dígitos:", clean);
//     return clean; // Devolver igual para que falle claramente
//   }
  
//   // 3. Verificar lada
//   const lada = clean.substring(0, 2); 
//   const validLadas = ['33', '55', '81', '83', '66', '67', '68', '69', '31', '32'];
  
//   if (!validLadas.includes(lada)) {
//     console.warn("⚠️ Lada no reconocida:", lada);
//   }
  
//   // 4. Para México: +52 + 1 + 10 dígitos = 13 dígitos total
//   // Formato correcto: +521XXXXXXXXX (13 dígitos total)
//   const formatted = `521${clean}`; // +52 1 XXX-XXX-XXXX
  
//   return formatted;
// }

// export async function sendWhatsAppMessage({ 
//   to, 
//   message 
// }: { 
//   to: string; 
//   message: string;
// }) {
//   try {
//     // Verificaciones
//     if (!twilioClient || !twilioWhatsAppNumber) {
//       console.error("❌ Twilio no configurado");
//       return {
//         success: false,
//         error: 'Twilio no está configurado correctamente.',
//       };
//     }

//     // Formatear el número CORRECTAMENTE
//     const formattedTo = formatMexicanPhoneForTwilio(to);
    
//     if (!formattedTo || formattedTo.length !== 13) {
//       console.error("❌ Formato incorrecto después de formatear:", formattedTo);
//       return {
//         success: false,
//         error: `Número inválido. Se esperaban 13 dígitos (incluyendo +521), se obtuvo: ${formattedTo?.length || 0}`,
//         details: `Original: ${to}, Formateado: ${formattedTo}`
//       };
//     }

//     // Enviar mensaje
//     const result = await twilioClient.messages.create({
//       from: twilioWhatsAppNumber,
//       to: `whatsapp:+${formattedTo}`,
//       body: message,
//     });

//     return {
//       success: true,
//       messageId: result.sid,
//       status: result.status,
//       toFormatted: formattedTo,
//       toTwilio: result.to, 
//     };
    
//   } catch (error: any) {
//     console.error('❌ Error detallado de Twilio:');
//     console.error('Mensaje:', error.message);
//     console.error('Código:', error.code);
//     console.error('Número intentado:', to);
    
//     let errorMessage = 'Error al enviar el mensaje';
    
//     if (error.code === 21211) {
//       errorMessage = 'Número inválido. Asegúrate de usar 10 dígitos mexicanos';
//     } else if (error.code === 21608) {
//       errorMessage = 'El número debe unirse al sandbox primero. Envía "join [código]" al sandbox.';
//     } else if (error.code === 63007) {
//       errorMessage = 'Error con el número de Twilio. Verifica el sandbox.';
//     } else if (error.message?.includes('not a valid phone number')) {
//       errorMessage = 'Número no válido. Formato esperado: 10 dígitos mexicanos';
//     }

//     return {
//       success: false,
//       error: errorMessage,
//       code: error.code,
//       details: error.message,
//     };
//   }
// }