/**
 * Validaciones de Régimen Fiscal y Uso CFDI según reglas del SAT
 * Catálogo CFDI 4.0
 */

// Catálogo de Regímenes Fiscales
export const REGIMENES_FISCALES = {
  "601": "General de Ley Personas Morales",
  "603": "Personas Morales con Fines no Lucrativos",
  "605": "Sueldos y Salarios e Ingresos Asimilados a Salarios",
  "606": "Arrendamiento",
  "607": "Régimen de Enajenación o Adquisición de Bienes",
  "608": "Demás ingresos",
  "610": "Residentes en el Extranjero sin EP en México",
  "611": "Ingresos por Dividendos",
  "612": "Personas Físicas con Actividades Empresariales",
  "614": "Ingresos por intereses",
  "615": "Obtención de premios",
  "616": "Sin obligaciones fiscales",
  "620": "Sociedades Cooperativas",
  "621": "Incorporación Fiscal",
  "622": "Actividades Agropecuarias",
  "623": "Grupos de sociedades",
  "624": "Coordinados",
  "625": "Plataformas tecnológicas",
  "626": "Régimen Simplificado de Confianza",
} as const;

// Catálogo de Usos CFDI
export const USOS_CFDI = {
  G01: "Adquisición de mercancías",
  G02: "Devoluciones, descuentos o bonificaciones",
  G03: "Gastos en general",
  I01: "Construcciones",
  I02: "Mobilario y equipo de oficina por inversiones",
  I03: "Equipo de transporte",
  I04: "Equipo de cómputo y accesorios",
  I05: "Dados, troqueles, moldes, matrices y herramental",
  I06: "Comunicaciones telefónicas",
  I07: "Comunicaciones satelitales",
  I08: "Otra maquinaria y equipo",
  D01: "Honorarios médicos, dentales y gastos hospitalarios",
  D02: "Gastos médicos por incapacidad o discapacidad",
  D03: "Gastos funerarios",
  D04: "Donativos",
  D05: "Intereses reales por créditos hipotecarios",
  D06: "Aportaciones voluntarias al SAR",
  D07: "Primas por seguros de gastos médicos",
  D08: "Gastos de transportación escolar obligatoria",
  D09: "Depósitos en cuentas para el ahorro",
  D10: "Pagos por servicios educativos (colegiaturas)",
  S01: "Sin efectos fiscales",
  P01: "Por definir (obsoleto)",
  CP01: "Pagos",
} as const;

export type RegimenFiscalCode = keyof typeof REGIMENES_FISCALES;
export type UsoCfdiCode = keyof typeof USOS_CFDI;

// Tipo de persona según RFC
export type TipoPersona = "moral" | "fisica" | "generico" | "extranjero";

/**
 * Determina el tipo de persona según el RFC
 */
export function getTipoPersonaByRfc(rfc: string): TipoPersona {
  if (!rfc) return "fisica";

  const rfcUpper = rfc.toUpperCase().trim();

  // RFC genérico público en general
  if (rfcUpper === "XAXX010101000") return "generico";

  // RFC genérico extranjero
  if (rfcUpper === "XEXX010101000") return "extranjero";

  // Persona moral: 12 caracteres
  if (rfcUpper.length === 12) return "moral";

  // Persona física: 13 caracteres
  if (rfcUpper.length === 13) return "fisica";

  return "fisica";
}

/**
 * Regímenes fiscales válidos por tipo de persona
 * Basado en el catálogo c_RegimenFiscal del SAT
 */
export const REGIMENES_POR_TIPO_PERSONA: Record<
  TipoPersona,
  RegimenFiscalCode[]
> = {
  moral: [
    "601", // General de Ley Personas Morales
    "603", // Personas Morales con Fines no Lucrativos
    "610", // Residentes en el Extranjero sin EP en México
    "616", // Sin obligaciones fiscales
    "620", // Sociedades Cooperativas
    "622", // Actividades Agropecuarias
    "623", // Grupos de sociedades
    "624", // Coordinados
    "626", // Régimen Simplificado de Confianza
  ],
  fisica: [
    "605", // Sueldos y Salarios
    "606", // Arrendamiento
    "607", // Régimen de Enajenación o Adquisición de Bienes
    "608", // Demás ingresos
    "610", // Residentes en el Extranjero sin EP en México
    "611", // Ingresos por Dividendos
    "612", // Personas Físicas con Actividades Empresariales
    "614", // Ingresos por intereses
    "615", // Obtención de premios
    "616", // Sin obligaciones fiscales
    "621", // Incorporación Fiscal
    "622", // Actividades Agropecuarias
    "625", // Plataformas tecnológicas
    "626", // Régimen Simplificado de Confianza
  ],
  generico: [
    "616", // Sin obligaciones fiscales (ÚNICO válido para público general)
  ],
  extranjero: [
    "610", // Residentes en el Extranjero sin EP en México
    "616", // Sin obligaciones fiscales
  ],
};

