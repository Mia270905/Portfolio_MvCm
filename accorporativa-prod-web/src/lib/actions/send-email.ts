"use server";

import { Resend } from "resend";
import { render } from "@react-email/render";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailData {
  from: string;
  to: string;
  name: string;
  subject: string;
  replyTo: string;
  contenHtmlt: any;
}

export async function sendEmail(data: SendEmailData) {
  try {
    // Enviar email
    const { data: result, error } = await resend.emails.send({
      from: data.from,
      to: [data.to],
      subject: data.subject,
      html: data.contenHtmlt,
      replyTo: data.replyTo,
    });

    // Verificar si hubo error
    if (error) {
      console.error("❌ Error de Resend:", error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email enviado a ${data.to}`);
    return { success: true, emailId: result?.id };
    
  } catch (error: any) {
    console.error("❌ Error enviando email:", error);
    return { success: false, error: error.message };
  }
}

export async function renderEmail(template: any){
  return await render(template);
}