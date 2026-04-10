import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const MOCK_USERS = [
  { id: '1', name: 'Arjun Mehta', email: 'admin@pharma.com', role: 'SUPER_ADMIN', status: 'Active', lastLogin: '2 hours ago' },
  { id: '2', name: 'Priya Sharma', email: 'planner@pharma.com', role: 'SUPPLY_PLANNER', status: 'Active', lastLogin: '1 hour ago' },
  { id: '3', name: 'Ravi Kumar', email: 'retailer@pharma.com', role: 'RETAILER', status: 'Active', lastLogin: '3 hours ago' },
  { id: '4', name: 'Sunita Patel', email: 'distributor@pharma.com', role: 'DISTRIBUTOR_MANAGER', status: 'Active', lastLogin: '5 hours ago' },
  { id: '5', name: 'Vikram Singh', email: 'production@pharma.com', role: 'PRODUCTION_MANAGER', status: 'Inactive', lastLogin: '2 days ago' },
  { id: '6', name: 'Meena Iyer', email: 'finance@pharma.com', role: 'FINANCE', status: 'Active', lastLogin: '4 hours ago' },
];

const MOCK_AUDIT = [
  { id: '1', user: 'Priya Sharma', action: 'FORECAST_OVERRIDE', entity: 'Ibuprofen 400mg', timestamp: '10 min ago', ip: '192.168.1.42' },
  { id: '2', user: 'Arjun Mehta', action: 'USER_INVITE', entity: 'new.user@pharma.com', timestamp: '2 hours ago', ip: '192.168.1.10' },
  { id: '3', user: 'Sunita Patel', action: 'PO_APPROVED', entity: 'PO-SAP-2024001', timestamp: '3 hours ago', ip: '192.168.1.55' },
  { id: '4', user: 'Ravi Kumar', action: 'ALERT_RESOLVED', entity: 'Alert #1248', timestamp: '5 hours ago', ip: '10.0.0.18' },
  { id: '5', user: 'System', action: 'MODEL_RETRAINED', entity: 'LSTM-v4.2', timestamp: '6 hours ago', ip: 'internal' },
];

const MODEL_LOG = [
  { model: 'LSTM Neural Network', version: 'v4.2', accuracy: 94.3, lastTrained: '3 days ago', status: 'Active' },
  { model: 'XGBoost Gradient', version: 'v3.8', accuracy: 91.8, lastTrained: '3 days ago', status: 'Active' },
  { model: 'Prophet Seasonal', version: 'v2.4', accuracy: 89.3, lastTrained: '3 days ago', status: 'Active' },
  { model: 'Ensemble (weighted)', version: 'v1.9', accuracy: 95.1, lastTrained: '3 days ago', status: 'Active' },
];