/**
 * Usos de CFDI válidos por tipo de persona
 * Basado en el catálogo c_UsoCFDI del SAT
 */
export const USOS_CFDI_POR_TIPO_PERSONA: Record<TipoPersona, UsoCfdiCode[]> = {
  moral: [
    "G01", // Adquisición de mercancías
    "G02", // Devoluciones, descuentos o bonificaciones
    "G03", // Gastos en general
    "I01", // Construcciones
    "I02", // Mobilario y equipo de oficina
    "I03", // Equipo de transporte
    "I04", // Equipo de cómputo
    "I05", // Dados, troqueles, moldes
    "I06", // Comunicaciones telefónicas
    "I07", // Comunicaciones satelitales
    "I08", // Otra maquinaria y equipo
    "D04", // Donativos
    "S01", // Sin efectos fiscales
    "CP01", // Pagos
  ],
  fisica: [
    "G01", // Adquisición de mercancías
    "G02", // Devoluciones, descuentos o bonificaciones
    "G03", // Gastos en general
    "I01", // Construcciones
    "I02", // Mobilario y equipo de oficina
    "I03", // Equipo de transporte
    "I04", // Equipo de cómputo
    "I05", // Dados, troqueles, moldes
    "I06", // Comunicaciones telefónicas
    "I07", // Comunicaciones satelitales
    "I08", // Otra maquinaria y equipo
    "D01", // Honorarios médicos
    "D02", // Gastos médicos por incapacidad
    "D03", // Gastos funerarios
    "D04", // Donativos
    "D05", // Intereses hipotecarios
    "D06", // Aportaciones SAR
    "D07", // Primas seguros médicos
    "D08", // Transportación escolar
    "D09", // Depósitos ahorro
    "D10", // Colegiaturas
    "S01", // Sin efectos fiscales
    "CP01", // Pagos
  ],
  generico: [
    "S01", // Sin efectos fiscales (ÚNICO válido para público general)
  ],
  extranjero: [
    "S01", // Sin efectos fiscales
    "G01", // Adquisición de mercancías
    "G03", // Gastos en general
  ],
};

/**
 * Matriz de compatibilidad Régimen Fiscal -> Usos CFDI permitidos
 * Reglas específicas del SAT CFDI 4.0
 */
