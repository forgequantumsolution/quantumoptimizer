import { useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { ROLES } from '../constants';
import {
  useSupplyPlans,
  useSupplyPlanDetail,
  useGenerateSupplyPlan,
  useUpdateSupplyRows,
  useReleaseSupplyPlan,
  useProductionOrders,
  useUpdateProductionStatus,
  useRescheduleOrder,
  useReplenishmentOrders,
  useApproveReplenishment,
  useDispatchReplenishment,
  useCapacityUtilisation,
} from '../hooks/useSupplyPlanning';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/ui/Button';

// ─── Role helpers ─────────────────────────────────────────────────────────────

const PLANNER_ROLES = [ROLES.SUPPLY_PLANNER, ROLES.PRODUCTION_MANAGER, ROLES.SUPER_ADMIN];
const APPROVER_ROLES = [ROLES.SUPPLY_PLANNER, ROLES.SUPER_ADMIN];

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = {
    DRAFT:       'bg-mid/20 text-mid',
    RELEASED:    'bg-success/20 text-success',
    LOCKED:      'bg-gold/20 text-gold',
    PLANNED:     'bg-mid/20 text-mid',
    CONFIRMED:   'bg-info/20 text-info',
    IN_PROGRESS: 'bg-warning/20 text-warning',
    COMPLETED:   'bg-success/20 text-success',
    CANCELLED:   'bg-danger/20 text-danger',
    PENDING:     'bg-warning/20 text-warning',
    AUTO_APPROVED: 'bg-info/20 text-info',
    HUMAN_APPROVED: 'bg-success/20 text-success',
    OVERRIDDEN:  'bg-mid/20 text-mid',
    DISPATCHED:  'bg-gold/20 text-gold',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded font-ui text-[10px] font-semibold uppercase tracking-wider ${cfg[status] ?? 'bg-mid/20 text-mid'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Coverage indicator ───────────────────────────────────────────────────────

function CoverageBar({ days, target = 14 }) {
  const pct = Math.min(100, Math.round((days / target) * 100));
  const color = pct < 50 ? 'bg-danger' : pct < 80 ? 'bg-warning' : 'bg-success';
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-dark/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-ui text-[10px] text-muted w-8 text-right">{Math.round(days)}d</span>
    </div>
  );
}

// ─── MRP Grid ─────────────────────────────────────────────────────────────────

function MRPGrid({ plan, canEdit, onSaveEdits }) {
  const [localEdits, setLocalEdits] = useState({});
  const debounceRef = useRef(null);

  if (!plan?.rows?.length) {
    return <div className="p-8 text-center font-ui text-sm text-muted">No MRP rows available. Generate a supply plan from an approved demand plan.</div>;
  }

  // Group rows by itemId
  const skuMap = new Map();
  for (const row of plan.rows) {
    if (!skuMap.has(row.itemId)) skuMap.set(row.itemId, { itemId: row.itemId, itemName: row.itemName ?? row.itemId, rows: [] });
    skuMap.get(row.itemId).rows.push(row);
  }
  const skus = [...skuMap.values()];

  // Extract unique week labels (sorted)
  const weeks = [...new Set(plan.rows.map((r) => r.periodLabel))].sort();

  const handleEdit = (rowId, field, value) => {
    setLocalEdits((prev) => ({
      ...prev,
      [rowId]: { ...(prev[rowId] ?? {}), rowId, [field]: parseFloat(value) || 0 },
    }));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const edits = Object.values({ ...localEdits, [rowId]: { ...(localEdits[rowId] ?? {}), rowId, [field]: parseFloat(value) || 0 } });
      if (edits.length > 0) onSaveEdits(edits);
    }, 900);
  };

  const ROW_LABELS = [
    { key: 'demandQty',          label: 'Demand',          editable: false, cls: 'text-dark font-semibold' },
    { key: 'openingStock',       label: 'Opening Stock',   editable: false, cls: 'text-mid' },
    { key: 'safetyStock',        label: 'Safety Stock',    editable: false, cls: 'text-muted' },
    { key: 'plannedProduction',  label: 'Planned Prod.',   editable: true,  cls: 'text-gold' },
    { key: 'plannedPurchase',    label: 'Planned Purchase', editable: true, cls: 'text-info' },
    { key: 'closingStock',       label: 'Closing Stock',   editable: false, cls: '' },
    { key: 'coverageDays',       label: 'Coverage Days',   editable: false, cls: 'text-muted', render: (v) => `${Math.round(v)}d` },
  ];

  return (
    <div className="overflow-auto">
      {skus.map((sku) => (
        <div key={sku.itemId} className="mb-6">
          {/* SKU header */}
          <div className="px-4 py-2 bg-dark/5 border-b border-dark/10 font-ui text-xs font-semibold text-dark uppercase tracking-wider">
            {sku.itemName}
          </div>
          <table className="w-full text-right min-w-max">
            <thead>
              <tr className="border-b border-dark/10">
                <th className="text-left px-4 py-2 font-ui text-[10px] text-muted uppercase tracking-wider w-36 sticky left-0 bg-white">Row</th>
                {weeks.map((w) => (
                  <th key={w} className="px-3 py-2 font-ui text-[10px] text-muted w-24">{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROW_LABELS.map(({ key, label, editable, cls, render }) => {
                const rowByWeek = new Map(sku.rows.map((r) => [r.periodLabel, r]));
                return (
                  <tr key={key} className="border-b border-dark/5 hover:bg-cream/30">
                    <td className="text-left px-4 py-1.5 font-ui text-xs text-muted sticky left-0 bg-white">{label}</td>
                    {weeks.map((w) => {
                      const row = rowByWeek.get(w);
                      const rawVal = row ? (localEdits[row.id]?.[key] ?? row[key] ?? 0) : 0;
                      const displayVal = render ? render(rawVal) : Math.round(rawVal).toLocaleString();
                      return (
                        <td key={w} className={`px-3 py-1.5 font-ui text-xs ${cls}`}>
                          {editable && canEdit && row ? (
                            <input
                              type="number"
                              min="0"
                              className="w-20 text-right bg-gold/5 border border-gold/30 rounded px-1.5 py-0.5 font-ui text-xs text-gold focus:outline-none focus:border-gold"
                              value={localEdits[row.id]?.[key] ?? row[key] ?? 0}
                              onChange={(e) => handleEdit(row.id, key, e.target.value)}
                            />
                          ) : (
                            <span className={rawVal < 0 ? 'text-danger' : ''}>{displayVal}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ─── Capacity Bar per work center ─────────────────────────────────────────────

function CapacityRow({ wc }) {
  const pct = wc.utilisationPct ?? 0;
  const color = pct > 90 ? 'bg-danger' : pct > 75 ? 'bg-warning' : 'bg-success';
  return (
    <div className="flex items-center gap-4 py-3 border-b border-dark/5">
      <div className="w-44 shrink-0">
        <p className="font-ui text-xs font-semibold text-dark truncate">{wc.workCenterName}</p>
        <p className="font-ui text-[10px] text-muted">{(wc.weeklyCapacity ?? 0).toLocaleString()} units/wk</p>
      </div>
      <div className="flex-1 h-5 bg-dark/5 rounded overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`w-12 text-right font-ui text-xs font-bold ${pct > 90 ? 'text-danger' : pct > 75 ? 'text-warning' : 'text-success'}`}>
        {pct}%
      </span>
    </div>
  );
}

// ─── Production Board (Gantt-lite) ────────────────────────────────────────────

function ProductionBoard({ orders, canEdit, onStatusChange }) {
  const STATUS_OPTIONS = ['PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  if (!orders?.length) {
    return <div className="p-8 text-center font-ui text-sm text-muted">No production orders yet.</div>;
  }

  // Group by work center
  const wcMap = new Map();
  for (const o of orders) {
    const key = o.workCenterId;
    const name = o.workCenterName ?? o.workCenter?.name ?? key;
    if (!wcMap.has(key)) wcMap.set(key, { name, orders: [] });
    wcMap.get(key).orders.push(o);
  }
  const workCenters = [...wcMap.entries()];

  // Date range for Gantt
  const allDates = orders.flatMap((o) => [new Date(o.startDate), new Date(o.endDate)]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const totalDays = Math.max(1, Math.round((maxDate - minDate) / 86400000)) + 2;

  const dateToOffset = (date) => {
    const d = new Date(date);
    return Math.max(0, Math.round((d - minDate) / 86400000));
  };
  const dateToPct = (date) => `${(dateToOffset(date) / totalDays) * 100}%`;
  const durationPct = (start, end) => {
    const days = Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000));
    return `${(days / totalDays) * 100}%`;
  };

  const STATUS_COLOR = {
    PLANNED: 'bg-mid',
    CONFIRMED: 'bg-info',
    IN_PROGRESS: 'bg-warning',
    COMPLETED: 'bg-success',
    CANCELLED: 'bg-danger',
  };

  return (
    <div className="overflow-x-auto">
      {workCenters.map(([wcId, wc]) => (
        <div key={wcId} className="mb-6">
          <div className="px-4 py-2 bg-dark/5 border-b border-dark/10 font-ui text-xs font-semibold text-dark uppercase tracking-wider">
            {wc.name}
          </div>
          {wc.orders.map((order) => (
            <div key={order.id} className="flex items-center gap-3 px-4 py-2 border-b border-dark/5 hover:bg-cream/20">
              {/* Item + quantity */}
              <div className="w-40 shrink-0">
                <p className="font-ui text-xs font-semibold text-dark truncate">{order.itemName ?? order.itemId}</p>
                <p className="font-ui text-[10px] text-muted">{order.quantity?.toLocaleString()} units</p>
              </div>
              {/* Gantt bar */}
              <div className="flex-1 relative h-6 bg-dark/5 rounded overflow-hidden min-w-[200px]">
                <div
                  className={`absolute top-0 h-full rounded ${STATUS_COLOR[order.status] ?? 'bg-mid'} opacity-70 flex items-center px-1`}
                  style={{ left: dateToPct(order.startDate), width: durationPct(order.startDate, order.endDate) }}
                >
                  <span className="font-ui text-[9px] text-white truncate">{order.status}</span>
                </div>
              </div>
              {/* Dates */}
              <div className="w-32 text-right shrink-0">
                <p className="font-ui text-[10px] text-muted">{new Date(order.startDate).toLocaleDateString()}</p>
                <p className="font-ui text-[10px] text-muted">→ {new Date(order.endDate).toLocaleDateString()}</p>
              </div>
              {/* Status change */}
              {canEdit && (
                <select
                  value={order.status}
                  onChange={(e) => onStatusChange(order.id, e.target.value)}
                  className="border border-dark/20 rounded px-2 py-1 font-ui text-xs text-dark bg-white focus:outline-none focus:border-gold"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab({ canApprove }) {
  const { data: orders = [], isLoading } = useReplenishmentOrders();
  const approveOrder = useApproveReplenishment();
  const dispatchOrder = useDispatchReplenishment();
  const addToast = useToastStore((s) => s.addToast);

  const handleApprove = async (id) => {
    try {
      await approveOrder.mutateAsync(id);
      addToast('Order approved', 'success');
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleDispatch = async (id) => {
    try {
      await dispatchOrder.mutateAsync({ orderId: id });
      addToast('Order dispatched', 'success');
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  if (isLoading) return <div className="p-8 text-center font-ui text-sm text-muted">Loading orders…</div>;

  return (
    <div className="overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dark/10">
            {['Item', 'Location', 'Quantity', 'Auto', 'Status', 'Actions'].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-ui text-[10px] text-muted uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-dark/5 hover:bg-cream/30">
              <td className="px-4 py-3 font-ui text-xs text-dark">{o.itemName ?? o.itemId}</td>
              <td className="px-4 py-3 font-ui text-xs text-muted">{o.locationId}</td>
              <td className="px-4 py-3 font-ui text-xs text-dark font-semibold">{o.quantity?.toLocaleString()}</td>
              <td className="px-4 py-3">
                <span className={`font-ui text-[10px] px-2 py-0.5 rounded ${o.isAutomatic ? 'bg-info/20 text-info' : 'bg-mid/20 text-mid'}`}>
                  {o.isAutomatic ? 'Auto' : 'Manual'}
                </span>
              </td>
              <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {canApprove && o.status === 'PENDING' && (
                    <Button size="xs" variant="outline" onClick={() => handleApprove(o.id)}>Approve</Button>
                  )}
                  {canApprove && o.status === 'HUMAN_APPROVED' && (
                    <Button size="xs" variant="gold" onClick={() => handleDispatch(o.id)}>Dispatch</Button>
                  )}
                  {o.status === 'DISPATCHED' && <span className="font-ui text-[10px] text-success">Dispatched ✓</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── New Plan Drawer ──────────────────────────────────────────────────────────

function NewPlanDrawer({ open, onClose }) {
  const [demandPlanId, setDemandPlanId] = useState('');
  const [name, setName] = useState('');
  const generatePlan = useGenerateSupplyPlan();
  const addToast = useToastStore((s) => s.addToast);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!demandPlanId.trim()) return addToast('Demand Plan ID is required', 'error');
    try {
      await generatePlan.mutateAsync({ demandPlanId: demandPlanId.trim(), name: name.trim() || undefined });
      addToast('Supply plan generated', 'success');
      onClose();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-dark/40" onClick={onClose} />
      <div className="w-96 bg-white shadow-2xl flex flex-col">
        <div className="p-6 border-b border-dark/10 flex items-center justify-between">
          <h3 className="font-ui text-sm font-semibold text-dark">Generate Supply Plan</h3>
          <button onClick={onClose} className="text-muted hover:text-dark text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
          <div>
            <label className="block font-ui text-xs text-muted mb-1">Demand Plan ID</label>
            <input
              className="w-full border border-dark/20 rounded px-3 py-2 font-ui text-sm focus:outline-none focus:border-gold"
              placeholder="Enter approved demand plan ID"
              value={demandPlanId}
              onChange={(e) => setDemandPlanId(e.target.value)}
            />
            <p className="font-ui text-[10px] text-muted mt-1">Must be an APPROVED demand plan.</p>
          </div>
          <div>
            <label className="block font-ui text-xs text-muted mb-1">Plan Name (optional)</label>
            <input
              className="w-full border border-dark/20 rounded px-3 py-2 font-ui text-sm focus:outline-none focus:border-gold"
              placeholder="e.g. Q2 2026 Supply Plan"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button type="submit" variant="gold" size="md" className="w-full" disabled={generatePlan.isPending}>
            {generatePlan.isPending ? 'Generating…' : 'Generate Plan'}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = ['MRP Grid', 'Production Board', 'Orders'];

export default function SupplyPlanningPage() {
  const { user } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const [activeTab, setActiveTab] = useState('MRP Grid');
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const canEdit    = PLANNER_ROLES.includes(user?.role);
  const canApprove = APPROVER_ROLES.includes(user?.role);

  const { data: plans = [], isLoading: plansLoading } = useSupplyPlans();
  const activePlanId = selectedPlanId ?? plans[0]?.id ?? 'mock-sp-01';

  const { data: plan, isLoading: planLoading } = useSupplyPlanDetail(activePlanId);
  const { data: productionOrders = [] } = useProductionOrders(activePlanId);
  const { data: capacityData = [] } = useCapacityUtilisation();

  const updateRows   = useUpdateSupplyRows(activePlanId);
  const releasePlan  = useReleaseSupplyPlan();
  const updateStatus = useUpdateProductionStatus();

  const handleSaveRows = async (edits) => {
    try {
      await updateRows.mutateAsync(edits);
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleRelease = async () => {
    if (!activePlanId) return;
    try {
      await releasePlan.mutateAsync(activePlanId);
      addToast('Supply plan released', 'success');
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateStatus.mutateAsync({ orderId, status });
      addToast('Order status updated', 'success');
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-full">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-ui text-xl font-semibold text-dark">Supply Planning</h1>
            <p className="font-body text-sm text-muted mt-0.5">MRP / MPS / DRP — Concurrent supply execution</p>
          </div>
          <div className="flex items-center gap-3">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
                + Generate Plan
              </Button>
            )}
            {canApprove && plan?.status === 'DRAFT' && (
              <Button variant="gold" size="sm" onClick={handleRelease} disabled={releasePlan.isPending}>
                {releasePlan.isPending ? 'Releasing…' : 'Release Plan'}
              </Button>
            )}
          </div>
        </div>

        {/* Plan selector */}
        <div className="mb-5 flex items-center gap-3">
          <label className="font-ui text-xs text-muted">Active Plan:</label>
          {plansLoading ? (
            <div className="h-8 w-48 bg-dark/5 rounded animate-pulse" />
          ) : (
            <select
              className="border border-dark/20 rounded px-3 py-1.5 font-ui text-xs text-dark bg-white focus:outline-none focus:border-gold"
              value={activePlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — <StatusBadge status={p.status} /></option>
              ))}
              {plans.length === 0 && <option value="mock-sp-01">Supply Plan — Auto (Mock)</option>}
            </select>
          )}
          {plan && <StatusBadge status={plan.status} />}
        </div>

        {/* Capacity summary strip */}
        {capacityData.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {capacityData.map((wc) => (
              <div key={wc.workCenterId} className="bg-white border border-dark/10 rounded-lg p-3">
                <p className="font-ui text-[10px] text-muted uppercase tracking-wider truncate">{wc.workCenterName}</p>
                <div className="flex items-end justify-between mt-1">
                  <p className={`font-ui text-lg font-bold ${wc.utilisationPct > 90 ? 'text-danger' : wc.utilisationPct > 75 ? 'text-warning' : 'text-success'}`}>
                    {wc.utilisationPct}%
                  </p>
                  <p className="font-ui text-[10px] text-muted">utilised</p>
                </div>
                <div className="mt-1.5 h-1 bg-dark/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${wc.utilisationPct > 90 ? 'bg-danger' : wc.utilisationPct > 75 ? 'bg-warning' : 'bg-success'}`}
                    style={{ width: `${wc.utilisationPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white border border-dark/10 rounded-[12px] overflow-hidden">
          <div className="flex border-b border-dark/10">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3.5 font-ui text-xs font-medium uppercase tracking-wider transition-colors ${
                  activeTab === tab
                    ? 'text-gold border-b-2 border-gold'
                    : 'text-muted hover:text-dark'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {planLoading ? (
              <div className="p-8 text-center font-ui text-sm text-muted">Loading plan…</div>
            ) : activeTab === 'MRP Grid' ? (
              <MRPGrid plan={plan} canEdit={canEdit} onSaveEdits={handleSaveRows} />
            ) : activeTab === 'Production Board' ? (
              <div>
                {/* Capacity rows */}
                {capacityData.length > 0 && (
                  <div className="p-4 border-b border-dark/10">
                    <p className="font-ui text-xs font-semibold text-dark mb-3 uppercase tracking-wider">Capacity Utilisation</p>
                    {capacityData.map((wc) => <CapacityRow key={wc.workCenterId} wc={wc} />)}
                  </div>
                )}
                <ProductionBoard
                  orders={productionOrders}
                  canEdit={canEdit}
                  onStatusChange={handleStatusChange}
                />
              </div>
            ) : (
              <OrdersTab canApprove={canApprove} />
            )}
          </div>
        </div>
      </div>

      <NewPlanDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </AppLayout>
  );
}
