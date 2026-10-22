"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface Company {
  id: string;
  name: string;
  rfc?: string | null;
}

interface CompanyContextType {
  selectedCompanies: string[];
  setSelectedCompanies: (companies: string[]) => void;
  companyNames: Record<string, string>; 
  clearSelection: () => void;
  addCompany: (companyId: string, companyName: string) => void;
  removeCompany: (companyId: string) => void;
  isCompanySelected: (companyId: string) => boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [selectedCompanies, setSelectedCompaniesState] = useState<string[]>([]);
  const [companyNames, setCompanyNamesState] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Función para obtener la primera empresa RAÍZ del servidor
  const fetchFirstRootCompany = async (): Promise<{id: string, name: string} | null> => {
    try {
      // Import dinámico para evitar problemas de SSR
      const { getAllCompanies } = await import('@/lib/actions/company.actions');
      const companies = await getAllCompanies();
      
      if (companies && companies.length > 0) {
        // Filtrar solo empresas raíz (sin parent_company)
        const rootCompanies = companies.filter(company => !company.parent_company);
        
        if (rootCompanies.length > 0) {
          // Ordenar por fecha de creación (la más antigua primero)
          const sortedRootCompanies = [...rootCompanies].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          
          const firstRootCompany = sortedRootCompanies[0];
          return { id: firstRootCompany.id, name: firstRootCompany.name };
        }
        
        // Si no hay empresas raíz, usar la primera empresa disponible
        console.warn("No root companies found, using first available company");
        const sortedCompanies = [...companies].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const firstCompany = sortedCompanies[0];
        return { id: firstCompany.id, name: firstCompany.name };
      }
    } catch (error) {
      console.error("Error fetching first root company:", error);
    }
    return null;
  };

  // Inicializar con empresa por defecto si no hay ninguna seleccionada
  const initializeDefaultCompany = async () => {
    if (typeof window === 'undefined') return;
    
    const savedCompanies = localStorage.getItem("selectedCompanies");
    const savedCompanyNames = localStorage.getItem("companyNames");
    
    if (savedCompanies && savedCompanyNames) {
      // Hay datos guardados, cargarlos
      const parsedCompanies = JSON.parse(savedCompanies);
      const parsedNames = JSON.parse(savedCompanyNames);
      
      if (parsedCompanies.length > 0) {
        setSelectedCompaniesState(parsedCompanies);
        setCompanyNamesState(parsedNames);
        setIsInitialized(true);
        return;
      }
    }
    
    // No hay datos o están vacíos, obtener la primera empresa RAÍZ
    const firstRootCompany = await fetchFirstRootCompany();
    
    if (firstRootCompany) {
      const defaultSelection = [firstRootCompany.id];
      const defaultNames = { [firstRootCompany.id]: firstRootCompany.name };
      
      setSelectedCompaniesState(defaultSelection);
      setCompanyNamesState(defaultNames);
      
      // Guardar en localStorage
      localStorage.setItem("selectedCompanies", JSON.stringify(defaultSelection));
      localStorage.setItem("companyNames", JSON.stringify(defaultNames));
    } else {
      console.warn("No companies found in database");
    }
    
    setIsInitialized(true);
  };

  // Cargar desde localStorage al iniciar
  useEffect(() => {
    initializeDefaultCompany();
  }, []);

  // Guardar en localStorage cuando cambia (solo si ya está inicializado)
  useEffect(() => {
    if (isInitialized && selectedCompanies.length > 0) {
      localStorage.setItem("selectedCompanies", JSON.stringify(selectedCompanies));
      localStorage.setItem("companyNames", JSON.stringify(companyNames));
    }
  }, [selectedCompanies, companyNames, isInitialized]);

  // Función pública para establecer empresas seleccionadas
  const setSelectedCompanies = (companies: string[]) => {
    // Asegurar que siempre haya al menos una empresa seleccionada
    if (companies.length === 0) {
      console.warn("Cannot set empty selection. Keeping current selection.");
      return;
    }
    
    setSelectedCompaniesState(companies);
  };

  const clearSelection = () => {
    // En lugar de vaciar completamente, seleccionar la primera empresa RAÍZ
    fetchFirstRootCompany().then(firstRootCompany => {
      if (firstRootCompany) {
        const defaultSelection = [firstRootCompany.id];
        const defaultNames = { [firstRootCompany.id]: firstRootCompany.name };
        
        setSelectedCompaniesState(defaultSelection);
        setCompanyNamesState(defaultNames);
      }
    });
  };

  const addCompany = (companyId: string, companyName: string) => {
    if (!selectedCompanies.includes(companyId)) {
      setSelectedCompaniesState(prev => [...prev, companyId]);
      setCompanyNamesState(prev => ({ ...prev, [companyId]: companyName }));
    }
  };

  const removeCompany = (companyId: string) => {
    // No permitir remover si es la única empresa seleccionada
    if (selectedCompanies.length <= 1) {
      console.warn("Cannot remove the only selected company");
      return;
    }
    
    setSelectedCompaniesState(prev => prev.filter(id => id !== companyId));
    setCompanyNamesState(prev => {
      const newNames = { ...prev };
      delete newNames[companyId];
      return newNames;
    });
  };

  const isCompanySelected = (companyId: string) => {
    return selectedCompanies.includes(companyId);
  };

  return (
    <CompanyContext.Provider value={{
      selectedCompanies,
      setSelectedCompanies,
      companyNames,
      clearSelection,
      addCompany,
      removeCompany,
      isCompanySelected,
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return context;
}