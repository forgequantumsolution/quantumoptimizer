import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useForecastForSku(skuId, locationId, horizon = 30, enabled = true) {
  return useQuery({
    queryKey: ['forecast', skuId, locationId, horizon],
    queryFn: async () => {
      if (!skuId || !locationId) return null;
      const res = await api.get(`/forecasts/${skuId}`, {
        params: { locationId, horizon },
      });
      return res.data.data;
    },
    enabled: enabled && !!skuId && !!locationId,
    staleTime: 120000,
    retry: 1,
  });
}

export function useRunForecast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, locationId, horizon }) =>
      api.post('/forecasts/run', { itemId, locationId, horizon }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['forecast', vars.itemId] });
    },
  });
}

export function useOverrideForecast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, overrideValue, overrideNote }) =>
      api.patch(`/forecasts/${id}/override`, { overrideValue, overrideNote }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forecast'] });
    },
  });
}

export function useModelPerformance() {
  return useQuery({
    queryKey: ['forecast', 'model-performance'],
    queryFn: async () => {
      const res = await api.get('/forecasts/model-performance');
      return res.data.data;
    },
    staleTime: 300000,
  });
}
