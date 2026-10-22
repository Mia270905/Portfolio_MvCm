import { getPhoneConfig } from "@/lib/actions/configuration.actions";

export async function getPhoneContacts() {
  try {
    const config = await getPhoneConfig();
    
    if (config.success && config.data && config.data.value && config.data.active) { 
      const phoneDigits = config.data.value.replace(/\D/g, '');
      const phoneNumber = `+52${phoneDigits}`;
      
      return [
        {
          name: "Parley Consultoría",
          subtitle: "Llámanos directamente",
          phone: phoneNumber,
        }
      ];
    }
    
    return [];
  } catch (error) {
    console.error("Error al cargar contactos de Teléfono:", error);
    return [];
  }
}

export async function getCompanyPhoneContacts(companyId?: string) {
  try {
    const config = await getPhoneConfig(companyId);
    
    if (config.success && config.data && config.data.value && config.data.active) {
      const phoneDigits = config.data.value.replace(/\D/g, '');
      const phoneNumber = `+52${phoneDigits}`;
      
      return [
        {
          name: "Parley Consultoría",
          subtitle: "Llámanos directamente",
          phone: phoneNumber,
          companyId: config.data.company_id,
        }
      ];
    }
    
    return [];
  } catch (error) {
    console.error("Error al cargar contactos de Teléfono:", error);
    return [];
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

// Exportar también un valor por defecto estático para compatibilidad
export const PhoneContacts = [
  {
    name: "Parley Consultoría",
    subtitle: "Llámanos directamente",
    phone: "+523312417413",
  }
];