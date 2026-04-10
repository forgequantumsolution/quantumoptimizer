import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export function useKPIs() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      const res = await api.get('/dashboard/kpis');
      return res.data.data;
    },
    staleTime: 60000,
  });
}

export function useAccuracyTrend() {
  return useQuery({
    queryKey: ['dashboard', 'accuracy-trend'],
    queryFn: async () => {
      const res = await api.get('/dashboard/accuracy-trend');
      return res.data.data;
    },
    staleTime: 60000,
  });
}

export function useSkuStatus() {
  return useQuery({
    queryKey: ['dashboard', 'sku-status'],
    queryFn: async () => {
      const res = await api.get('/dashboard/sku-status');
      return res.data.data;
    },
    staleTime: 60000,
  });
}
