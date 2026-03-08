import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/api/customers';
import type { Patient, PatientDetail } from '@/types/patient';

export function usePatients(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: async () => {
      const res = await customersApi.patients.list(params);
      const data = res.data as { patients: Patient[]; total: number };
      return {
        data: data.patients,
        total: data.total,
        totalPages: Math.ceil(data.total / ((params?.per_page as number) || 10)),
      };
    },
  });
}

export function usePatient(id: number | null) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const res = await customersApi.patients.get(id!);
      return res.data as PatientDetail;
    },
    enabled: id !== null,
  });
}
