import winston from 'winston';
import { env } from './env';

// ─── PII / sensitive field scrubber ──────────────────────────────────────────
// Never log these fields — they are redacted before any log transport sees them.
const PII_KEYS = new Set([
  'password', 'passwd', 'secret', 'token', 'authorization',
  'apikey', 'api_key', 'accesstoken', 'access_token', 'refreshtoken',
  'refresh_token', 'creditcard', 'credit_card', 'ssn', 'dob',
  'dateofbirth', 'fullname', 'firstname', 'lastname',
]);

function scrubPII(obj: unknown, depth = 0): unknown {
  if (depth > 6 || obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((v) => scrubPII(v, depth + 1));

  const scrubbed: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    scrubbed[k] = PII_KEYS.has(k.toLowerCase().replace(/[^a-z]/g, ''))
      ? '[REDACTED]'
      : scrubPII(v, depth + 1);
  }
  return scrubbed;
}

// ─── Custom format that scrubs PII from log metadata ─────────────────────────
const piiScrubFormat = winston.format((info) => {
  if (info.context) info.context = scrubPII(info.context);
  if (info.body)    info.body    = scrubPII(info.body);
  if (info.data)    info.data    = scrubPII(info.data);
  return info;
})();

// ─── Transport selection ──────────────────────────────────────────────────────
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: env.isProd
      ? winston.format.combine(
          piiScrubFormat,
          winston.format.timestamp(),
          winston.format.json(),
        )
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'HH:mm:ss' }),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${level}] ${message}${metaStr}`;
          }),
        ),
    silent: process.env.NODE_ENV === 'test',
  }),
];

// ─── Logger instance ──────────────────────────────────────────────────────────
export const logger = winston.createLogger({
  level: env.isProd ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: env.isProd ? false : true }), // no stack traces in prod
    winston.format.json(),
  ),
  defaultMeta: {
    service: 'quantum-optimizer-api',
    version: process.env.APP_VERSION || 'local',
  },
  transports,
  exitOnError: false,
});

// ─── Security event helpers ───────────────────────────────────────────────────
export const securityLog = {
  loginSuccess:  (userId: string, ip: string, ua: string) =>
    logger.info('auth.login_success',  { event: 'LOGIN_SUCCESS',  userId, ip, userAgent: ua }),
  loginFailure:  (email: string,  ip: string, ua: string, reason: string) =>
    logger.warn('auth.login_failure',  { event: 'LOGIN_FAILURE',  email, ip, userAgent: ua, reason }),
  logout:        (userId: string, ip: string) =>
    logger.info('auth.logout',         { event: 'LOGOUT',         userId, ip }),
  tokenInvalid:  (ip: string, reason: string) =>
    logger.warn('auth.token_invalid',  { event: 'TOKEN_INVALID',  ip, reason }),
  permDenied:    (userId: string, resource: string, action: string) =>
    logger.warn('authz.denied',        { event: 'PERMISSION_DENIED', userId, resource, action }),
  rateLimitHit:  (ip: string, endpoint: string) =>
    logger.warn('rate.limit_hit',      { event: 'RATE_LIMIT_HIT', ip, endpoint }),
  validationFail:(endpoint: string, fields: string[]) =>
    logger.warn('input.validation_fail',{ event: 'VALIDATION_FAILURE', endpoint, fields }),
  adminAction:   (userId: string, action: string, entity: string, before?: unknown, after?: unknown) =>
    logger.info('admin.action',        { event: 'ADMIN_ACTION',   userId, action, entity,
                                         before: scrubPII(before), after: scrubPII(after) }),
  sensitiveAccess:(userId: string, resource: string) =>
    logger.info('data.sensitive_access',{ event: 'SENSITIVE_DATA_ACCESS', userId, resource }),
};