export const USOS_CFDI_POR_REGIMEN: Record<RegimenFiscalCode, UsoCfdiCode[]> = {
  // ========================================
  // PERSONAS MORALES
  // ========================================

  // 601 - General de Ley Personas Morales
  "601": [
    "G01",
    "G02",
    "G03",
    "I01",
    "I02",
    "I03",
    "I04",
    "I05",
    "I06",
    "I07",
    "I08",
    "D04", // Solo donativos de deducciones
    "S01",
    "CP01",
  ],

  // 603 - Personas Morales con Fines no Lucrativos
  "603": [
    "D04", // Donativos
    "S01",
    "CP01",
  ],

  // 610 - Residentes en el Extranjero sin EP en México
  "610": ["S01", "CP01"],

  // 620 - Sociedades Cooperativas de Producción
  "620": [
    "G01",
    "G02",
    "G03",
    "I01",
    "I02",
    "I03",
    "I04",
    "I05",
    "I06",
    "I07",
    "I08",
    "D04",
    "S01",
    "CP01",
  ],

  // 622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras (PM)
  "622": [
    "G01",
    "G02",
    "G03",
    "I01",
    "I02",
    "I03",
    "I04",
    "I05",
    "I06",
    "I07",
    "I08",
    "D04",
    "S01",
    "CP01",
  ],

  // 623 - Opcional para Grupos de Sociedades
  "623": [
    "G01",
    "G02",
    "G03",
    "I01",
    "I02",
    "I03",
    "I04",
    "I05",
    "I06",
    "I07",
    "I08",
    "S01",
    "CP01",
  ],

  // 624 - Coordinados
  "624": [
    "G01",
    "G02",
    "G03",
    "I01",
    "I02",
    "I03",
    "I04",
    "I05",
    "I06",
    "I07",
    "I08",
    "S01",
    "CP01",
  ],

  // 626 - Régimen Simplificado de Confianza (PM)
  "626": [
    "G01",
    "G02",
    "G03",
    "I01",
    "I02",
    "I03",
    "I04",
    "I05",
    "I06",
    "I07",
    "I08",
    "D04",
    "S01",
    "CP01",
  ],

  // ========================================
  // PERSONAS FÍSICAS
  // ========================================

  // 605 - Sueldos y Salarios e Ingresos Asimilados a Salarios
  // NO puede usar G01, G02, G03 ni inversiones I0X según Facturama
  "605": [
    "D01",
    "D02",
    "D03",
    "D04",
    "D05",
    "D06",
    "D07",
    "D08",
    "D09",
    "D10",
    "S01",
    "CP01",
  ],

  // 606 - Arrendamiento
  "606": [
    "G01",
    "G02",
    "G03",
    "I01",
    "I02",
    "I03",
    "I04",
    "I05",
    "I06",
    "I07",
    "I08",
    "D01",
    "D02",
    "D03",
    "D04",
    "D05",
    "D06",
    "D07",
    "D08",
    "D09",
    "D10",
    "S01",
    "CP01",
  ],

  // 607 - Régimen de Enajenación o Adquisición de Bienes
  "607": [
    "G01",
    "G02",
    "G03",
    "D01",
    "D02",
    "D03",
    "D04",
    "D05",
    "D06",
    "D07",
    "D08",
    "D09",
    "D10",
    "S01",
    "CP01",
  ],

  // 608 - Demás ingresos
  "608": [
    "G01",
    "G02",
    "G03",
    "D01",
    "D02",
    "D03",
    "D04",
    "D05",
    "D06",
    "D07",
    "D08",
    "D09",
    "D10",
    "S01",
    "CP01",
  ],

  // 611 - Ingresos por Dividendos (socios y accionistas)
  // RESTRICTIVO: Solo deducciones personales, NO gastos generales
  "611": [
    "D01",
    "D02",
    "D03",
    "D04",
    "D05",
    "D06",
    "D07",
    "D08",
    "D09",
    "D10",
    "S01",
    "CP01",
  ],

  // 612 - Personas Físicas con Actividades Empresariales y Profesionales
  "612": [
    "G01",
    "G02",
    "G03",
    "I01",
    "I02",
    "I03",
    "I04",
    "I05",
    "I06",
    "I07",
    "I08",
    "D01",
    "D02",
    "D03",
    "D04",
    "D05",
    "D06",
    "D07",
    "D08",
    "D09",
    "D10",
    "S01",
    "CP01",
  ],

  // 614 - Ingresos por intereses
  // RESTRICTIVO: Solo deducciones personales
  "614": [
    "D01",
    "D02",
    "D03",
    "D04",
    "D05",
    "D06",
    "D07",
    "D08",
    "D09",
    "D10",
    "S01",
    "CP01",
  ],

  // 615 - Régimen de los ingresos por obtención de premios
  // RESTRICTIVO: Solo deducciones personales
  "615": [
    "D01",
    "D02",
    "D03",
    "D04",
    "D05",
    "D06",
    "D07",
    "D08",
    "D09",
    "D10",
    "S01",
    "CP01",
  ],

  // 616 - Sin obligaciones fiscales
  "616": [
    "S01", // ÚNICO permitido
  ],

  // 621 - Incorporación Fiscal (RIF - ya no disponible para nuevos)
  "621": [
    "G01",
    "G02",
    "G03",
    "I01",
    "I02",
    "I03",
    "I04",
    "I05",
    "I06",
    "I07",
    "I08",
    "D01",
    "D02",
    "D03",
    "D04",
    "D05",
    "D06",
    "D07",
    "D08",
    "D09",
    "D10",
    "S01",
    "CP01",
  ],

  // 625 - Plataformas Tecnológicas
  "625": [
    "G01",
    "G02",
    "G03",
    "I01",
    "I02",
    "I03",
    "I04",
    "I05",
    "I06",
    "I07",
    "I08",
    "D01",
    "D02",
    "D03",
    "D04",
    "D05",
    "D06",
    "D07",
    "D08",
    "D09",
    "D10",
    "S01",
    "CP01",
  ],
};

