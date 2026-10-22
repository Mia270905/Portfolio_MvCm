"use server";

import { createClient } from "@/lib/supabase/server";

export interface WhatsAppConfig {
  id: string;
  key: string;
  value: string;
  company_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface WhatsAppConfigForm {
  id?: string;
  phone_number: string;
  active: boolean;
}

interface CreateWhatsAppPayload {
  phone_number: string;
  active: boolean;
  userId: string;
  companyId?: string;
}

interface UpdateWhatsAppPayload {
  id: string;
  phone_number: string;
  active: boolean;
  userId: string;
  companyId?: string;
}

export async function createWhatsAppConfig({
  phone_number,
  active,
  userId,
  companyId,
}: CreateWhatsAppPayload) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configurations")
    .insert([
      {
        key: "phone_number",
        value: phone_number,
        active,
        company_id: companyId || null,
        created_by: userId,
      },
    ])
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data: data as WhatsAppConfig };
}

export async function getWhatsAppConfig(companyId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("configurations")
    .select("*")
    .eq("key", "phone_number")
    .order("created_at", { ascending: true });

  // Si se proporciona companyId, filtrar por compañía
  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query.limit(1).single();

  if (error) {
    if (error.code === "PGRST116") {
      return {
        success: false,
        message: "No se encontró una configuración activa de WhatsApp.",
        data: null,
      };
    }

    return {
      success: false,
      message: `Error al obtener la configuración: ${error.message}`,
      data: null,
    };
  }
  
  return {
    success: true,
    message: "Configuración obtenida correctamente.",
    data: data as WhatsAppConfig,
  };
}

export async function updateWhatsAppConfig({
  id,
  phone_number,
  active,
  userId,
  companyId,
}: UpdateWhatsAppPayload) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configurations")
    .update({
      value: phone_number,
      active,
      company_id: companyId || null,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data: data as WhatsAppConfig };
}

export async function deleteWhatsAppConfig(id: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configurations")
    .update({
      active: false,
      updated_at: new Date().toISOString(),
      updated_by: userId,
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
    })
    .eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data };
}

// Versión de eliminación física (si necesitas ambas)
export async function hardDeleteWhatsAppConfig(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configurations")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data };
}

export async function getActiveWhatsAppNumber(companyId?: string) {
  const config = await getWhatsAppConfig(companyId);
  if (config.success && config.data) {
    return `521${config.data.value}`;
  }
  return null;
}
// Interfaces para configuración de Teléfono
export interface PhoneConfig {
  id: string;
  key: string;
  value: string;
  company_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface PhoneConfigForm {
  id?: string;
  phone_number: string;
  active: boolean;
}

interface CreatePhonePayload {
  phone_number: string;
  active: boolean;
  userId: string;
  companyId?: string;
}

interface UpdatePhonePayload {
  id: string;
  phone_number: string;
  active: boolean;
  userId: string;
  companyId?: string;
}

export async function createPhoneConfig({
  phone_number,
  active,
  userId,
  companyId,
}: CreatePhonePayload) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configurations")
    .insert([
      {
        key: "contact_phone",
        value: phone_number,
        active,
        company_id: companyId || null,
        created_by: userId,
      },
    ])
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data: data as PhoneConfig };
}

export async function getPhoneConfig(companyId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("configurations")
    .select("*")
    .eq("key", "contact_phone") 
    .order("created_at", { ascending: true });

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query.limit(1).single();

  if (error) {
    if (error.code === "PGRST116") {
      return {
        success: false,
        message: "No se encontró una configuración activa de Teléfono.",
        data: null,
      };
    }

    return {
      success: false,
      message: `Error al obtener la configuración: ${error.message}`,
      data: null,
    };
  }
  
  return {
    success: true,
    message: "Configuración obtenida correctamente.",
    data: data as PhoneConfig,
  };
}

export async function updatePhoneConfig({
  id,
  phone_number,
  active,
  userId,
  companyId,
}: UpdatePhonePayload) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configurations")
    .update({
      value: phone_number,
      active,
      company_id: companyId || null,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data: data as PhoneConfig };
}

export async function deletePhoneConfig(id: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configurations")
    .update({
      active: false,
      updated_at: new Date().toISOString(),
      updated_by: userId,
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
    })
    .eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data };
}

// Versión de eliminación física (si necesitas ambas)
export async function hardDeletePhoneConfig(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configurations")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data };
}

