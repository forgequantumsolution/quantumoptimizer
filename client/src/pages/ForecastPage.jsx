import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useToastStore } from '../store/toastStore';
import { useForecastForSku, useOverrideForecast, useModelPerformance } from '../hooks/useForecast';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

// SKUs populated from seed data
const SKU_LIST = [
  { id: 'WH-001', skuCode: 'PH001', name: 'Paracetamol 500mg', category: 'Analgesics', warehouseId: 'WH-001' },
  { id: 'WH-002', skuCode: 'PH002', name: 'Amoxicillin 250mg', category: 'Antibiotics', warehouseId: 'WH-001' },
  { id: 'WH-003', skuCode: 'PH003', name: 'Ibuprofen 400mg', category: 'Analgesics', warehouseId: 'WH-001' },
  { id: 'WH-004', skuCode: 'PH004', name: 'Metformin 500mg', category: 'Diabetes', warehouseId: 'WH-001' },
  { id: 'WH-005', skuCode: 'PH005', name: 'Omeprazole 20mg', category: 'GI', warehouseId: 'WH-001' },
];

const HORIZONS = [
  { label: '1W', days: 7 },
  { label: '2W', days: 14 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
];

// Build chart data from ensemble forecast result
function buildChartData(forecastData) {
  if (!forecastData) return [];
  const forecasts = forecastData.ensemble?.forecasts || forecastData || [];
  return forecasts.map((f) => ({
    date: new Date(f.date || f.forecastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    forecast: f.point ?? f.pointForecast,
    lower80: f.lower80,
    upper80: f.upper80,
    lower95: f.lower95,
    upper95: f.upper95,
  }));
}

function ModelScoreCard({ models }) {
  if (!models || models.length === 0) return null;
  const MODEL_COLORS = { HOLT_WINTERS: '#b8922a', SARIMA: '#3a7d5c', XGBOOST: '#2a5a8a', ENSEMBLE: '#8b5cf6' };
  return (
    <div className="bg-white border border-dark/10 rounded-[10px] p-5 shadow-sm">
      <h3 className="font-ui text-[10px] font-semibold uppercase tracking-[0.15em] text-muted mb-4">
        Model performance
      </h3>
      <div className="space-y-3">
        {models.map((m) => (
          <div key={m.model}>
            <div className="flex justify-between mb-1">
              <span className="font-ui text-xs text-mid">{m.model.replace('_', '-')}</span>
              <span className="font-ui text-xs font-semibold" style={{ color: MODEL_COLORS[m.model] || '#b8922a' }}>
                MAPE {m.mape?.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 bg-cream3 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.max(5, 100 - (m.mape || 10))}%`, backgroundColor: MODEL_COLORS[m.model] || '#b8922a' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DriverCard({ drivers, confidence }) {
  if (!drivers || drivers.length === 0) return null;
  return (
    <div className="bg-amber-light border border-gold/20 rounded-[10px] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-ui text-[10px] font-semibold uppercase tracking-[0.15em] text-dark">
          Top forecast drivers
        </h3>
        <Badge variant="warn">{((confidence || 0.85) * 100).toFixed(0)}% confidence</Badge>
      </div>
      <div className="space-y-2">
        {drivers.filter(Boolean).map((d, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="font-display text-gold font-bold text-sm w-5 shrink-0">{i + 1}</span>
            <span className="font-body text-sm text-dark">{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ForecastPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [selectedSku, setSelectedSku] = useState(SKU_LIST[0]);
  const [horizon, setHorizon] = useState(14);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideForm, setOverrideForm] = useState({ value: '', note: '' });
  const [selectedForecastId, setSelectedForecastId] = useState(null);
  const [showCI, setShowCI] = useState('80'); // '80' | '95' | 'none'

  const overrideMutation = useOverrideForecast();
  const { data: modelPerf } = useModelPerformance();

  // Fetch real forecast from API (falls back gracefully if API is down)
  const { data: forecastData, isLoading, refetch } = useForecastForSku(
    selectedSku.skuCode,
    selectedSku.warehouseId,
    horizon
  );

  const chartData = buildChartData(forecastData);
  const drivers = forecastData?.ensemble?.drivers || forecastData?.drivers || [];
  const confidence = forecastData?.ensemble?.confidence || forecastData?.confidenceScore || 0.87;
  const models = forecastData?.models || modelPerf || [];

  const avgForecast = chartData.length > 0
    ? Math.round(chartData.reduce((s, d) => s + (d.forecast || 0), 0) / chartData.length)
    : 0;

  const handleOverrideSubmit = async () => {
    const val = parseFloat(overrideForm.value);
    if (isNaN(val) || val < 0) { addToast('Enter a valid non-negative number', 'error'); return; }
    if (!overrideForm.note.trim()) { addToast('Justification note is required', 'error'); return; }
    try {
      await overrideMutation.mutateAsync({
        id: selectedForecastId || 'live-0',
        overrideValue: val,
        overrideNote: overrideForm.note.trim(),
      });
      addToast('Forecast override saved and logged to audit trail', 'success');
      setShowOverride(false);
      setOverrideForm({ value: '', note: '' });
    } catch {
      addToast('Override failed — check connection', 'error');
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-[32px] font-bold text-dark">Demand sensing</h1>
            <p className="font-ui text-sm text-muted mt-1">
              AI ensemble forecasts with confidence bands and driver explanations
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant={showOverride ? 'danger' : 'outline'} size="sm"
              onClick={() => setShowOverride(v => !v)}>
              {showOverride ? 'Cancel override' : 'Override forecast'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
            <Button variant="ghost" size="sm">Export CSV</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left sidebar: SKU selector */}
          <div className="space-y-4">
            <div className="bg-white border border-dark/10 rounded-[10px] p-5 shadow-sm">
              <h2 className="font-ui text-[10px] font-semibold uppercase tracking-[0.15em] text-muted mb-4">Select SKU</h2>
              <div className="space-y-1.5">
                {SKU_LIST.map((sku) => (
                  <button key={sku.skuCode} onClick={() => setSelectedSku(sku)}
                    className={`w-full text-left px-3 py-2.5 rounded-[6px] transition-colors ${selectedSku.skuCode === sku.skuCode ? 'bg-gold/10 border border-gold/20' : 'hover:bg-cream'}`}>
                    <p className={`font-ui text-xs font-semibold ${selectedSku.skuCode === sku.skuCode ? 'text-gold' : 'text-dark'}`}>{sku.name}</p>
                    <p className="font-ui text-[10px] text-muted mt-0.5">{sku.category}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Driver card */}
            <DriverCard drivers={drivers} confidence={confidence} />

            {/* Model scores */}
            <ModelScoreCard models={models} />
          </div>

          {/* Main forecast area */}
          <div className="xl:col-span-3 space-y-5">
            <div className="bg-white border border-dark/10 rounded-[10px] p-6 shadow-sm">
              {/* Toolbar */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-dark">{selectedSku.name}</h2>
                  <p className="font-ui text-xs text-muted mt-0.5">
                    {selectedSku.category} · AI Ensemble (Holt-Winters + SARIMA + XGBoost)
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  <div className="flex gap-1">
                    {HORIZONS.map((h) => (
                      <button key={h.days} onClick={() => setHorizon(h.days)}
                        className={`font-ui text-[10px] font-semibold uppercase tracking-[0.1em] px-3 py-1.5 rounded-[4px] transition-colors ${horizon === h.days ? 'bg-gold text-white' : 'bg-cream text-muted hover:text-dark'}`}>
                        {h.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {[['80', '80% CI'], ['95', '95% CI'], ['none', 'None']].map(([v, l]) => (
                      <button key={v} onClick={() => setShowCI(v)}
                        className={`font-ui text-[10px] font-semibold px-2.5 py-1.5 rounded-[4px] transition-colors ${showCI === v ? 'bg-dark text-white' : 'bg-cream text-muted hover:text-dark'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* KPI strip */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  [`${avgForecast.toLocaleString()} units/day`, 'Avg daily forecast'],
                  [`${((confidence || 0.87) * 100).toFixed(0)}%`, 'Model confidence'],
                  [isLoading ? '—' : `${chartData.length} days`, 'Forecast horizon'],
                ].map(([v, l]) => (
                  <div key={l} className="bg-cream rounded-[6px] p-3">
                    <div className="font-display text-xl font-bold text-gold">{v}</div>
                    <div className="font-ui text-[10px] text-muted mt-1">{l}</div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              {isLoading ? (
                <div className="h-[280px] flex items-center justify-center">
                  <div className="font-ui text-sm text-muted">Running AI models…</div>
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="ci95" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#b8922a" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#b8922a" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ci80" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#b8922a" stopOpacity={0.14} />
                        <stop offset="95%" stopColor="#b8922a" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,20,0.06)" />
                    <XAxis dataKey="date" tick={{ fontFamily: 'DM Sans', fontSize: 10, fill: '#8a8a72' }} />
                    <YAxis tick={{ fontFamily: 'DM Sans', fontSize: 10, fill: '#8a8a72' }} />
                    <Tooltip
                      contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: 6, border: '1px solid rgba(26,26,20,0.1)' }}
                      formatter={(v, name) => [v?.toLocaleString(), name]}
                    />
                    {showCI === '95' && (
                      <>
                        <Area type="monotone" dataKey="upper95" stroke="transparent" fill="url(#ci95)" />
                        <Area type="monotone" dataKey="lower95" stroke="transparent" fill="#fff" />
                      </>
                    )}
                    {(showCI === '80' || showCI === '95') && (
                      <>
                        <Area type="monotone" dataKey="upper80" stroke="transparent" fill="url(#ci80)" />
                        <Area type="monotone" dataKey="lower80" stroke="transparent" fill="#fff" />
                      </>
                    )}
                    <Area type="monotone" dataKey="forecast" stroke="#b8922a" strokeWidth={2.5}
                      fill="transparent" dot={false} name="AI forecast" strokeDasharray="none" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center bg-cream rounded-[8px]">
                  <div className="text-center">
                    <p className="font-display text-lg font-bold text-dark">No forecast data</p>
                    <p className="font-ui text-sm text-muted mt-1">Sync a data connector to generate forecasts</p>
                  </div>
                </div>
              )}
            </div>

            {/* Override panel (inline, no modal) */}
            {showOverride && (
              <div className="bg-amber-light border border-gold/30 rounded-[10px] p-6">
                <h3 className="font-display text-base font-bold text-dark mb-1">Override AI forecast</h3>
                <p className="font-ui text-xs text-muted mb-5">
                  This override will be written to the audit trail with your user ID and timestamp.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="font-ui text-[11px] font-semibold uppercase tracking-[0.1em] text-muted block mb-1.5">
                      Override value (units/day)
                    </label>
                    <input
                      type="number" min="0"
                      value={overrideForm.value}
                      onChange={(e) => setOverrideForm({ ...overrideForm, value: e.target.value })}
                      className="w-full bg-white border border-dark/15 rounded-[4px] px-4 py-2.5 font-ui text-sm text-dark focus:outline-none focus:border-gold"
                      placeholder="e.g. 9500"
                    />
                  </div>
                  <div>
                    <label className="font-ui text-[11px] font-semibold uppercase tracking-[0.1em] text-muted block mb-1.5">
                      Justification (required)
                    </label>
                    <input
                      type="text"
                      value={overrideForm.note}
                      onChange={(e) => setOverrideForm({ ...overrideForm, note: e.target.value })}
                      className="w-full bg-white border border-dark/15 rounded-[4px] px-4 py-2.5 font-ui text-sm text-dark focus:outline-none focus:border-gold"
                      placeholder="e.g. Promo campaign week starting 15th"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="gold" size="sm" onClick={handleOverrideSubmit}
                    disabled={overrideMutation.isPending}>
                    {overrideMutation.isPending ? 'Saving…' : 'Submit override'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setShowOverride(false); setOverrideForm({ value: '', note: '' }); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
