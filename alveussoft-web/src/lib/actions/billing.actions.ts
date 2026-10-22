// lib/actions/billing.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import {
  validateBillingData,
  validateRfcFormat,
  getRegimenFiscalOptions,
  getUsoCfdiOptions,
  getTipoPersonaByRfc,
  type ValidationResult,
  type RegimenFiscalCode,
} from "@/lib/utils/cfdi-validations";

// ============================================
// TIPOS PARA FACTURAMA
// ============================================

export interface FacturamaError {
  Message?: string;
  ModelState?: Record<string, string[]>;
  Errors?: Array<{ Message?: string } | string>;
  message?: string; // Algunos errores vienen en minúsculas
}

export interface BillingFormData {
  rfc: string;
  name: string;
  fiscal_regime: string;
  cfdi_use: string;
  tax_zip_code: string;
  street: string;
  exterior_number: string;
  interior_number?: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
}

export interface SaveBillingResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: ValidationResult["suggestions"];
  facturamaErrors?: string[];
  data?: any;
}

interface BillingData {
  rfc: string;
  name: string;
  cfdi_use: string;
  tax_regime: string;
  tax_zip_code: string;
  email: string;
  street?: string;
  exterior_number?: string;
  interior_number?: string;
  neighborhood?: string;
  locality?: string;
  municipality?: string;
  state?: string;
  country: string;
  zip_code?: string;
  num_reg_id_trib?: string;
  tax_residence?: string;
}

export interface OrderWithBillingInfo {
  id: string;
  order_number: number;
  status: string;
  created_at: string;
  user_id?: string | null;
  contacts_id?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  id_billing_info?: string | null;
  billing_info?: {
    id: string;
    rfc: string;
    name: string;
    cfdi_use: string;
    tax_regime: string;
    tax_zip_code: string;
    email?: string;
    created_at: string;
    id_facrutama?: string;
  } | null;
}

export interface UserBillingInfo {
  id: string;
  user_id: string;
  rfc: string;
  name: string;
  cfdi_use: string;
  fiscal_regime: string;
  tax_zip_code: string;
  email?: string;
  street?: string;
  exterior_number?: string;
  interior_number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  is_active: boolean;
  created_at: string;
}

export interface BillingOrdersResult {
  success: boolean;
  orders: OrderWithBillingInfo[];
  total: number;
  stats?: {
    totalOrders: number;
    withInvoice: number;
    withoutInvoice: number;
  };
  error?: string;
}

// ============================================
// FUNCIONES DE CONFIGURACIÓN
// ============================================

export async function getConfigValue(key: string): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configurations")
    .select("value")
    .eq("key", key)
    .eq("active", true)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    console.error(`Config '${key}' not found:`, error?.message);
    return null;
  }

  return data.value;
}

export async function getExpeditionZipCode(): Promise<string> {
  const zipCode = await getConfigValue("zip_code");
  return zipCode ?? "42501";
}

// ============================================
// FUNCIONES DE PARSEO DE ERRORES FACTURAMA
// ============================================

/**
 * Traduce nombres de campos de Facturama al español
 */
