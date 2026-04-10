import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ROUTES, ROLES } from '../../constants';
import { cn } from '../../utils/cn';

const navItems = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: '▦' },
  { label: 'Data Hub', path: ROUTES.DATA_HUB, icon: '⊞' },
  { label: 'Forecast', path: ROUTES.FORECAST, icon: '◈' },
  { label: 'Alerts', path: ROUTES.ALERTS, icon: '◎' },
  { label: 'Inventory', path: ROUTES.INVENTORY, icon: '▤' },
  { label: 'Consensus', path: ROUTES.CONSENSUS, icon: '◫' },
  { label: 'Scenario Planner', path: ROUTES.SCENARIOS, icon: '◆' },
  { label: 'Compliance', path: ROUTES.COMPLIANCE, icon: '◉' },
  { label: 'Integrations', path: ROUTES.INTEGRATIONS, icon: '◈' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate(ROUTES.SIGNIN);
  };

  const allItems = user?.role === ROLES.SUPER_ADMIN
    ? [...navItems, { label: 'Admin', path: ROUTES.ADMIN, icon: '⚙' }]
    : navItems;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-dark2 border-r border-white/5 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5">
        {!collapsed && (
          <span className="font-ui text-sm font-medium text-white">
            Forge <span className="text-gold">Quantum</span>
          </span>
        )}
        <button
          onClick={onToggle}
          className={cn('ml-auto text-muted hover:text-white transition-colors text-lg', collapsed && 'mx-auto')}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {allItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 font-ui text-xs font-medium transition-colors',
                isActive
                  ? 'text-gold bg-gold/10 border-r-2 border-gold'
                  : 'text-muted hover:text-white hover:bg-white/5'
              )
            }
          >
            <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
            {!collapsed && <span className="uppercase tracking-[0.08em]">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-white/5 p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-ui text-xs font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-ui text-xs font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="font-ui text-[10px] text-muted truncate uppercase tracking-wider">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
            <button onClick={handleLogout} className="text-muted hover:text-danger transition-colors text-lg" title="Logout">⏻</button>
          </div>
        ) : (
          <button onClick={handleLogout} className="w-full flex justify-center text-muted hover:text-danger transition-colors text-lg" title="Logout">⏻</button>
        )}
      </div>
    </aside>
  );
}
