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
    onMutate: async (doctorId) => {
      await qc.cancelQueries({ queryKey: ['doctors'] });
      // Optimistically update doctor status in all doctor list caches
      const queries = qc.getQueryCache().findAll({ queryKey: ['doctors'] });
      const snapshots: Array<{ key: readonly unknown[]; data: unknown }> = [];
      for (const query of queries) {
        snapshots.push({ key: query.queryKey, data: query.state.data });
        qc.setQueryData(query.queryKey, (old: { doctors: Doctor[]; total: number } | undefined) => {
          if (!old?.doctors) return old;
          return {
            ...old,
            doctors: old.doctors.map((d) =>
              d.id === doctorId ? { ...d, doctor_status: 'approved' as const } : d
            ),
          };
        });
      }
      return { snapshots };
    },
    onError: (_err, _doctorId, context) => {
      // Rollback on error
      for (const snap of context?.snapshots ?? []) {
        qc.setQueryData(snap.key, snap.data);
      }
    },
    onSettled: () => {
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
    onMutate: async (doctorId) => {
      await qc.cancelQueries({ queryKey: ['doctors'] });
      const queries = qc.getQueryCache().findAll({ queryKey: ['doctors'] });
      const snapshots: Array<{ key: readonly unknown[]; data: unknown }> = [];
      for (const query of queries) {
        snapshots.push({ key: query.queryKey, data: query.state.data });
        qc.setQueryData(query.queryKey, (old: { doctors: Doctor[]; total: number } | undefined) => {
          if (!old?.doctors) return old;
          return {
            ...old,
            doctors: old.doctors.map((d) =>
              d.id === doctorId ? { ...d, doctor_status: 'rejected' as const } : d
            ),
          };
        });
      }
      return { snapshots };
    },
    onError: (_err, _doctorId, context) => {
      for (const snap of context?.snapshots ?? []) {
        qc.setQueryData(snap.key, snap.data);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['doctor'] });
      qc.invalidateQueries({ queryKey: ['customerStats'] });
    },
  });
}