function translateFacturamaField(field: string): string {
  const translations: Record<string, string> = {
    // Campos del receptor
    Rfc: "RFC",
    rfc: "RFC",
    Name: "Razón Social",
    name: "Razón Social",
    FiscalRegime: "Régimen Fiscal",
    fiscal_regime: "Régimen Fiscal",
    RegimenFiscalReceptor: "Régimen Fiscal",
    CfdiUse: "Uso CFDI",
    cfdi_use: "Uso CFDI",
    UsoCFDI: "Uso CFDI",
    TaxZipCode: "Código Postal Fiscal",
    tax_zip_code: "Código Postal Fiscal",
    DomicilioFiscalReceptor: "Código Postal Fiscal",
    ZipCode: "Código Postal",
    Email: "Correo Electrónico",

    // Campos de dirección
    "Address.Street": "Calle",
    "Address.ExteriorNumber": "Número Exterior",
    "Address.InteriorNumber": "Número Interior",
    "Address.Neighborhood": "Colonia",
    "Address.ZipCode": "Código Postal",
    "Address.City": "Ciudad",
    "Address.State": "Estado",

    // Campos con prefijo Receiver
    "Receiver.Rfc": "RFC",
    "Receiver.Name": "Razón Social",
    "Receiver.FiscalRegime": "Régimen Fiscal",
    "Receiver.CfdiUse": "Uso CFDI",
    "Receiver.TaxZipCode": "Código Postal Fiscal",
    "Receiver.DomicilioFiscalReceptor": "Código Postal Fiscal",

    // Campos con prefijo cfdiToCreate
    "cfdiToCreate.Receiver.Rfc": "RFC",
    "cfdiToCreate.Receiver.Name": "Razón Social",
    "cfdiToCreate.Receiver.FiscalRegime": "Régimen Fiscal",
    "cfdiToCreate.Receiver.CfdiUse": "Uso CFDI",
    "cfdiToCreate.Receiver.DomicilioFiscalReceptor": "Código Postal Fiscal",
  };

  // Buscar traducción exacta
  if (translations[field]) {
    return translations[field];
  }

  // Buscar coincidencia parcial
  for (const [key, value] of Object.entries(translations)) {
    if (field.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Limpiar el campo si no hay traducción
  return field
    .replace(/cfdiToCreate\./g, "")
    .replace(/Receiver\./g, "")
    .replace(/DomicilioFiscalReceptor/g, "Código Postal Fiscal")
    .replace(/RegimenFiscalReceptor/g, "Régimen Fiscal")
    .replace(/TaxZipCode/g, "Código Postal Fiscal");
}

/**
 * Traduce mensajes comunes de Facturama al español
 */
function translateFacturamaMessage(message: string): string {
  const translations: Record<string, string> = {
    // =============================================
    // ERRORES DE RFC
    // =============================================
    "The Rfc field is required": "El campo RFC es requerido",
    "The Name field is required": "El campo Razón Social es requerido",
    "The FiscalRegime field is required":
      "El campo Régimen Fiscal es requerido",
    "The CfdiUse field is required": "El campo Uso CFDI es requerido",
    "Invalid RFC format": "El formato del RFC no es válido",
    "The RFC is not valid": "El RFC no es válido",
    "The specified RFC does not exist in SAT records":
      "El RFC especificado no existe en los registros del SAT",
    "RFC inscritos no cancelados":
      "El RFC no está activo en el SAT. Verifica que no esté cancelado o suspendido.",

    // =============================================
    // ERRORES DE DOMICILIO FISCAL / CÓDIGO POSTAL
    // =============================================
    DomicilioFiscalReceptor:
      "El código postal fiscal no coincide con el registrado en el SAT para este RFC",
    "El campo DomicilioFiscalReceptor del receptor, debe encontrarse en la lista de RFC inscritos no cancelados en el SAT":
      "El código postal fiscal no coincide con el registrado en el SAT. Verifica que el código postal sea el mismo que aparece en tu Constancia de Situación Fiscal.",
    "DomicilioFiscalReceptor del receptor":
      "El código postal fiscal no coincide con el registrado en el SAT para este RFC",
    "The zip code is not valid": "El código postal no es válido",
    "The zip code does not exist":
      "El código postal no existe en el catálogo del SAT",
    TaxZipCode: "El código postal fiscal no es válido o no coincide con el RFC",

    // =============================================
    // ERRORES DE RÉGIMEN FISCAL
    // =============================================
    "The fiscal regime is not valid for this RFC":
      "El régimen fiscal no es válido para este RFC",
    "The CFDI use is not valid for this fiscal regime":
      "El uso de CFDI no es válido para este régimen fiscal",
    regimen: "El régimen fiscal no es válido para este tipo de contribuyente",
    RegimenFiscalReceptor:
      "El régimen fiscal no coincide con el registrado en el SAT",
    "no aplica para persona":
      "El régimen fiscal seleccionado no aplica para este tipo de persona (física/moral)",

    // =============================================
    // ERRORES DE USO CFDI
    // =============================================
    "UsoCFDI no es válido":
      "El uso de CFDI seleccionado no es válido para este régimen fiscal",
    "La clave": "La combinación de régimen fiscal y uso de CFDI no es válida",
    CfdiUse: "El uso de CFDI no es válido para el régimen fiscal seleccionado",

    // =============================================
    // ERRORES DE NOMBRE / RAZÓN SOCIAL
    // =============================================
    "El campo Nombre del receptor, debe pertenecer al nombre asociado al RFC registrado en el campo Rfc del Receptor":
      "El nombre no coincide con el registrado en el SAT. Verifica que sea EXACTAMENTE igual al de tu Constancia de Situación Fiscal (incluyendo mayúsculas, acentos y abreviaturas).",
    "Nombre del receptor":
      "El nombre no coincide con el registrado en el SAT para este RFC",
    "The receiver name does not match the RFC":
      "El nombre no coincide con el RFC registrado en el SAT",
    "Receiver name must match SAT records":
      "El nombre debe coincidir con los registros del SAT",
    "Name does not match RFC in SAT database":
      "El nombre no coincide con el RFC en la base de datos del SAT",

    // =============================================
    // ERRORES GENERALES
    // =============================================
    "Receiver data is invalid": "Los datos del receptor no son válidos",
    "The receiver RFC is required": "El RFC del receptor es requerido",
    "The value is not valid": "El valor no es válido",
    "La solicitud no es válida": "Los datos enviados contienen errores",
    "An error occurred while processing your request":
      "Ocurrió un error al procesar tu solicitud",
    Unauthorized: "No autorizado - verifica las credenciales de Facturama",
    "Bad Request": "Solicitud inválida - verifica los datos enviados",
    "Internal Server Error": "Error interno del servidor de facturación",

    // =============================================
    // ERRORES DE PRODUCTOS / ITEMS
    // =============================================
    Product: "Error en los datos del producto",
    Items: "Error en los productos de la factura",
    UnitCode: "El código de unidad del producto no es válido",
    ProductCode: "El código del producto SAT no es válido",
  };

  // 1. Buscar traducción exacta
  if (translations[message]) {
    return translations[message];
  }

  // 2. Buscar coincidencia parcial (el mensaje contiene alguna clave)
  for (const [key, value] of Object.entries(translations)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // 3. Patrones específicos con regex

  // Patrón: "El regimen XXX no aplica para persona el rfc: YYY"
  if (message.match(/regimen.*no aplica.*persona/i)) {
    const regimen = message.match(/regimen\s+(\d+)/i)?.[1] || "";
    return `El régimen fiscal ${regimen} no es válido para este tipo de contribuyente. Verifica tu Constancia de Situación Fiscal.`;
  }

  // Patrón: "La clave XXX del campo YYY no es válida"
  if (message.match(/clave.*campo.*no es válida/i)) {
    if (message.toLowerCase().includes("usocfdi")) {
      return "El uso de CFDI seleccionado no es válido para este régimen fiscal";
    }
    if (message.toLowerCase().includes("regimen")) {
      return "El régimen fiscal seleccionado no es válido";
    }
    return "Uno de los valores seleccionados no es válido para esta combinación";
  }

  // Patrón: Cualquier mención de "DomicilioFiscal"
  if (message.toLowerCase().includes("domiciliofiscal")) {
    return "El código postal fiscal no coincide con el registrado en el SAT. Verifica tu Constancia de Situación Fiscal.";
  }

  // Patrón: Cualquier mención de "nombre" y "RFC"
  if (
    message.toLowerCase().includes("nombre") &&
    message.toLowerCase().includes("rfc")
  ) {
    return "El nombre no coincide con el registrado en el SAT. Verifica que sea EXACTAMENTE igual al de tu Constancia de Situación Fiscal.";
  }

  // Patrón: Cualquier mención de "SAT" y "inscrito" o "cancelado"
  if (
    message.toLowerCase().includes("sat") &&
    (message.toLowerCase().includes("inscrito") ||
      message.toLowerCase().includes("cancelado"))
  ) {
    return "Los datos no coinciden con los registros activos del SAT. Verifica tu Constancia de Situación Fiscal.";
  }

  // 4. Si no hay traducción, limpiar términos técnicos comunes
  let cleanMessage = message
    .replace(/DomicilioFiscalReceptor/gi, "código postal fiscal")
    .replace(/RegimenFiscalReceptor/gi, "régimen fiscal")
    .replace(/UsoCFDI/gi, "uso de CFDI")
    .replace(/TaxZipCode/gi, "código postal fiscal")
    .replace(/FiscalRegime/gi, "régimen fiscal")
    .replace(/CfdiUse/gi, "uso de CFDI")
    .replace(/Receiver\./gi, "")
    .replace(/cfdiToCreate\./gi, "")
    .replace(/receptor,/gi, "")
    .replace(/del receptor/gi, "");

  return cleanMessage;
}

/**
 * Parsea errores de Facturama a mensajes legibles en español
 */
export async function parseFacturamaErrors(error: any): Promise<string[]> {
  const errors: string[] = [];

  if (!error) return errors;

  // Si ya es array de strings, devolverlo
  if (Array.isArray(error) && error.every((item) => typeof item === "string")) {
    return error;
  }

  // Si es string que contiene JSON
  if (typeof error === "string") {
    try {
      const parsed = JSON.parse(error);
      return await parseFacturamaErrors(parsed);
    } catch {
      errors.push(error);
      return errors;
    }
  }

  // Mensaje principal
  if (error.Message) {
    const translatedMsg = translateFacturamaMessage(String(error.Message));
    if (translatedMsg && translatedMsg.trim() !== "") {
      errors.push(translatedMsg);
    }
  }

  if (error.message && error.message !== error.Message) {
    const translatedMsg = translateFacturamaMessage(String(error.message));
    if (translatedMsg && translatedMsg.trim() !== "") {
      errors.push(translatedMsg);
    }
  }

  // ModelState contiene errores de validación específicos por campo
  if (error.ModelState && typeof error.ModelState === "object") {
    for (const [field, messages] of Object.entries(error.ModelState)) {
      if (Array.isArray(messages)) {
        messages.forEach((msg: any) => {
          if (msg) {
            const fieldName = translateFacturamaField(field);
            const translatedMsg = translateFacturamaMessage(String(msg));
            if (translatedMsg && translatedMsg.trim() !== "") {
              errors.push(`${fieldName}: ${translatedMsg}`);
            }
          }
        });
      } else if (messages) {
        const fieldName = translateFacturamaField(field);
        const translatedMsg = translateFacturamaMessage(String(messages));
        if (translatedMsg && translatedMsg.trim() !== "") {
          errors.push(`${fieldName}: ${translatedMsg}`);
        }
      }
    }
  }

  // Errores anidados en array
  if (error.Errors && Array.isArray(error.Errors)) {
    error.Errors.forEach((e: any) => {
      if (e?.Message) {
        const translatedMsg = translateFacturamaMessage(String(e.Message));
        if (translatedMsg && translatedMsg.trim() !== "") {
          errors.push(translatedMsg);
        }
      } else if (e && typeof e === "string") {
        const translatedMsg = translateFacturamaMessage(e);
        if (translatedMsg && translatedMsg.trim() !== "") {
          errors.push(translatedMsg);
        }
      }
    });
  }

  // Si no pudimos extraer nada específico
  if (errors.length === 0 && error) {
    // Intentar stringificar si es un objeto complejo
    if (typeof error === "object") {
      try {
        errors.push(JSON.stringify(error));
      } catch {
        errors.push("Error desconocido del servicio de facturación");
      }
    } else {
      errors.push(String(error));
    }
  }

  return errors.filter((err) => err && err.trim() !== "");
}

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Valida datos de facturación localmente (sin llamar a Facturama)
 */
export async function validateBillingLocally(
  form: BillingFormData,
): Promise<ValidationResult> {
  const expeditionZipCode = await getExpeditionZipCode();

  return validateBillingData(
    {
      rfc: form.rfc,
      fiscal_regime: form.fiscal_regime,
      cfdi_use: form.cfdi_use,
      tax_zip_code: form.tax_zip_code,
      name: form.name,
    },
    expeditionZipCode,
  );
}

/**
 * Obtiene opciones de régimen fiscal para un RFC (server action)
 */
export async function getRegimenOptionsForRfc(
  rfc: string,
): Promise<Array<{ value: string; label: string }>> {
  if (!rfc || rfc.length < 12) {
    return [];
  }

  const validation = validateRfcFormat(rfc);
  if (!validation.isValid) {
    return [];
  }

  return getRegimenFiscalOptions(rfc);
}

/**
 * Obtiene opciones de uso CFDI para un RFC y régimen (server action)
 */
export async function getUsoCfdiOptionsForRegimen(
  rfc: string,
  regimenFiscal: string,
): Promise<Array<{ value: string; label: string }>> {
  if (!rfc || rfc.length < 12 || !regimenFiscal) {
    return [];
  }

  return getUsoCfdiOptions(rfc, regimenFiscal);
}

/**
 * Obtiene el tipo de persona por RFC (server action)
 */
export async function getTipoPersona(
  rfc: string,
): Promise<"moral" | "fisica" | "generico" | "extranjero"> {
  return getTipoPersonaByRfc(rfc);
}

// ============================================
// FUNCIONES CRUD DE BILLING
// ============================================

export async function getBillingData(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("billing_info")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      rfc: data.rfc,
      name: data.name,
      cfdi_use: data.cfdi_use,
      tax_regime: data.tax_regime,
      zip_code: data.tax_zip_code,
      email: data.email,
      street: data.street,
      exterior_number: data.exterior_number,
      interior_number: data.interior_number,
      neighborhood: data.neighborhood,
      locality: data.locality,
      municipality: data.municipality,
      state: data.state,
      country: data.country,
      num_reg_id_trib: data.num_reg_id_trib,
      tax_residence: data.tax_residence,
      id_facturama: data.id_facrutama,
      order_number: data.order_number,
    };
  } catch (err) {
    console.error("Error fetching billing data:", err);
    return null;
  }
}

export async function getUserBillingInfo() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("user_billing_info")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error("Error fetching user billing info:", err);
    return [];
  }
}

