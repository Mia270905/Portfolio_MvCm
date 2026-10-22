import { NextResponse } from "next/server";
import { Resend } from "resend";
import { renderAsync } from "@react-email/render";
import ReminderTemplate from "@/components/email/reminder-template";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const html = await renderAsync(
      ReminderTemplate({
        name: body.name,
        time: body.time,
      })
    );

    await resend.emails.send({
      from: "MarviBeauty <notificaciones@marvi.alveussoft.com>",
      to: body.email,
      subject: "Recordatorio de tu cita de hoy",
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error enviando recordatorio:", error);
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}