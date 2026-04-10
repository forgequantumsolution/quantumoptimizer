/**
 * Demand forecasting model implementations.
 * Production deployment: replace with actual ML model inference
 * (Python FastAPI sidecar, AWS SageMaker, Azure ML endpoint, etc.)
 * These implementations provide statistically valid approximations
 * suitable for demonstration and baseline comparison.
 */

export interface ForecastPoint {
  date: Date;
  point: number;
  lower80: number;
  upper80: number;
  lower95: number;
  upper95: number;
}

export interface ModelResult {
  model: 'HOLT_WINTERS' | 'SARIMA' | 'XGBOOST' | 'ENSEMBLE';
  forecasts: ForecastPoint[];
  mape: number;
  confidence: number;
  drivers: string[];
}

interface HistoryPoint {
  date: Date;
  quantity: number;
  promoFlag: boolean;
}

// ── Utility helpers ──────────────────────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(mean(arr.map(x => (x - m) ** 2)));
}

function clampPositive(v: number): number {
  return Math.max(0, Math.round(v));
}

// ── Holt-Winters double exponential smoothing ────────────────────────────────

export function holtWinters(history: HistoryPoint[], horizon: number, alpha = 0.3, beta = 0.1): ModelResult {
  const qty = history.map(h => h.quantity);
  if (qty.length < 4) {
    return naiveForecast(history, horizon, 'HOLT_WINTERS');
  }

  // Initialise level and trend
  let level = mean(qty.slice(0, Math.min(4, qty.length)));
  let trend = (mean(qty.slice(Math.ceil(qty.length / 2))) - mean(qty.slice(0, Math.floor(qty.length / 2)))) / Math.floor(qty.length / 2);

  // Smooth over history
  for (const q of qty) {
    const prevLevel = level;
    level = alpha * q + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  // Compute in-sample residual std for confidence intervals
  const residuals: number[] = [];
  let l2 = mean(qty.slice(0, 2));
  let t2 = trend / 4;
  for (const q of qty) {
    const predicted = l2 + t2;
    residuals.push(q - predicted);
    const pl = l2;
    l2 = alpha * q + (1 - alpha) * (l2 + t2);
    t2 = beta * (l2 - pl) + (1 - beta) * t2;
  }
  const resStd = std(residuals.length > 0 ? residuals : [level * 0.1]);

  const forecasts: ForecastPoint[] = [];
  const lastDate = history[history.length - 1]?.date ?? new Date();

  for (let h = 1; h <= horizon; h++) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + h);
    const point = level + h * trend;
    const spread80 = 1.28 * resStd * Math.sqrt(h);
    const spread95 = 1.96 * resStd * Math.sqrt(h);
    forecasts.push({
      date,
      point: clampPositive(point),
      lower80: clampPositive(point - spread80),
      upper80: clampPositive(point + spread80),
      lower95: clampPositive(point - spread95),
      upper95: clampPositive(point + spread95),
    });
  }

  const mape = residuals.length > 0
    ? mean(residuals.slice(-7).map((r, i) => Math.abs(r) / Math.max(1, qty[qty.length - 7 + i] ?? 1))) * 100
    : 15;

  return {
    model: 'HOLT_WINTERS',
    forecasts,
    mape: parseFloat(mape.toFixed(2)),
    confidence: Math.max(0.6, Math.min(0.95, 1 - mape / 100)),
    drivers: ['Trend component', 'Historical smoothing', 'Level adjustment'],
  };
}

// ── SARIMA-style seasonal model ──────────────────────────────────────────────

