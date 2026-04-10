import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';
import { useToastStore } from '../store/toastStore';

const SCENARIO_TYPES = ['Promotion', 'Disruption', 'New Product', 'Seasonal'];

const MOCK_SCENARIOS = [
  { id: 's1', name: 'Diwali Promo Uplift', type: 'Promotion', status: 'Completed', results: { projectedDemandChange: '+32%', estimatedRevenuImpact: '₹3,84,000', stockoutRisk: 'MEDIUM', recommendedInventoryIncrease: '48%' } },
  { id: 's2', name: 'Monsoon Demand Shift', type: 'Seasonal', status: 'Completed', results: { projectedDemandChange: '+18%', estimatedRevenuImpact: '₹2,16,000', stockoutRisk: 'LOW', recommendedInventoryIncrease: '27%' } },
];

const BASE_DATA = [
  { month: 'Oct', baseline: 8200, scenario: null },
  { month: 'Nov', baseline: 8600, scenario: null },
  { month: 'Dec', baseline: 9100, scenario: null },
];

export default function ScenarioPlannerPage() {
  const addToast = useToastStore(s => s.addToast);
  const [scenarios, setScenarios] = useState(MOCK_SCENARIOS);
  const [creating, setCreating] = useState(false);
  const [running, setRunning] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'Promotion', uplift: 20, skus: 'All SKUs', dateRange: '30' });
  const [activeScenario, setActiveScenario] = useState(null);
  const [chartData, setChartData] = useState(BASE_DATA);

  const handleCreate = () => {
    if (!form.name) { addToast('Please enter a scenario name', 'warning'); return; }
    const newS = { id: `s${Date.now()}`, name: form.name, type: form.type, status: 'Draft', results: null };
    setScenarios(prev => [newS, ...prev]);
    setCreating(false);
    setForm({ name: '', type: 'Promotion', uplift: 20, skus: 'All SKUs', dateRange: '30' });
    addToast(`Scenario "${newS.name}" created`, 'success');
  };

  const handleRun = async (scenario) => {
    setRunning(scenario.id);
    try {
      // Simulate AI run
      await new Promise(r => setTimeout(r, 1500));
      const uplift = form.uplift || 20;
      const results = {
        projectedDemandChange: `+${uplift}%`,
        estimatedRevenuImpact: `₹${(uplift * 12000).toLocaleString()}`,
        stockoutRisk: uplift > 30 ? 'HIGH' : 'MEDIUM',
        recommendedInventoryIncrease: `${Math.round(uplift * 1.5)}%`,
      };
      setScenarios(prev => prev.map(s => s.id === scenario.id ? { ...s, status: 'Completed', results } : s));
      setActiveScenario({ ...scenario, results });
      setChartData(BASE_DATA.map((d, i) => ({ ...d, scenario: Math.round(d.baseline * (1 + uplift / 100) * (1 + i * 0.02)) })));
      addToast('Scenario simulation complete!', 'success');
    } finally {
      setRunning(null);
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-[32px] font-bold text-dark">Scenario Planner</h1>
            <p className="font-ui text-sm text-muted mt-1">Model promotions, disruptions, and seasonal peaks before they happen</p>
          </div>
          <Button variant="gold" size="md" onClick={() => setCreating(true)}>+ New Scenario</Button>
        </div>

        {/* Create form */}
        {creating && (
          <div className="bg-white border border-dark/10 rounded-[10px] p-7 shadow-sm mb-8">
            <h2 className="font-display text-lg font-bold text-dark mb-6">Configure New Scenario</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              <div className="col-span-2">
                <label className="font-ui text-[11px] font-semibold uppercase tracking-[0.1em] text-muted block mb-1.5">Scenario Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-cream border border-dark/15 rounded-[4px] px-4 py-2.5 font-ui text-sm text-dark focus:outline-none focus:border-gold" placeholder="e.g. Diwali Promo 2025" />
              </div>
              <div>
                <label className="font-ui text-[11px] font-semibold uppercase tracking-[0.1em] text-muted block mb-1.5">Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full bg-cream border border-dark/15 rounded-[4px] px-4 py-2.5 font-ui text-sm text-dark focus:outline-none">
                  {SCENARIO_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="font-ui text-[11px] font-semibold uppercase tracking-[0.1em] text-muted block mb-1.5">Uplift / Impact %</label>
                <input type="number" value={form.uplift} onChange={e => setForm({...form, uplift: Number(e.target.value)})}
                  className="w-full bg-cream border border-dark/15 rounded-[4px] px-4 py-2.5 font-ui text-sm text-dark focus:outline-none focus:border-gold" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="gold" size="sm" onClick={handleCreate}>Create Scenario</Button>
              <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="grid xl:grid-cols-3 gap-6">
          {/* Scenarios list */}
          <div className="xl:col-span-1 space-y-3">
            <h2 className="font-ui text-[10px] font-semibold uppercase tracking-[0.15em] text-muted mb-3">Saved Scenarios</h2>
            {scenarios.map(s => (
              <div key={s.id}
                onClick={() => s.results && setActiveScenario(s)}
                className={`bg-white border rounded-[10px] p-5 cursor-pointer transition-all ${activeScenario?.id === s.id ? 'border-gold shadow-md' : 'border-dark/10 hover:border-dark/20'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-ui text-sm font-semibold text-dark">{s.name}</p>
                    <p className="font-ui text-[10px] text-muted uppercase tracking-wider mt-0.5">{s.type}</p>
                  </div>
                  <Badge variant={s.status === 'Completed' ? 'ok' : 'muted'}>{s.status}</Badge>
                </div>
                {s.results ? (
                  <p className="font-ui text-xs text-green font-semibold">{s.results.projectedDemandChange} projected demand</p>
                ) : (
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleRun(s); }} disabled={running === s.id} className="mt-2">
                    {running === s.id ? 'Running...' : 'Run Simulation'}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Results panel */}
          <div className="xl:col-span-2">
            {activeScenario ? (
              <div className="bg-white border border-dark/10 rounded-[10px] p-7 shadow-sm">
                <h2 className="font-display text-xl font-bold text-dark mb-1">{activeScenario.name}</h2>
                <p className="font-ui text-xs text-muted mb-6">{activeScenario.type} · Simulation Results</p>
                {/* Impact KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  {[
                    [activeScenario.results.projectedDemandChange, 'Demand Change'],
                    [activeScenario.results.estimatedRevenuImpact, 'Revenue Impact'],
                    [activeScenario.results.stockoutRisk, 'Stockout Risk'],
                    [activeScenario.results.recommendedInventoryIncrease, 'Rec. Inv. Increase'],
                  ].map(([v, l]) => (
                    <div key={l} className="bg-cream rounded-[6px] p-4">
                      <div className="font-display text-xl font-bold text-gold">{v}</div>
                      <div className="font-ui text-[10px] text-muted mt-1">{l}</div>
                    </div>
                  ))}
                </div>
                {/* Comparison chart */}
                <h3 className="font-ui text-[11px] font-semibold uppercase tracking-wider text-muted mb-4">Baseline vs Scenario Demand</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,20,0.06)" />
                    <XAxis dataKey="month" tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#8a8a72' }} />
                    <YAxis tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#8a8a72' }} />
                    <Tooltip contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: 6 }} />
                    <Legend wrapperStyle={{ fontFamily: 'DM Sans', fontSize: 11 }} />
                    <Bar dataKey="baseline" name="Baseline" fill="#e4dfd4" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="scenario" name="Scenario" fill="#b8922a" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-cream2 border border-dark/10 rounded-[10px] h-full min-h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <p className="font-display text-2xl font-bold text-dark mb-2">Select a Scenario</p>
                  <p className="font-ui text-sm text-muted">Click a completed scenario to view results, or create a new one.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
