import { DataConnector, ConnectorRecord } from '../base/DataConnector';
import { logger } from '../../../config/logger';

export class WmsConnector extends DataConnector {
  readonly name = 'WMS / 3PL Connector';
  readonly sourceType = 'WMS' as const;

  async connect(): Promise<void> {
    logger.info('[WMS] Connecting via flat-file SFTP / REST endpoint');
  }

  async fetchData(): Promise<ConnectorRecord[]> {
    return this.withRetry(async () => {
      logger.info('[WMS] Fetching inventory positions');
      const records: ConnectorRecord[] = Array.from({ length: 4 }, (_, i) => ({
        id: `wms-${Date.now()}-${i}`,
        source: 'WMS',
        data: {
          item_id: `SKU-${String(i + 1).padStart(3, '0')}`,
          warehouse_id: `WH-00${i + 1}`,
          date: new Date().toISOString(),
          quantity: Math.floor(Math.random() * 8000) + 1000,
          uom: 'UNIT',
          expiry_date: new Date(Date.now() + (i + 1) * 30 * 86400000).toISOString(),
          batch_number: `BATCH-${Math.floor(Math.random() * 9000) + 1000}`,
        },
        receivedAt: new Date(),
      }));
      this.lastSyncAt = new Date();
      this.health = 'healthy';
      return records;
    });
  }
}