export async function getActivePhoneNumber(companyId?: string) {
  const config = await getPhoneConfig(companyId);
  if (config.success && config.data) {
    return config.data.value;
  }
  return null;
}
export interface SocialMediaConfig {
  id: string;
  key: string;
  value: string;
  company_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface SocialMediaConfigForm {
  id?: string;
  key: string;
  value: string;
  active: boolean;
}

export interface SocialMediaPayload {
  key: string;
  value: string;
  active: boolean;
  userId: string;
  companyId?: string;
}

export interface SocialMediaData {
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  tiktok_url?: string;
  whatsapp_url?: string;
  email?: string;
  phone_number?: string;
}

// Funciones específicas para redes sociales
export async function getSocialMediaConfigs(companyId?: string) {
  const supabase = await createClient();
  
  const socialKeys = [
    'facebook_url',
    'instagram_url', 
    'linkedin_url',
    'twitter_url',
    'tiktok_url',
    'whatsapp_url',
    'email',
    'phone_number',
  ];

  let query = supabase
    .from("configurations")
    .select("*")
    .in("key", socialKeys)
    .order("key", { ascending: true });

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query;

  if (error) {
    return {
      success: false,
      message: `Error al obtener las redes sociales: ${error.message}`,
      data: null,
    };
  }

  // Transformar a objeto con las claves como propiedades
  const socialData: SocialMediaData = {};
  data?.forEach(item => {
    socialData[item.key as keyof SocialMediaData] = item.value;
  });

  return {
    success: true,
    message: "Redes sociales obtenidas correctamente.",
    data: socialData,
  };
}

export async function getSocialMediaConfigByKey(key: string, companyId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("configurations")
    .select("*")
    .eq("key", key);

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") {
      return {
        success: false,
        message: `No se encontró configuración para: ${key}`,
        data: null,
      };
    }
    return {
      success: false,
      message: `Error al obtener la configuración: ${error.message}`,
      data: null,
    };
  }

  return {
    success: true,
    message: "Configuración obtenida correctamente.",
    data: data as SocialMediaConfig,
  };
}

