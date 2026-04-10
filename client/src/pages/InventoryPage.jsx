import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Badge from '../components/ui/Badge';

const MOCK_INVENTORY = [
  { id: '1', name: 'Paracetamol 500mg', category: 'Analgesics', warehouse: 'Mumbai Central DC', qty: 42000, stockDays: 34, expiryDays: 180, status: 'HEALTHY' },
  { id: '2', name: 'Amoxicillin 250mg', category: 'Antibiotics', warehouse: 'Delhi North Hub', qty: 18500, stockDays: 14, expiryDays: 90, status: 'REORDER' },
  { id: '3', name: 'Ibuprofen 400mg', category: 'Analgesics', warehouse: 'Mumbai Central DC', qty: 5100, stockDays: 5, expiryDays: 60, status: 'CRITICAL' },
  { id: '4', name: 'Metformin 500mg', category: 'Diabetes', warehouse: 'Bangalore South FC', qty: 31000, stockDays: 28, expiryDays: 270, status: 'HEALTHY' },
  { id: '5', name: 'Omeprazole 20mg', category: 'GI', warehouse: 'Delhi North Hub', qty: 14200, stockDays: 18, expiryDays: 45, status: 'REORDER' },
  { id: '6', name: 'Azithromycin 500mg', category: 'Antibiotics', warehouse: 'Mumbai Central DC', qty: 6700, stockDays: 7, expiryDays: 30, status: 'CRITICAL' },
  { id: '7', name: 'Atorvastatin 10mg', category: 'Cardiovascular', warehouse: 'Bangalore South FC', qty: 25000, stockDays: 42, expiryDays: 365, status: 'HEALTHY' },
  { id: '8', name: 'Vitamin D3 60K IU', category: 'Supplements', warehouse: 'Delhi North Hub', qty: 48000, stockDays: 95, expiryDays: 730, status: 'OVERSTOCK' },
];

function ExpiryHeatCell({ days }) {
  const color = days < 30 ? 'bg-danger-light text-danger' : days < 90 ? 'bg-amber-light text-[#b45309]' : 'bg-green-light text-green';
  return <span className={`font-ui text-[11px] font-semibold px-2.5 py-1 rounded-sm ${color}`}>{days}d</span>;
}

export default function InventoryPage() {
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const warehouses = ['ALL', ...new Set(MOCK_INVENTORY.map(i => i.warehouse))];

  const filtered = MOCK_INVENTORY.filter(i =>
    (warehouseFilter === 'ALL' || i.warehouse === warehouseFilter) &&
    (statusFilter === 'ALL' || i.status === statusFilter)
  );

  const totalValue = '₹4.2 Cr';
  const criticalCount = MOCK_INVENTORY.filter(i => i.status === 'CRITICAL').length;
  const expiringCount = MOCK_INVENTORY.filter(i => i.expiryDays < 60).length;

  return (
    <AppLayout>
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-[32px] font-bold text-dark">Inventory Management</h1>
          <p className="font-ui text-sm text-muted mt-1">Multi-location inventory with expiry tracking and slow-mover analysis</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            [totalValue, 'Total Inventory Value', null],
            [MOCK_INVENTORY.length, 'Total SKUs', null],
            [criticalCount, 'Critical Stock', 'text-danger'],
            [expiringCount, 'Expiring < 60 days', 'text-[#b45309]'],
          ].map(([v, l, c]) => (
            <div key={l} className="bg-white border border-dark/10 rounded-[10px] p-5 shadow-sm">
              <div className={`font-display text-[28px] font-bold leading-none mb-1 ${c || 'text-gold'}`}>{v}</div>
              <div className="font-ui text-[10px] uppercase tracking-wider text-muted">{l}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            {['ALL', 'CRITICAL', 'REORDER', 'HEALTHY', 'OVERSTOCK'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`font-ui text-[10px] font-semibold uppercase tracking-[0.1em] px-3 py-1.5 rounded-[4px] transition-colors ${statusFilter === f ? 'bg-gold text-white' : 'bg-cream text-muted hover:text-dark'}`}>
                {f}
              </button>
            ))}
          </div>
          <select value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)}
            className="bg-white border border-dark/10 rounded-[4px] px-3 py-1.5 font-ui text-xs text-dark focus:outline-none">
            {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-dark/10 rounded-[10px] shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark/8">
                {['SKU Name', 'Category', 'Warehouse', 'Quantity', 'Stock Days', 'Expiry (days)', 'Status'].map(h => (
                  <th key={h} className="text-left font-ui text-[10px] font-semibold uppercase tracking-[0.1em] text-muted px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-b border-dark/5 hover:bg-cream/40 transition-colors">
                  <td className="px-5 py-4 font-ui text-sm font-medium text-dark">{item.name}</td>
                  <td className="px-5 py-4 font-ui text-xs text-muted">{item.category}</td>
                  <td className="px-5 py-4 font-ui text-xs text-mid">{item.warehouse}</td>
                  <td className="px-5 py-4 font-ui text-sm text-dark font-medium">{item.qty.toLocaleString()}</td>
                  <td className="px-5 py-4 font-ui text-sm text-dark">{item.stockDays}d</td>
                  <td className="px-5 py-4"><ExpiryHeatCell days={item.expiryDays} /></td>
                  <td className="px-5 py-4">
                    <Badge variant={item.status === 'HEALTHY' ? 'ok' : item.status === 'REORDER' ? 'warn' : item.status === 'OVERSTOCK' ? 'info' : 'risk'}>
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