/**
 * Interface para datos de facturación
 */
export interface BillingValidationData {
  rfc: string;
  fiscal_regime: string;
  cfdi_use: string;
  tax_zip_code: string;
  name: string;
}

/**
 * Interface para resultado de validación
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: {
    fiscal_regime?: RegimenFiscalCode[];
    cfdi_use?: UsoCfdiCode[];
  };
}

/**
 * Valida la estructura del RFC
 */
export function validateRfcFormat(rfc: string): {
  isValid: boolean;
  error?: string;
} {
  if (!rfc || rfc.trim() === "") {
    return { isValid: false, error: "El RFC es requerido" };
  }

  const rfcUpper = rfc.toUpperCase().trim();

  // RFC genéricos son válidos
  if (rfcUpper === "XAXX010101000" || rfcUpper === "XEXX010101000") {
    return { isValid: true };
  }

  // Persona moral: 3 letras + 6 dígitos fecha + 3 homoclave = 12
  const regexMoral = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;

  // Persona física: 4 letras + 6 dígitos fecha + 3 homoclave = 13
  const regexFisica = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;

  if (rfcUpper.length === 12 && regexMoral.test(rfcUpper)) {
    return { isValid: true };
  }

  if (rfcUpper.length === 13 && regexFisica.test(rfcUpper)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error:
      "El formato del RFC no es válido. Debe tener 12 caracteres (persona moral) o 13 caracteres (persona física)",
  };
}

/**
 * Valida el código postal (5 dígitos)
 */
export function validateZipCode(zipCode: string): {
  isValid: boolean;
  error?: string;
} {
  if (!zipCode || zipCode.trim() === "") {
    return { isValid: false, error: "El código postal es requerido" };
  }

  const regex = /^\d{5}$/;
  if (!regex.test(zipCode.trim())) {
    return { isValid: false, error: "El código postal debe tener 5 dígitos" };
  }

  return { isValid: true };
}

/**
 * Obtiene los regímenes fiscales válidos para un RFC
 */
export function getValidRegimenesForRfc(rfc: string): RegimenFiscalCode[] {
  const tipoPersona = getTipoPersonaByRfc(rfc);
  return REGIMENES_POR_TIPO_PERSONA[tipoPersona];
}

/**
 * Obtiene los usos de CFDI válidos para un régimen fiscal y tipo de persona
 */
export function getValidUsosCfdiForRegimen(
  rfc: string,
  regimenFiscal: RegimenFiscalCode,
): UsoCfdiCode[] {
  const tipoPersona = getTipoPersonaByRfc(rfc);

  // Usos permitidos por tipo de persona
  const usosPorTipo = USOS_CFDI_POR_TIPO_PERSONA[tipoPersona];

  // Usos permitidos por régimen
  const usosPorRegimen = USOS_CFDI_POR_REGIMEN[regimenFiscal] || [];

  // Intersección: debe estar en ambas listas
  return usosPorRegimen.filter((uso) => usosPorTipo.includes(uso));
}

/**
 * Validación completa de datos de facturación
 */
