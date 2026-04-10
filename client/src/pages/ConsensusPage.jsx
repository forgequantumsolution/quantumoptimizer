import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { ROLES } from '../constants';
import AppLayout from '../components/layout/AppLayout';
import {
  usePlans, useCreatePlan, usePlanDetail,
  useUpsertCells, useSubmitPlan, useApprovePlan, useRejectPlan,
  useCellComments, useAddComment, useAnalogueSKUs,
} from '../hooks/useConsensus';

// ─── Permissions ──────────────────────────────────────────────────────────────

const EDITOR_ROLES = [ROLES.SUPPLY_PLANNER, ROLES.SUPER_ADMIN];
const APPROVER_ROLES = [ROLES.FINANCE, ROLES.SUPER_ADMIN];

// ─── Mock data (offline fallback) ─────────────────────────────────────────────

const MOCK_SKUS = [
  { id: 'sku-1', code: 'SKU-001', name: 'Amoxicillin 500mg', category: 'Antibiotics' },
  { id: 'sku-2', code: 'SKU-002', name: 'Paracetamol 650mg', category: 'Analgesics' },
  { id: 'sku-3', code: 'SKU-003', name: 'Ibuprofen 400mg', category: 'NSAIDs' },
  { id: 'sku-4', code: 'SKU-004', name: 'Omeprazole 20mg', category: 'GI' },
  { id: 'sku-5', code: 'SKU-005', name: 'Atorvastatin 10mg', category: 'Cardiovascular' },
];

const MOCK_WEEKS = ['2026-W15', '2026-W16', '2026-W17', '2026-W18', '2026-W19', '2026-W20'];

function buildMockCells() {
  const cells = [];
  MOCK_SKUS.forEach((sku) => {
    MOCK_WEEKS.forEach((week) => {
      const stat = Math.round(150 + Math.random() * 400);
      cells.push({
        id: `${sku.id}-${week}`,
        itemId: sku.id,
        locationId: 'WH-001',
        periodLabel: week,
        statForecast: stat,
        consensusValue: stat,
        priorValue: Math.round(stat * (0.9 + Math.random() * 0.2)),
        revenueImpact: 0,
        sku,
        _count: { comments: 0 },
      });
    });
  });
  return cells;
}

const MOCK_PLANS = [
  {
    id: 'plan-demo-1',
    name: 'S&OP Apr 2026',
    periodStart: '2026-04-07',
    periodEnd: '2026-06-29',
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    _count: { cells: 30 },
    approvals: [],
  },
];

const MOCK_PLAN_DETAIL = {
  plan: MOCK_PLANS[0],
  cells: buildMockCells(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status) {
  const map = {
    DRAFT: 'bg-muted/20 text-muted',
    SUBMITTED: 'bg-blue/20 text-blue-light',
    APPROVED: 'bg-green/20 text-green',
    REJECTED: 'bg-danger/20 text-danger',
    LOCKED: 'bg-gold/20 text-gold',
  };
  return map[status] || 'bg-muted/20 text-muted';
}

function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('en-IN');
}

