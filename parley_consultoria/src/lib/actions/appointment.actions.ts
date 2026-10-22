"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { renderEmail, sendEmail } from "@/lib/actions/send-email";
import RegistrationTemplate from "@/components/email/registration-template";

type CreateAvailableAppointmentPayload = {
  appointment_datetimes: string[]; // Array de ISO strings
  notes?: string;
};

type DeleteAvailableAppointmentPayload = {
  appointmentId: string;
};

type ConfirmAppointmentPayload = {
  appointmentId: string;
};

type ActionResult = {
  success: boolean;
  result?: any;
  message?: string;
};

export interface AppointmentStatus {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface Appointment {
  id: string;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  space_owner_user_id: string | null;
  booked_by_user_id: string | null;
  status_id: string | null;
  booked_at: string | null;
  cancelled_at: string | null;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  notes: string | null;
  client_notes: string | null;
  appointment_datetime: string;

  // Relaciones
  space_owner?: {
    id: string;
    email: string;
    full_name?: string | null;
    active?: boolean;
    user_metadata?: {
      name?: string;
    };
  } | null;
  booked_by?: {
    id: string;
    email: string;
    full_name?: string | null;
    active?: boolean;
    user_metadata?: {
      name?: string;
    };
  } | null;
  status?: AppointmentStatus | null;
}

export interface AppointmentsResponse {
  appointments: Appointment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Types para payloads
export interface NewAppointmentPayload {
  space_owner_user_id?: string | null;
  status_id?: string | null;
  appointment_datetime: string;
  client_name?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  notes?: string | null;
  client_notes?: string | null;
}

export interface UpdateAppointmentPayload {
  space_owner_user_id?: string | null;
  status_id?: string | null;
  appointment_datetime?: string | null;
  booked_at?: string | null;
  cancelled_at?: string | null;
  client_name?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  notes?: string | null;
  client_notes?: string | null;
}

export interface UpdateAppointmentPayload {
  space_owner_user_id?: string | null;
  status_id?: string | null;
  appointment_datetime?: string | null;
  booked_at?: string | null;
  cancelled_at?: string | null;
  client_name?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  notes?: string | null;
  client_notes?: string | null;
}

export async function createAvailableAppointment(
  payload: CreateAvailableAppointmentPayload
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "Usuario no autenticado" };
  }

  const { appointment_datetimes, notes } = payload;

  if (!appointment_datetimes || appointment_datetimes.length === 0) {
    return { success: false, message: "Debe proporcionar al menos una fecha" };
  }

  // Validar cada fecha
  const nowUTC = new Date();
  for (const datetime of appointment_datetimes) {
    const appointmentDate = new Date(datetime);
    if (isNaN(appointmentDate.getTime())) {
      return { success: false, message: "Una o más fechas son inválidas" };
    }
    if (appointmentDate <= nowUTC) {
      return {
        success: false,
        message: "Todas las citas deben ser en fechas futuras",
      };
    }
  }

  // Verificar disponibilidad antes de insertar
  // El constraint único es: (appointment_datetime, space_owner_user_id) WHERE deleted_at IS NULL
  const { data: existingAppointments } = await supabase
    .from("appointments")
    .select("appointment_datetime, space_owner_user_id")
    .in("appointment_datetime", appointment_datetimes)
    .is("deleted_at", null)
    .is("space_owner_user_id", user.id); // Solo verificar los que no tienen owner (espacios generales)

  const occupiedDatetimes = existingAppointments?.map(apt => apt.appointment_datetime) || [];
  const availableDatetimes = appointment_datetimes.filter(
    dt => !occupiedDatetimes.includes(dt)
  );

  if (availableDatetimes.length === 0) {
    return {
      success: false,
      message: "Todas las horas seleccionadas ya están ocupadas",
    };
  }

  // Preparar inserts
  const appointmentsToInsert = availableDatetimes.map(datetime => ({
    appointment_datetime: datetime,
    notes: notes ?? null,
    status_id: "517e3cc0-0763-4fd0-9195-756fe4617706", // AVAILABLE
    created_by: user.id,
    space_owner_user_id: user.id,
  }));

  const { error, data } = await supabase
    .from("appointments")
    .insert(appointmentsToInsert)
    .select();

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/citas/gestion");
  
  const createdCount = data?.length || 0;
  const skippedCount = occupiedDatetimes.length;

  let message = `${createdCount} espacio${createdCount !== 1 ? 's' : ''} creado${createdCount !== 1 ? 's' : ''} correctamente`;
  if (skippedCount > 0) {
    message += `. ${skippedCount} hora${skippedCount !== 1 ? 's' : ''} omitida${skippedCount !== 1 ? 's' : ''} por estar ocupada${skippedCount !== 1 ? 's' : ''}.`;
  }

  return { 
    success: true, 
    message,
    result: { created: createdCount, skipped: skippedCount }
  };
}

export async function deleteAvailableAppointment(
  payload: DeleteAvailableAppointmentPayload
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "Usuario no autenticado" };
  }

  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("id, status_id")
    .eq("id", payload.appointmentId)
    .single();

  if (fetchError || !appointment) {
    return {
      success: false,
      message: "El espacio disponible no existe",
    };
  }

  if (appointment.status_id !== "517e3cc0-0763-4fd0-9195-756fe4617706") {
    return {
      success: false,
      message:
        "Solo se pueden eliminar espacios disponibles en estado AVAILABLE",
    };
  }

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", payload.appointmentId);

  if (error) {
    console.error(error);
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/citas/gestion");

  return { success: true };
}

/**
 * Función para confirmar una cita reservada
 */
