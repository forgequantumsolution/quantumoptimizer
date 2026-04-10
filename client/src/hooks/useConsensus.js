import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BASE = '/api/consensus';

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

// ─── Plan list ────────────────────────────────────────────────────────────────

export function usePlans(status) {
  return useQuery({
    queryKey: ['consensus-plans', status],
    queryFn: () => apiFetch(`${BASE}?${status ? `status=${status}` : ''}`),
    staleTime: 30_000,
  });
}

// ─── Plan detail (with cells) ─────────────────────────────────────────────────

export function usePlanDetail(planId, enabled = true) {
  return useQuery({
    queryKey: ['consensus-plan', planId],
    queryFn: () => apiFetch(`${BASE}/${planId}`),
    enabled: !!planId && enabled,
    staleTime: 10_000,
  });
}

// ─── Create plan ──────────────────────────────────────────────────────────────

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      apiFetch(BASE, { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consensus-plans'] }),
  });
}

// ─── Upsert cells (batch save) ────────────────────────────────────────────────

export function useUpsertCells(planId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (edits) =>
      apiFetch(`${BASE}/${planId}/cells`, { method: 'PATCH', body: JSON.stringify({ edits }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consensus-plan', planId] }),
  });
}

// ─── Workflow actions ─────────────────────────────────────────────────────────

export function useSubmitPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId) =>
      apiFetch(`${BASE}/${planId}/submit`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consensus-plans'] }),
  });
}

export function useApprovePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, note }) =>
      apiFetch(`${BASE}/${planId}/approve`, { method: 'POST', body: JSON.stringify({ note }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consensus-plans'] }),
  });
}

export function useRejectPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, note }) =>
      apiFetch(`${BASE}/${planId}/reject`, { method: 'POST', body: JSON.stringify({ note }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consensus-plans'] }),
  });
}

// ─── Cell comments ────────────────────────────────────────────────────────────

export function useCellComments(cellId, enabled = true) {
  return useQuery({
    queryKey: ['cell-comments', cellId],
    queryFn: () => apiFetch(`${BASE}/cells/${cellId}/comments`),
    enabled: !!cellId && enabled,
  });
}

export function useAddComment(cellId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) =>
      apiFetch(`${BASE}/cells/${cellId}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cell-comments', cellId] }),
  });
}

// ─── NPI analogues ────────────────────────────────────────────────────────────

export function useAnalogueSKUs(category, excludeItemId, enabled = true) {
  return useQuery({
    queryKey: ['npi-analogues', category, excludeItemId],
    queryFn: () =>
      apiFetch(`${BASE}/npi/analogues?category=${encodeURIComponent(category)}${excludeItemId ? `&excludeItemId=${excludeItemId}` : ''}`),
    enabled: !!category && enabled,
    staleTime: 60_000,
  });
}
