import api from './api';

// ─── Demo users (mock fallback when backend is offline) ───────────────────────
// These mirror the server/prisma/seed.ts accounts exactly.
const DEMO_USERS = [
  { email: 'admin@pharma.com',       password: 'demo1234', firstName: 'Arjun',  lastName: 'Mehta',  role: 'SUPER_ADMIN',         tenantId: 'tenant-pharma', tenantName: 'MedCore Pharma Ltd.' },
  { email: 'planner@pharma.com',     password: 'demo1234', firstName: 'Priya',  lastName: 'Sharma', role: 'SUPPLY_PLANNER',       tenantId: 'tenant-pharma', tenantName: 'MedCore Pharma Ltd.' },
  { email: 'retailer@pharma.com',    password: 'demo1234', firstName: 'Ravi',   lastName: 'Kumar',  role: 'RETAILER',             tenantId: 'tenant-pharma', tenantName: 'MedCore Pharma Ltd.' },
  { email: 'distributor@pharma.com', password: 'demo1234', firstName: 'Sunita', lastName: 'Patel',  role: 'DISTRIBUTOR_MANAGER',  tenantId: 'tenant-pharma', tenantName: 'MedCore Pharma Ltd.' },
  { email: 'production@pharma.com',  password: 'demo1234', firstName: 'Vikram', lastName: 'Singh',  role: 'PRODUCTION_MANAGER',   tenantId: 'tenant-pharma', tenantName: 'MedCore Pharma Ltd.' },
  { email: 'finance@pharma.com',     password: 'demo1234', firstName: 'Meena',  lastName: 'Iyer',   role: 'FINANCE',              tenantId: 'tenant-pharma', tenantName: 'MedCore Pharma Ltd.' },
  { email: 'admin@fnb.com',          password: 'demo1234', firstName: 'Nisha',  lastName: 'Rao',    role: 'SUPER_ADMIN',          tenantId: 'tenant-fnb',    tenantName: 'FreshBite Foods Ltd.' },
  { email: 'planner@fnb.com',        password: 'demo1234', firstName: 'Karan',  lastName: 'Verma',  role: 'SUPPLY_PLANNER',       tenantId: 'tenant-fnb',    tenantName: 'FreshBite Foods Ltd.' },
  { email: 'admin@fmcg.com',         password: 'demo1234', firstName: 'Raj',    lastName: 'Agarwal',role: 'SUPER_ADMIN',          tenantId: 'tenant-fmcg',   tenantName: 'EverFresh Consumer Goods' },
  { email: 'planner@fmcg.com',       password: 'demo1234', firstName: 'Divya',  lastName: 'Nair',   role: 'SUPPLY_PLANNER',       tenantId: 'tenant-fmcg',   tenantName: 'EverFresh Consumer Goods' },
];

function mockLogin(email, password) {
  const found = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password,
  );
  if (!found) return null;

  // Build a lightweight mock token (base64 payload — not a real JWT, just enough
  // to carry user info client-side for the demo)
  const payload = btoa(JSON.stringify({
    id: `mock-${found.email}`,
    email: found.email,
    role: found.role,
    tenantId: found.tenantId,
    exp: Math.floor(Date.now() / 1000) + 3600,
  }));
  const mockToken = `demo.${payload}.signature`;

  return {
    data: {
      success: true,
      data: {
        accessToken: mockToken,
        user: {
          id: `mock-${found.email}`,
          email: found.email,
          firstName: found.firstName,
          lastName: found.lastName,
          role: found.role,
          tenantId: found.tenantId,
        },
      },
    },
  };
}

export const authService = {
  login: async (email, password) => {
    try {
      // Try real backend first
      const res = await api.post('/auth/login', { email, password });
      return res;
    } catch (err) {
      // If the backend is unreachable (network error / no server), fall back to mock
      const isNetworkError = !err.response;
      if (isNetworkError) {
        const mock = mockLogin(email, password);
        if (mock) return mock;
        // Wrong credentials even in mock mode
        const error = new Error('Invalid credentials');
        error.response = { data: { error: { message: 'Invalid email or password.' } } };
        throw error;
      }
      throw err;
    }
  },
  logout: () => api.post('/auth/logout').catch(() => {}),
  refresh: () => api.post('/auth/refresh'),
  demoRequest: (data) => api.post('/auth/demo-request', data),
};
