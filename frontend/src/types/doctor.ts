export interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  npi_number: string;
  practice_name: string;
  specialty: string;
  referral_code: string;
  doctor_status: string;
  date_created: string;
  phone?: string;
  practice_state?: string;
  license_number?: string;
  application_date?: string;
  orders_count: number;
  total_spent: string;
  avatar_url: string;
}

export interface DoctorDetail {
  doctor: Doctor;
  patients: PatientSummary[];
  orders: DoctorOrder[];
}

export interface PatientSummary {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  referral_code_used: string;
  orders_count: number;
  total_spent: string;
  date_created: string;
}

export interface DoctorOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  date_created: string;
}

// Keep for backwards compatibility - may be used if WordPress plugin is installed
export interface DoctorApplication {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  npiNumber: string;
  practiceName: string;
  specialty: string;
  status: 'pending' | 'approved' | 'rejected';
  dateApplied: string;
  reason?: string;
}
