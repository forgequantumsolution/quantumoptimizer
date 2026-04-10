import { DataConnector, ConnectorRecord } from '../base/DataConnector';
import { logger } from '../../../config/logger';

export class MarketDataConnector extends DataConnector {
  readonly name = 'Market Data (Weather & External)';
  readonly sourceType = 'MARKET' as const;

  async connect(): Promise<void> {
    // Open-Meteo is free, no key required
    logger.info('[Market] Open-Meteo weather API — no auth required');
  }

  async fetchData(): Promise<ConnectorRecord[]> {
    return this.withRetry(async () => {
      logger.info('[Market] Fetching weather forecast signals');
      // Production: fetch from https://api.open-meteo.com/v1/forecast
      const records: ConnectorRecord[] = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return {
          id: `market-${Date.now()}-${i}`,
          source: 'MARKET',
          data: {
            item_id: 'WEATHER_SIGNAL',
            location_id: 'REGION-SOUTH',
            date: date.toISOString(),
            temperature_max_c: (Math.random() * 15 + 20).toFixed(1),
            precipitation_mm: (Math.random() * 20).toFixed(1),
            weather_code: Math.floor(Math.random() * 3),
            demand_impact_factor: (0.9 + Math.random() * 0.3).toFixed(3),
          },
          receivedAt: new Date(),
        };
      });
      this.lastSyncAt = new Date();
      this.health = 'healthy';
      return records;
    });
  }

  protected getRequiredFields(): string[] {
    return ['date', 'location_id'];
  }
}