export function sarima(history: HistoryPoint[], horizon: number, seasonPeriod = 7): ModelResult {
  const qty = history.map(h => h.quantity);
  if (qty.length < seasonPeriod * 2) {
    return naiveForecast(history, horizon, 'SARIMA');
  }

  // Compute seasonal indices using ratio-to-moving-average
  const seasonalIndices = new Array(seasonPeriod).fill(1.0);
  if (qty.length >= seasonPeriod) {
    const grouped: number[][] = Array.from({ length: seasonPeriod }, () => []);
    qty.forEach((q, i) => grouped[i % seasonPeriod].push(q));
    const overallMean = mean(qty);
    if (overallMean > 0) {
      grouped.forEach((grp, s) => {
        seasonalIndices[s] = mean(grp) / overallMean;
      });
    }
  }

  // Linear trend on deseasonalised series
  const deseason = qty.map((q, i) => q / (seasonalIndices[i % seasonPeriod] || 1));
  const xBar = (deseason.length - 1) / 2;
  const yBar = mean(deseason);
  let num = 0, den = 0;
  deseason.forEach((y, x) => { num += (x - xBar) * (y - yBar); den += (x - xBar) ** 2; });
  const slope = den !== 0 ? num / den : 0;
  const intercept = yBar - slope * xBar;

  // In-sample residuals
  const residuals = qty.map((q, i) => {
    const trend = intercept + slope * i;
    const predicted = trend * (seasonalIndices[i % seasonPeriod] || 1);
    return q - predicted;
  });
  const resStd = std(residuals);

  const forecasts: ForecastPoint[] = [];
  const lastDate = history[history.length - 1]?.date ?? new Date();
  const n = qty.length;

  for (let h = 1; h <= horizon; h++) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + h);
    const trendVal = intercept + slope * (n + h - 1);
    const seasonal = seasonalIndices[(n + h - 1) % seasonPeriod] || 1;
    const point = trendVal * seasonal;
    const spread80 = 1.28 * resStd * Math.sqrt(h);
    const spread95 = 1.96 * resStd * Math.sqrt(h);
    forecasts.push({
      date,
      point: clampPositive(point),
      lower80: clampPositive(point - spread80),
      upper80: clampPositive(point + spread80),
      lower95: clampPositive(point - spread95),
      upper95: clampPositive(point + spread95),
    });
  }

  const mape = residuals.length > 0
    ? mean(residuals.slice(-7).map((r, i) => Math.abs(r) / Math.max(1, qty[qty.length - 7 + i] ?? 1))) * 100
    : 12;

  // Identify dominant season
  const maxSeason = seasonalIndices.indexOf(Math.max(...seasonalIndices));
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return {
    model: 'SARIMA',
    forecasts,
    mape: parseFloat(mape.toFixed(2)),
    confidence: Math.max(0.6, Math.min(0.95, 1 - mape / 100)),
    drivers: [
      `Weekly seasonality (peak: ${dayNames[maxSeason % 7]})`,
      'Linear trend component',
      'Seasonal decomposition',
    ],
  };
}

// ── XGBoost-style feature-based model ───────────────────────────────────────

export function xgboostSimulation(
  history: HistoryPoint[],
  horizon: number,
  weatherSignals?: Array<{ date: Date; tempMax: number; precipMm: number; demandImpact: number }>,
): ModelResult {
  const qty = history.map(h => h.quantity);
  if (qty.length < 7) {
    return naiveForecast(history, horizon, 'XGBOOST');
  }

  const avgQty = mean(qty);
  const promoCount = history.filter(h => h.promoFlag).length;
  const promoLift = promoCount > 0
    ? mean(history.filter(h => h.promoFlag).map(h => h.quantity)) / Math.max(1, mean(history.filter(h => !h.promoFlag).map(h => h.quantity))) - 1
    : 0.15;

  // Simulate XGBoost residuals using lag features
  const residuals: number[] = [];
  for (let i = 7; i < qty.length; i++) {
    const lag7 = qty[i - 7];
    const lag14 = i >= 14 ? qty[i - 14] : lag7;
    const rolling7 = mean(qty.slice(Math.max(0, i - 7), i));
    const predicted = 0.4 * lag7 + 0.3 * lag14 + 0.3 * rolling7;
    residuals.push(qty[i] - predicted);
  }
  const resStd = std(residuals.length > 0 ? residuals : [avgQty * 0.08]);

  const forecasts: ForecastPoint[] = [];
  const lastDate = history[history.length - 1]?.date ?? new Date();
  const recentQty = qty.slice(-14);

  for (let h = 1; h <= horizon; h++) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + h);

    // Lag features from recent history
    const lag7 = recentQty[Math.max(0, recentQty.length - 7)] ?? avgQty;
    const lag14 = recentQty[Math.max(0, recentQty.length - 14)] ?? avgQty;
    const rolling7 = mean(recentQty.slice(-7));
    let point = 0.4 * lag7 + 0.3 * lag14 + 0.3 * rolling7;

    // Day-of-week effect
    const dow = date.getDay();
    const dowEffect = [0.9, 1.05, 1.1, 1.05, 1.1, 0.95, 0.85][dow];
    point *= dowEffect;

    // Weather signal integration
    const weatherForDay = weatherSignals?.find(w => {
      const wd = new Date(w.date);
      return wd.toDateString() === date.toDateString();
    });
    if (weatherForDay) {
      point *= weatherForDay.demandImpact;
    }

    const spread80 = 1.28 * resStd * Math.sqrt(1 + h * 0.1);
    const spread95 = 1.96 * resStd * Math.sqrt(1 + h * 0.1);

    forecasts.push({
      date,
      point: clampPositive(point),
      lower80: clampPositive(point - spread80),
      upper80: clampPositive(point + spread80),
      lower95: clampPositive(point - spread95),
      upper95: clampPositive(point + spread95),
    });

    // Append to rolling window for next iteration
    recentQty.push(clampPositive(point));
    if (recentQty.length > 14) recentQty.shift();
  }

  const mape = residuals.length > 0
    ? mean(residuals.slice(-7).map((r, i) => Math.abs(r) / Math.max(1, qty[qty.length - 7 + i] ?? 1))) * 100
    : 10;

  const drivers: string[] = ['7-day lag feature'];
  if (promoLift > 0.05) drivers.push(`Promotion uplift (+${(promoLift * 100).toFixed(0)}%)`);
  if (weatherSignals && weatherSignals.length > 0) drivers.push('Weather impact signal');
  if (drivers.length < 3) drivers.push('Day-of-week pattern');

  return {
    model: 'XGBOOST',
    forecasts,
    mape: parseFloat(mape.toFixed(2)),
    confidence: Math.max(0.65, Math.min(0.97, 1 - mape / 100)),
    drivers,
  };
}

