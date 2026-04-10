import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BASE = '/api/supply';

async function apiFetch(path, opts = {}) {
  const token = JSON.parse(localStorage.getItem('auth-store') || '{}')?.state?.token;
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opts,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'API error');
  return json.data;
}

// ─── Supply Plans ─────────────────────────────────────────────────────────────

export function useSupplyPlans(status) {
  return useQuery({
    queryKey: ['supply-plans', status],
    queryFn: () => apiFetch(`${BASE}?${status ? `status=${status}` : ''}`),
    staleTime: 30_000,
  });
}

export function useSupplyPlanDetail(planId, enabled = true) {
  return useQuery({
    queryKey: ['supply-plan', planId],
    queryFn: () => apiFetch(`${BASE}/${planId}`),
    enabled: !!planId && enabled,
    staleTime: 15_000,
  });
}

export function useGenerateSupplyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      apiFetch(BASE, { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supply-plans'] }),
  });
}

export function useUpdateSupplyRows(planId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (edits) =>
      apiFetch(`${BASE}/${planId}/rows`, { method: 'PATCH', body: JSON.stringify({ edits }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supply-plan', planId] }),
  });
}

export function useReleaseSupplyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId) =>
      apiFetch(`${BASE}/${planId}/release`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supply-plans'] }),
  });
}

// ─── Work Centers ─────────────────────────────────────────────────────────────

export function useWorkCenters() {
  return useQuery({
    queryKey: ['work-centers'],
    queryFn: () => apiFetch(`${BASE}/work-centers`),
    staleTime: 60_000,
  });
}

export function useCapacityUtilisation(week) {
  return useQuery({
    queryKey: ['capacity', week],
    queryFn: () => apiFetch(`${BASE}/capacity?${week ? `week=${week}` : ''}`),
    staleTime: 30_000,
  });
}

// ─── Production Orders ────────────────────────────────────────────────────────

export function useProductionOrders(supplyPlanId) {
  return useQuery({
    queryKey: ['production-orders', supplyPlanId],
    queryFn: () => apiFetch(`${BASE}/production-orders?${supplyPlanId ? `supplyPlanId=${supplyPlanId}` : ''}`),
    staleTime: 15_000,
  });
}

export function useUpdateProductionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }) =>
      apiFetch(`${BASE}/production-orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['production-orders'] }),
  });
}

export function useRescheduleOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, startDate, endDate }) =>
      apiFetch(`${BASE}/production-orders/${orderId}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({ startDate, endDate }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['production-orders'] }),
  });
}

// ─── Replenishment Orders ─────────────────────────────────────────────────────

export function useReplenishmentOrders(status) {
  return useQuery({
    queryKey: ['replenishment-orders', status],
    queryFn: () => apiFetch(`${BASE}/replenishment?${status ? `status=${status}` : ''}`),
    staleTime: 30_000,
  });
}

export function useApproveReplenishment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId) =>
      apiFetch(`${BASE}/replenishment/${orderId}/approve`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['replenishment-orders'] }),
  });
}

export function useDispatchReplenishment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, erpRef }) =>
      apiFetch(`${BASE}/replenishment/${orderId}/dispatch`, {
        method: 'POST',
        body: JSON.stringify({ erpRef }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['replenishment-orders'] }),
  });
}