/**
 * Guarda datos de facturación con validación completa
 */
export async function saveUserBillingInfo(
  form: BillingFormData,
): Promise<SaveBillingResult> {
  try {
    // 1. Validación local primero
    const localValidation = await validateBillingLocally(form);

    if (!localValidation.isValid) {
      return {
        success: false,
        errors: localValidation.errors,
        warnings: localValidation.warnings,
        suggestions: localValidation.suggestions,
      };
    }

    // 2. Obtener usuario
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        errors: ["No hay sesión activa"],
        warnings: [],
      };
    }

    // 3. Guardar en base de datos
    const { data, error } = await supabase
      .from("user_billing_info")
      .insert({
        user_id: user.id,
        rfc: form.rfc.toUpperCase().trim(),
        name: form.name.trim(),
        fiscal_regime: form.fiscal_regime,
        cfdi_use: form.cfdi_use,
        tax_zip_code: form.tax_zip_code,
        street: form.street,
        exterior_number: form.exterior_number,
        interior_number: form.interior_number || null,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        country: form.country,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving billing:", error);

      // Intentar parsear si es error de Facturama (en caso de trigger)
      const facturamaErrors = await parseFacturamaErrors(error);

      return {
        success: false,
        errors:
          facturamaErrors.length > 0
            ? []
            : ["Error al guardar los datos de facturación"],
        warnings: [],
        facturamaErrors:
          facturamaErrors.length > 0 ? facturamaErrors : undefined,
      };
    }

    return {
      success: true,
      errors: [],
      warnings: localValidation.warnings,
      data,
    };
  } catch (error: any) {
    console.error("Error in saveUserBillingInfo:", error);

    // Capturar errores de Facturama
    const facturamaErrors = await parseFacturamaErrors(error);

    return {
      success: false,
      errors: facturamaErrors.length > 0 ? [] : ["Error inesperado al guardar"],
      warnings: [],
      facturamaErrors: facturamaErrors.length > 0 ? facturamaErrors : undefined,
    };
  }
}

