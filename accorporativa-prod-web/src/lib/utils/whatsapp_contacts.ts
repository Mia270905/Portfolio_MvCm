import { getWhatsAppConfig } from "@/lib/actions/configuration.actions";

export async function getWhatsAppContacts() {
  try {
    const config = await getWhatsAppConfig();
    
    if (config.success && config.data && config.data.value && config.data.active) { 
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
    
    return [];
  } catch (error) {
    console.error("Error al cargar contactos de WhatsApp:", error);
    return [];
  }
}

export async function getCompanyWhatsAppContacts(companyId?: string) {
  try {
    const config = await getWhatsAppConfig(companyId);
    
    // Misma verificación aquí
    if (config.success && config.data && config.data.value && config.data.active) {
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
    
    return [];
  } catch (error) {
    console.error("Error al cargar contactos de WhatsApp:", error);
    return [];
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

// Exportar también un valor por defecto estático para compatibilidad
export const WhatsAppContacts = [
  {
    name: "Alveus Soft",
    subtitle: "Resuelve tus dudas",
    phone: "5213111982683",
  }
];