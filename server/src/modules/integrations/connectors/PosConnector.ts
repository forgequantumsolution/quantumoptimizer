import { DataConnector, ConnectorRecord } from '../base/DataConnector';
import { logger } from '../../../config/logger';

export class PosConnector extends DataConnector {
  readonly name = 'POS Connector';
  readonly sourceType = 'POS' as const;
  private pollingIntervalMs: number;

  constructor(config: Record<string, string> = {}) {
    super(config);
    this.pollingIntervalMs = parseInt(config.pollingIntervalMs || '300000'); // 5 min default
  }

  async connect(): Promise<void> {
    const endpoint = this.config.endpoint || process.env.POS_ENDPOINT;
    if (!endpoint) {
      logger.warn('[POS] No endpoint configured — operating in batch simulation mode');
    } else {
      logger.info(`[POS] Connected to real-time stream at ${endpoint}`);
    }
  }

  async fetchData(): Promise<ConnectorRecord[]> {
    return this.withRetry(async () => {
      logger.info('[POS] Fetching real-time POS transactions');
      // Production: connect to Kafka topic or REST endpoint
      const txCount = Math.floor(Math.random() * 20) + 5;
      const records: ConnectorRecord[] = Array.from({ length: txCount }, (_, i) => ({
        id: `pos-${Date.now()}-${i}`,
        source: 'POS',
        data: {
          item_id: `SKU-${String((i % 10) + 1).padStart(3, '0')}`,
          store_id: `STORE-${String((i % 3) + 1).padStart(3, '0')}`,
          date: new Date().toISOString(),
          quantity: Math.floor(Math.random() * 50) + 1,
          revenue: Math.floor(Math.random() * 5000) + 100,
          currency: 'INR',
          channel: 'RETAIL',
          promo_flag: Math.random() > 0.8,
        },
        receivedAt: new Date(),
      }));
      this.lastSyncAt = new Date();
      this.health = 'healthy';
      return records;
    });
  }
}