export async function saveUserBillingInfo2(
  form: BillingFormData,
  contact_id: string,
): Promise<SaveBillingResult> {
  try {
    // 1. Validación local primero
    const localValidation = await validateBillingLocally(form);

    if (!localValidation.isValid) {
      return {
        success: false,
        errors: localValidation.errors,
        warnings: localValidation.warnings,
        suggestions: localValidation.suggestions,
      };
    }

    // 2. Verificar que se proporcionó un contact_id
    if (!contact_id) {
      return {
        success: false,
        errors: ["No se proporcionó un ID de contacto"],
        warnings: [],
      };
    }

    // 3. Obtener usuario autenticado (opcional, para auditoría)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 4. Guardar en base de datos usando el contact_id proporcionado
    const { data, error } = await supabase
      .from("user_billing_info")
      .insert({
        user_id: null, 
        rfc: form.rfc.toUpperCase().trim(),
        name: form.name.trim(),
        fiscal_regime: form.fiscal_regime,
        cfdi_use: form.cfdi_use,
        tax_zip_code: form.tax_zip_code,
        street: form.street,
        exterior_number: form.exterior_number,
        interior_number: form.interior_number || null,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        country: form.country,
        is_active: true,
        created_by: user?.id || null, 
        contact_id: contact_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving billing:", error);

      // Intentar parsear si es error de Facturama (en caso de trigger)
      const facturamaErrors = await parseFacturamaErrors(error);

      return {
        success: false,
        errors:
          facturamaErrors.length > 0
            ? []
            : ["Error al guardar los datos de facturación"],
        warnings: [],
        facturamaErrors:
          facturamaErrors.length > 0 ? facturamaErrors : undefined,
      };
    }

    return {
      success: true,
      errors: [],
      warnings: localValidation.warnings,
      data,
    };
  } catch (error: any) {
    console.error("Error in saveUserBillingInfo:", error);

    // Capturar errores de Facturama
    const facturamaErrors = await parseFacturamaErrors(error);

    return {
      success: false,
      errors: facturamaErrors.length > 0 ? [] : ["Error inesperado al guardar"],
      warnings: [],
      facturamaErrors: facturamaErrors.length > 0 ? facturamaErrors : undefined,
    };
  }
}

/**
 * Actualiza datos de facturación con validación completa
 */
export async function updateUserBillingInfo(
  id: string,
  form: BillingFormData,
): Promise<SaveBillingResult> {
  try {
    // 1. Validación local
    const localValidation = await validateBillingLocally(form);

    if (!localValidation.isValid) {
      return {
        success: false,
        errors: localValidation.errors,
        warnings: localValidation.warnings,
        suggestions: localValidation.suggestions,
      };
    }

    // 2. Obtener usuario
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        errors: ["No hay sesión activa"],
        warnings: [],
      };
    }

    // 3. Actualizar
    const { data, error } = await supabase
      .from("user_billing_info")
      .update({
        rfc: form.rfc.toUpperCase().trim(),
        name: form.name.trim(),
        fiscal_regime: form.fiscal_regime,
        cfdi_use: form.cfdi_use,
        tax_zip_code: form.tax_zip_code,
        street: form.street,
        exterior_number: form.exterior_number,
        interior_number: form.interior_number || null,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        country: form.country,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating billing:", error);
      const facturamaErrors = await parseFacturamaErrors(error);

      return {
        success: false,
        errors:
          facturamaErrors.length > 0
            ? []
            : ["Error al actualizar los datos de facturación"],
        warnings: [],
        facturamaErrors:
          facturamaErrors.length > 0 ? facturamaErrors : undefined,
      };
    }

    return {
      success: true,
      errors: [],
      warnings: localValidation.warnings,
      data,
    };
  } catch (error: any) {
    console.error("Error in updateUserBillingInfo:", error);
    const facturamaErrors = await parseFacturamaErrors(error);

    return {
      success: false,
      errors:
        facturamaErrors.length > 0 ? [] : ["Error inesperado al actualizar"],
      warnings: [],
      facturamaErrors: facturamaErrors.length > 0 ? facturamaErrors : undefined,
    };
  }
}

