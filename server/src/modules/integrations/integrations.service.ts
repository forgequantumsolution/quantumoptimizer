import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { eventBus } from '../../events/eventBus';
import { DataConnector, ConnectorRecord } from './base/DataConnector';
import { ErpConnector } from './connectors/ErpConnector';
import { CrmConnector } from './connectors/CrmConnector';
import { WmsConnector } from './connectors/WmsConnector';
import { PosConnector } from './connectors/PosConnector';
import { IotConnector } from './connectors/IotConnector';
import { MarketDataConnector } from './connectors/MarketDataConnector';

// Registry of all connectors
const connectorRegistry: DataConnector[] = [
  new ErpConnector(),
  new CrmConnector(),
  new WmsConnector(),
  new PosConnector(),
  new IotConnector(),
  new MarketDataConnector(),
];

export async function getAllConnectorStatuses() {
  return connectorRegistry.map(c => c.getStatus());
}

export async function triggerSync(connectorName: string, tenantId: string) {
  const connector = connectorRegistry.find(c => c.name === connectorName);
  if (!connector) throw new Error(`Connector "${connectorName}" not found`);

  const startTime = Date.now();
  let inserted = 0;
  let qualityIssues = 0;
  let totalRecords = 0;

  try {
    await connector.connect();
    const rawRecords = await connector.fetchData();
    totalRecords = rawRecords.length;

    for (const record of rawRecords) {
      const validation = connector.validate(record);
      if (!validation.valid) {
        qualityIssues++;
        // Store quality issues
        for (const issue of validation.issues) {
          await prisma.dataQualityIssue.create({
            data: {
              tenantId,
              source: connector.name,
              sourceType: connector.sourceType,
              recordId: record.id,
              field: issue.field,
              issueType: issue.issueType,
              rawValue: String(issue.rawValue ?? ''),
              resolved: false,
            },
          }).catch(() => {}); // Non-blocking
        }
      } else {
        const normalized = connector.normalize(record);
        // Store to demand_history if it has item + date + quantity
        if (normalized.itemId && normalized.date && normalized.quantity !== undefined) {
          await prisma.demandHistory.upsert({
            where: {
              itemId_locationId_date_channel: {
                itemId: normalized.itemId,
                locationId: normalized.locationId || 'DEFAULT',
                date: new Date(normalized.date),
                channel: normalized.channel || 'DIRECT',
              },
            },
            update: {
              quantity: normalized.quantity,
              revenue: normalized.revenue,
              promoFlag: normalized.promoFlag || false,
            },
            create: {
              tenantId,
              itemId: normalized.itemId,
              locationId: normalized.locationId || 'DEFAULT',
              date: new Date(normalized.date),
              quantity: normalized.quantity,
              revenue: normalized.revenue,
              currency: normalized.currency || 'INR',
              uom: normalized.uom || 'UNIT',
              channel: normalized.channel || 'DIRECT',
              promoFlag: normalized.promoFlag || false,
              source: connector.sourceType,
            },
          }).catch(() => {});
          inserted++;
        }
      }
    }

    // Log the sync
    const durationMs = Date.now() - startTime;
    const qualityScore = totalRecords > 0 ? Math.round(((totalRecords - qualityIssues) / totalRecords) * 100) : 100;

    await prisma.connectorSyncLog.create({
      data: {
        tenantId,
        connectorName: connector.name,
        sourceType: connector.sourceType,
        recordsTotal: totalRecords,
        recordsInserted: inserted,
        qualityIssues,
        qualityScore,
        durationMs,
        status: 'SUCCESS',
      },
    }).catch(() => {});

    // Fire event for downstream modules
    eventBus.emitDataIngested({
      connectorName: connector.name,
      sourceType: connector.sourceType,
      tenantId,
      recordCount: inserted,
      qualityScore,
      timestamp: new Date(),
    });

    logger.info(`[Sync] ${connector.name} — ${inserted}/${totalRecords} inserted, ${qualityIssues} issues, ${durationMs}ms`);

    return { connectorName: connector.name, inserted, qualityIssues, qualityScore, durationMs };

  } catch (error) {
    const durationMs = Date.now() - startTime;
    await prisma.connectorSyncLog.create({
      data: {
        tenantId,
        connectorName: connector.name,
        sourceType: connector.sourceType,
        recordsTotal: 0,
        recordsInserted: 0,
        qualityIssues: 0,
        qualityScore: 0,
        durationMs,
        status: 'ERROR',
        errorMessage: (error as Error).message,
      },
    }).catch(() => {});
    throw error;
  }
}

export async function getQualityIssues(tenantId: string, resolved?: boolean) {
  return prisma.dataQualityIssue.findMany({
    where: {
      tenantId,
      ...(resolved !== undefined ? { resolved } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

export async function resolveQualityIssue(issueId: string, tenantId: string) {
  return prisma.dataQualityIssue.update({
    where: { id: issueId },
    data: { resolved: true, resolvedAt: new Date() },
  });
}

export async function getConnectorSyncLogs(tenantId: string, connectorName?: string) {
  return prisma.connectorSyncLog.findMany({
    where: {
      tenantId,
      ...(connectorName ? { connectorName } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