export async function confirmAppointment(
  appointmentId: string,
  userId?: string
) {
  try {
    const supabase = await createClient();

    // 1. Verificar usuario
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    const currentUser = userId ? { id: userId } : user;

    if (!currentUser) {
      return { success: false, message: "Usuario no autenticado" };
    }

    // 2. Verificar que la cita existe
    const { data: simpleAppointment, error: simpleError } = await supabase
      .from("appointments")
      .select("id, client_name, client_email, status_id, space_owner_user_id")
      .eq("id", appointmentId)
      .single();

    if (simpleError || !simpleAppointment) {
      const { data: multipleData, error: multipleError } = await supabase
        .from("appointments")
        .select("id")
        .eq("id", appointmentId);

      return {
        success: false,
        message: "La cita no existe o no tienes permisos para verla",
        debug: {
          simpleError: simpleError?.message,
          multipleCount: multipleData?.length,
        },
      };
    }

    // 3. Ahora intenta la consulta completa
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select(
        `
        *,
        booked_by:booked_by_user_id(id, email, user_metadata),
        space_owner:space_owner_user_id(id, email, full_name, user_metadata)
      `
      )
      .eq("id", appointmentId)
      .single();

    const appointmentData = appointment || simpleAppointment;

    if (!appointmentData) {
      return {
        success: false,
        message: "No se pudo obtener información de la cita",
      };
    }

    // 4. Verificar estado actual
    const RESERVED_STATUS_ID = "aa68683c-9977-4b6d-8c9c-aad1d3f0500f";
    const CONFIRMED_STATUS_ID = "7cccd43a-1998-41e9-b70a-61a778106338";

    if (appointmentData.status_id !== RESERVED_STATUS_ID) {
      if (appointmentData.status_id === CONFIRMED_STATUS_ID) {
        return { success: false, message: "Esta cita ya está confirmada" };
      }
      return {
        success: false,
        message: "Solo se pueden confirmar citas en estado 'reservada'",
        debug: { statusActual: appointmentData.status_id },
      };
    }

    // 5. Actualizar estado
    const updateData = {
      status_id: CONFIRMED_STATUS_ID,
      updated_at: new Date().toISOString(),
      updated_by: currentUser.id,
    };

    const { data: result, error: updateError } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        message: `Error al confirmar: ${updateError.message}`,
        debug: { updateError: updateError.message },
      };
    }

    if (!result) {
      return { success: false, message: "No se pudo confirmar la cita" };
    }

    // 6. Enviar email
    if (result.client_email && result.appointment_datetime) {
      try {
        // Importaciones dinámicas
        const { sendEmail, renderEmail } =
          await import("@/lib/actions/send-email");
        const { format } = await import("date-fns");
        const { es } = await import("date-fns/locale");
        const RegistrationTemplate = (
          await import("@/components/email/registration-template")
        ).default;

        const appointmentDate = new Date(result.appointment_datetime);

        const formatterDate = new Intl.DateTimeFormat("es-MX", {
          timeZone: "America/Mazatlan",
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const formatterTime = new Intl.DateTimeFormat("es-MX", {
          timeZone: "America/Mazatlan",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        const formattedDate = formatterDate.format(appointmentDate);
        const formattedTime = formatterTime.format(appointmentDate);

        const clientName = result.client_name || "Cliente";

        // Renderizar email para CLIENTE
        const clientContent = await renderEmail(
          RegistrationTemplate({
            name: clientName,
            serviceName: "Cita",
            time: formattedTime,
            date: formattedDate,
            status: "CONFIRMADA",
            isAdmin: false, // Para el cliente
          })
        );

        // Enviar email al CLIENTE
        await sendEmail({
          from: "AlveusSoft <notificaciones@notificaciones.alveussoft.com>",
          to: result.client_email,
          replyTo: "alveusweb.servicios@gmail.com",
          subject: `✅ Confirmación de Cita: ${clientName}`,
          name: clientName,
          contenHtmlt: clientContent,
        });
      } catch (emailError) {
        console.error("Error enviando email de confirmación:", emailError);
      }
    } else {
      console.warn("⚠️ No se envió email:", {
        razon: !result.client_email
          ? "Sin email del cliente"
          : "Sin fecha de cita",
        client_email: result.client_email,
        appointment_datetime: result.appointment_datetime,
      });
    }

    // 7. Revalidar
    revalidatePath("/dashboard/citas/gestion");
    revalidatePath("/dashboard/citas");

    return {
      success: true,
      appointment: result,
      message: "¡Cita confirmada exitosamente!",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Error desconocido al confirmar la cita",
    };
  }
}

export async function completeAppointment(
  appointmentId: string,
  notes?: string,
  userId?: string
) {
  try {
    const supabase = await createClient();

    // 1. Verificar usuario
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    const currentUser = userId ? { id: userId } : user;

    if (!currentUser) {
      return { success: false, message: "Usuario no autenticado" };
    }

    // 2. IDs de estados
    const COMPLETED_STATUS_ID = "6eb8a4c9-d793-411a-a333-7c9c806c25df"; // estado finalizada
    const CONFIRMED_STATUS_ID = "7cccd43a-1998-41e9-b70a-61a778106338"; // Estado CONFIRMADA
    const CANCELLED_STATUS_ID = "6aa423c3-db95-4633-9e31-a1bb92e16f2c"; // Estado CANCELADA
    const RESERVED_STATUS_ID = "aa68683c-9977-4b6d-8c9c-aad1d3f0500f"; // Estado RESERVADA

    // 3. Verificar que la cita existe
    const { data: simpleAppointment, error: simpleError } = await supabase
      .from("appointments")
      .select(
        "id, client_name, client_email, status_id, appointment_datetime, client_notes"
      )
      .eq("id", appointmentId)
      .single();

    if (simpleError || !simpleAppointment) {
      return {
        success: false,
        message: "La cita no existe o no tienes permisos para verla",
      };
    }

    // 4. Validaciones específicas para finalizar

    // Verificar que esté CONFIRMADA
    if (simpleAppointment.status_id !== CONFIRMED_STATUS_ID) {
      if (simpleAppointment.status_id === COMPLETED_STATUS_ID) {
        return { success: false, message: "Esta cita ya está finalizada" };
      }
      if (simpleAppointment.status_id === CANCELLED_STATUS_ID) {
        return {
          success: false,
          message: "No se puede finalizar una cita cancelada",
        };
      }
      if (simpleAppointment.status_id === RESERVED_STATUS_ID) {
        return {
          success: false,
          message:
            "No se puede finalizar una cita en estado 'reservada'. Debe ser confirmada primero.",
        };
      }

      // Para cualquier otro estado no permitido
      return {
        success: false,
        message: "Solo se pueden finalizar citas en estado 'confirmada'",
      };
    }
    const appointmentDate = new Date(simpleAppointment.appointment_datetime);

    // 5. Preparar datos de actualización
    const updateData: any = {
      status_id: COMPLETED_STATUS_ID,
      updated_at: new Date().toISOString(),
      updated_by: currentUser.id,
    };

    // 6. Actualizar cita
    const { data: result, error: updateError } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        message: `Error al finalizar cita: ${updateError.message}`,
        debug: { updateError: updateError.message },
      };
    }

    if (!result) {
      return { success: false, message: "No se pudo finalizar la cita" };
    }

    // 7. Enviar email de finalización
    if (result.client_email && result.appointment_datetime) {
      try {
        const { sendEmail, renderEmail } =
          await import("@/lib/actions/send-email");
        const { format } = await import("date-fns");
        const { es } = await import("date-fns/locale");
        const RegistrationTemplate = (
          await import("@/components/email/registration-template")
        ).default;

        const appointmentDate = new Date(result.appointment_datetime);

        const formatterDate = new Intl.DateTimeFormat("es-MX", {
          timeZone: "America/Mazatlan",
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const formatterTime = new Intl.DateTimeFormat("es-MX", {
          timeZone: "America/Mazatlan",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        const formattedDate = formatterDate.format(appointmentDate);
        const formattedTime = formatterTime.format(appointmentDate);

        const clientName = result.client_name || "Cliente";

        // Renderizar email para CLIENTE
        const clientContent = await renderEmail(
          RegistrationTemplate({
            name: clientName,
            serviceName: "Cita",
            time: formattedTime,
            date: formattedDate,
            status: "FINALIZADA",
            isAdmin: false,
          })
        );

        // Enviar email al CLIENTE
        await sendEmail({
          from: "AlveusSoft <notificaciones@notificaciones.alveussoft.com>",
          to: result.client_email,
          replyTo: "alveusweb.servicios@gmail.com",
          subject: `✅ Cita Finalizada: ${clientName}`,
          name: clientName,
          contenHtmlt: clientContent,
        });
      } catch (emailError) {
        console.error("❌ Error enviando email de finalización:", emailError);
      }
    }

    // 8. Revalidar
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/dashboard/citas/gestion");
    revalidatePath("/dashboard/citas");

    return {
      success: true,
      appointment: result,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Error desconocido al finalizar la cita",
    };
  }
}

export async function markAppointmentAsLost(
  appointmentId: string,
  notes?: string,
  userId?: string
) {
  try {
    const supabase = await createClient();

    // 1. Verificar usuario
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    const currentUser = userId ? { id: userId } : user;

    if (!currentUser) {
      return { success: false, message: "Usuario no autenticado" };
    }

    // 2. IDs de estados
    const LOST_STATUS_ID = "fcd4937a-6f80-4134-87c2-f990dd910139"; // estado PERDIDA
    const COMPLETED_STATUS_ID = "6eb8a4c9-d793-411a-a333-7c9c806c25df"; // estado FINALIZADA
    const CONFIRMED_STATUS_ID = "7cccd43a-1998-41e9-b70a-61a778106338"; // estado CONFIRMADA
    const CANCELLED_STATUS_ID = "6aa423c3-db95-4633-9e31-a1bb92e16f2c"; // estado CANCELADA
    const RESERVED_STATUS_ID = "aa68683c-9977-4b6d-8c9c-aad1d3f0500f"; // estado RESERVADA

    // 3. Verificar que la cita existe
    const { data: simpleAppointment, error: simpleError } = await supabase
      .from("appointments")
      .select(
        "id, client_name, client_email, status_id, appointment_datetime, client_notes"
      )
      .eq("id", appointmentId)
      .single();

    if (simpleError || !simpleAppointment) {
      return {
        success: false,
        message: "La cita no existe o no tienes permisos para verla",
      };
    }

    // 4. Validaciones específicas para marcar como perdida
    const allowedStatuses = [CONFIRMED_STATUS_ID, RESERVED_STATUS_ID];
    const notAllowedStatuses = [
      COMPLETED_STATUS_ID,
      CANCELLED_STATUS_ID,
      LOST_STATUS_ID,
    ];

    // Verificar si ya está en estado perdida
    if (simpleAppointment.status_id === LOST_STATUS_ID) {
      return {
        success: false,
        message: "Esta cita ya está marcada como perdida",
      };
    }

    // Verificar si está en estado no permitido
    if (notAllowedStatuses.includes(simpleAppointment.status_id)) {
      const statusMessages = {
        [COMPLETED_STATUS_ID]:
          "No se puede marcar como perdida una cita finalizada",
        [CANCELLED_STATUS_ID]:
          "No se puede marcar como perdida una cita cancelada",
      };

      return {
        success: false,
        message:
          statusMessages || "Estado no permitido para marcar como perdida",
      };
    }

    // Verificar que esté en estado permitido
    if (!allowedStatuses.includes(simpleAppointment.status_id)) {
      return {
        success: false,
        message:
          "Solo se pueden marcar como perdidas citas en estado 'confirmada' o 'reservada'",
        debug: {
          statusActual: simpleAppointment.status_id,
          estadosPermitidos: allowedStatuses,
        },
      };
    }

    const appointmentDate = new Date(simpleAppointment.appointment_datetime);

    // 5. Preparar datos de actualización
    const updateData: any = {
      status_id: LOST_STATUS_ID,
      updated_at: new Date().toISOString(),
      updated_by: currentUser.id,
    };

    // 6. Actualizar cita
    const { data: result, error: updateError } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        message: `Error al marcar cita como perdida: ${updateError.message}`,
        debug: { updateError: updateError.message },
      };
    }

    if (!result) {
      return {
        success: false,
        message: "No se pudo marcar la cita como perdida",
      };
    }

    // 7. Enviar email de notificación
    if (result.client_email && result.appointment_datetime) {
      try {
        const { sendEmail, renderEmail } =
          await import("@/lib/actions/send-email");
        const RegistrationTemplate = (
          await import("@/components/email/registration-template")
        ).default;

        const appointmentDate = new Date(result.appointment_datetime);

        const formatterDate = new Intl.DateTimeFormat("es-MX", {
          timeZone: "America/Mazatlan",
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const formatterTime = new Intl.DateTimeFormat("es-MX", {
          timeZone: "America/Mazatlan",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        const formattedDate = formatterDate.format(appointmentDate);
        const formattedTime = formatterTime.format(appointmentDate);

        const clientName = result.client_name || "Cliente";

        // Renderizar email para CLIENTE
        const clientContent = await renderEmail(
          RegistrationTemplate({
            name: clientName,
            serviceName: "Cita",
            time: formattedTime,
            date: formattedDate,
            status: "PERDIDA",
            isAdmin: false,
          })
        );

        // Enviar email al CLIENTE
        await sendEmail({
          from: "AlveusSoft <notificaciones@notificaciones.alveussoft.com>",
          to: result.client_email,
          replyTo: "alveusweb.servicios@gmail.com",
          subject: `❌ Cita Marcada como Perdida: ${clientName}`,
          name: clientName,
          contenHtmlt: clientContent,
        });
      } catch (emailError) {
        console.error("❌ Error enviando email de cita perdida:", emailError);
      }
    }

    // 8. Revalidar
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/dashboard/citas/gestion");
    revalidatePath("/dashboard/citas");

    return {
      success: true,
      appointment: result,
      message: "Cita marcada como perdida exitosamente",
    };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.message || "Error desconocido al marcar la cita como perdida",
    };
  }
}

export async function markReenableSpace(
  appointmentId: string,
  userId?: string
) {
  try {
    const supabase = await createClient();

    // 1. Verificar usuario
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    const currentUser = userId ? { id: userId } : user;

    if (!currentUser) {
      return { success: false, message: "Usuario no autenticado" };
    }

    // 2. ID de estado permitido
    const CANCELLED_STATUS_ID = "6aa423c3-db95-4633-9e31-a1bb92e16f2c"; // estado CANCELADA

    // 3. Verificar que la cita existe
    const { data: simpleAppointment, error: simpleError } = await supabase
      .from("appointments")
      .select(
        "id, client_name, client_email, status_id, appointment_datetime, client_notes"
      )
      .eq("id", appointmentId)
      .single();

    if (simpleError || !simpleAppointment) {
      return {
        success: false,
        message: "La cita no existe o no tienes permisos para verla",
      };
    }

    // Verificar si está en estado no permitido
    if (simpleAppointment.status_id !== CANCELLED_STATUS_ID) {
      return {
        success: false,
        message: "Estado no permitido para rehabilitar un espacio",
      };
    }

    // 5. Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: currentUser.id,
      deleted_at: new Date().toISOString(),
      deleted_by: currentUser.id,
    };

    // 6. Actualizar cita
    const { data: result, error: updateError } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        message: `Error al liberar el espacio: ${updateError.message}`,
        debug: { updateError: updateError.message },
      };
    }

    if (!result) {
      return {
        success: false,
        message: "No se pudo rehabilitar el espacio de la cita.",
      };
    }

    // 7. Revalidar
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/dashboard/citas/gestion");
    revalidatePath("/dashboard/citas");

    return {
      success: true,
      appointment: result,
      message: "Espacio de cita rehabilitado exitosamente",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Error desconocido al rehabilitar el espacio",
    };
  }
}

/**
 * Obtiene citas con paginación
 * @param page - Número de página (inicia en 1)
 * @param pageSize - Cantidad de items por página
 * @param searchQuery - Término de búsqueda (opcional)
 * @param filters - Filtros adicionales (opcional)
 * @returns Objeto con citas, total, página actual y total de páginas
 */
export async function getAppointments(
  page = 1,
  pageSize = 50,
  searchQuery = "",
  filters?: {
    status_id?: string | string[];
    space_owner_user_id?: string;
    booked_by_user_id?: string;
    start_date?: string;
    end_date?: string;
  }
): Promise<AppointmentsResponse> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("appointments")
    .select(
      `
      *,
      space_owner:space_owner_user_id (
        id, 
        email, 
        full_name
      ),
      booked_by:booked_by_user_id (
        id, 
        email, 
        full_name
      ),
      status:status_id (id, name, description)
    `,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("appointment_datetime", { ascending: true }); 

  // Aplicar búsqueda por texto
  if (searchQuery) {
    query = query.or(
      `client_name.ilike.%${searchQuery}%,client_email.ilike.%${searchQuery}%,client_phone.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%,client_notes.ilike.%${searchQuery}%`
    );
  }

  // Aplicar filtros
  if (filters) {
    if (filters.status_id) {
      if (Array.isArray(filters.status_id) && filters.status_id.length > 0) {
        query = query.in("status_id", filters.status_id);
      } else if (typeof filters.status_id === "string") {
        query = query.eq("status_id", filters.status_id);
      }
    }
    if (filters.space_owner_user_id) {
      query = query.eq("space_owner_user_id", filters.space_owner_user_id);
    }
    if (filters.booked_by_user_id) {
      query = query.eq("booked_by_user_id", filters.booked_by_user_id);
    }
    if (filters.start_date) {
      query = query.gte("appointment_datetime", filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte("appointment_datetime", filters.end_date);
    }
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Error al obtener citas:", error);
    throw new Error(`Error al obtener citas: ${error.message}`);
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  return {
    appointments:
      data?.map((appointment) => ({
        ...appointment,
        space_owner: appointment.space_owner
          ? {
              id: appointment.space_owner.id,
              email: appointment.space_owner.email,
              user_metadata: {
                name:
                  appointment.space_owner.full_name ||
                  appointment.space_owner.email,
              },
            }
          : null,
        booked_by: appointment.booked_by
          ? {
              id: appointment.booked_by.id,
              email: appointment.booked_by.email,
              user_metadata: {
                name:
                  appointment.booked_by.full_name ||
                  appointment.booked_by.email,
              },
            }
          : null,
      })) || [],
    total: count || 0,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Obtiene una cita por su ID
 */
export async function getAppointmentById(
  appointmentId: string
): Promise<Appointment | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      space_owner:space_owner_user_id (id, email, full_name, active),
      booked_by:booked_by_user_id (id, email, full_name, active),
      status:status_id (id, name, description, active)
    `
    )
    .eq("id", appointmentId)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error al obtener cita:", error);
    return null;
  }

  return data
    ? {
        ...data,
        space_owner: data.space_owner
          ? {
              id: data.space_owner.id,
              email: data.space_owner.email,
              user_metadata: {
                name: data.space_owner.full_name || data.space_owner.email,
              },
            }
          : null,
        booked_by: data.booked_by
          ? {
              id: data.booked_by.id,
              email: data.booked_by.email,
              user_metadata: {
                name: data.booked_by.full_name || data.booked_by.email,
              },
            }
          : null,
      }
    : null;
}

/**
 * Obtiene todas las citas (sin paginación)
 */
export async function getAllAppointments(): Promise<Appointment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      space_owner:space_owner_user_id (id, email, full_name, active),
      booked_by:booked_by_user_id (id, email, full_name, active),
      status:status_id (id, name, description, active)
    `
    )
    .is("deleted_at", null)
    .order("appointment_datetime", { ascending: true });

  if (error) {
    console.error("Error al obtener citas:", error);
    return [];
  }

  return (data || []).map((appointment) => ({
    ...appointment,
    space_owner: appointment.space_owner
      ? {
          id: appointment.space_owner.id,
          email: appointment.space_owner.email,
          user_metadata: {
            name:
              appointment.space_owner.full_name ||
              appointment.space_owner.email,
          },
        }
      : null,
    booked_by: appointment.booked_by
      ? {
          id: appointment.booked_by.id,
          email: appointment.booked_by.email,
          user_metadata: {
            name:
              appointment.booked_by.full_name || appointment.booked_by.email,
          },
        }
      : null,
  }));
}

/**
 * Crea una nueva cita
 */
export async function createAppointment(
  payload: NewAppointmentPayload
): Promise<{
  success: boolean;
  message?: string;
  appointment?: Appointment;
}> {
  const supabase = await createClient();

  try {
    // Obtener usuario actual
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Validaciones básicas
    const clientName = payload.client_name?.trim();
    if (!clientName) {
      return {
        success: false,
        message: "El nombre del cliente es obligatorio",
      };
    }

    const appointmentDatetime = payload.appointment_datetime?.trim();
    if (!appointmentDatetime) {
      return {
        success: false,
        message: "La fecha y hora de la cita es obligatoria",
      };
    }

    // Validar que la fecha de la cita no sea en el pasado
    const appointmentDate = new Date(appointmentDatetime);
    const now = new Date();
    if (appointmentDate < now) {
      return {
        success: false,
        message: "La fecha de la cita no puede ser en el pasado",
      };
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        space_owner_user_id: payload.space_owner_user_id || null,
        booked_by_user_id: user?.id || null,
        status_id: payload.status_id || null,
        appointment_datetime: appointmentDatetime,
        client_name: clientName,
        client_phone: payload.client_phone?.trim() || null,
        client_email: payload.client_email?.trim() || null,
        notes: payload.notes?.trim() || null,
        client_notes: payload.client_notes?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user?.id || null,
        updated_by: user?.id || null,
      })
      .select(
        `
        *,
        space_owner:space_owner_user_id (id, email, full_name),
        booked_by:booked_by_user_id (id, email, full_name),
        status:status_id (id, name, description)
      `
      )
      .single();

    if (error) {
      console.error("Error en createAppointment:", error);

      // Manejar errores de constraints
      if (error.code === "23503") {
        if (error.message.includes("space_owner_user_id")) {
          return {
            success: false,
            message: "El propietario del espacio no existe.",
          };
        }
        if (error.message.includes("status_id")) {
          return {
            success: false,
            message: "El estado seleccionado no existe.",
          };
        }
      }

      return { success: false, message: error.message };
    }

    revalidatePath("/dashboard/citas");

    // Procesar datos para compatibilidad
    const processedAppointment: Appointment = {
      ...data,
      space_owner: data.space_owner
        ? {
            id: data.space_owner.id,
            email: data.space_owner.email,
            full_name: data.space_owner.full_name,
            user_metadata: {
              name: data.space_owner.full_name || data.space_owner.email,
            },
          }
        : null,
      booked_by: data.booked_by
        ? {
            id: data.booked_by.id,
            email: data.booked_by.email,
            full_name: data.booked_by.full_name,
            user_metadata: {
              name: data.booked_by.full_name || data.booked_by.email,
            },
          }
        : null,
    };

    return { success: true, appointment: processedAppointment };
  } catch (error: any) {
    console.error("Error inesperado en createAppointment:", error);
    return { success: false, message: "Ocurrió un error inesperado" };
  }
}

/**
 * Actualiza una cita existente
 */
export async function updateAppointment(
  appointmentId: string,
  payload: UpdateAppointmentPayload
): Promise<{
  success: boolean;
  message?: string;
  appointment?: Appointment;
}> {
  try {
    const supabase = await createClient();

    // 1. Verificar que la cita existe
    const { data: existingAppointment, error: findError } = await supabase
      .from("appointments")
      .select("id, status_id, appointment_datetime, cancelled_at")
      .eq("id", appointmentId)
      .is("deleted_at", null)
      .single();

    if (findError || !existingAppointment) {
      return { success: false, message: "Cita no encontrada" };
    }

    // 2. Validaciones - Manejo más seguro
    if (payload.client_name !== undefined) {
      const clientName = payload.client_name?.trim();
      if (!clientName) {
        return {
          success: false,
          message: "El nombre del cliente es obligatorio",
        };
      }
    }

    if (payload.appointment_datetime !== undefined) {
      const appointmentDatetime = payload.appointment_datetime?.trim();
      if (!appointmentDatetime) {
        return {
          success: false,
          message: "La fecha y hora de la cita es obligatoria",
        };
      }

      // Validar que la fecha de la cita no sea en el pasado (solo si se está cambiando)
      const appointmentDate = new Date(appointmentDatetime);
      const now = new Date();
      if (appointmentDate < now) {
        return {
          success: false,
          message: "La fecha de la cita no puede ser en el pasado",
        };
      }
    }

    // 3. Validar lógica de cancelación
    if (payload.cancelled_at !== undefined) {
      // Si se está cancelando la cita
      if (payload.cancelled_at && !existingAppointment.cancelled_at) {
        // Verificar si ya estaba cancelada
        if (existingAppointment.status_id === "cancelled") {
          return { success: false, message: "La cita ya está cancelada" };
        }
      }
      // Si se está removiendo la cancelación
      else if (!payload.cancelled_at && existingAppointment.cancelled_at) {
        // Permitir reactivar solo si la cita no ha pasado
        const appointmentDate = new Date(
          existingAppointment.appointment_datetime
        );
        const now = new Date();
        if (appointmentDate < now) {
          return {
            success: false,
            message: "No se puede reactivar una cita que ya pasó",
          };
        }
      }
    }

    // 4. Obtener usuario actual
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 5. Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    };

    // Agregar solo los campos que tienen valor con manejo seguro
    if (payload.space_owner_user_id !== undefined)
      updateData.space_owner_user_id = payload.space_owner_user_id;
    if (payload.status_id !== undefined)
      updateData.status_id = payload.status_id;
    if (payload.appointment_datetime !== undefined)
      updateData.appointment_datetime = payload.appointment_datetime?.trim();
    if (payload.booked_at !== undefined)
      updateData.booked_at = payload.booked_at;
    if (payload.cancelled_at !== undefined)
      updateData.cancelled_at = payload.cancelled_at;
    if (payload.client_name !== undefined)
      updateData.client_name = payload.client_name?.trim() || null;
    if (payload.client_phone !== undefined)
      updateData.client_phone = payload.client_phone?.trim() || null;
    if (payload.client_email !== undefined)
      updateData.client_email = payload.client_email?.trim() || null;
    if (payload.notes !== undefined)
      updateData.notes = payload.notes?.trim() || null;
    if (payload.client_notes !== undefined)
      updateData.client_notes = payload.client_notes?.trim() || null;

    // 6. Ejecutar el UPDATE
    const { data, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId)
      .select(
        `
        *,
        space_owner:space_owner_user_id (id, email, full_name),
        booked_by:booked_by_user_id (id, email, full_name),
        status:status_id (id, name, description)
      `
      )
      .single();

    if (error) {
      console.error("Error al actualizar cita:", error);

      // Manejar errores de foreign key
      if (error.code === "23503") {
        if (error.message.includes("space_owner_user_id")) {
          return {
            success: false,
            message: "El propietario del espacio no existe.",
          };
        }
        if (error.message.includes("status_id")) {
          return {
            success: false,
            message: "El estado seleccionado no existe.",
          };
        }
      }

      return {
        success: false,
        message: `Error de base de datos: ${error.message}`,
      };
    }

    // 7. Procesar datos para compatibilidad
    const processedAppointment: Appointment = {
      ...data,
      space_owner: data.space_owner
        ? {
            id: data.space_owner.id,
            email: data.space_owner.email,
            full_name: data.space_owner.full_name,
            user_metadata: {
              name: data.space_owner.full_name || data.space_owner.email,
            },
          }
        : null,
      booked_by: data.booked_by
        ? {
            id: data.booked_by.id,
            email: data.booked_by.email,
            full_name: data.booked_by.full_name,
            user_metadata: {
              name: data.booked_by.full_name || data.booked_by.email,
            },
          }
        : null,
    };

    // 8. Revalidar paths
    revalidatePath("/dashboard/citas");
    revalidatePath(`/dashboard/citas/gestion/editar/${appointmentId}`);

    return { success: true, appointment: processedAppointment };
  } catch (error: any) {
    console.error("Error general en updateAppointment:", error);
    return { success: false, message: `Error inesperado: ${error.message}` };
  }
}

/**
 * Obtiene citas para calendario
 */
export async function getCalendarAppointments(
  startDate: string,
  endDate: string,
  spaceOwnerId?: string
): Promise<Appointment[]> {
  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select(
      `
      *,
      space_owner:space_owner_user_id (id, email, user_metadata),
      booked_by:booked_by_user_id (id, email, user_metadata),
      status:status_id (id, name, description, active)
    `
    )
    .is("deleted_at", null)
    .gte("appointment_datetime", startDate)
    .lte("appointment_datetime", endDate)
    .order("appointment_datetime", { ascending: true });

  if (spaceOwnerId) {
    query = query.eq("space_owner_user_id", spaceOwnerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error al obtener citas para calendario:", error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene estados de citas disponibles
 */
export async function getAppointmentStatuses(): Promise<AppointmentStatus[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointment_status")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error al obtener estados de citas:", error);
    return [];
  }

  return data || [];
}

/**
 * Cancela una cita
 */
export async function cancelAppointment(
  appointmentId: string,
  reason?: string
): Promise<{
  success: boolean;
  message?: string;
  appointment?: Appointment;
}> {
  const supabase = await createClient();

  try {
    // Obtener usuario actual
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Buscar el estado "CANCELADA" en la tabla appointment_status
    const { data: statusData, error: statusError } = await supabase
      .from("appointment_status")
      .select("id")
      .or("name.ilike.%cancel%,description.ilike.%cancel%")
      .single();

    if (statusError || !statusData) {
      return {
        success: false,
        message:
          "No se encontró un estado de cancelación. Verifica la configuración de estados.",
      };
    }

    const CANCELLED_STATUS_ID = statusData.id;

    // 2. OBTENER DATOS COMPLETOS DE LA CITA (INCLUYENDO SPACE_OWNER) ANTES DE CANCELAR
    const { data: appointmentData, error: fetchError } = await supabase
      .from("appointments")
      .select(
        `
        *,
        space_owner:space_owner_user_id(id, email, full_name),
        booked_by:booked_by_user_id(id, email, full_name),
        status:status_id(id, name, description)
      `
      )
      .eq("id", appointmentId)
      .is("deleted_at", null)
      .single();

    if (fetchError || !appointmentData) {
      console.error("Error obteniendo datos de la cita:", fetchError);
      return {
        success: false,
        message: "No se pudo obtener información de la cita",
      };
    }

    // 3. Verificar que no esté ya cancelada
    if (appointmentData.status_id === CANCELLED_STATUS_ID) {
      return { success: false, message: "Esta cita ya está cancelada" };
    }

    // 4. Validar que solo se cancelen ciertos estados
    const allowedStatuses = [
      "aa68683c-9977-4b6d-8c9c-aad1d3f0500f", // RESERVADA
      "7cccd43a-1998-41e9-b70a-61a778106338", // CONFIRMADA
      "517e3cc0-0763-4fd0-9195-756fe4617706", // DISPONIBLE 
    ];

    if (
      appointmentData.status_id &&
      !allowedStatuses.includes(appointmentData.status_id)
    ) {
      return {
        success: false,
        message: "No se puede cancelar esta cita en su estado actual",
      };
    }

    // 5. Actualizar la cita
    const { data, error } = await supabase
      .from("appointments")
      .update({
        status_id: CANCELLED_STATUS_ID,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: user?.id || null,
      })
      .eq("id", appointmentId)
      .is("deleted_at", null)
      .select(
        `
        *,
        space_owner:space_owner_user_id (id, email, full_name),
        booked_by:booked_by_user_id (id, email, full_name),
        status:status_id (id, name, description)
      `
      )
      .single();

    if (error) {
      console.error("Error al cancelar cita:", error);
      return { success: false, message: error.message };
    }

    if (!data) {
      return { success: false, message: "No se pudo cancelar la cita" };
    }

    // 6. Procesar respuesta
    const processedAppointment: Appointment = {
      ...data,
      space_owner: data.space_owner
        ? {
            id: data.space_owner.id,
            email: data.space_owner.email,
            full_name: data.space_owner.full_name || null,
          }
        : null,
      booked_by: data.booked_by
        ? {
            id: data.booked_by.id,
            email: data.booked_by.email,
            full_name: data.booked_by.full_name || null,
          }
        : null,
    };

    // 7. ENVIAR CORREO DE NOTIFICACIÓN AL ADMINISTRADOR (SPACE_OWNER)
    try {
      const adminEmail = appointmentData.space_owner?.email;
      const adminName =
        appointmentData.space_owner?.full_name || "Administrador";
      
      // Obtener datos del cliente
      const clientName = appointmentData.client_name || "Cliente";
      const clientEmail = appointmentData.client_email;
      const clientPhone = appointmentData.client_phone;

      if (adminEmail && appointmentData.appointment_datetime) {
        // Formatear fecha y hora de la cita
        const appointmentDate = new Date(appointmentData.appointment_datetime);

        const formatterDate = new Intl.DateTimeFormat("es-MX", {
          timeZone: "America/Mazatlan",
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const formatterTime = new Intl.DateTimeFormat("es-MX", {
          timeZone: "America/Mazatlan",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        const formattedDate = formatterDate.format(appointmentDate);
        const formattedTime = formatterTime.format(appointmentDate);

        // Renderizar email para ADMINISTRADOR
        const adminContent = await renderEmail(
          RegistrationTemplate({
            name: adminName, // Nombre del administrador
            serviceName: `Cita de ${clientName}`,
            time: formattedTime,
            date: formattedDate,
            status: "CANCELADA",
            isAdmin: true,
            clientName: clientName,
            clientEmail: clientEmail,
            clientPhone: clientPhone,
          })
        );

        // Enviar email al ADMINISTRADOR
        await sendEmail({
          from: "AlveusSoft <notificaciones@notificaciones.alveussoft.com>",
          to: adminEmail,
          replyTo: "alveusweb.servicios@gmail.com",
          subject: `❌ Cita Cancelada por Cliente - ${formattedDate}`,
          name: adminName,
          contenHtmlt: adminContent,
        });

        console.log(
          `✅ Email de cancelación enviado al administrador: ${adminEmail}`
        );
      } else {
        console.warn("⚠️ No se envió email al administrador:", {
          razon: !adminEmail
            ? "Sin email del administrador"
            : "Sin fecha de cita",
          admin_email: adminEmail,
          appointment_datetime: appointmentData.appointment_datetime,
          space_owner: appointmentData.space_owner,
        });
      }
    } catch (emailError) {
      console.error("❌ Error enviando email de cancelación:", emailError);
      // No fallamos la operación principal si el email falla
    }

    // 8. Revalidar rutas
    revalidatePath("/appointments/history");
    revalidatePath(`/appointments/history/${appointmentId}`);

    return {
      success: true,
      appointment: processedAppointment,
      message: "Cita cancelada correctamente",
    };
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return { success: false, message: "Ocurrió un error inesperado" };
  }
}

/**
 * Función para cancelar una cita (versión administrador)
 */
export async function cancelAppointmentAdmin(
  appointmentId: string,
  reason?: string,
  userId?: string
) {
  try {
    const supabase = await createClient();

    // 1. Verificar usuario
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    const currentUser = userId ? { id: userId } : user;

    if (!currentUser) {
      return { success: false, message: "Usuario no autenticado" };
    }

    // 2. IDs de estados
    const CANCELLED_STATUS_ID = "6aa423c3-db95-4633-9e31-a1bb92e16f2c";
    const RESERVED_STATUS_ID = "aa68683c-9977-4b6d-8c9c-aad1d3f0500f";
    const CONFIRMED_STATUS_ID = "7cccd43a-1998-41e9-b70a-61a778106338";

    // 3. Verificar que la cita existe
    const { data: simpleAppointment, error: simpleError } = await supabase
      .from("appointments")
      .select("id, client_name, client_email, status_id, appointment_datetime")
      .eq("id", appointmentId)
      .single();

    if (simpleError || !simpleAppointment) {
      const { data: multipleData, error: multipleError } = await supabase
        .from("appointments")
        .select("id")
        .eq("id", appointmentId);

      return {
        success: false,
        message: "La cita no existe o no tienes permisos para verla",
      };
    }

    // 4. Ahora la consulta completa para obtener más datos
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select(
        `
        *,
        booked_by:booked_by_user_id(id, email, user_metadata),
        space_owner:space_owner_user_id(id, email, full_name, user_metadata)
      `
      )
      .eq("id", appointmentId)
      .single();

    if (fetchError) {
      console.error("🔍 DEBUG Error en consulta completa:", fetchError);
    }

    const appointmentData = appointment || simpleAppointment;

    if (!appointmentData) {
      return {
        success: false,
        message: "No se pudo obtener información de la cita",
      };
    }

    // 5. Verificar que no esté ya cancelada
    if (appointmentData.status_id === CANCELLED_STATUS_ID) {
      return { success: false, message: "Esta cita ya está cancelada" };
    }

    // 6. Validar que solo se cancelen ciertos estados
    const allowedStatuses = [RESERVED_STATUS_ID, CONFIRMED_STATUS_ID];
    if (!allowedStatuses.includes(appointmentData.status_id)) {
      return {
        success: false,
        message:
          "Solo se pueden cancelar citas en estado 'reservada' o 'confirmada'",
        debug: {
          statusActual: appointmentData.status_id,
          allowedStatuses,
        },
      };
    }

    // 7. Actualizar cita
    const updateData = {
      status_id: CANCELLED_STATUS_ID,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: currentUser.id,
    };

    const { data: result, error: updateError } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        message: `Error al cancelar: ${updateError.message}`,
        debug: { updateError: updateError.message },
      };
    }

    if (!result) {
      return { success: false, message: "No se pudo cancelar la cita" };
    }

    // 9. Enviar email de cancelación
    if (result.client_email && result.appointment_datetime) {
      try {
        // Importaciones dinámicas
        const { sendEmail, renderEmail } =
          await import("@/lib/actions/send-email");
        const { format } = await import("date-fns");
        const { es } = await import("date-fns/locale");
        const RegistrationTemplate = (
          await import("@/components/email/registration-template")
        ).default;

        const appointmentDate = new Date(result.appointment_datetime);

        const formatterDate = new Intl.DateTimeFormat("es-MX", {
          timeZone: "America/Mazatlan",
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const formatterTime = new Intl.DateTimeFormat("es-MX", {
          timeZone: "America/Mazatlan",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        const formattedDate = formatterDate.format(appointmentDate);
        const formattedTime = formatterTime.format(appointmentDate);

        const clientName = result.client_name || "Cliente";

        // Renderizar email para CLIENTE
        const clientContent = await renderEmail(
          RegistrationTemplate({
            name: clientName,
            serviceName: "Cita",
            time: formattedTime,
            date: formattedDate,
            status: "CANCELADA",
            isAdmin: false,
          })
        );

        // Enviar email al CLIENTE
        await sendEmail({
          from: "AlveusSoft <notificaciones@notificaciones.alveussoft.com>",
          to: result.client_email,
          replyTo: "alveusweb.servicios@gmail.com",
          subject: `❌ Cancelación de Cita: ${clientName}`,
          name: clientName,
          contenHtmlt: clientContent,
        });
      } catch (emailError) {
        console.error("❌ Error enviando email de cancelación:", emailError);
      }
    } else {
      console.warn("⚠️ No se envió email de cancelación:", {
        razon: !result.client_email
          ? "Sin email del cliente"
          : "Sin fecha de cita",
        client_email: result.client_email,
        appointment_datetime: result.appointment_datetime,
      });
    }

    // 10. Revalidar
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/dashboard/citas/gestion");
    revalidatePath("/dashboard/citas");

    return {
      success: true,
      appointment: result,
      message: reason
        ? `Cita cancelada correctamente. Razón: ${reason}`
        : "Cita cancelada correctamente",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Error desconocido al cancelar la cita",
    };
  }
}

/**
 * Obtiene estadísticas de citas
 */
export async function getAppointmentStats(
  startDate?: string,
  endDate?: string
): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
}> {
  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select("*", { count: "exact" })
    .is("deleted_at", null);

  if (startDate) {
    query = query.gte("appointment_datetime", startDate);
  }
  if (endDate) {
    query = query.lte("appointment_datetime", endDate);
  }

  const { count: total, error } = await query;

  if (error) {
    console.error("Error al obtener estadísticas:", error);
    return { total: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0 };
  }

  return {
    total: total || 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  };
}

/**
 * Busca citas por nombre de cliente, email o teléfono
 */
export async function searchAppointments(
  query: string
): Promise<Appointment[]> {
  const supabase = await createClient();

  if (query.trim().length < 2) return [];

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      space_owner:space_owner_user_id (id, email, user_metadata),
      booked_by:booked_by_user_id (id, email, user_metadata),
      status:status_id (id, name, description, active)
    `
    )
    .is("deleted_at", null)
    .or(
      `client_name.ilike.%${query}%,client_email.ilike.%${query}%,client_phone.ilike.%${query}%`
    )
    .order("appointment_datetime", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error al buscar citas:", error);
    return [];
  }

  return data || [];
}

/**
 * Busca el historial de citas del cliente autenticado
 */
export async function getMyAppointmentHistory(
  page: number,
  pageSize: number,
  search?: string,
  filters?: {
    status_ids?: string[];
    start_date?: string;
    end_date?: string;
  }
): Promise<AppointmentsResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuario no autenticado");
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("appointments")
    .select(
      `
      *,
      status:appointment_status (
        id,
        name,
        description
      )
      `,
      { count: "exact" }
    )
    .eq("booked_by_user_id", user.id)
    .order("appointment_datetime", { ascending: true });

  if (search && search.trim() !== "") {
    const term = `%${search.trim()}%`;
    query = query.ilike("notes", term);
  }

  if (filters?.status_ids && filters.status_ids.length > 0) {
    query = query.in("status_id", filters.status_ids);
  }

  if (filters?.start_date) {
    query = query.gte(
      "appointment_datetime",
      new Date(filters.start_date).toISOString()
    );
  }

  if (filters?.end_date) {
    query = query.lte(
      "appointment_datetime",
      new Date(filters.end_date).toISOString()
    );
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw error;

  return {
    appointments: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

/**
 * Función para reservar una cita (actualizar con datos del cliente)
 */
export async function bookAppointment(
  appointmentId: string,
  clientInfo: {
    full_name: string;
    email: string;
    phone: string;
    notes?: string;
  },
  userId?: string
) {
  try {
    const supabase = await createClient();

    // 1. Verificar usuario
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const currentUser = userId ? { id: userId } : user;

    if (!currentUser) {
      return { success: false, message: "Usuario no autenticado" };
    }

    // 2. Verificar que la cita existe y está disponible
    const { data: exactAppointment, error: fetchError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (fetchError || !exactAppointment) {
      return { success: false, message: "La cita no existe" };
    }

    // 3. Verificar estado actual
    const AVAILABLE_STATUS_ID = "517e3cc0-0763-4fd0-9195-756fe4617706";
    const RESERVED_STATUS_ID = "aa68683c-9977-4b6d-8c9c-aad1d3f0500f";

    // Verificar condiciones
    if (exactAppointment.status_id !== AVAILABLE_STATUS_ID) {
      if (exactAppointment.status_id === RESERVED_STATUS_ID) {
        return {
          success: false,
          message: "Este horario ya ha sido reservado por alguien más",
        };
      }
      return {
        success: false,
        message: "La cita no está disponible para reservar",
      };
    }

    // 4. Hacer el update
    const updateData = {
      client_name: clientInfo.full_name.trim(),
      client_email: clientInfo.email.trim(),
      client_phone: clientInfo.phone?.trim() || "",
      client_notes: clientInfo.notes?.trim() || null,
      booked_by_user_id: currentUser.id,
      booked_at: new Date().toISOString(),
      status_id: RESERVED_STATUS_ID,
      updated_at: new Date().toISOString(),
      updated_by: currentUser.id,
    };

    const { data: result, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: `Error al actualizar: ${error.message}`,
      };
    }

    if (!result) {
      return { success: false, message: "No se pudo actualizar la cita" };
    }

    try {
      const { sendEmail } = await import("@/lib/actions/send-email");
      const { format } = await import("date-fns");
      const { es } = await import("date-fns/locale");

      if (result.appointment_datetime) {
        const appointmentDate = new Date(result.appointment_datetime);

        const formatterDate = new Intl.DateTimeFormat("es-MX", {
          timeZone: "America/Mazatlan",
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const formatterTime = new Intl.DateTimeFormat("es-MX", {
          timeZone: "America/Mazatlan",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        const formattedDate = formatterDate.format(appointmentDate);
        const formattedTime = formatterTime.format(appointmentDate);

        const content = await renderEmail(
          RegistrationTemplate({
            name: clientInfo.full_name,
            serviceName: "Cita",
            time: formattedTime || "",
            date: formattedDate || "",
            status: "RESERVADA",
            isAdmin: false,
          })
        );

        await sendEmail({
          from: "AlveusSoft <notificaciones@notificaciones.alveussoft.com>",
          to: clientInfo.email,
          replyTo: "alveusweb.servicios@gmail.com",
          subject: `📅 Nueva cita: ${clientInfo.full_name}`,
          name: clientInfo.full_name,
          contenHtmlt: content,
        });

        const adminContent = await renderEmail(
          RegistrationTemplate({
            name: clientInfo.full_name,
            serviceName: "Cita",
            time: formattedTime || "",
            date: formattedDate || "",
            status: "RESERVADA",
            isAdmin: true,
          })
        );

        await sendEmail({
          from: "AlveusSoft <notificaciones@notificaciones.alveussoft.com>",
          to: "alveusweb.servicios@gmail.com",
          replyTo: "alveusweb.servicios@gmail.com",
          subject: `📅 Nueva cita: ${clientInfo.full_name}`,
          name: clientInfo.full_name,
          contenHtmlt: adminContent,
        });
      }
    } catch (emailError) {
      console.error("❌ Error enviando email:", emailError);
      // No fallar por error de email
    }

    // 6. Revalidar paths
    revalidatePath("/dashboard/citas");
    revalidatePath("/citas");
    revalidatePath("/profile");

    return {
      success: true,
      appointment: result,
      appointmentId: result.id, // ← IMPORTANTE: Devuelve el ID
      message: "¡Cita reservada exitosamente!",
    };
  } catch (error: any) {
    console.error("Error general:", error);
    return { success: false, message: error.message };
  }
}

// Función para obtener profesional por código
export async function getProfessionalByCode(userCode: string) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, user_code, active")
      .eq("user_code", userCode)
      .eq("active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, message: `El profesional "${userCode}" no existe` };
      }
      return { success: false, message: `Error técnico: ${error.message}` };
    }

    if (!data) {
      return { success: false, message: `El profesional "${userCode}" no está disponible` };
    }

    return { 
      success: true, 
      data: {
        id: data.id,
        email: data.email,
        full_name: data.full_name || data.email,
        user_code: data.user_code
      }
    };
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return { success: false, message: `Error: ${error.message || "No se pudo cargar la información"}` };
  }
}

// Función para obtener profesionales activos con espacios disponibles
export async function getProfessionalsWithAvailableSlots() {
  const supabase = await createClient();
  
  try {
    // 1. Obtener todos los profesionales activos con user_code
    const { data: allProfessionals, error: professionalsError } = await supabase
      .from("users")
      .select("id, email, full_name, user_code, active")
      .eq("active", true)
      .not("user_code", "is", null)
      .order("full_name", { ascending: true });

    if (professionalsError) {
      console.error("Error al cargar profesionales:", professionalsError);
      return { success: false, message: "Error al cargar la lista de profesionales" };
    }

    if (!allProfessionals || allProfessionals.length === 0) {
      return { success: true, data: [] };
    }

    // 2. Obtener IDs de profesionales con citas disponibles
    const professionalIds = allProfessionals.map(prof => prof.id);
    const { data: availableAppointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("space_owner_user_id")
      .eq("status_id", "517e3cc0-0763-4fd0-9195-756fe4617706") // Estado "available"
      .is("client_name", null)
      .is("client_email", null)
      .is("client_phone", null)
      .is("deleted_at", null)
      .gte("appointment_datetime", new Date().toISOString())
      .in("space_owner_user_id", professionalIds);

    if (appointmentsError) {
      console.error("Error al obtener citas disponibles:", appointmentsError);
      return { success: false, message: "Error al verificar disponibilidad" };
    }

    // 3. Filtrar profesionales con espacios disponibles
    const availableProfessionalIds = [...new Set(
      (availableAppointments || []).map(apt => apt.space_owner_user_id)
    )];

    const professionalsWithSlots = allProfessionals.filter(prof => 
      prof.user_code && 
      prof.user_code.trim() !== "" &&
      availableProfessionalIds.includes(prof.id)
    );

    return { 
      success: true, 
      data: professionalsWithSlots.map(prof => ({
        id: prof.id,
        email: prof.email,
        full_name: prof.full_name,
        user_code: prof.user_code,
        active: prof.active
      }))
    };
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return { success: false, message: "Error al cargar profesionales" };
  }
}

// Función para obtener slots disponibles por profesional y fecha
export async function getAvailableSlotsByDate(professionalId: string, date: Date) {
  const supabase = await createClient();
  
  try {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
          id,
          appointment_datetime,
          space_owner:space_owner_user_id (
            id, 
            email, 
            full_name,
            user_code
          )
        `
      )
      .eq("status_id", "517e3cc0-0763-4fd0-9195-756fe4617706")
      .eq("space_owner_user_id", professionalId)
      .is("client_name", null)
      .is("client_email", null)
      .is("client_phone", null)
      .is("deleted_at", null)
      .gte("appointment_datetime", startDate.toISOString())
      .lte("appointment_datetime", endDate.toISOString())
      .order("appointment_datetime", { ascending: true });

    if (error) {
      console.error("Error consulta slots:", error);
      return { success: false, message: "Error al cargar los horarios", data: [] };
    }

    const formattedSlots = (data || []).map(
      (slot: any) => ({
        id: slot.id,
        appointment_datetime: slot.appointment_datetime,
        space_owner: Array.isArray(slot.space_owner)
          ? slot.space_owner[0] || null
          : slot.space_owner || null,
      })
    );

    return { success: true, data: formattedSlots };
  } catch (error) {
    console.error("Error al obtener horarios:", error);
    return { success: false, message: "Error al cargar los horarios del día", data: [] };
  }
}