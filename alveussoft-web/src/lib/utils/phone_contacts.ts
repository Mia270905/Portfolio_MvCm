import { getPhoneConfig } from "@/lib/actions/configuration.actions";

// Exportar también un valor por defecto estático para compatibilidad
export const PhoneContacts = [
  {
    name: "Alveus Soft",
    subtitle: "Llámanos directamente",
    phone: "+523111221842",
  }
];

export async function getPhoneContacts() {
  try {
    const config = await getPhoneConfig();
    
    if (config.success && config.data) {
      if (!config.data.active || !config.data.value) {
        return []; // Inactivo explícitamente, ocultar widget
      }

      const phoneDigits = config.data.value.replace(/\D/g, '');
      const phoneNumber = `+52${phoneDigits}`;
      
      return [
        {
          name: "Alveus Soft",
          subtitle: "Llámanos directamente",
          phone: phoneNumber,
        }
      ];
    }
    
    // Si no hay configuración en BD, usamos el valor por defecto
    return PhoneContacts;
  } catch (error) {
    console.error("Error al cargar contactos de Teléfono:", error);
    return PhoneContacts;
  }
}

export async function getCompanyPhoneContacts(companyId?: string) {
  try {
    const config = await getPhoneConfig(companyId);
    
    if (config.success && config.data) {
      if (!config.data.active || !config.data.value) {
        return [];
      }

      const phoneDigits = config.data.value.replace(/\D/g, '');
      const phoneNumber = `+52${phoneDigits}`;
      
      return [
        {
          name: "Alveus Soft",
          subtitle: "Llámanos directamente",
          phone: phoneNumber,
          companyId: config.data.company_id,
        }
      ];
    }
    
    return PhoneContacts;
  } catch (error) {
    console.error("Error al cargar contactos de Teléfono:", error);
    return PhoneContacts;
  }
}

export async function getPhoneNumber(companyId?: string): Promise<string | null> {
  try {
    const config = await getPhoneConfig(companyId);
    
    if (config.success && config.data && config.data.value && config.data.active) {
      const phoneDigits = config.data.value.replace(/\D/g, '');
      return `+52${phoneDigits}`;
    }
    
    return null;
  } catch (error) {
    console.error("Error al obtener número de Teléfono:", error);
    return null;
  }
}

// Eliminado del final porque ahora está arriba