export async function deleteUserBillingInfo(id: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("user_billing_info")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        is_active: false,
      })
      .eq("id", id);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error("Error deleting billing info:", err);
    return { success: false };
  }
}

// ============================================
// RESTO DE FUNCIONES EXISTENTES
// ============================================

export async function saveBillingInfo(
  userId: string,
  orderNumber: string,
  data: BillingData & { id?: string },
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const billingPayload = {
      user_id: userId,
      rfc: data.rfc,
      name: data.name,
      cfdi_use: data.cfdi_use,
      tax_regime: data.tax_regime,
      tax_zip_code: data.tax_zip_code,
      email: user.email,
      street: data.street || null,
      exterior_number: data.exterior_number || null,
      interior_number: data.interior_number || null,
      neighborhood: data.neighborhood || null,
      locality: data.locality || null,
      municipality: data.state || null,
      state: data.state || "Nayarit",
      country: "MEX",
      order_number: orderNumber,
      created_by: user.id,
      created_at: new Date().toISOString(),
    };

    if (data.id) {
      const { data: newData, error } = await supabase
        .from("billing_info")
        .insert([
          {
            ...billingPayload,
            created_by: user.id,
          },
        ])
        .select();

      if (error) throw error;

      return { success: true, id: newData?.[0]?.id };
    }
  } catch (err) {
    console.error("Error saving billing info:", err);
    throw err;
  }
}

export async function updateBillingInfoWithFactura(
  billingId: string,
  idFacturama: string,
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("billing_info")
      .update({
        id_facrutama: idFacturama,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", billingId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Error updating billing info with factura:", err);
    throw err;
  }
}

export async function getBillingDataByOrder(
  userId: string,
  orderNumber: string,
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("billing_info")
      .select("*")
      .eq("user_id", userId)
      .eq("order_number", orderNumber)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      rfc: data.rfc,
      name: data.name,
      cfdi_use: data.cfdi_use,
      tax_regime: data.tax_regime,
      zip_code: data.tax_zip_code,
      email: data.email,
      street: data.street,
      exterior_number: data.exterior_number,
      interior_number: data.interior_number,
      neighborhood: data.neighborhood,
      locality: data.locality,
      municipality: data.municipality,
      state: data.state,
      country: data.country,
      id_facturama: data.id_facrutama,
      order_number: data.order_number,
    };
  } catch (err) {
    console.error("Error fetching billing data by order:", err);
    return null;
  }
}

export async function createBillingFromLatest(
  userId: string,
  orderNumber: string,
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const latestBilling = await getBillingData(userId);
    if (!latestBilling) throw new Error("No hay datos de facturación previos");

    const { data: newData, error } = await supabase
      .from("billing_info")
      .insert([
        {
          user_id: userId,
          rfc: latestBilling.rfc,
          name: latestBilling.name,
          cfdi_use: latestBilling.cfdi_use,
          tax_regime: latestBilling.tax_regime,
          tax_zip_code: latestBilling.zip_code,
          email: latestBilling.email,
          street: latestBilling.street || null,
          exterior_number: latestBilling.exterior_number || null,
          interior_number: latestBilling.interior_number || null,
          neighborhood: latestBilling.neighborhood || null,
          locality: latestBilling.locality || null,
          municipality: latestBilling.municipality || null,
          state: latestBilling.state || null,
          country: latestBilling.country || "MEX",
          order_number: orderNumber,
          created_by: user.id,
          updated_by: user.id,
        },
      ])
      .select();

    if (error) throw error;

    const newBilling = newData?.[0];
    return {
      id: newBilling.id,
      rfc: newBilling.rfc,
      name: newBilling.name,
      cfdi_use: newBilling.cfdi_use,
      tax_regime: newBilling.tax_regime,
      zip_code: newBilling.tax_zip_code,
      email: newBilling.email,
      street: newBilling.street,
      exterior_number: newBilling.exterior_number,
      interior_number: newBilling.interior_number,
      neighborhood: newBilling.neighborhood,
      locality: newBilling.locality,
      municipality: newBilling.municipality,
      state: newBilling.state,
      country: newBilling.country,
      id_facturama: newBilling.id_facrutama,
      order_number: newBilling.order_number,
    };
  } catch (err) {
    console.error("Error creating billing from latest:", err);
    throw err;
  }
}

