import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import AlertItem from '../components/ui/AlertItem';
import Button from '../components/ui/Button';
import { useAlerts, useResolveAlert } from '../hooks/useAlerts';

const MOCK_ALERTS = [
  { id: '1', severity: 'CRITICAL', title: 'Stockout Risk — Ibuprofen 400mg', message: 'Current stock will run out in 5 days based on demand trajectory.', createdAt: new Date(Date.now() - 3600000).toISOString(), category: 'STOCKOUT_RISK' },
  { id: '2', severity: 'CRITICAL', title: 'Expiry Alert — Batch #2241', message: 'Batch of Amoxicillin expires in 12 days. Redistribution recommended.', createdAt: new Date(Date.now() - 7200000).toISOString(), category: 'EXPIRY' },
  { id: '3', severity: 'CRITICAL', title: 'Supplier Delay — API Supplier', message: 'Primary supplier for Metformin has reported a 14-day delay.', createdAt: new Date(Date.now() - 10800000).toISOString(), category: 'SUPPLIER_DELAY' },
  { id: '4', severity: 'WARNING', title: 'Reorder Point — Amoxicillin 250mg', message: '14 days stock remaining. PO not yet approved.', createdAt: new Date(Date.now() - 14400000).toISOString(), category: 'STOCKOUT_RISK' },
  { id: '5', severity: 'WARNING', title: 'Overstock Risk — Vitamin D3 60K', message: 'Current stock = 95 days demand. Consider redistribution.', createdAt: new Date(Date.now() - 18000000).toISOString(), category: 'OVERSTOCK' },
  { id: '6', severity: 'WARNING', title: 'Low Stock — Omeprazole 20mg', message: 'Stock at 18 days with 12% demand uptick forecast next week.', createdAt: new Date(Date.now() - 21600000).toISOString(), category: 'STOCKOUT_RISK' },
  { id: '7', severity: 'INFO', title: 'AI Replenishment Plan Ready', message: 'New plan for 12 SKUs covering 30-day horizon. Pending review.', createdAt: new Date(Date.now() - 25200000).toISOString(), category: 'AI_PLAN_READY' },
  { id: '8', severity: 'INFO', title: 'Forecast Model Updated', message: 'Monthly retraining complete. Accuracy improved by +1.4%.', createdAt: new Date(Date.now() - 28800000).toISOString(), category: 'AI_PLAN_READY' },
  { id: '9', severity: 'INFO', title: 'Transfer Recommendation', message: 'Transfer 2,000 units of Paracetamol from Delhi to Bangalore.', createdAt: new Date(Date.now() - 32400000).toISOString(), category: 'OVERSTOCK' },
  { id: '10', severity: 'WARNING', title: 'Expiry Warning — Prednisolone 5mg', message: 'Batch expiring in 21 days with 45% remaining. Consider disposal.', createdAt: new Date(Date.now() - 36000000).toISOString(), category: 'EXPIRY' },
];

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selected, setSelected] = useState([]);

  const { data: alerts } = useAlerts({ resolved: 'false' });
  const resolveAlert = useResolveAlert();
  const displayAlerts = alerts || MOCK_ALERTS;

  const filtered = severityFilter === 'ALL'
    ? displayAlerts
    : displayAlerts.filter(a => a.severity === severityFilter);

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const counts = { CRITICAL: displayAlerts.filter(a => a.severity === 'CRITICAL').length, WARNING: displayAlerts.filter(a => a.severity === 'WARNING').length, INFO: displayAlerts.filter(a => a.severity === 'INFO').length };

  return (
    <AppLayout>
      <div className="p-8 max-w-[1200px] mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-[32px] font-bold text-dark">Alert Management</h1>
          <p className="font-ui text-sm text-muted mt-1">Monitor and resolve supply chain alerts across your network</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[['CRITICAL', counts.CRITICAL, 'bg-danger-light text-danger'], ['WARNING', counts.WARNING, 'bg-amber-light text-[#b45309]'], ['INFO', counts.INFO, 'bg-blue-light text-blue']].map(([sev, count, cls]) => (
            <div key={sev} className={`${cls} rounded-[10px] p-5 border border-current/20`}>
              <div className="font-display text-3xl font-bold">{count}</div>
              <div className="font-ui text-[11px] font-semibold uppercase tracking-wider mt-1">{sev}</div>
            </div>
          ))}
        </div>

        {/* Filters + bulk */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map(f => (
              <button key={f} onClick={() => setSeverityFilter(f)}
                className={`font-ui text-[10px] font-semibold uppercase tracking-[0.1em] px-3 py-1.5 rounded-[4px] transition-colors ${severityFilter === f ? 'bg-gold text-white' : 'bg-cream text-muted hover:text-dark'}`}>
                {f}
              </button>
            ))}
          </div>
          {selected.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => { selected.forEach(id => resolveAlert.mutate(id)); setSelected([]); }}>
              Resolve {selected.length} selected
            </Button>
          )}
        </div>

        {/* Alert list */}
        <div className="space-y-3">
          {filtered.map(alert => (
            <div key={alert.id} className="flex items-start gap-3">
              <input type="checkbox" checked={selected.includes(alert.id)} onChange={() => toggle(alert.id)}
                className="mt-5 accent-gold" />
              <div className="flex-1">
                <AlertItem
                  severity={alert.severity}
                  title={alert.title}
                  message={alert.message}
                  timestamp={new Date(alert.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  onResolve={() => resolveAlert.mutate(alert.id)}
                />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 font-ui text-muted">No alerts matching this filter.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
