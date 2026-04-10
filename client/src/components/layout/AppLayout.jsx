import { useState } from 'react';
import Sidebar from './Sidebar';
import { ToastContainer } from '../ui';
import { cn } from '../../utils/cn';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-cream flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <main className={cn('flex-1 transition-all duration-300', collapsed ? 'ml-16' : 'ml-60')}>
        {children}
      </main>
      <ToastContainer />
    </div>
  );
}