export async function createOrUpdateSocialMediaConfig({
  key,
  value,
  active = true,
  userId,
  companyId,
}: SocialMediaPayload) {
  const supabase = await createClient();

  // Primero verificar si ya existe
  const existing = await getSocialMediaConfigByKey(key, companyId);

  if (existing.success && existing.data) {
    // Actualizar existente
    const { data, error } = await supabase
      .from("configurations")
      .update({
        value,
        active,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq("id", existing.data.id)
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data: data as SocialMediaConfig };
  } else {
    // Crear nuevo
    const { data, error } = await supabase
      .from("configurations")
      .insert([
        {
          key,
          value,
          active,
          company_id: companyId || null,
          created_by: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data: data as SocialMediaConfig };
  }
}

export async function updateMultipleSocialMediaConfigs(
  configs: Array<{ key: string; value: string }>,
  userId: string,
  companyId?: string
) {
  const supabase = await createClient();
  const results = [];
  const errors = [];

  // Obtener TODAS las configuraciones existentes para estas claves
  const existingConfigs = await getSocialMediaConfigs(companyId);
  
  // Crear un mapa de configuraciones existentes
  const existingMap = new Map();
  if (existingConfigs.success && existingConfigs.data) {
    Object.entries(existingConfigs.data).forEach(([key, value]) => {
      if (value) {
        existingMap.set(key, value);
      }
    });
  }

  // Procesar cada configuración del formulario
  for (const config of configs) {
    try {
      // Verificar si ya existe
      const existing = await getSocialMediaConfigByKey(config.key, companyId);

      if (config.value.trim() === "") {
        // Si el campo está vacío Y existía un registro, desactivarlo
        if (existing.success && existing.data) {
          const { error } = await supabase
            .from("configurations")
            .update({
              value: "",
              active: false,
              updated_at: new Date().toISOString(),
              updated_by: userId,
            })
            .eq("id", existing.data.id);

          if (error) throw error;
          results.push({ key: config.key, action: 'deactivated' });
        }
      } else {
        // Si hay valor, crear o actualizar
        if (existing.success && existing.data) {
          // Actualizar existente
          const { error } = await supabase
            .from("configurations")
            .update({
              value: config.value,
              active: true,
              updated_at: new Date().toISOString(),
              updated_by: userId,
            })
            .eq("id", existing.data.id);

          if (error) throw error;
          results.push({ key: config.key, action: 'updated' });
        } else {
          // Crear nuevo
          const { error } = await supabase
            .from("configurations")
            .insert([
              {
                key: config.key,
                value: config.value,
                active: true,
                company_id: companyId || null,
                created_by: userId,
              },
            ]);

          if (error) throw error;
          results.push({ key: config.key, action: 'created' });
        }
      }
    } catch (error) {
      errors.push({ key: config.key, error: String(error) });
    }
  }

  // Verificar si hay configuraciones existentes que NO están en el formulario
  // Esto maneja el caso cuando el usuario borra completamente un campo
  const keysFromForm = new Set(configs.map(c => c.key));
  
  for (const [key, value] of existingMap.entries()) {
    if (!keysFromForm.has(key) && value && value.trim() !== "") {
      // Esta configuración existía pero no está en el formulario (usuario la borró)
      try {
        const existing = await getSocialMediaConfigByKey(key, companyId);
        if (existing.success && existing.data) {
          const { error } = await supabase
            .from("configurations")
            .update({
              value: "",
              active: false,
              updated_at: new Date().toISOString(),
              updated_by: userId,
            })
            .eq("id", existing.data.id);

          if (error) throw error;
          results.push({ key: key, action: 'cleared' });
        }
      } catch (error) {
        errors.push({ key: key, error: String(error) });
      }
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      message: `Errores en algunas operaciones: ${errors.map(e => e.key).join(', ')}`,
      results,
      errors,
    };
  }

  return {
    success: true,
    message: "Redes sociales actualizadas correctamente.",
    results,
  };
}

// Interfaces para tiempo de cancelación
export interface CancellationTimeConfig {
  id: string;
  key: string;
  value: string;
  company_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CancellationTimeForm {
  id?: string;
  cancellation_minutes: string; 
  active: boolean;
}

interface CreateCancellationTimePayload {
  cancellation_minutes: string;
  active: boolean;
  userId: string;
  companyId?: string;
}

interface UpdateCancellationTimePayload {
  id: string;
  cancellation_minutes: string;
  active: boolean;
  userId: string;
  companyId?: string;
}

export async function getCancellationTimeConfig(companyId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("configurations")
    .select("*")
    .eq("key", "cancellation_time")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query.limit(1).single();

  if (error) {
    if (error.code === "PGRST116") {
      return {
        success: false,
        message: "No se encontró configuración de tiempo de cancelación.",
        data: null,
      };
    }

    return {
      success: false,
      message: `Error al obtener la configuración: ${error.message}`,
      data: null,
    };
  }
  
  return {
    success: true,
    message: "Configuración obtenida correctamente.",
    data: data as CancellationTimeConfig,
  };
}

export async function createCancellationTimeConfig({
  cancellation_minutes,
  active,
  userId,
  companyId,
}: CreateCancellationTimePayload) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configurations")
    .insert([
      {
        key: "cancellation_time",
        value: cancellation_minutes,
        active,
        company_id: companyId || null,
        created_by: userId,
      },
    ])
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data: data as CancellationTimeConfig };
}


export async function updateCancellationTimeConfig({
  id,
  cancellation_minutes,
  active,
  userId,
  companyId,
}: UpdateCancellationTimePayload) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configurations")
    .update({
      value: cancellation_minutes,
      active,
      company_id: companyId || null,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data: data as CancellationTimeConfig };
}

// Obtener el tiempo de cancelación en minutos 
export async function getCancellationTimeMinutes(companyId?: string): Promise<number> {
  const config = await getCancellationTimeConfig(companyId);
  
  if (config.success && config.data) {
    const minutes = parseInt(config.data.value, 10);
    return isNaN(minutes) ? 60 : minutes;
  }
  
  return 60; // Valor por defecto: 60 minutos 
}

// Verificar si una cita puede ser cancelada
export async function canCancelAppointment(
  appointmentDatetime: string | null,
  companyId?: string
): Promise<boolean> {
  if (!appointmentDatetime) return false;
  
  const maxCancellationMinutes = await getCancellationTimeMinutes(companyId);
  const appointmentTime = new Date(appointmentDatetime);
  const now = new Date();
  
  // Calcular la diferencia en minutos
  const timeDiff = appointmentTime.getTime() - now.getTime();
  const minutesUntilAppointment = timeDiff / (1000 * 60);
  
  // Puede cancelar si quedan más minutos que el límite configurado
  return minutesUntilAppointment > maxCancellationMinutes;
}

// Obtener mensaje de tiempo de cancelación (para mostrar al usuario)
export async function getCancellationTimeMessage(companyId?: string): Promise<string> {
  const minutes = await getCancellationTimeMinutes(companyId);
  
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    return `Las citas pueden cancelarse hasta ${days} ${days === 1 ? 'día' : 'días'} antes.`;
  } else if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `Las citas pueden cancelarse hasta ${hours} ${hours === 1 ? 'hora' : 'horas'} antes.`;
  } else {
    return `Las citas pueden cancelarse hasta ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} antes.`;
  }
}

// Interfaces para configuración de reservas
// Obtener configuración de reservas
export async function getReservationConfig(companyId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("configurations")
    .select("*")
    .eq("key", "enable_reservations")
    .order("created_at", { ascending: false })
    .limit(1);

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Error al obtener configuración:", error);
    return {
      success: false,
      message: `Error al obtener la configuración: ${error.message}`,
      data: null,
    };
  }
  
  return {
    success: true,
    data: data,
  };
}

