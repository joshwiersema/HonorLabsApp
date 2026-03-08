export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  linked_doctor_id: string;
  linked_doctor_name: string;
  referral_code_used: string;
  date_created: string;
  orders_count: number;
  total_spent: string;
  patient_phone?: string;
  patient_verified?: string;
  registration_date?: string;
  avatar_url: string;
}

export interface PatientDetail {
  patient: Patient;
  orders: PatientOrder[];
}

export interface PatientOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  date_created: string;
}
