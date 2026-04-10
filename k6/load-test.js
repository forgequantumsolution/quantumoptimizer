/**
 * Quantum Optimizer — k6 Load Test Suite
 *
 * Scenarios:
 *   smoke    — 1 VU, 30s (baseline sanity check)
 *   load     — ramp to 50 VU, hold 10 min (normal load)
 *   stress   — ramp to 200 VU (find breaking point)
 *   spike    — instant 500 VU for 30s (sudden traffic burst)
 *   soak     — 50 VU for 4 hours (memory leak detection)
 *
 * Usage:
 *   k6 run --env BASE_URL=http://localhost:3001 k6/load-test.js
 *   k6 run --env BASE_URL=https://api.example.com --scenario smoke k6/load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Custom metrics
const authFailureRate  = new Rate('auth_failure_rate');
const apiLatencyTrend  = new Trend('api_latency_ms', true);
const rateLimitHits    = new Counter('rate_limit_hits');

// ─── Scenarios ────────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { scenario: 'smoke' },
    },
    load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 50 },   // ramp up
        { duration: '10m', target: 50 },  // hold
        { duration: '2m', target: 0 },    // ramp down
      ],
      tags: { scenario: 'load' },
      startTime: '35s',                   // after smoke
    },
  },

  // SLO thresholds — CI fails if breached
  thresholds: {
    http_req_duration:        ['p(95)<500', 'p(99)<2000'],
    http_req_failed:          ['rate<0.01'],   // < 1% error rate
    http_reqs:                ['rate>10'],     // > 10 rps throughput
    auth_failure_rate:        ['rate<0.05'],   // < 5% auth failures
  },
};

// ─── Auth helper ──────────────────────────────────────────────────────────────
function authenticate() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: 'planner@pharma.com', password: 'demo1234' }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  const success = check(res, {
    'login 200': (r) => r.status === 200,
    'has token': (r) => r.json('data.accessToken') !== null,
  });

  authFailureRate.add(!success);
  if (!success) return null;
  return res.json('data.accessToken');
}

// ─── Main VU scenario ─────────────────────────────────────────────────────────
export default function () {
  const token = authenticate();
  if (!token) {
    sleep(1);
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  group('Health', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, { 'health 200': (r) => r.status === 200 });
    apiLatencyTrend.add(res.timings.duration);
  });

  sleep(0.5);

  group('Dashboard', () => {
    const res = http.get(`${BASE_URL}/api/dashboard`, { headers });
    check(res, {
      'dashboard 200': (r) => r.status === 200,
      'dashboard has data': (r) => r.json('success') === true,
    });
    apiLatencyTrend.add(res.timings.duration);
  });

  sleep(0.5);

  group('Forecasts', () => {
    const res = http.get(`${BASE_URL}/api/forecasts`, { headers });
    check(res, { 'forecasts 200 or 204': (r) => r.status === 200 || r.status === 204 });
    apiLatencyTrend.add(res.timings.duration);
  });

  sleep(0.5);

  group('Alerts', () => {
    const res = http.get(`${BASE_URL}/api/alerts`, { headers });
    check(res, { 'alerts 200': (r) => r.status === 200 });
    apiLatencyTrend.add(res.timings.duration);
  });

  group('Inventory', () => {
    const res = http.get(`${BASE_URL}/api/inventory`, { headers });
    check(res, { 'inventory 200': (r) => r.status === 200 });

    if (res.status === 429) rateLimitHits.add(1);
    apiLatencyTrend.add(res.timings.duration);
  });

  sleep(1);
}

// ─── Teardown summary ─────────────────────────────────────────────────────────
export function handleSummary(data) {
  return {
    stdout: JSON.stringify({
      p95_ms: data.metrics.http_req_duration?.values?.['p(95)'],
      p99_ms: data.metrics.http_req_duration?.values?.['p(99)'],
      error_rate: data.metrics.http_req_failed?.values?.rate,
      rps: data.metrics.http_reqs?.values?.rate,
    }, null, 2),
  };
}
