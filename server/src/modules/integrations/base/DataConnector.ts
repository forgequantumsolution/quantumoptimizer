import { logger } from '../../../config/logger';

export type ConnectorHealth = 'healthy' | 'degraded' | 'error' | 'unknown';

export interface ConnectorRecord {
  id: string;
  source: string;
  data: Record<string, unknown>;
  receivedAt: Date;
}

export interface ValidationResult {
  valid: boolean;
  issues: Array<{
    field: string;
    issueType: 'missing_field' | 'out_of_range' | 'duplicate_key' | 'invalid_format';
    rawValue: unknown;
  }>;
}

export interface NormalizedRecord {
  itemId?: string;
  locationId?: string;
  date?: string;          // ISO 8601
  quantity?: number;
  revenue?: number;
  currency?: string;
  uom?: string;
  channel?: string;
  promoFlag?: boolean;
  raw: Record<string, unknown>;
}

export abstract class DataConnector {
  abstract readonly name: string;
  abstract readonly sourceType: 'ERP' | 'CRM' | 'WMS' | 'POS' | 'IOT' | 'MARKET';

  protected config: Record<string, string>;
  protected lastSyncAt: Date | null = null;
  protected health: ConnectorHealth = 'unknown';

  constructor(config: Record<string, string> = {}) {
    this.config = config;
  }

  abstract connect(): Promise<void>;
  abstract fetchData(): Promise<ConnectorRecord[]>;

  validate(record: ConnectorRecord): ValidationResult {
    const issues: ValidationResult['issues'] = [];
    const data = record.data;

    // Required field presence
    const requiredFields = this.getRequiredFields();
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        issues.push({ field, issueType: 'missing_field', rawValue: data[field] });
      }
    }

    // Numeric range checks
    if (data.quantity !== undefined && (Number(data.quantity) < 0 || Number(data.quantity) > 1_000_000_000)) {
      issues.push({ field: 'quantity', issueType: 'out_of_range', rawValue: data.quantity });
    }
    if (data.revenue !== undefined && Number(data.revenue) < 0) {
      issues.push({ field: 'revenue', issueType: 'out_of_range', rawValue: data.revenue });
    }

    // Date format
    if (data.date !== undefined) {
      const d = new Date(data.date as string);
      if (isNaN(d.getTime())) {
        issues.push({ field: 'date', issueType: 'invalid_format', rawValue: data.date });
      }
    }

    return { valid: issues.length === 0, issues };
  }

  normalize(record: ConnectorRecord): NormalizedRecord {
    const d = record.data;
    return {
      itemId: String(d.item_id || d.itemId || d.sku || d.product_code || ''),
      locationId: String(d.location_id || d.locationId || d.warehouse_id || d.store_id || ''),
      date: d.date ? new Date(d.date as string).toISOString() : new Date().toISOString(),
      quantity: d.quantity !== undefined ? Number(d.quantity) : undefined,
      revenue: d.revenue !== undefined ? Number(d.revenue) : undefined,
      currency: String(d.currency || 'INR'),
      uom: String(d.uom || d.unit_of_measure || 'UNIT'),
      channel: String(d.channel || d.sales_channel || 'DIRECT'),
      promoFlag: Boolean(d.promo_flag || d.is_promotion || false),
      raw: d,
    };
  }

  async push(_normalized: NormalizedRecord[]): Promise<{ inserted: number; skipped: number }> {
    // Override in subclasses for DB persistence
    return { inserted: _normalized.length, skipped: 0 };
  }

  async withRetry<T>(fn: () => Promise<T>, maxAttempts = 3, delayMs = 1000): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err as Error;
        logger.warn(`[${this.name}] Attempt ${attempt}/${maxAttempts} failed: ${lastError.message}`);
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt - 1)));
        }
      }
    }
    this.health = 'error';
    throw lastError;
  }

  async checkHealth(): Promise<ConnectorHealth> {
    try {
      await this.connect();
      this.health = 'healthy';
    } catch {
      this.health = 'error';
    }
    return this.health;
  }

  getStatus() {
    return {
      name: this.name,
      sourceType: this.sourceType,
      health: this.health,
      lastSyncAt: this.lastSyncAt,
      config: Object.keys(this.config).reduce((acc, k) => {
        acc[k] = k.toLowerCase().includes('key') || k.toLowerCase().includes('secret') || k.toLowerCase().includes('pass')
          ? '***'
          : this.config[k];
        return acc;
      }, {} as Record<string, string>),
    };
  }

  protected getRequiredFields(): string[] {
    return ['item_id', 'date', 'quantity'];
  }
}
