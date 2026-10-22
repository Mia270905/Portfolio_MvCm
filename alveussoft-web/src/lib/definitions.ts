//TODO. Separar las definiciones de tipos por módulos. 
export type Module = {
  id: string;
  code: string;
  name: string;
  path: string;
  description: string | null;
  icon: string | null;
  parent_module_id: string | null;
  active: boolean;
};

export type ModuleWithPermissions = {
  id: string;
  code: string;
  name: string;
  path: string;
  description: string | null;
  icon: string | null;
  parent_module_id: string | null;
  active: boolean;
  permissions: Permission[];
};

export type NewModulePayload = Omit<Module, 'id' | 'created_at'>;

export class FieldError extends Error {
  constructor(message: string, public field: 'code' | 'path') {
    super(message);
    this.name = 'FieldError';
  }
}

export type ModuleWithChildren = Module & {
  children: Module[];
};

export type ModulesHierarchy = ModuleWithChildren[];

export interface Permission {
  id: string;
  code: string; // "create:users"
  name: string;
  description: string;
  active: boolean;
  module_id: string;
  created_at: string;
  updated_at: string;
}

export interface NewPermissionPayload {
  code_prefix: string; // "create", "update", etc.
  name: string;
  description: string;
  active: boolean;
  module_id: string;
}

export type PermissionsResponse = {
  permissions: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    active: boolean;
    module_id: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Profile {
  id: string;
  code: string; 
  name: string;
  is_write_protected?: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

export interface NewProfilePayload {
  code: string;
  name: string;
  is_write_protected?: boolean; 
  hierarchy: number;
  active: boolean;
}

export type ProfilesResponse = {
  profiles: Array<{
    id: string;
    code: string;
    name: string;
    active: boolean;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Platform {
  id: string;
  code: string;
  name: string;
  description: string | null;
  domain: string;
  contact_id: string | null; 
  is_write_protected?: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface NewPlatformPayload {
  code: string;
  name: string;
  description: string;
  domain: string;
  contact_id: string;
  is_write_protected?: boolean;
  active: boolean;
}

export type PlatformsResponse = {
  platforms: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    domain: string;
    contact_id: string | null; 
    active: boolean;
    is_write_protected?: boolean;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Companies types
export interface Company {
  id: string;
  name: string;
  street: string | null;
  colony: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  address_number: string | null;
  phone: string | null;
  cellphone: string | null;
  website: string | null;
  rfc: string | null;
  parent_company: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface NewCompanyPayload {
  name: string;
  street?: string | null;
  colony?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  address_number?: string | null;
  phone?: string | null;
  cellphone?: string | null;
  website?: string | null;
  rfc?: string | null;
  parent_company?: string | null;
}

export type CompaniesResponse = {
  companies: Array<{
    id: string;
    name: string;
    street: string | null;
    colony: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    address_number: string | null;
    phone: string | null;
    cellphone: string | null;
    website: string | null;
    rfc: string | null;
    parent_company: string | null;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Measurement {
  id: string;
  unit: string;
  quantity: string;
  reference: string | null;
  unspsc: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  
  // Relaciones
  parent_measurement?: Measurement | null; 
  unspsc_data?: Unspsc | null;
}

export interface MeasurementForList {
  id: string;
  unit: string;
  quantity: string;
  reference: string | null;
  unspsc: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  parent_measurement?: {
    id: string;
    unit: string;
    quantity: string;
  } | null;
  unspsc_data?: {
    id: string;
    code: string;
    name: string;
    type: string;
  } | null;
}

export interface NewMeasurementPayload {
  unit: string;
  quantity: string;
  reference?: string | null;
  unspsc?: string | null;
}

export interface UpdateMeasurementPayload {
  unit?: string;
  quantity?: string;
  reference?: string | null;
  unspsc?: string | null;
}

export type MeasurementsResponse = {
  measurements: Array<{
    id: string;
    unit: string;
    quantity: string;
    reference: string | null;
    unspsc: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
    parent_measurement?: {
      id: string;
      unit: string;
      quantity: string;
    } | null;
    unspsc_data?: {
      id: string;
      code: string;
      name: string;
      type: string;
    } | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Unspsc {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface NewUnspscPayload {
  code: string;
  name: string;
  type: string;
  description?: string | null;
}

export interface UpdateUnspscPayload {
  code?: string;
  name?: string;
  type?: string;
  description?: string | null;
}

export type UnspscResponse = {
  unspsc_codes: Array<{
    id: string;
    code: string;
    name: string;
    type: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}