// Verificar si las reservas están habilitadas
export async function areReservationsEnabled(companyId?: string): Promise<boolean> {
  const config = await getReservationConfig(companyId);
  
  if (config.success && config.data) {
    return config.data.value === 'true' && config.data.active !== false;
  }
  
  // Si no existe configuración, crear una por defecto (true)
  return true;
}

// Crear o actualizar configuración
export async function toggleReservations(enabled: boolean, userId: string, companyId?: string) {
  const supabase = await createClient();
  
  // Primero verificar si ya existe
  const existing = await getReservationConfig(companyId);
  
  if (existing.success && existing.data) {
    // Actualizar existente
    const { data, error } = await supabase
      .from("configurations")
      .update({
        value: enabled.toString(),
        active: true,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq("id", existing.data.id)
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data: data };
  } else {
    // Crear nueva
    const { data, error } = await supabase
      .from("configurations")
      .insert([
        {
          key: "enable_reservations",
          value: enabled.toString(),
          active: true,
          company_id: companyId || null,
          created_by: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data: data };
  }
}

// Interfaces para tiempo mínimo de reserva
export interface MinReservationTimeConfig {
  id: string;
  key: string;
  value: string;
  company_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface MinReservationTimeForm {
  id?: string;
  min_reservation_minutes: string;
  active: boolean;
}

interface CreateMinReservationTimePayload {
  min_reservation_minutes: string;
  active: boolean;
  userId: string;
  companyId?: string;
}

interface UpdateMinReservationTimePayload {
  id: string;
  min_reservation_minutes: string;
  active: boolean;
  userId: string;
  companyId?: string;
}

// Obtener configuración de tiempo mínimo para reservar
export async function getMinReservationTimeConfig(companyId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("configurations")
    .select("*")
    .eq("key", "min_reservation_time")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    return {
      success: false,
      message: `Error al obtener la configuración: ${error.message}`,
      data: null,
    };
  }

  if (!data) {
    return {
      success: false,
      message: "No se encontró configuración de tiempo mínimo para reservar.",
      data: null,
    };
  }
  
  return {
    success: true,
    message: "Configuración obtenida correctamente.",
    data: data as MinReservationTimeConfig,
  };
}

// Crear configuración de tiempo mínimo para reservar
export async function createMinReservationTimeConfig({
  min_reservation_minutes,
  active,
  userId,
  companyId,
}: CreateMinReservationTimePayload) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configurations")
    .insert([
      {
        key: "min_reservation_time",
        value: min_reservation_minutes,
        active,
        company_id: companyId || null,
        created_by: userId,
      },
    ])
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data: data as MinReservationTimeConfig };
}

// Actualizar configuración de tiempo mínimo para reservar
export async function updateMinReservationTimeConfig({
  id,
  min_reservation_minutes,
  active,
  userId,
  companyId,
}: UpdateMinReservationTimePayload) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configurations")
    .update({
      value: min_reservation_minutes,
      active,
      company_id: companyId || null,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data: data as MinReservationTimeConfig };
}

// Obtener el tiempo mínimo para reservar en minutos
export async function getMinReservationTimeMinutes(companyId?: string): Promise<number> {
  const config = await getMinReservationTimeConfig(companyId);
  
  if (config.success && config.data) {
    const minutes = parseInt(config.data.value, 10);
    return isNaN(minutes) ? 120 : minutes; // Valor por defecto: 120 minutos (2 horas)
  }
  
  return 120; // Valor por defecto: 120 minutos (2 horas)
}

// Verificar si una cita puede ser reservada (si no está demasiado cerca)
export async function canReserveAppointment(
  appointmentDatetime: string | null,
  companyId?: string
): Promise<boolean> {
  if (!appointmentDatetime) return false;
  
  const minReservationMinutes = await getMinReservationTimeMinutes(companyId);
  const appointmentTime = new Date(appointmentDatetime);
  const now = new Date();
  
  // Calcular la diferencia en minutos
  const timeDiff = appointmentTime.getTime() - now.getTime();
  const minutesUntilAppointment = timeDiff / (1000 * 60);
  
  // Se puede reservar si quedan más minutos que el mínimo configurado
  return minutesUntilAppointment >= minReservationMinutes;
}

// Obtener mensaje de tiempo mínimo para reservar
export async function getMinReservationTimeMessage(companyId?: string): Promise<string> {
  const minutes = await getMinReservationTimeMinutes(companyId);
  
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    return `Las citas deben reservarse con al menos ${days} ${days === 1 ? 'día' : 'días'} de anticipación.`;
  } else if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `Las citas deben reservarse con al menos ${hours} ${hours === 1 ? 'hora' : 'horas'} de anticipación.`;
  } else {
    return `Las citas deben reservarse con al menos ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} de anticipación.`;
  }
}