export async function getOrdersWithBillingInfo(
  page: number = 1,
  limit: number = 15,
  filters?: {
    invoiceStatus?: "all" | "with_invoice" | "without_invoice";
    orderDateFrom?: string;
    orderDateTo?: string;
    invoiceDateFrom?: string;
    invoiceDateTo?: string;
    searchTerm?: string;
  },
): Promise<BillingOrdersResult> {
  try {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    // PRIMERO: Obtener las estadísticas correctamente
    let statsQuery = supabase
      .from("sale_orders")
      .select("id, order_number, created_at")
      .eq("status", "Entregado");

    // Aplicar filtros de fecha a las estadísticas
    if (filters?.orderDateFrom) {
      statsQuery = statsQuery.gte("created_at", filters.orderDateFrom);
    }
    if (filters?.orderDateTo) {
      const toDate = new Date(filters.orderDateTo);
      toDate.setDate(toDate.getDate() + 1);
      statsQuery = statsQuery.lt("created_at", toDate.toISOString());
    }

    const { data: deliveredOrders, error: statsError } = await statsQuery;

    if (statsError) {
      console.error("Error obteniendo estadísticas:", statsError);
    }

    // Calcular estadísticas
    let stats = {
      totalOrders: 0,
      withInvoice: 0,
      withoutInvoice: 0,
    };

    if (deliveredOrders && deliveredOrders.length > 0) {
      // Obtener las órdenes que tienen factura
      const orderNumbers = deliveredOrders.map(order => order.order_number.toString());
      
      const { data: billingInfos } = await supabase
        .from("billing_info")
        .select("order_number")
        .in("order_number", orderNumbers)
        .is("deleted_at", null);

      // Crear un Set de órdenes facturadas para búsqueda rápida
      const billedOrderNumbers = new Set(
        billingInfos?.map(b => b.order_number) || []
      );

      stats.totalOrders = deliveredOrders.length;
      stats.withInvoice = deliveredOrders.filter(order => 
        billedOrderNumbers.has(order.order_number.toString())
      ).length;
      stats.withoutInvoice = stats.totalOrders - stats.withInvoice;
    }

    // SEGUNDO: Query para las órdenes paginadas con filtros completos
    let query = supabase
      .from("sale_orders")
      .select(`
        id, 
        order_number, 
        status, 
        created_at, 
        user_id,
        contact_id,
        id_billing_info
      `, {
        count: "exact",
      })
      .eq("status", "Entregado")
      .order("created_at", { ascending: false });

    // Aplicar filtro de estado de facturación
    if (filters?.invoiceStatus && filters.invoiceStatus !== "all") {
      // Obtenemos todas las órdenes con factura
      const { data: billedOrders } = await supabase
        .from("billing_info")
        .select("order_number")
        .is("deleted_at", null);

      const billedOrderNumbers = billedOrders?.map((b) => b.order_number) || [];

      if (filters.invoiceStatus === "with_invoice") {
        query = query.in("order_number", billedOrderNumbers);
      } else {
        query = query.not(
          "order_number",
          "in",
          `(${billedOrderNumbers.join(",")})`,
        );
      }
    }

    // Filtros de fecha de orden
    if (filters?.orderDateFrom) {
      query = query.gte("created_at", filters.orderDateFrom);
    }
    if (filters?.orderDateTo) {
      const toDate = new Date(filters.orderDateTo);
      toDate.setDate(toDate.getDate() + 1);
      query = query.lt("created_at", toDate.toISOString());
    }

    // Filtro de búsqueda (ahora incluyendo contacts)
    if (filters?.searchTerm) {
      const searchNum = parseInt(filters.searchTerm);

      if (!isNaN(searchNum)) {
        query = query.eq("order_number", searchNum);
      } else {
        // Buscar en usuarios
        const { data: users } = await supabase
          .from("users")
          .select("id")
          .or(
            `full_name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`,
          );

        // Buscar en contactos
        const { data: contacts } = await supabase
          .from("contacts")
          .select("id")
          .or(
            `full_name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`,
          );

        const userIds = users?.map((u) => u.id) || [];
        const contactIds = contacts?.map((c) => c.id) || [];
        
        // Construir condiciones de búsqueda
        if (userIds.length > 0 || contactIds.length > 0) {
          const conditions = [];
          
          if (userIds.length > 0) {
            conditions.push(`user_id.in.(${userIds.join(",")})`);
          }
          
          if (contactIds.length > 0) {
            conditions.push(`contacts_id.in.(${contactIds.join(",")})`);
          }
          
          // Aplicar la condición OR
          query = query.or(conditions.join(","));
        } else {
          // Buscar en billing_info como fallback
          const { data: billingMatches } = await supabase
            .from("billing_info")
            .select("order_number")
            .or(
              `rfc.ilike.%${filters.searchTerm}%,name.ilike.%${filters.searchTerm}%`,
            )
            .is("deleted_at", null);

          const billingOrderNumbers =
            billingMatches?.map((b) => b.order_number) || [];
          
          if (billingOrderNumbers.length > 0) {
            query = query.in("order_number", billingOrderNumbers);
          } else {
            return {
              success: true,
              orders: [],
              total: 0,
              stats,
            };
          }
        }
      }
    }

    const {
      data: orders,
      error,
      count,
    } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    if (!orders || orders.length === 0) {
      return {
        success: true,
        orders: [],
        total: count || 0,
        stats,
      };
    }

    const ordersWithBilling = await enrichOrdersWithBillingData(
      supabase,
      orders,
    );

    // Aplicar filtro de fecha de factura (si existe)
    let filteredOrders = ordersWithBilling;
    if (filters?.invoiceDateFrom || filters?.invoiceDateTo) {
      filteredOrders = ordersWithBilling.filter((order) => {
        if (!order.billing_info?.created_at) return false;

        const invoiceDate = new Date(order.billing_info.created_at);

        if (filters.invoiceDateFrom) {
          const fromDate = new Date(filters.invoiceDateFrom);
          if (invoiceDate < fromDate) return false;
        }

        if (filters.invoiceDateTo) {
          const toDate = new Date(filters.invoiceDateTo);
          toDate.setDate(toDate.getDate() + 1);
          if (invoiceDate >= toDate) return false;
        }

        return true;
      });
    }

    return {
      success: true,
      orders: filteredOrders,
      total: count || 0,
      stats,
    };
  } catch (error) {
    console.error("Error in getOrdersWithBillingInfo:", error);
    return {
      success: false,
      orders: [],
      total: 0,
      error: "Error interno del servidor",
    };
  }
}

