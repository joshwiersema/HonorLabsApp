import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/api/customers';
import type { Doctor, DoctorDetail } from '@/types/doctor';

export function useDoctors(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: async () => {
      const res = await customersApi.doctors.list(params);
      return res.data as { doctors: Doctor[]; total: number };
    },
  });
}

export function useDoctor(id: number | null) {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const res = await customersApi.doctors.get(id!);
      return res.data as DoctorDetail;
    },
    enabled: id !== null,
  });
}

export function useApproveDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doctorId: number) => {
      const res = await customersApi.doctors.approve(doctorId);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['doctor'] });
      qc.invalidateQueries({ queryKey: ['customerStats'] });
    },
  });
}

export function useRejectDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doctorId: number) => {
      const res = await customersApi.doctors.reject(doctorId);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['doctor'] });
      qc.invalidateQueries({ queryKey: ['customerStats'] });
    },
  });
}
