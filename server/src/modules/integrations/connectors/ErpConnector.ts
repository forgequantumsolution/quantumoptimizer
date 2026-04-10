import { DataConnector, ConnectorRecord } from '../base/DataConnector';
import { logger } from '../../../config/logger';

export class ErpConnector extends DataConnector {
  readonly name = 'ERP Connector';
  readonly sourceType = 'ERP' as const;

  async connect(): Promise<void> {
    const url = this.config.baseUrl || process.env.ERP_BASE_URL;
    if (!url) throw new Error('ERP_BASE_URL not configured');
    logger.info(`[ERP] Connecting to ${url}`);
    // In production: verify OAuth2 token / API key handshake
  }

  async fetchData(): Promise<ConnectorRecord[]> {
    return this.withRetry(async () => {
      // Production: fetch from SAP OData / Oracle REST API
      // Simulate returning records for dev/demo
      logger.info('[ERP] Fetching demand transactions');
      const records: ConnectorRecord[] = Array.from({ length: 5 }, (_, i) => ({
        id: `erp-${Date.now()}-${i}`,
        source: 'ERP',
        data: {
          item_id: `SKU-${String(i + 1).padStart(3, '0')}`,
          location_id: 'WH-001',
          date: new Date().toISOString(),
          quantity: Math.floor(Math.random() * 1000) + 100,
          revenue: Math.floor(Math.random() * 50000) + 5000,
          currency: 'INR',
          uom: 'UNIT',
          channel: 'B2B',
        },
        receivedAt: new Date(),
      }));
      this.lastSyncAt = new Date();
      this.health = 'healthy';
      return records;
    });
  }
}
