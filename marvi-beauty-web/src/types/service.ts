// --- SERVICES ---
export interface Service {
  id: string
  user_id: string
  service_name: string
  description: string | null
  duration_minutes: number
  price: number
  color: string                    
  hourly_booking: boolean
  is_available: boolean
  created_by?: string | null
  created_at: string
  updated_by?: string | null
  updated_at?: string | null
  deleted_by?: string | null
  deleted_at?: string | null
  image_url: string | null
}

export interface CreateServiceInput {
  service_name: string
  description?: string
  image_url: string
  duration_minutes: number
  price: number
  hourly_booking?: boolean
  color?: string                     
}

export interface UpdateServiceInput {
  service_name?: string
  description?: string
  image_url: string
  duration_minutes?: number
  price?: number
  hourly_booking?: boolean
  is_available?: boolean
  color?: string                  
}


// --- SCHEDULE ---
export interface Schedule {
  id: string
  user_id: string
  service_id: string
  weekday: number // 0 = domingo, 6 = sábado
  start_time: string // formato "HH:MM:SS"
  end_time: string // formato "HH:MM:SS"
  start_date: string | null // YYYY-MM-DD
  end_date: string | null // YYYY-MM-DD
  is_available: boolean
  created_by?: string | null
  created_at: string
  updated_by?: string | null
  updated_at?: string | null
  deleted_by?: string | null
  deleted_at?: string | null
}

export interface ServiceWithSchedules extends Service {
  schedule: Schedule[]
}

// --- EXCEPTIONS ---
export interface Exception {
  id: string
  user_id: string
  service_id: string
  date: string // YYYY-MM-DD
  start_time: string | null
  end_time: string | null
  is_available: boolean
  created_by?: string | null
  created_at: string
  updated_by?: string | null
  updated_at?: string | null
  deleted_by?: string | null
  deleted_at?: string | null
}

export interface CreateExceptionInput {
  service_id: string
  exceptions: {
    date: string
    start_time?: string
    end_time?: string
  }[]
}

// --- APPOINTMENTS ---
export type AppointmentStatus = 'confirmed' | 'completed' | 'canceled'

export interface Appointment {
  id: string
  user_id: string
  service_id: string
  client_name: string | null
  client_email: string | null
  date: string // YYYY-MM-DD
  start_time: string // HH:MM:SS
  end_time: string // HH:MM:SS
  status: AppointmentStatus
  details: string | null
  is_available: boolean
  created_by?: string | null
  created_at: string
  updated_by?: string | null
  updated_at?: string | null
  deleted_by?: string | null
  deleted_at?: string | null
}
