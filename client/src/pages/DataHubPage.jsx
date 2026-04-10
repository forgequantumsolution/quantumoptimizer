import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/layout/AppLayout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import api from '../services/api';

// ─── Mock fallback for when API is offline ───
const MOCK_CONNECTORS = [
  { name: 'ERP Connector', sourceType: 'ERP', health: 'healthy', lastSyncAt: new Date(Date.now() - 300000).toISOString() },
  { name: 'CRM Connector', sourceType: 'CRM', health: 'healthy', lastSyncAt: new Date(Date.now() - 900000).toISOString() },
  { name: 'WMS / 3PL Connector', sourceType: 'WMS', health: 'healthy', lastSyncAt: new Date(Date.now() - 1800000).toISOString() },
  { name: 'POS Connector', sourceType: 'POS', health: 'degraded', lastSyncAt: new Date(Date.now() - 3600000).toISOString() },
  { name: 'IoT / Sensor Feed', sourceType: 'IOT', health: 'healthy', lastSyncAt: new Date(Date.now() - 600000).toISOString() },
  { name: 'Market Data (Weather & External)', sourceType: 'MARKET', health: 'healthy', lastSyncAt: new Date(Date.now() - 7200000).toISOString() },
];

const MOCK_ISSUES = [
  { id: '1', source: 'ERP Connector', sourceType: 'ERP', field: 'quantity', issueType: 'out_of_range', rawValue: '-500', resolved: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: '2', source: 'POS Connector', sourceType: 'POS', field: 'date', issueType: 'invalid_format', rawValue: '32/13/2025', resolved: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', source: 'WMS / 3PL Connector', sourceType: 'WMS', field: 'item_id', issueType: 'missing_field', rawValue: '', resolved: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
];

const HEALTH_VARIANT = { healthy: 'ok', degraded: 'warn', error: 'risk', unknown: 'muted' };
const SOURCE_ICONS = { ERP: '⚙', CRM: '👥', WMS: '🏭', POS: '🛒', IOT: '📡', MARKET: '🌤' };

function timeAgo(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ConnectorCard({ connector, onSync, syncing }) {
  return (
    <div className="bg-white border border-dark/10 rounded-[10px] p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-cream2 flex items-center justify-center text-xl">
            {SOURCE_ICONS[connector.sourceType] || '🔌'}
          </div>
          <div>
            <p className="font-ui text-sm font-semibold text-dark">{connector.name}</p>
            <p className="font-ui text-[10px] text-muted uppercase tracking-wider mt-0.5">{connector.sourceType}</p>
          </div>
        </div>
        <Badge variant={HEALTH_VARIANT[connector.health] || 'muted'}>{connector.health}</Badge>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div>
          <p className="font-ui text-[10px] text-muted uppercase tracking-wider">Last sync</p>
          <p className="font-ui text-xs text-dark font-medium mt-0.5">{timeAgo(connector.lastSyncAt)}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSync(connector.name)}
          disabled={syncing === connector.name}
        >
          {syncing === connector.name ? 'Syncing...' : 'Sync now'}
        </Button>
      </div>
    </div>
  );
}

// ─── Inline drawer for quality issues ───
function QualityDrawer({ issues, onResolve, resolving }) {
  const [showResolved, setShowResolved] = useState(false);
  const filtered = showResolved ? issues : issues.filter(i => !i.resolved);

  const ISSUE_LABELS = {
    missing_field: 'Missing field',
    out_of_range: 'Out of range',
    duplicate_key: 'Duplicate key',
    invalid_format: 'Invalid format',
  };

  return (
    <div className="mt-8 bg-white border border-dark/10 rounded-[10px] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-dark/8">
        <div>
          <h2 className="font-display text-lg font-bold text-dark">Data quality issues</h2>
          <p className="font-ui text-xs text-muted mt-0.5">{filtered.length} {showResolved ? 'total' : 'unresolved'} issues</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 font-ui text-xs text-muted cursor-pointer">
            <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} className="accent-gold" />
            Show resolved
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="font-ui text-sm text-muted">No issues found. Data quality looks good.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark/8">
                {['Source', 'Field', 'Issue type', 'Raw value', 'Detected', 'Status', ''].map(h => (
                  <th key={h} className="text-left font-ui text-[10px] font-semibold uppercase tracking-[0.1em] text-muted px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(issue => (
                <tr key={issue.id} className={`border-b border-dark/5 hover:bg-cream/40 transition-colors ${issue.resolved ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3 font-ui text-xs text-dark font-medium">{issue.source}</td>
                  <td className="px-5 py-3 font-mono text-xs text-mid">{issue.field}</td>
                  <td className="px-5 py-3">
                    <Badge variant={issue.issueType === 'out_of_range' || issue.issueType === 'missing_field' ? 'risk' : 'warn'}>
                      {ISSUE_LABELS[issue.issueType] || issue.issueType}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-danger">{issue.rawValue || '—'}</td>
                  <td className="px-5 py-3 font-ui text-xs text-muted">{timeAgo(issue.createdAt)}</td>
                  <td className="px-5 py-3">
                    <Badge variant={issue.resolved ? 'ok' : 'warn'}>{issue.resolved ? 'Resolved' : 'Open'}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    {!issue.resolved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onResolve(issue.id)}
                        disabled={resolving === issue.id}
                      >
                        {resolving === issue.id ? '...' : 'Resolve'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function DataHubPage() {
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(null);
  const [resolving, setResolving] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  const { data: connectors } = useQuery({
    queryKey: ['integrations', 'connectors'],
    queryFn: async () => {
      const res = await api.get('/integrations');
      return res.data.data;
    },
    staleTime: 30000,
  });

  const { data: issues } = useQuery({
    queryKey: ['integrations', 'quality-issues'],
    queryFn: async () => {
      const res = await api.get('/integrations/quality-issues');
      return res.data.data;
    },
    staleTime: 30000,
  });

  const displayConnectors = connectors || MOCK_CONNECTORS;
  const displayIssues = issues || MOCK_ISSUES;

  const handleSync = async (connectorName) => {
    setSyncing(connectorName);
    setSyncResult(null);
    try {
      const res = await api.post('/integrations/sync', { connectorName });
      setSyncResult(res.data.data);
      qc.invalidateQueries({ queryKey: ['integrations'] });
    } catch (err) {
      setSyncResult({ error: err.response?.data?.error?.message || 'Sync failed' });
    } finally {
      setSyncing(null);
    }
  };

  const handleResolve = async (issueId) => {
    setResolving(issueId);
    try {
      await api.patch(`/integrations/quality-issues/${issueId}/resolve`);
      qc.invalidateQueries({ queryKey: ['integrations', 'quality-issues'] });
    } finally {
      setResolving(null);
    }
  };

  // Summary metrics
  const healthyCnt = displayConnectors.filter(c => c.health === 'healthy').length;
  const openIssues = displayIssues.filter(i => !i.resolved).length;
  const qualityScore = displayIssues.length > 0
    ? Math.round(((displayIssues.length - openIssues) / displayIssues.length) * 100)
    : 100;

  return (
    <AppLayout>
      <div className="p-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-[32px] font-bold text-dark">Data hub</h1>
            <p className="font-ui text-sm text-muted mt-1">
              Monitor connectors, track data quality, and trigger manual syncs
            </p>
          </div>
          <Button
            variant="gold"
            size="md"
            onClick={() => displayConnectors.forEach(c => handleSync(c.name))}
            disabled={!!syncing}
          >
            Sync all connectors
          </Button>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            [`${healthyCnt} / ${displayConnectors.length}`, 'Connectors healthy', healthyCnt === displayConnectors.length ? 'text-green' : 'text-[#b45309]'],
            [`${openIssues}`, 'Open quality issues', openIssues > 0 ? 'text-danger' : 'text-green'],
            [`${qualityScore}%`, 'Overall data quality', qualityScore >= 95 ? 'text-green' : qualityScore >= 80 ? 'text-[#b45309]' : 'text-danger'],
          ].map(([v, l, c]) => (
            <div key={l} className="bg-white border border-dark/10 rounded-[10px] p-5 shadow-sm">
              <div className={`font-display text-[28px] font-bold leading-none mb-1 ${c}`}>{v}</div>
              <div className="font-ui text-[10px] uppercase tracking-wider text-muted">{l}</div>
            </div>
          ))}
        </div>

        {/* Sync result notification */}
        {syncResult && (
          <div className={`mb-6 rounded-[8px] p-4 border font-ui text-sm ${
            syncResult.error
              ? 'bg-danger-light border-danger/20 text-danger'
              : 'bg-green-light border-green/20 text-green'
          }`}>
            {syncResult.error
              ? `Sync failed: ${syncResult.error}`
              : `Sync complete — ${syncResult.inserted} records inserted, quality score ${syncResult.qualityScore}%`
            }
          </div>
        )}

        {/* Connector tiles */}
        <h2 className="font-ui text-[10px] font-semibold uppercase tracking-[0.15em] text-muted mb-4">
          Connectors ({displayConnectors.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
          {displayConnectors.map(connector => (
            <ConnectorCard
              key={connector.name}
              connector={connector}
              onSync={handleSync}
              syncing={syncing}
            />
          ))}
        </div>

        {/* Quality issues drawer */}
        <QualityDrawer
          issues={displayIssues}
          onResolve={handleResolve}
          resolving={resolving}
        />
      </div>
    </AppLayout>
  );
}
