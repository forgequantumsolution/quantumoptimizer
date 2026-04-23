import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
// import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import DashboardPage from './pages/DashboardPage';
import ForecastPage from './pages/ForecastPage';
import AlertsPage from './pages/AlertsPage';
import InventoryPage from './pages/InventoryPage';
import ScenarioPlannerPage from './pages/ScenarioPlannerPage';
import AdminPage from './pages/AdminPage';
import DataHubPage from './pages/DataHubPage';
import ConsensusPage from './pages/ConsensusPage';
import SupplyPlanningPage from './pages/SupplyPlanningPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/signin" replace />;
}

function P({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* <Route path="/" element={<LandingPage />} /> */}
          <Route path="/" element={<SignInPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/dashboard" element={<P><DashboardPage /></P>} />
          <Route path="/forecast" element={<P><ForecastPage /></P>} />
          <Route path="/alerts" element={<P><AlertsPage /></P>} />
          <Route path="/inventory" element={<P><InventoryPage /></P>} />
          <Route path="/scenarios" element={<P><ScenarioPlannerPage /></P>} />
          <Route path="/consensus" element={<P><ConsensusPage /></P>} />
          <Route path="/supply-planning" element={<P><SupplyPlanningPage /></P>} />
          <Route path="/data-hub" element={<P><DataHubPage /></P>} />
          <Route path="/compliance" element={<P><DashboardPage /></P>} />
          <Route path="/integrations" element={<P><DashboardPage /></P>} />
          <Route path="/admin" element={<P><AdminPage /></P>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
