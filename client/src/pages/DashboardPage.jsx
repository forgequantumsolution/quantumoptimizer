import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useKPIs, useAccuracyTrend, useSkuStatus } from '../hooks/useDashboard';
import { useAlerts, useResolveAlert } from '../hooks/useAlerts';
import AppLayout from '../components/layout/AppLayout';
import KPICard from '../components/ui/KPICard';
import AlertItem from '../components/ui/AlertItem';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';

// Fallback mock data for when API is offline
const mockKPIs = {
  forecastAccuracy: 94.3,
  inventoryValue: '₹4.2 Cr',
  autoReplenishedOrders: 1284,
  activeAlerts: 23,
  criticalAlerts: 3,
};

const mockAccuracyTrend = [
  { month: 'Jan', lstm: 88.4, xgboost: 85.2, prophet: 82.1 },
  { month: 'Feb', lstm: 89.1, xgboost: 86.0, prophet: 83.5 },
  { month: 'Mar', lstm: 90.3, xgboost: 87.4, prophet: 84.8 },
  { month: 'Apr', lstm: 91.0, xgboost: 88.1, prophet: 85.9 },
  { month: 'May', lstm: 91.8, xgboost: 89.0, prophet: 86.7 },
  { month: 'Jun', lstm: 92.4, xgboost: 89.8, prophet: 87.3 },
  { month: 'Jul', lstm: 92.9, xgboost: 90.3, prophet: 87.9 },
  { month: 'Aug', lstm: 93.2, xgboost: 90.8, prophet: 88.2 },
  { month: 'Sep', lstm: 93.7, xgboost: 91.1, prophet: 88.6 },
  { month: 'Oct', lstm: 94.0, xgboost: 91.5, prophet: 88.9 },
  { month: 'Nov', lstm: 94.1, xgboost: 91.7, prophet: 89.1 },
  { month: 'Dec', lstm: 94.3, xgboost: 91.8, prophet: 89.3 },
];

const mockSkuStatus = [
  { id: '1', name: 'Paracetamol 500mg', category: 'Analgesics', stockDays: 34, status: 'HEALTHY', forecastDemand: 8200 },
  { id: '2', name: 'Amoxicillin 250mg', category: 'Antibiotics', stockDays: 14, status: 'REORDER', forecastDemand: 5400 },
  { id: '3', name: 'Ibuprofen 400mg', category: 'Analgesics', stockDays: 5, status: 'CRITICAL', forecastDemand: 6100 },
  { id: '4', name: 'Metformin 500mg', category: 'Diabetes', stockDays: 28, status: 'HEALTHY', forecastDemand: 4300 },
  { id: '5', name: 'Omeprazole 20mg', category: 'GI', stockDays: 18, status: 'REORDER', forecastDemand: 3800 },
  { id: '6', name: 'Azithromycin 500mg', category: 'Antibiotics', stockDays: 7, status: 'CRITICAL', forecastDemand: 2900 },
];

const mockAlerts = [
  { id: '1', severity: 'CRITICAL', title: 'Stockout Risk — Ibuprofen 400mg', message: 'Current stock will run out in 5 days based on current demand.', createdAt: new Date().toISOString() },
  { id: '2', severity: 'CRITICAL', title: 'Expiry Alert — Batch #2241', message: 'Batch expires in 14 days. Redistribution recommended.', createdAt: new Date().toISOString() },
  { id: '3', severity: 'WARNING', title: 'Reorder Point — Amoxicillin 250mg', message: '14 days stock remaining. Replenishment PO not yet approved.', createdAt: new Date().toISOString() },
  { id: '4', severity: 'INFO', title: 'AI Plan Ready', message: 'New replenishment plan generated for 12 SKUs. Review required.', createdAt: new Date().toISOString() },
];

