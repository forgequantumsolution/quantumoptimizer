import { DataConnector, ConnectorRecord } from '../base/DataConnector';
import { logger } from '../../../config/logger';

export class IotConnector extends DataConnector {
  readonly name = 'IoT / Sensor Feed';
  readonly sourceType = 'IOT' as const;

  async connect(): Promise<void> {
    const mqttBroker = this.config.mqttBroker || process.env.MQTT_BROKER_URL;
    if (mqttBroker) {
      logger.info(`[IoT] MQTT broker configured at ${mqttBroker}`);
    } else {
      logger.info('[IoT] Using REST polling (MQTT not configured)');
    }
  }

  async fetchData(): Promise<ConnectorRecord[]> {
    return this.withRetry(async () => {
      logger.info('[IoT] Fetching sensor readings (temperature, weight, count)');
      const records: ConnectorRecord[] = Array.from({ length: 3 }, (_, i) => ({
        id: `iot-${Date.now()}-${i}`,
        source: 'IOT',
        data: {
          sensor_id: `SENSOR-${String(i + 1).padStart(3, '0')}`,
          warehouse_id: `WH-00${i + 1}`,
          date: new Date().toISOString(),
          temperature_c: (Math.random() * 10 + 2).toFixed(1),
          humidity_pct: (Math.random() * 20 + 30).toFixed(1),
          item_count: Math.floor(Math.random() * 1000) + 100,
          item_id: `SKU-00${i + 1}`,
          quantity: Math.floor(Math.random() * 1000) + 100,
        },
        receivedAt: new Date(),
      }));
      this.lastSyncAt = new Date();
      this.health = 'healthy';
      return records;
    });
  }

  protected getRequiredFields(): string[] {
    return ['sensor_id', 'warehouse_id', 'date'];
  }
}