// ── Ensemble: weighted average by inverse MAPE ──────────────────────────────

export function ensemble(modelResults: ModelResult[]): ModelResult {
  const valid = modelResults.filter(m => m.forecasts.length > 0);
  if (valid.length === 0) throw new Error('No model results to ensemble');
  if (valid.length === 1) return { ...valid[0], model: 'ENSEMBLE' };

  // Inverse-MAPE weights (lower MAPE → higher weight)
  const weights = valid.map(m => 1 / Math.max(0.1, m.mape));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const normWeights = weights.map(w => w / totalWeight);

  const horizon = valid[0].forecasts.length;
  const ensembleForecasts: ForecastPoint[] = [];

  for (let h = 0; h < horizon; h++) {
    let point = 0, lower80 = 0, upper80 = 0, lower95 = 0, upper95 = 0;
    valid.forEach((m, mi) => {
      const f = m.forecasts[h];
      if (!f) return;
      point   += normWeights[mi] * f.point;
      lower80 += normWeights[mi] * f.lower80;
      upper80 += normWeights[mi] * f.upper80;
      lower95 += normWeights[mi] * f.lower95;
      upper95 += normWeights[mi] * f.upper95;
    });
    ensembleForecasts.push({
      date: valid[0].forecasts[h].date,
      point: clampPositive(point),
      lower80: clampPositive(lower80),
      upper80: clampPositive(upper80),
      lower95: clampPositive(lower95),
      upper95: clampPositive(upper95),
    });
  }

  const ensembleMape = valid.reduce((s, m, i) => s + normWeights[i] * m.mape, 0);
  const allDrivers = [...new Set(valid.flatMap(m => m.drivers))].slice(0, 3);

  return {
    model: 'ENSEMBLE',
    forecasts: ensembleForecasts,
    mape: parseFloat(ensembleMape.toFixed(2)),
    confidence: Math.max(0.7, Math.min(0.98, 1 - ensembleMape / 100)),
    drivers: allDrivers,
  };
}

// ── Naive fallback ────────────────────────────────────────────────────────────

function naiveForecast(history: HistoryPoint[], horizon: number, model: ModelResult['model']): ModelResult {
  const qty = history.map(h => h.quantity);
  const avg = mean(qty.length > 0 ? qty : [0]);
  const s = std(qty.length > 0 ? qty : [avg]);
  const lastDate = history[history.length - 1]?.date ?? new Date();

  return {
    model,
    forecasts: Array.from({ length: horizon }, (_, h) => {
      const date = new Date(lastDate);
      date.setDate(date.getDate() + h + 1);
      return {
        date,
        point: clampPositive(avg),
        lower80: clampPositive(avg - 1.28 * s),
        upper80: clampPositive(avg + 1.28 * s),
        lower95: clampPositive(avg - 1.96 * s),
        upper95: clampPositive(avg + 1.96 * s),
      };
    }),
    mape: 20,
    confidence: 0.7,
    drivers: ['Historical average (insufficient data for advanced model)'],
  };
}
