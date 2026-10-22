import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/app/providers/company-provider";

/**
 * Hook para obtener las empresas seleccionadas del contexto
 */
export function useSelectedCompanies() {
  const { selectedCompanies } = useCompany();
  return selectedCompanies;
}

/**
 * Helper para agregar filtro de empresas a una query de Supabase
 */
export function withCompanyFilter(
  query: any,
  companyField: string = 'company_id'
) {
  const selectedCompanies = JSON.parse(localStorage.getItem("selectedCompanies") || "[]");
  
  if (selectedCompanies.length > 0) {
    return query.in(companyField, selectedCompanies);
  }
  
  return query;
}

/**
 * Función para crear una query con filtro de empresas
 */
export async function queryWithCompanyFilter(
  table: string,
  options: {
    select?: string;
    companyField?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending: boolean };
    limit?: number;
  } = {}
) {
  const supabase = createClient();
  const selectedCompanies = JSON.parse(localStorage.getItem("selectedCompanies") || "[]");
  
  let query = supabase.from(table).select(options.select || '*');
  
  // Aplicar filtro de empresas si hay selección
  if (selectedCompanies.length > 0) {
    query = query.in(options.companyField || 'company_id', selectedCompanies);
  }
  
  // Aplicar filtros adicionales
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
  }
  
  // Ordenar
  if (options.orderBy) {
    query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
  }
  
  // Límite
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error(`Error querying ${table}:`, error);
    throw error;
  }
  
  return data;
}

/**
 * Para usar en Server Components donde no hay contexto
 */
export function getSelectedCompaniesFromStorage(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  const saved = localStorage.getItem("selectedCompanies");
  return saved ? JSON.parse(saved) : [];
}