function StatusBadge({ status }) {
  const map = { HEALTHY: 'ok', REORDER: 'warn', CRITICAL: 'risk' };
  return <Badge variant={map[status] || 'muted'}>{status}</Badge>;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [skuFilter, setSkuFilter] = useState('ALL');

  // Try to load from API; fall back to mock data
  const { data: kpis } = useKPIs();
  const { data: accuracyTrend } = useAccuracyTrend();
  const { data: skuStatus } = useSkuStatus();
  const { data: alerts } = useAlerts({ resolved: 'false' });
  const resolveAlert = useResolveAlert();

  const displayKPIs = kpis || mockKPIs;
  const displayTrend = accuracyTrend || mockAccuracyTrend;
  const displaySkus = skuStatus || mockSkuStatus;
  const displayAlerts = alerts || mockAlerts;

  const filteredSkus = skuFilter === 'ALL'
    ? displaySkus
    : displaySkus.filter((s) => s.status === skuFilter);

  const now = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });

  return (
    <AppLayout>
      <div className="p-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-[32px] font-bold text-dark leading-tight">
              Welcome back, <em className="italic text-gold">{user?.firstName}</em>
            </h1>
            <p className="font-ui text-sm text-muted mt-1">
              <span className="uppercase tracking-wider">{user?.role?.replace(/_/g, ' ')}</span>
              <span className="mx-2">·</span>
              {now}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-dark/10 rounded-[8px] px-4 py-2.5 shadow-sm">
            <span className="text-muted text-sm">🔍</span>
            <input
              className="bg-transparent font-ui text-sm text-dark placeholder:text-muted2 outline-none w-48"
              placeholder="Search SKUs, alerts..."
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            value={`${displayKPIs.forecastAccuracy}%`}
            label="Forecast Accuracy"
            trend="+2.1%"
            subtext="vs last month"
          />
          <KPICard
            value={displayKPIs.inventoryValue}
            label="Inventory Value"
            trend="-8%"
            subtext="working capital"
          />
          <KPICard
            value={displayKPIs.autoReplenishedOrders?.toLocaleString()}
            label="Auto-Replenished Orders"
            subtext="this week"
          />
          <KPICard
            value={displayKPIs.activeAlerts}
            label="Active Alerts"
            trend={displayKPIs.criticalAlerts > 0 ? `${displayKPIs.criticalAlerts} critical` : undefined}
            subtext="unresolved"
          />
        </div>

        {/* Main content: chart + alerts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Accuracy Trend Chart */}
          <div className="xl:col-span-2 bg-white border border-dark/10 rounded-[10px] p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-dark mb-1">Forecast Accuracy Trend</h2>
            <p className="font-ui text-xs text-muted mb-6">Model performance — Jan to Dec</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={displayTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,20,0.06)" />
                <XAxis dataKey="month" tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#8a8a72' }} />
                <YAxis domain={[80, 100]} tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#8a8a72' }} unit="%" />
                <Tooltip
                  contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, border: '1px solid rgba(26,26,20,0.1)', borderRadius: 6 }}
                  formatter={(v) => [`${v.toFixed(1)}%`]}
                />
                <Legend wrapperStyle={{ fontFamily: 'DM Sans', fontSize: 11 }} />
                <Line type="monotone" dataKey="lstm" name="LSTM" stroke="#b8922a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="xgboost" name="XGBoost" stroke="#3a7d5c" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="prophet" name="Prophet" stroke="#2a5a8a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Alert Feed */}
          <div className="bg-white border border-dark/10 rounded-[10px] p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-dark">Alert Feed</h2>
              <span className="font-ui text-xs text-muted">{displayAlerts.length} active</span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[280px]">
              {displayAlerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  severity={alert.severity}
                  title={alert.title}
                  message={alert.message}
                  timestamp={new Date(alert.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  onResolve={() => resolveAlert.mutate(alert.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* SKU Status Table */}
        <div className="bg-white border border-dark/10 rounded-[10px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-lg font-bold text-dark">SKU Status</h2>
              <p className="font-ui text-xs text-muted mt-0.5">{filteredSkus.length} items shown</p>
            </div>
            <div className="flex gap-2">
              {['ALL', 'CRITICAL', 'REORDER', 'HEALTHY'].map((f) => (
                <button
                  key={f}
                  onClick={() => setSkuFilter(f)}
                  className={`font-ui text-[10px] font-semibold uppercase tracking-[0.1em] px-3 py-1.5 rounded-[4px] transition-colors ${
                    skuFilter === f
                      ? 'bg-gold text-white'
                      : 'bg-cream text-muted hover:text-dark'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark/8">
                  {['SKU Name', 'Category', 'Stock Days', 'Status', 'Forecast Demand', 'Actions'].map((h) => (
                    <th key={h} className="text-left font-ui text-[10px] font-semibold uppercase tracking-[0.1em] text-muted pb-3 pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSkus.map((sku) => (
                  <tr key={sku.id} className="border-b border-dark/5 hover:bg-cream/50 transition-colors">
                    <td className="py-3.5 pr-4 font-ui text-sm font-medium text-dark">{sku.name}</td>
                    <td className="py-3.5 pr-4 font-ui text-xs text-muted">{sku.category}</td>
                    <td className="py-3.5 pr-4 font-ui text-sm text-dark font-medium">{sku.stockDays}d</td>
                    <td className="py-3.5 pr-4"><StatusBadge status={sku.status} /></td>
                    <td className="py-3.5 pr-4 font-ui text-sm text-mid">{sku.forecastDemand?.toLocaleString()} units</td>
                    <td className="py-3.5">
                      <Button variant="outline" size="sm">Approve Replenishment</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Autonomous Execution Panel */}
        <div className="mt-6 bg-dark2 rounded-[10px] p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-white">Autonomous Execution</h2>
              <p className="font-ui text-xs text-muted2 mt-1">This week's automated actions</p>
            </div>
            <div className="flex gap-8">
              {[
                { v: '1,284', l: 'Auto-POs Generated', c: 'text-gold' },
                { v: '94%', l: 'Auto-Approved', c: 'text-green' },
                { v: '6%', l: 'Human Override', c: 'text-muted2' },
              ].map((k) => (
                <div key={k.l} className="text-center">
                  <div className={`font-display text-2xl font-bold ${k.c}`}>{k.v}</div>
                  <div className="font-ui text-[10px] text-muted uppercase tracking-wider mt-1">{k.l}</div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="border-white/20 text-muted2 hover:text-white hover:border-white/40">
              View Audit Trail
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