async function enrichOrdersWithBillingData(
  supabase: any,
  orders: any[]
): Promise<OrderWithBillingInfo[]> {
  const orderNumbers = orders.map(order => order.order_number.toString());
  
  // Obtener información de facturación
  const { data: billingInfos } = await supabase
    .from("billing_info")
    .select("*")
    .in("order_number", orderNumbers)
    .is("deleted_at", null);

  // Crear un mapa de billing_info por order_number
  const billingMap = new Map(
    billingInfos?.map((b: any) => [b.order_number, b]) || []
  );

  // Obtener todos los user_id y contacts_id únicos
  const userIds = orders
    .map(order => order.user_id)
    .filter(id => id != null);
  
  const contactIds = orders
    .map(order => order.contacts_id)
    .filter(id => id != null);

  // Obtener información de usuarios
  let usersMap = new Map();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", userIds);
    
    usersMap = new Map(users?.map((u: any) => [u.id, u]) || []);
  }

  // Obtener información de contactos
  let contactsMap = new Map();
  if (contactIds.length > 0) {
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, full_name, email")
      .in("id", contactIds);
    
    contactsMap = new Map(contacts?.map((c: any) => [c.id, c]) || []);
  }

  // Enriquecer las órdenes
  const enrichedOrders = orders.map(order => {
    const billing_info = billingMap.get(order.order_number.toString()) || null;
    
    // Determinar el nombre del cliente (de user o contact)
    let user_name = null;
    let user_email = null;
    
    if (order.user_id) {
      const user = usersMap.get(order.user_id);
      if (user) {
        user_name = user.full_name;
        user_email = user.email;
      }
    } else if (order.contacts_id) {
      const contact = contactsMap.get(order.contacts_id);
      if (contact) {
        user_name = contact.full_name;
        user_email = contact.email;
      }
    }

    return {
      ...order,
      billing_info,
      user_name,
      user_email
    };
  });

  return enrichedOrders;
}

export async function getUserBillingInfo2(
  identifier: string,
  type: 'user' | 'contact' = 'user'
): Promise<UserBillingInfo[]> {
  try {
    const supabase = await createClient();
    const results: UserBillingInfo[] = [];
    const seenIds = new Set<string>();

    if (type === 'user') {
      // CASO USER: El identifier es un user_id
      
      // 1. Buscar por user_id directamente
      const { data: userData, error: userError } = await supabase
        .from("user_billing_info")
        .select("*")
        .eq("is_active", true)
        .eq("user_id", identifier)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (!userError && userData) {
        userData.forEach(item => {
          seenIds.add(item.id);
          results.push(item);
        });
      }

      // 2. Buscar contactos relacionados a este user_id
      const { data: contacts, error: contactsError } = await supabase
        .from("contacts")
        .select("id")
        .eq("related_user_id", identifier);

      if (!contactsError && contacts && contacts.length > 0) {
        const contactIds = contacts.map(c => c.id);
        
        // 3. Buscar datos de facturación por esos contact_ids
        const { data: contactBillingData, error: contactBillingError } = await supabase
          .from("user_billing_info")
          .select("*")
          .eq("is_active", true)
          .in("contact_id", contactIds)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (!contactBillingError && contactBillingData) {
          contactBillingData.forEach(item => {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              results.push(item);
            }
          });
        }
      }

      // Ordenar por fecha
      return results.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } 
    else {
      // CASO CONTACT: El identifier es un contact_id
      
      // 1. Buscar por contact_id directamente
      const { data: contactData, error: contactError } = await supabase
        .from("user_billing_info")
        .select("*")
        .eq("is_active", true)
        .eq("contact_id", identifier)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (!contactError && contactData) {
        contactData.forEach(item => {
          seenIds.add(item.id);
          results.push(item);
        });
      }

      // 2. Obtener el related_user_id del contacto
      const { data: contact, error: contactFetchError } = await supabase
        .from("contacts")
        .select("related_user_id")
        .eq("id", identifier)
        .single();

      // 3. Buscar por user_id si existe
      if (!contactFetchError && contact?.related_user_id) {
        const { data: userData, error: userError } = await supabase
          .from("user_billing_info")
          .select("*")
          .eq("is_active", true)
          .eq("user_id", contact.related_user_id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (!userError && userData) {
          userData.forEach(item => {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              results.push(item);
            }
          });
        }
      }

      // Ordenar por fecha
      return results.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  } catch (error) {
    console.error("Error in getUserBillingInfo2:", error);
    return [];
  }
}

export async function getUserBillingInfo3(
  identifier: string,
): Promise<UserBillingInfo[]> {
  try {
    const supabase = await createClient();
    const results: UserBillingInfo[] = [];

    // 1. Buscar por contact_id directamente
    const { data: contactBillingData, error: contactError } = await supabase
      .from("user_billing_info")
      .select("*")
      .eq("is_active", true)
      .eq("contact_id", identifier)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (!contactError && contactBillingData) {
      results.push(...contactBillingData);
    }

    // 2. Buscar el contacto para obtener related_user_id
    const { data: contactData, error: contactFetchError } = await supabase
      .from("contacts")
      .select("related_user_id")
      .eq("id", identifier)
      .single();

    // 3. Si hay related_user_id, buscar por user_id
    if (!contactFetchError && contactData?.related_user_id) {
      const { data: userBillingData, error: userError } = await supabase
        .from("user_billing_info")
        .select("*")
        .eq("is_active", true)
        .eq("user_id", contactData.related_user_id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (!userError && userBillingData) {
        // Agregar solo los que no estén ya en results (evitar duplicados)
        const existingIds = new Set(results.map(item => item.id));
        for (const item of userBillingData) {
          if (!existingIds.has(item.id)) {
            results.push(item);
          }
        }
      }
    }

    // 4. Ordenar todos los resultados por fecha (más reciente primero)
    return results.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  } catch (error) {
    console.error("Error in getUserBillingInfo3:", error);
    return [];
  }
}

export async function createUserBillingInfo(
  identifier: string,
  type: 'user' | 'contact',
  data: Omit<UserBillingInfo, "id" | "user_id" | "contact_id" | "created_at" | "is_active">,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado");

    // Preparar el objeto de inserción
    const insertData: any = {
      rfc: data.rfc,
      name: data.name,
      cfdi_use: data.cfdi_use,
      fiscal_regime: data.fiscal_regime,
      tax_zip_code: data.tax_zip_code,
      street: data.street,
      exterior_number: data.exterior_number,
      interior_number: data.interior_number,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      country: data.country || "México",
      zip_code: data.zip_code,
      is_active: true,
      created_by: user.id,
      updated_by: user.id,
    };

    // Asignar según el tipo
    if (type === 'user') {
      insertData.user_id = identifier;
    } else {
      insertData.contact_id = identifier;
    }

    const { data: newBilling, error } = await supabase
      .from("user_billing_info")
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    return { success: true, id: newBilling.id };
  } catch (error) {
    console.error("Error creating user billing info:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al guardar datos fiscales",
    };
  }
}

