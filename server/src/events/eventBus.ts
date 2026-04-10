import { EventEmitter } from 'events';
import { logger } from '../config/logger';

export interface DataIngestedEvent {
  connectorName: string;
  sourceType: string;
  tenantId: string;
  recordCount: number;
  qualityScore: number;   // 0-100
  timestamp: Date;
}

export interface PlanApprovedEvent {
  planId: string;
  tenantId: string;
  approvedBy: string;
  timestamp: Date;
}

export interface ActualsCapturedEvent {
  tenantId: string;
  periodEnd: Date;
  recordCount: number;
  timestamp: Date;
}

class AppEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  emitDataIngested(payload: DataIngestedEvent) {
    logger.info(`[EventBus] DataIngested — ${payload.connectorName} → ${payload.recordCount} records, quality: ${payload.qualityScore}%`);
    this.emit('DataIngested', payload);
  }

  emitPlanApproved(payload: PlanApprovedEvent) {
    logger.info(`[EventBus] PlanApproved — plan ${payload.planId} by ${payload.approvedBy}`);
    this.emit('PlanApproved', payload);
  }

  emitActualsCaptured(payload: ActualsCapturedEvent) {
    logger.info(`[EventBus] ActualsCaptured — period ending ${payload.periodEnd.toISOString()}`);
    this.emit('ActualsCaptured', payload);
  }

  onDataIngested(handler: (e: DataIngestedEvent) => void) {
    this.on('DataIngested', handler);
  }

  onPlanApproved(handler: (e: PlanApprovedEvent) => void) {
    this.on('PlanApproved', handler);
  }

  onActualsCaptured(handler: (e: ActualsCapturedEvent) => void) {
    this.on('ActualsCaptured', handler);
  }
}

export const eventBus = new AppEventBus();