function fmtImpact(n) {
  if (!n) return null;
  const abs = Math.abs(n);
  const sign = n >= 0 ? '+' : '-';
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  return `${sign}₹${(abs / 1000).toFixed(1)}K`;
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── New plan drawer ──────────────────────────────────────────────────────────

function NewPlanDrawer({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: '',
    periodStart: '2026-04-07',
    periodEnd: '2026-06-29',
    locationId: 'WH-001',
  });
  const { mutate, isPending, error } = useCreatePlan();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit(ev) {
    ev.preventDefault();
    mutate(form, {
      onSuccess: (plan) => {
        onCreate(plan);
        onClose();
      },
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <aside className="w-96 bg-dark2 border-l border-white/10 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="font-display text-lg text-white">New plan version</h2>
          <button onClick={onClose} className="text-muted hover:text-white text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-5">
          <div>
            <label className="block font-ui text-xs text-muted mb-1">Plan name</label>
            <input
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. S&OP May 2026"
              className="w-full bg-dark border border-white/10 rounded px-3 py-2 font-ui text-sm text-white placeholder-muted focus:outline-none focus:border-gold/50"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-ui text-xs text-muted mb-1">Period start</label>
              <input
                type="date"
                value={form.periodStart}
                onChange={set('periodStart')}
                className="w-full bg-dark border border-white/10 rounded px-3 py-2 font-ui text-sm text-white focus:outline-none focus:border-gold/50"
                required
              />
            </div>
            <div>
              <label className="block font-ui text-xs text-muted mb-1">Period end</label>
              <input
                type="date"
                value={form.periodEnd}
                onChange={set('periodEnd')}
                className="w-full bg-dark border border-white/10 rounded px-3 py-2 font-ui text-sm text-white focus:outline-none focus:border-gold/50"
                required
              />
            </div>
          </div>
          <div>
            <label className="block font-ui text-xs text-muted mb-1">Location</label>
            <input
              value={form.locationId}
              onChange={set('locationId')}
              placeholder="WH-001"
              className="w-full bg-dark border border-white/10 rounded px-3 py-2 font-ui text-sm text-white placeholder-muted focus:outline-none focus:border-gold/50"
              required
            />
          </div>
          {error && (
            <p className="font-ui text-xs text-danger">Error: {error.message}</p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gold hover:bg-gold2 text-dark font-ui text-sm font-semibold py-2.5 rounded transition-colors disabled:opacity-50"
          >
            {isPending ? 'Creating…' : 'Create plan'}
          </button>
        </form>
      </aside>
    </div>
  );
}

// ─── Approval drawer ──────────────────────────────────────────────────────────

function ApprovalDrawer({ plan, onClose, userRole }) {
  const [note, setNote] = useState('');
  const approve = useApprovePlan();
  const reject = useRejectPlan();
  const canApprove = APPROVER_ROLES.includes(userRole);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <aside className="w-96 bg-dark2 border-l border-white/10 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="font-display text-lg text-white">Plan review</h2>
          <button onClick={onClose} className="text-muted hover:text-white text-xl">✕</button>
        </div>
        <div className="flex-1 p-6 space-y-5">
          <div className="bg-dark rounded-lg p-4 space-y-1">
            <p className="font-ui text-xs text-muted">Plan</p>
            <p className="font-ui text-sm text-white font-semibold">{plan.name}</p>
            <span className={`inline-flex px-2 py-0.5 rounded-full font-ui text-[10px] font-semibold uppercase tracking-wider ${statusBadge(plan.status)}`}>
              {plan.status}
            </span>
          </div>
          {plan.approvals?.length > 0 && (
            <div className="space-y-2">
              <p className="font-ui text-xs text-muted uppercase tracking-wider">Approval trail</p>
              {plan.approvals.map((a, i) => (
                <div key={i} className="bg-dark rounded p-3">
                  <div className="flex items-center justify-between">
                    <span className={`font-ui text-xs font-semibold ${a.action === 'APPROVED' ? 'text-green' : a.action === 'REJECTED' ? 'text-danger' : 'text-blue-light'}`}>
                      {a.action}
                    </span>
                    <span className="font-ui text-[10px] text-muted">{timeAgo(a.createdAt)}</span>
                  </div>
                  <p className="font-ui text-xs text-muted mt-0.5">{a.userName || a.userEmail}</p>
                  {a.note && <p className="font-ui text-xs text-white/70 mt-1 italic">"{a.note}"</p>}
                </div>
              ))}
            </div>
          )}
          {canApprove && plan.status === 'SUBMITTED' && (
            <div className="space-y-3">
              <div>
                <label className="block font-ui text-xs text-muted mb-1">Review note (required for rejection)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full bg-dark border border-white/10 rounded px-3 py-2 font-ui text-sm text-white placeholder-muted focus:outline-none focus:border-gold/50 resize-none"
                  placeholder="Optional for approval, required for rejection…"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => approve.mutate({ planId: plan.id, note }, { onSuccess: onClose })}
                  disabled={approve.isPending}
                  className="flex-1 bg-green/80 hover:bg-green text-white font-ui text-sm font-semibold py-2.5 rounded transition-colors disabled:opacity-50"
                >
                  {approve.isPending ? 'Approving…' : 'Approve'}
                </button>
                <button
                  onClick={() => reject.mutate({ planId: plan.id, note }, { onSuccess: onClose })}
                  disabled={reject.isPending || !note.trim()}
                  className="flex-1 bg-danger/80 hover:bg-danger text-white font-ui text-sm font-semibold py-2.5 rounded transition-colors disabled:opacity-50"
                >
                  {reject.isPending ? 'Rejecting…' : 'Reject'}
                </button>
              </div>
            </div>
          )}
          {!canApprove && (
            <p className="font-ui text-xs text-muted">Only Finance approvers can approve or reject plans.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

// ─── Cell comment drawer ──────────────────────────────────────────────────────

function CommentDrawer({ cell, onClose }) {
  const { data: comments = [], isLoading } = useCellComments(cell?.id, !!cell);
  const addComment = useAddComment(cell?.id);
  const [body, setBody] = useState('');

  function handleAdd(ev) {
    ev.preventDefault();
    if (!body.trim()) return;
    addComment.mutate(body, { onSuccess: () => setBody('') });
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <aside className="w-80 bg-dark2 border-l border-white/10 flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="font-display text-base text-white">Comments</h2>
            {cell && (
              <p className="font-ui text-[10px] text-muted mt-0.5">
                {cell.sku?.code} · {cell.periodLabel}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-muted hover:text-white text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && <p className="font-ui text-xs text-muted">Loading…</p>}
          {!isLoading && comments.length === 0 && (
            <p className="font-ui text-xs text-muted text-center py-8">No comments yet.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="bg-dark rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-ui text-xs font-semibold text-gold">{c.userName || c.userEmail}</span>
                <span className="font-ui text-[10px] text-muted">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="font-ui text-xs text-white/80">{c.body}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleAdd} className="border-t border-white/10 p-4 flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 bg-dark border border-white/10 rounded px-3 py-2 font-ui text-xs text-white placeholder-muted focus:outline-none focus:border-gold/50"
          />
          <button
            type="submit"
            disabled={!body.trim() || addComment.isPending}
            className="bg-gold hover:bg-gold2 text-dark font-ui text-xs font-semibold px-3 py-2 rounded transition-colors disabled:opacity-40"
          >
            Post
          </button>
        </form>
      </aside>
    </div>
  );
}

// ─── NPI Panel ────────────────────────────────────────────────────────────────

function NPIPanel({ tenantId }) {
  const [category, setCategory] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const { data: analogues, isFetching } = useAnalogueSKUs(searchCategory, undefined, !!searchCategory);

  return (
    <div className="bg-dark2 border border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gold text-base">★</span>
        <h3 className="font-display text-base text-white">NPI — new product introduction</h3>
      </div>
      <p className="font-ui text-xs text-muted mb-4">
        Find analogous SKUs to seed phase-in forecasts for a new product. Select a category to discover items with similar demand profiles.
      </p>
      <div className="flex gap-2 mb-4">
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (e.g. Antibiotics)"
          className="flex-1 bg-dark border border-white/10 rounded px-3 py-2 font-ui text-xs text-white placeholder-muted focus:outline-none focus:border-gold/50"
        />
        <button
          onClick={() => setSearchCategory(category)}
          className="bg-gold hover:bg-gold2 text-dark font-ui text-xs font-semibold px-4 py-2 rounded transition-colors"
        >
          Find
        </button>
      </div>
      {isFetching && <p className="font-ui text-xs text-muted">Searching…</p>}
      {!isFetching && analogues && analogues.length === 0 && (
        <p className="font-ui text-xs text-muted">No analogues found for "{searchCategory}".</p>
      )}
      {!isFetching && analogues && analogues.length > 0 && (
        <div className="space-y-2">
          {analogues.map((sku) => (
            <div key={sku.id} className="bg-dark rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="font-ui text-xs font-semibold text-white">{sku.name}</p>
                <p className="font-ui text-[10px] text-muted">{sku.code} · {sku.category} · {sku.historyWeeks}w history</p>
              </div>
              <div className="text-right">
                <p className="font-ui text-xs font-semibold text-gold">{fmtNum(sku.avgWeeklyDemand)}</p>
                <p className="font-ui text-[10px] text-muted">avg/week</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Pivot grid ───────────────────────────────────────────────────────────────

function PivotGrid({ cells, plan, canEdit, onCellComment }) {
  const upsertCells = useUpsertCells(plan?.id);
  const pendingEdits = useRef({});
  const [localValues, setLocalValues] = useState({});

  // Derive unique items and periods from cells
  const itemMap = new Map();
  const periodSet = new Set();
  for (const c of cells) {
    if (!itemMap.has(c.itemId)) itemMap.set(c.itemId, c.sku);
    periodSet.add(c.periodLabel);
  }
  const items = [...itemMap.entries()];
  const periods = [...periodSet].sort();

  // Index cells by itemId::period
  const cellIndex = new Map();
  for (const c of cells) cellIndex.set(`${c.itemId}::${c.periodLabel}`, c);

  // Aggregate revenue impact for footer
  const totalImpact = cells.reduce((sum, c) => {
    const cv = localValues[c.id] ?? c.consensusValue;
    return sum + (cv - c.statForecast) * 850;
  }, 0);

  function handleBlur(cell) {
    const raw = localValues[cell.id];
    if (raw === undefined) return;
    const val = parseFloat(String(raw));
    if (isNaN(val) || val < 0) return;
    if (Math.round(val) === cell.consensusValue) {
      setLocalValues((v) => { const n = { ...v }; delete n[cell.id]; return n; });
      return;
    }
    pendingEdits.current[cell.id] = Math.round(val);
    // Debounce flush
    clearTimeout(pendingEdits.current.__timer);
    pendingEdits.current.__timer = setTimeout(() => {
      const edits = Object.entries(pendingEdits.current)
        .filter(([k]) => k !== '__timer')
        .map(([cellId, consensusValue]) => ({ cellId, consensusValue }));
      if (edits.length > 0) {
        upsertCells.mutate(edits);
        pendingEdits.current = {};
      }
    }, 800);
  }

  const isDraft = plan?.status === 'DRAFT';

  return (
    <div className="relative">
      {upsertCells.isPending && (
        <div className="absolute top-2 right-2 z-10 bg-gold/90 text-dark font-ui text-[10px] font-semibold px-2 py-1 rounded">
          Saving…
        </div>
      )}
      {/* Scrollable grid */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="text-left border-collapse min-w-full">
          <thead>
            <tr className="bg-dark2 border-b border-white/10">
              <th className="sticky left-0 z-20 bg-dark2 px-4 py-3 font-ui text-[10px] text-muted uppercase tracking-wider min-w-[200px]">SKU</th>
              <th className="sticky left-[200px] z-20 bg-dark2 px-3 py-3 font-ui text-[10px] text-muted uppercase tracking-wider min-w-[100px]">Category</th>
              {periods.map((p) => (
                <th key={p} className="px-3 py-3 font-ui text-[10px] text-muted uppercase tracking-wider min-w-[100px] text-right whitespace-nowrap">
                  {p.replace('20', "'")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(([itemId, sku]) => {
              const rowImpact = periods.reduce((sum, p) => {
                const c = cellIndex.get(`${itemId}::${p}`);
                if (!c) return sum;
                const cv = localValues[c.id] ?? c.consensusValue;
                return sum + (cv - c.statForecast) * 850;
              }, 0);
              return (
                <tr key={itemId} className="border-b border-white/5 hover:bg-white/[0.02] group">
                  <td className="sticky left-0 z-10 bg-dark px-4 py-2.5 group-hover:bg-dark2">
                    <div>
                      <p className="font-ui text-xs font-semibold text-white truncate max-w-[180px]">{sku?.name || itemId}</p>
                      <p className="font-ui text-[10px] text-muted">{sku?.code}</p>
                    </div>
                  </td>
                  <td className="sticky left-[200px] z-10 bg-dark px-3 py-2.5 group-hover:bg-dark2">
                    <span className="font-ui text-[10px] text-muted">{sku?.category || '—'}</span>
                    {rowImpact !== 0 && (
                      <p className={`font-ui text-[10px] font-semibold ${rowImpact > 0 ? 'text-green' : 'text-danger'}`}>
                        {fmtImpact(rowImpact)}
                      </p>
                    )}
                  </td>
                  {periods.map((p) => {
                    const c = cellIndex.get(`${itemId}::${p}`);
                    if (!c) return <td key={p} className="px-3 py-2.5 text-right font-ui text-xs text-muted">—</td>;
                    const localVal = localValues[c.id];
                    const displayVal = localVal !== undefined ? localVal : c.consensusValue;
                    const diff = (localVal !== undefined ? parseFloat(String(localVal)) : c.consensusValue) - c.statForecast;
                    const diffPct = c.statForecast ? Math.round((diff / c.statForecast) * 100) : 0;
                    const hasComment = c._count?.comments > 0;
                    const isEdited = c.consensusValue !== c.statForecast || localVal !== undefined;
                    return (
                      <td
                        key={p}
                        className={`px-3 py-1.5 text-right min-w-[100px] transition-colors ${isEdited ? (diff > 0 ? 'bg-green/5' : 'bg-danger/5') : ''}`}
                      >
                        <div className="flex flex-col items-end gap-0.5">
                          {/* Stat forecast (reference) */}
                          <span className="font-ui text-[9px] text-muted">{fmtNum(c.statForecast)}</span>
                          {/* Editable consensus value */}
                          {canEdit && isDraft ? (
                            <input
                              type="number"
                              min="0"
                              value={displayVal}
                              onChange={(e) => setLocalValues((v) => ({ ...v, [c.id]: e.target.value }))}
                              onBlur={() => handleBlur(c)}
                              className={`w-20 text-right bg-transparent border-b font-ui text-xs font-semibold text-white focus:outline-none focus:border-gold/60 transition-colors
                                ${diff > 0 ? 'border-green/30' : diff < 0 ? 'border-danger/30' : 'border-white/10'}`}
                            />
                          ) : (
                            <span className={`font-ui text-xs font-semibold ${diff > 0 ? 'text-green' : diff < 0 ? 'text-danger' : 'text-white'}`}>
                              {fmtNum(c.consensusValue)}
                            </span>
                          )}
                          {/* Delta badge */}
                          {diffPct !== 0 && (
                            <span className={`font-ui text-[9px] ${diffPct > 0 ? 'text-green' : 'text-danger'}`}>
                              {diffPct > 0 ? '+' : ''}{diffPct}%
                            </span>
                          )}
                          {/* Comment indicator */}
                          <button
                            onClick={() => onCellComment(c)}
                            className={`font-ui text-[9px] transition-colors ${hasComment ? 'text-gold' : 'text-muted/40 hover:text-muted'}`}
                            title={hasComment ? `${c._count.comments} comment(s)` : 'Add comment'}
                          >
                            {hasComment ? `💬 ${c._count.comments}` : '+ note'}
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-dark2 border-t border-white/10">
              <td colSpan={2} className="sticky left-0 bg-dark2 px-4 py-3 font-ui text-[10px] text-muted uppercase tracking-wider">
                Revenue impact
              </td>
              {periods.map((p) => {
                const colImpact = cells
                  .filter((c) => c.periodLabel === p)
                  .reduce((sum, c) => {
                    const cv = localValues[c.id] ?? c.consensusValue;
                    return sum + (cv - c.statForecast) * 850;
                  }, 0);
                return (
                  <td key={p} className="px-3 py-3 text-right">
                    {colImpact !== 0 && (
                      <span className={`font-ui text-[10px] font-semibold ${colImpact > 0 ? 'text-green' : 'text-danger'}`}>
                        {fmtImpact(colImpact)}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
      {/* Total impact strip */}
      <div className="mt-3 flex items-center justify-end gap-2">
        <span className="font-ui text-xs text-muted">Total revenue impact vs AI forecast:</span>
        <span className={`font-ui text-sm font-semibold ${totalImpact > 0 ? 'text-green' : totalImpact < 0 ? 'text-danger' : 'text-muted'}`}>
          {totalImpact !== 0 ? fmtImpact(totalImpact) : '—'}
        </span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ConsensusPage() {
  const { user } = useAuthStore();
  const canEdit = EDITOR_ROLES.includes(user?.role);
  const canApprove = APPROVER_ROLES.includes(user?.role);

  const { data: plansRaw, isLoading: plansLoading, isError: plansError } = usePlans();
  const plans = plansError ? MOCK_PLANS : (plansRaw || []);

  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const [activeCell, setActiveCell] = useState(null);
  const [showNPI, setShowNPI] = useState(false);
  const submitPlan = useSubmitPlan();

  // Select first plan by default
  useEffect(() => {
    if (!selectedPlanId && plans.length > 0) setSelectedPlanId(plans[0].id);
  }, [plans, selectedPlanId]);

  const selectedPlanMeta = plans.find((p) => p.id === selectedPlanId);

  const { data: planDetailRaw, isLoading: detailLoading, isError: detailError } = usePlanDetail(selectedPlanId, !!selectedPlanId);
  const planDetail = detailError ? (selectedPlanId === MOCK_PLANS[0].id ? MOCK_PLAN_DETAIL : null) : planDetailRaw;

  const cells = planDetail?.cells || [];
  const planMeta = planDetail?.plan || selectedPlanMeta;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-white">Consensus demand planning</h1>
            <p className="font-ui text-sm text-muted mt-1">
              Collaborative S&OP workspace — one version of truth across demand, commercial, and finance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNPI((v) => !v)}
              className={`font-ui text-xs font-semibold px-4 py-2 rounded border transition-colors ${showNPI ? 'border-gold text-gold bg-gold/10' : 'border-white/10 text-muted hover:text-white hover:border-white/20'}`}
            >
              NPI module
            </button>
            {canEdit && (
              <button
                onClick={() => setShowNewPlan(true)}
                className="bg-gold hover:bg-gold2 text-dark font-ui text-xs font-semibold px-4 py-2 rounded transition-colors"
              >
                + New version
              </button>
            )}
          </div>
        </div>

        {/* NPI panel (collapsible) */}
        {showNPI && (
          <NPIPanel tenantId={user?.tenantId} />
        )}

        {/* Plan selector + controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="font-ui text-xs text-muted">Plan version</label>
            <select
              value={selectedPlanId || ''}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="bg-dark2 border border-white/10 rounded px-3 py-1.5 font-ui text-xs text-white focus:outline-none focus:border-gold/50 min-w-[200px]"
            >
              {plansLoading && <option>Loading…</option>}
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>
          {planMeta && (
            <span className={`inline-flex px-2.5 py-1 rounded-full font-ui text-[10px] font-semibold uppercase tracking-wider ${statusBadge(planMeta.status)}`}>
              {planMeta.status}
            </span>
          )}
          {planMeta && (
            <span className="font-ui text-[10px] text-muted">
              {planMeta._count?.cells || 0} cells
            </span>
          )}
          <div className="flex-1" />
          {/* Workflow actions */}
          {canEdit && planMeta?.status === 'DRAFT' && (
            <button
              onClick={() => submitPlan.mutate(selectedPlanId)}
              disabled={submitPlan.isPending}
              className="bg-blue/80 hover:bg-blue text-white font-ui text-xs font-semibold px-4 py-2 rounded transition-colors disabled:opacity-50"
            >
              {submitPlan.isPending ? 'Submitting…' : 'Submit for approval'}
            </button>
          )}
          {(canApprove || planMeta?.status === 'SUBMITTED') && planMeta?.status !== 'DRAFT' && (
            <button
              onClick={() => setShowApproval(true)}
              className="bg-dark2 border border-white/10 hover:border-white/20 text-white font-ui text-xs font-semibold px-4 py-2 rounded transition-colors"
            >
              Review &amp; approve
            </button>
          )}
          {planMeta?.status === 'REJECTED' && canEdit && (
            <button
              onClick={() => setShowNewPlan(true)}
              className="bg-gold/20 hover:bg-gold/30 text-gold font-ui text-xs font-semibold px-4 py-2 rounded transition-colors"
            >
              Revise plan
            </button>
          )}
        </div>

        {/* Pivot grid */}
        {detailLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-ui text-sm text-muted">Loading plan…</p>
            </div>
          </div>
        )}
        {!detailLoading && planDetail && cells.length > 0 && (
          <PivotGrid
            cells={cells}
            plan={planMeta}
            canEdit={canEdit}
            onCellComment={(cell) => setActiveCell(cell)}
          />
        )}
        {!detailLoading && planDetail && cells.length === 0 && (
          <div className="bg-dark2 border border-white/10 rounded-xl p-12 text-center">
            <p className="font-display text-lg text-muted">No cells found for this plan.</p>
            <p className="font-ui text-xs text-muted mt-2">The plan may still be generating cells. Refresh in a moment.</p>
          </div>
        )}
        {!detailLoading && !planDetail && !selectedPlanId && (
          <div className="bg-dark2 border border-white/10 rounded-xl p-12 text-center">
            <p className="font-display text-xl text-muted">No plans yet</p>
            {canEdit && (
              <p className="font-ui text-sm text-muted mt-3">
                Create the first plan version to start the S&OP cycle.
              </p>
            )}
          </div>
        )}

        {/* Role guidance */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`bg-dark2 border rounded-xl p-4 ${canEdit ? 'border-gold/30' : 'border-white/5'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${canEdit ? 'bg-gold' : 'bg-muted/30'}`} />
              <p className="font-ui text-xs font-semibold text-white">Demand planner</p>
            </div>
            <p className="font-ui text-[10px] text-muted">Creates plan versions, edits consensus cells, submits for review.</p>
          </div>
          <div className="bg-dark2 border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-muted/30" />
              <p className="font-ui text-xs font-semibold text-white">Commercial reviewer</p>
            </div>
            <p className="font-ui text-[10px] text-muted">Views plan, comments on cells, flags risks before submission.</p>
          </div>
          <div className={`bg-dark2 border rounded-xl p-4 ${canApprove ? 'border-green/30' : 'border-white/5'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${canApprove ? 'bg-green' : 'bg-muted/30'}`} />
              <p className="font-ui text-xs font-semibold text-white">Finance approver</p>
            </div>
            <p className="font-ui text-[10px] text-muted">Approves or rejects submitted plans. Approval triggers supply run.</p>
          </div>
        </div>
      </div>

      {/* Drawers */}
      {showNewPlan && (
        <NewPlanDrawer
          onClose={() => setShowNewPlan(false)}
          onCreate={(plan) => setSelectedPlanId(plan?.id)}
        />
      )}
      {showApproval && planMeta && (
        <ApprovalDrawer
          plan={{ ...planMeta, approvals: planDetail?.plan?.approvals || [] }}
          onClose={() => setShowApproval(false)}
          userRole={user?.role}
        />
      )}
      {activeCell && (
        <CommentDrawer cell={activeCell} onClose={() => setActiveCell(null)} />
      )}
    </AppLayout>
  );
}