export async function createBillingInfoFromUserBilling(
  orderNumber: string,
  userBillingId: string,
  orderInfo: {
    user_id?: string | null;
    contact_id?: string | null;
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Obtener los datos fiscales del usuario/contacto
    const { data: userBilling, error: fetchError } = await supabase
      .from("user_billing_info")
      .select("*")
      .eq("id", userBillingId)
      .single();

    if (fetchError || !userBilling) {
      throw new Error("Datos fiscales no encontrados");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado");

    // Preparar los datos para billing_info
    const billingData: any = {
      order_number: orderNumber,
      rfc: userBilling.rfc,
      name: userBilling.name,
      cfdi_use: userBilling.cfdi_use,
      tax_regime: userBilling.fiscal_regime,
      tax_zip_code: userBilling.tax_zip_code,
      email: userBilling.email,
      street: userBilling.street,
      exterior_number: userBilling.exterior_number,
      interior_number: userBilling.interior_number,
      neighborhood: userBilling.neighborhood,
      locality: userBilling.city,
      municipality: userBilling.state,
      state: userBilling.state,
      country: "MEX",
      zip_code: userBilling.zip_code,
      created_by: user.id,
      updated_by: user.id,
    };

    // Asignar user_id o contact_id según corresponda
    if (orderInfo.user_id) {
      billingData.user_id = orderInfo.user_id;
    }
    if (orderInfo.contact_id) {
      billingData.contact_id = orderInfo.contact_id;
    }

    const { data: billingInfo, error } = await supabase
      .from("billing_info")
      .insert([billingData])
      .select()
      .single();

    if (error) throw error;

    return { success: true, id: billingInfo.id };
  } catch (error) {
    console.error("Error creating billing info from user billing:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al crear datos de facturación",
    };
  }
}

export async function softDeleteBillingByFacturamaId(
  facturamaId: string,
  deletedBy: string,
) {
  try {
    const supabase = await createClient();

    const { data: existingBilling, error: findError } = await supabase
      .from("billing_info")
      .select("id, order_number, rfc, name")
      .eq("id_facrutama", facturamaId)
      .is("deleted_at", null)
      .maybeSingle();

    if (findError) {
      console.error("Error buscando billing_info:", findError);
      return {
        ok: false,
        error: "No se pudo encontrar la facturación con ese ID de Facturama",
      };
    }

    if (!existingBilling) {
      console.log(
        `No se encontró billing_info activo con facturama_id: ${facturamaId}`,
      );
      return {
        ok: true,
        message: "No se encontró registro activo con ese ID de Facturama",
        data: null,
      };
    }

    const { error: updateError } = await supabase
      .from("billing_info")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id_facrutama", facturamaId)
      .is("deleted_at", null);

    if (updateError) {
      console.error("Error marcando como eliminado:", updateError);
      return {
        ok: false,
        error: `No se pudo marcar como eliminado: ${updateError.message}`,
      };
    }

    return {
      ok: true,
      message: "Facturación marcada como eliminada",
      data: {
        deletedBillingId: existingBilling.id,
        deletedOrderNumber: existingBilling.order_number,
        deletedFacturamaId: facturamaId,
        deletedAt: new Date().toISOString(),
        deletedBy,
      },
    };
  } catch (error: any) {
    console.error("Error en softDeleteBillingByFacturamaId:", error);
    return {
      ok: false,
      error: error.message || "Error al marcar como eliminada la facturación",
    };
  }
}

export async function saveBillingInfoV2(
  userId: string,
  orderNumber: string,
  data: BillingData & { id?: string },
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const billingPayload = {
      user_id: userId,
      rfc: data.rfc,
      name: data.name,
      cfdi_use: data.cfdi_use,
      tax_regime: data.tax_regime,
      tax_zip_code: data.tax_zip_code,
      email: user.email,
      street: data.street || null,
      exterior_number: data.exterior_number || null,
      interior_number: data.interior_number || null,
      neighborhood: data.neighborhood || null,
      locality: data.locality || null,
      municipality: data.municipality || null,
      state: data.state || "Nayarit",
      country: "MEX",
      zip_code: data.zip_code || null,
      order_number: orderNumber,
      created_by: user.id,
      created_at: new Date().toISOString(),
    };

    const { data: newData, error } = await supabase
      .from("billing_info")
      .insert([billingPayload])
      .select("id")
      .single();

    if (error) {
      console.error("Error insertando en billing_info:", error);
      throw error;
    }

    return {
      success: true,
      id: newData?.id,
    };
  } catch (err) {
    console.error("Error saving billing info:", err);
    throw err;
  }
}

export async function getBillingInfoById(billingInfoId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("user_billing_info")
      .select("*")
      .eq("id", billingInfoId)
      .is("deleted_at", null)
      .single();

    if (error) {
      console.error("Error fetching billing info by id:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getBillingInfoById:", error);
    return null;
  }
}