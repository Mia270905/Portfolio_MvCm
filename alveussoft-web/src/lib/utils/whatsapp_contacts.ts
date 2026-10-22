import { getWhatsAppConfig } from "@/lib/actions/configuration.actions";

// Exportar también un valor por defecto estático para compatibilidad
export const WhatsAppContacts = [
  {
    name: "Alveus Soft",
    subtitle: "Resuelve tus dudas",
    phone: "5213111221844",
  }
];

export async function getWhatsAppContacts() {
  try {
    const config = await getWhatsAppConfig();

    if (config.success && config.data) {
      if (!config.data.active || !config.data.value) {
        return []; // Inactivo explícitamente, ocultar widget
      }

      const phoneDigits = config.data.value.replace(/\D/g, '');
      const internationalPhone = `521${phoneDigits}`;

      return [
        {
          name: "Alveus Soft",
          subtitle: "Resuelve tus dudas",
          phone: internationalPhone,
        }
      ];
    }

    // Si no hay configuración en BD, usamos el valor por defecto
    return WhatsAppContacts;
  } catch (error) {
    console.error("Error al cargar contactos de WhatsApp:", error);
    return WhatsAppContacts;
  }
}

export async function getCompanyWhatsAppContacts(companyId?: string) {
  try {
    const config = await getWhatsAppConfig(companyId);

    // Misma verificación aquí
    if (config.success && config.data) {
      if (!config.data.active || !config.data.value) {
        return [];
      }

      const phoneDigits = config.data.value.replace(/\D/g, '');
      const internationalPhone = `521${phoneDigits}`;

      return [
        {
          name: "Alveus Soft",
          subtitle: "Resuelve tus dudas",
          phone: internationalPhone,
          companyId: config.data.company_id,
        }
      ];
    }

    return WhatsAppContacts;
  } catch (error) {
    console.error("Error al cargar contactos de WhatsApp:", error);
    return WhatsAppContacts;
  }
}

export async function getWhatsAppPhoneNumber(companyId?: string): Promise<string | null> {
  try {
    const config = await getWhatsAppConfig(companyId);

    // Y también aquí
    if (config.success && config.data && config.data.value && config.data.active) {
      const phoneDigits = config.data.value.replace(/\D/g, '');
      return `521${phoneDigits}`;
    }

    return null;
  } catch (error) {
    console.error("Error al obtener número de WhatsApp:", error);
    return null;
  }
}

// Eliminado del final porque ahora está arriba