/**
 * Environment configuration with startup-time validation.
 * Missing required variables in production will crash fast with a clear message.
 */

const REQUIRED_IN_PRODUCTION = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL',
];

// Validate on module load — fail fast before server accepts any traffic
if (process.env.NODE_ENV === 'production') {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
    console.error('See .env.example for required configuration.');
    process.exit(1);
  }
  // Reject insecure defaults in production
  if (process.env.JWT_ACCESS_SECRET === 'dev_secret') {
    console.error('[FATAL] JWT_ACCESS_SECRET is set to the default dev value. Rotate it immediately.');
    process.exit(1);
  }
}

export const env = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_secret_change_before_production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_change_before_production',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',   // reduced from 8h for security
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
    algorithm: 'HS256' as const,                            // explicit algorithm whitelist
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  rateLimits: {
    authWindowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '60000', 10),   // 1 min
    authMaxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10', 10),
    apiWindowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW_MS || '900000', 10),    // 15 min
    apiMaxRequests: parseInt(process.env.RATE_LIMIT_API_MAX || '1000', 10),
  },
};