export function validateBillingData(
  data: BillingValidationData,
  expeditionZipCode: string, // Código postal del emisor (tu negocio)
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: ValidationResult["suggestions"] = {};

  // 1. Validar formato RFC
  const rfcValidation = validateRfcFormat(data.rfc);
  if (!rfcValidation.isValid) {
    errors.push(rfcValidation.error!);
    return { isValid: false, errors, warnings };
  }

  // 2. Validar código postal
  const zipValidation = validateZipCode(data.tax_zip_code);
  if (!zipValidation.isValid) {
    errors.push(zipValidation.error!);
  }

  // 3. Validar nombre
  if (!data.name || data.name.trim().length < 3) {
    errors.push("El nombre o razón social es requerido (mínimo 3 caracteres)");
  }

  const tipoPersona = getTipoPersonaByRfc(data.rfc);
  const regimenFiscal = data.fiscal_regime as RegimenFiscalCode;
  const usoCfdi = data.cfdi_use as UsoCfdiCode;

  // 4. Validaciones especiales para RFC genérico (público en general)
  if (tipoPersona === "generico") {
    if (regimenFiscal !== "616") {
      errors.push(
        `Para público en general (RFC: ${data.rfc}), el único régimen fiscal válido es 616 - Sin obligaciones fiscales`,
      );
      suggestions.fiscal_regime = ["616"];
    }

    if (usoCfdi !== "S01") {
      errors.push(
        `Para público en general, el único uso de CFDI válido es S01 - Sin efectos fiscales`,
      );
      suggestions.cfdi_use = ["S01"];
    }

    if (data.tax_zip_code !== expeditionZipCode) {
      errors.push(
        `Para público en general, el código postal fiscal debe coincidir con el lugar de expedición (${expeditionZipCode})`,
      );
    }

    return { isValid: errors.length === 0, errors, warnings, suggestions };
  }

  // 5. Validaciones para RFC extranjero
  if (tipoPersona === "extranjero") {
    const regimenesValidos = REGIMENES_POR_TIPO_PERSONA.extranjero;
    if (!regimenesValidos.includes(regimenFiscal)) {
      errors.push(
        `Para extranjeros (RFC: ${data.rfc}), los regímenes válidos son: ${regimenesValidos.map((r) => `${r} - ${REGIMENES_FISCALES[r]}`).join(", ")}`,
      );
      suggestions.fiscal_regime = regimenesValidos;
    }

    if (data.tax_zip_code !== expeditionZipCode) {
      errors.push(
        `Para extranjeros, el código postal fiscal debe coincidir con el lugar de expedición (${expeditionZipCode})`,
      );
    }
  }

  // 6. Validar que el régimen fiscal sea válido para el tipo de persona
  const regimenesValidos = getValidRegimenesForRfc(data.rfc);
  if (!regimenesValidos.includes(regimenFiscal)) {
    const tipoLabel =
      tipoPersona === "moral" ? "persona moral" : "persona física";
    errors.push(
      `El régimen fiscal ${regimenFiscal} (${REGIMENES_FISCALES[regimenFiscal] || "Desconocido"}) no es válido para ${tipoLabel}`,
    );
    suggestions.fiscal_regime = regimenesValidos;
  }

  // 7. Validar que el uso de CFDI sea válido para el régimen fiscal
  if (regimenesValidos.includes(regimenFiscal)) {
    const usosCfdiValidos = getValidUsosCfdiForRegimen(data.rfc, regimenFiscal);

    if (!usosCfdiValidos.includes(usoCfdi)) {
      errors.push(
        `El uso de CFDI ${usoCfdi} (${USOS_CFDI[usoCfdi] || "Desconocido"}) no es válido para el régimen fiscal ${regimenFiscal}`,
      );
      suggestions.cfdi_use = usosCfdiValidos;
    }
  }

  // 8. Warnings adicionales
  if (usoCfdi === "S01") {
    warnings.push(
      "Usar 'S01 - Sin efectos fiscales' significa que esta factura no podrá usarse para deducciones",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions: Object.keys(suggestions).length > 0 ? suggestions : undefined,
  };
}

/**
 * Obtiene datos por defecto para público en general
 */
export function getPublicoGeneralDefaults(
  expeditionZipCode: string,
): BillingValidationData {
  return {
    rfc: "XAXX010101000",
    name: "PUBLICO EN GENERAL",
    fiscal_regime: "616",
    cfdi_use: "S01",
    tax_zip_code: expeditionZipCode,
  };
}

/**
 * Obtiene datos por defecto para extranjero
 */
export function getExtranjeroDefaults(
  expeditionZipCode: string,
): BillingValidationData {
  return {
    rfc: "XEXX010101000",
    name: "EXTRANJERO",
    fiscal_regime: "616",
    cfdi_use: "S01",
    tax_zip_code: expeditionZipCode,
  };
}

/**
 * Helper para mostrar opciones en un select
 */
export function getRegimenFiscalOptions(
  rfc: string,
): Array<{ value: string; label: string }> {
  const validos = getValidRegimenesForRfc(rfc);
  return validos.map((code) => ({
    value: code,
    label: `${code} - ${REGIMENES_FISCALES[code]}`,
  }));
}

/**
 * Helper para mostrar opciones de uso CFDI en un select
 */
export function getUsoCfdiOptions(
  rfc: string,
  regimenFiscal: string,
): Array<{ value: string; label: string }> {
  const validos = getValidUsosCfdiForRegimen(
    rfc,
    regimenFiscal as RegimenFiscalCode,
  );
  return validos.map((code) => ({
    value: code,
    label: `${code} - ${USOS_CFDI[code]}`,
  }));
}