const INTEGRATIONS = [
  { name: 'SAP ERP', type: 'ERP', status: 'Connected', lastSync: '5 min ago' },
  { name: 'Oracle WMS', type: 'WMS', status: 'Connected', lastSync: '15 min ago' },
  { name: 'Kafka Stream', type: 'Streaming', status: 'Connected', lastSync: 'Live' },
  { name: 'Snowflake', type: 'Data Warehouse', status: 'Connected', lastSync: '1 hour ago' },
  { name: 'Salesforce', type: 'CRM', status: 'Disconnected', lastSync: 'N/A' },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');
  const tabs = [['users', 'User Management'], ['models', 'AI Models'], ['audit', 'Audit Log'], ['integrations', 'Integrations']];

  return (
    <AppLayout>
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-[32px] font-bold text-dark">Administration</h1>
          <p className="font-ui text-sm text-muted mt-1">Manage users, AI models, integrations, and system audit logs</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-dark/10 mb-8">
          {tabs.map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`font-ui text-xs font-semibold uppercase tracking-[0.1em] px-5 py-3 border-b-2 transition-colors ${activeTab === key ? 'border-gold text-gold' : 'border-transparent text-muted hover:text-dark'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-dark">{MOCK_USERS.length} Users — MedCore Pharma</h2>
              <Button variant="gold" size="sm">+ Invite User</Button>
            </div>
            <div className="bg-white border border-dark/10 rounded-[10px] shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark/8">
                    {['Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                      <th key={h} className="text-left font-ui text-[10px] font-semibold uppercase tracking-[0.1em] text-muted px-5 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_USERS.map(user => (
                    <tr key={user.id} className="border-b border-dark/5 hover:bg-cream/40 transition-colors">
                      <td className="px-5 py-4 font-ui text-sm font-semibold text-dark">{user.name}</td>
                      <td className="px-5 py-4 font-ui text-xs text-muted">{user.email}</td>
                      <td className="px-5 py-4 font-ui text-xs text-mid">{user.role.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-4"><Badge variant={user.status === 'Active' ? 'ok' : 'muted'}>{user.status}</Badge></td>
                      <td className="px-5 py-4 font-ui text-xs text-muted">{user.lastLogin}</td>
                      <td className="px-5 py-4 flex gap-2">
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm" className="text-danger hover:text-danger">Deactivate</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Models tab */}
        {activeTab === 'models' && (
          <div>
            <div className="flex justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-dark">AI Model Management</h2>
              <Button variant="gold" size="sm">Trigger Retrain</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {MODEL_LOG.map(m => (
                <div key={m.model} className="bg-white border border-dark/10 rounded-[10px] p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-dark">{m.model}</h3>
                      <p className="font-ui text-[11px] text-muted mt-0.5 uppercase tracking-wider">{m.version} · Last trained {m.lastTrained}</p>
                    </div>
                    <Badge variant="ok">{m.status}</Badge>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between mb-1">
                      <span className="font-ui text-xs text-mid">Accuracy</span>
                      <span className="font-ui text-xs font-semibold text-gold">{m.accuracy}%</span>
                    </div>
                    <div className="h-2 bg-cream3 rounded-full overflow-hidden">
                      <div className="h-full bg-gold rounded-full" style={{ width: `${m.accuracy}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit log tab */}
        {activeTab === 'audit' && (
          <div>
            <h2 className="font-display text-lg font-bold text-dark mb-5">System Audit Log</h2>
            <div className="bg-white border border-dark/10 rounded-[10px] shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark/8">
                    {['Timestamp', 'User', 'Action', 'Entity / Record', 'IP Address'].map(h => (
                      <th key={h} className="text-left font-ui text-[10px] font-semibold uppercase tracking-[0.1em] text-muted px-5 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_AUDIT.map(log => (
                    <tr key={log.id} className="border-b border-dark/5 hover:bg-cream/40 transition-colors">
                      <td className="px-5 py-4 font-ui text-xs text-muted">{log.timestamp}</td>
                      <td className="px-5 py-4 font-ui text-sm font-medium text-dark">{log.user}</td>
                      <td className="px-5 py-4"><Badge variant="info">{log.action}</Badge></td>
                      <td className="px-5 py-4 font-ui text-xs text-mid">{log.entity}</td>
                      <td className="px-5 py-4 font-ui text-xs text-muted font-mono">{log.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Integrations tab */}
        {activeTab === 'integrations' && (
          <div>
            <h2 className="font-display text-lg font-bold text-dark mb-5">Integration Connections</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {INTEGRATIONS.map(int => (
                <div key={int.name} className="bg-white border border-dark/10 rounded-[10px] p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-ui text-sm font-semibold text-dark">{int.name}</h3>
                      <p className="font-ui text-[10px] text-muted uppercase tracking-wider mt-0.5">{int.type}</p>
                    </div>
                    <Badge variant={int.status === 'Connected' ? 'ok' : 'risk'}>{int.status}</Badge>
                  </div>
                  <p className="font-ui text-[11px] text-muted">Last sync: {int.lastSync}</p>
                  <div className="mt-4 flex gap-2">
                    <Button variant={int.status === 'Connected' ? 'outline' : 'gold'} size="sm">
                      {int.status === 'Connected' ? 'Configure' : 'Connect'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
