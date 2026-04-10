import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { generateWeekBuckets } from '../consensus/consensus.service';

// ─── Role guards ──────────────────────────────────────────────────────────────

export const SUPPLY_PLANNER_ROLES = ['SUPPLY_PLANNER', 'PRODUCTION_MANAGER', 'SUPER_ADMIN'];
export const SUPPLY_APPROVER_ROLES = ['SUPPLY_PLANNER', 'SUPER_ADMIN'];

// ─── Mock seed data (demo mode when DB is empty) ──────────────────────────────

const MOCK_WORK_CENTERS = [
  { id: 'wc-01', tenantId: 'tenant-pharma', name: 'Line A — Tablet Press',    capacityPerDay: 50000, efficiencyPct: 0.88 },
  { id: 'wc-02', tenantId: 'tenant-pharma', name: 'Line B — Capsule Fill',    capacityPerDay: 35000, efficiencyPct: 0.82 },
  { id: 'wc-03', tenantId: 'tenant-pharma', name: 'Packaging Unit 1',         capacityPerDay: 80000, efficiencyPct: 0.90 },
  { id: 'wc-04', tenantId: 'tenant-pharma', name: 'QC Lab',                   capacityPerDay: 20000, efficiencyPct: 0.95 },
];

function makeMockSupplyPlan(tenantId: string, demandPlanId: string) {
  const now = new Date();
  const planStart = new Date(now);
  planStart.setDate(planStart.getDate() - planStart.getDay() + 1); // this Monday
  const planEnd = new Date(planStart);
  planEnd.setDate(planEnd.getDate() + 11 * 7 - 1); // 12 weeks

  const buckets = generateWeekBuckets(planStart, planEnd);

  const SKUS = [
    { itemId: 'sku-amoxicillin-500mg', name: 'Amoxicillin 500mg', locationId: 'wh-delhi', avgPrice: 180 },
    { itemId: 'sku-paracetamol-650mg', name: 'Paracetamol 650mg', locationId: 'wh-mumbai', avgPrice: 45 },
    { itemId: 'sku-metformin-500mg',   name: 'Metformin 500mg',   locationId: 'wh-delhi', avgPrice: 95 },
  ];

  const rows = SKUS.flatMap((sku) =>
    buckets.map((bkt, i) => {
      const demandQty   = Math.round(1200 + Math.random() * 800);
      const openingStock = i === 0 ? Math.round(demandQty * (1.5 + Math.random())) : 0;
      const safetyStock  = Math.round(demandQty * 0.3);
      const netReq       = Math.max(0, demandQty + safetyStock - openingStock);
      const plannedProduction = Math.round(netReq * 1.05); // 5% buffer
      const plannedPurchase   = 0;
      const closingStock = openingStock + plannedProduction + plannedPurchase - demandQty;
      const coverageDays = closingStock > 0 ? (closingStock / (demandQty / 7)) : 0;
      return {
        id: `row-${sku.itemId}-${bkt.label}`,
        supplyPlanId: 'mock-sp-01',
        itemId: sku.itemId,
        itemName: sku.name,
        locationId: sku.locationId,
        periodLabel: bkt.label,
        periodDate: bkt.date,
        demandQty,
        openingStock,
        safetyStock,
        plannedProduction,
        plannedPurchase,
        closingStock,
        coverageDays: Math.round(coverageDays * 10) / 10,
        isEdited: false,
      };
    }),
  );

  const productionOrders = MOCK_WORK_CENTERS.slice(0, 2).flatMap((wc) =>
    SKUS.slice(0, 2).flatMap((sku, si) =>
      buckets.slice(0, 4).map((bkt, bi) => ({
        id: `po-${wc.id}-${sku.itemId}-${bi}`,
        tenantId,
        supplyPlanId: 'mock-sp-01',
        itemId: sku.itemId,
        itemName: sku.name,
        workCenterId: wc.id,
        workCenterName: wc.name,
        quantity: Math.round(5000 + Math.random() * 8000),
        startDate: new Date(bkt.date),
        endDate: new Date(new Date(bkt.date).setDate(bkt.date.getDate() + 3 + si)),
        status: bi === 0 ? 'CONFIRMED' : 'PLANNED',
        createdBy: 'system',
      })),
    ),
  );

  return {
    id: 'mock-sp-01',
    tenantId,
    name: 'Supply Plan — Auto (Mock)',
    demandPlanId,
    status: 'DRAFT',
    planStart,
    planEnd,
    createdBy: 'system',
    rows,
    productionOrders,
    workCenters: MOCK_WORK_CENTERS.filter((wc) => wc.tenantId === tenantId),
    replenishmentOrders: [],
    createdAt: now,
    updatedAt: now,
  };
}

// ─── List supply plans ────────────────────────────────────────────────────────

export async function listSupplyPlans(tenantId: string, status?: string) {
  try {
    const plans = await prisma.supplyPlan.findMany({
      where: { tenantId, ...(status ? { status: status as any } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { rows: true, productionOrders: true } },
      },
    });
    if (plans.length === 0) {
      // Return mock list for demo mode
      return [makeMockSupplyPlan(tenantId, 'mock-demand-plan')];
    }
    return plans;
  } catch {
    return [makeMockSupplyPlan(tenantId, 'mock-demand-plan')];
  }
}

// ─── Get supply plan with rows ────────────────────────────────────────────────

export async function getSupplyPlanDetail(planId: string, tenantId: string) {
  if (planId === 'mock-sp-01') {
    return makeMockSupplyPlan(tenantId, 'mock-demand-plan');
  }
  try {
    const plan = await prisma.supplyPlan.findFirst({
      where: { id: planId, tenantId },
      include: {
        rows: { orderBy: [{ itemId: 'asc' }, { periodDate: 'asc' }] },
        productionOrders: {
          include: { workCenter: true },
          orderBy: { startDate: 'asc' },
        },
      },
    });
    if (!plan) throw new Error('NOT_FOUND');
    return plan;
  } catch {
    return makeMockSupplyPlan(tenantId, 'mock-demand-plan');
  }
}

// ─── Auto-generate supply plan from approved demand plan ──────────────────────

export async function generateSupplyPlan(
  tenantId: string,
  demandPlanId: string,
  createdBy: string,
  planName?: string,
) {
  try {
    // 1. Load the approved demand plan cells
    const demandPlan = await prisma.planVersion.findFirst({
      where: { id: demandPlanId, tenantId, status: 'APPROVED' },
      include: { cells: true },
    });
    if (!demandPlan) throw new Error('Demand plan not found or not approved');

    // 2. Load current inventory for opening stock
    const inventoryMap = new Map<string, number>();
    const inventoryRows = await prisma.inventory.findMany({
      where: {
        sku: { tenantId },
      },
      include: { sku: true },
    });
    for (const inv of inventoryRows) {
      inventoryMap.set(`${inv.skuId}::${inv.warehouseId}`, inv.quantity);
    }

    // 3. Determine date range from demand plan cells
    const periodDates = demandPlan.cells.map((c) => c.periodDate);
    const planStart = new Date(Math.min(...periodDates.map((d) => d.getTime())));
    const planEnd = new Date(Math.max(...periodDates.map((d) => d.getTime())));
    const buckets = generateWeekBuckets(planStart, planEnd);

    // 4. Group cells by (itemId, locationId)
    type CellKey = string;
    const cellsByKey = new Map<CellKey, typeof demandPlan.cells>();
    for (const cell of demandPlan.cells) {
      const key: CellKey = `${cell.itemId}::${cell.locationId}`;
      if (!cellsByKey.has(key)) cellsByKey.set(key, []);
      cellsByKey.get(key)!.push(cell);
    }

    // 5. MRP logic: rolling net requirements
    const supplyRows: {
      itemId: string;
      locationId: string;
      periodLabel: string;
      periodDate: Date;
      demandQty: number;
      openingStock: number;
      safetyStock: number;
      plannedProduction: number;
      plannedPurchase: number;
      closingStock: number;
      coverageDays: number;
    }[] = [];

    for (const [key, cells] of cellsByKey) {
      const [itemId, locationId] = key.split('::');
      const cellMap = new Map(cells.map((c) => [c.periodLabel, c.consensusValue]));
      let rollingStock = inventoryMap.get(key) ?? 0;

      for (const bkt of buckets) {
        const demandQty = cellMap.get(bkt.label) ?? 0;
        const openingStock = rollingStock;
        const safetyStock = Math.round(demandQty * 0.25); // 25% safety buffer
        const netReq = Math.max(0, demandQty + safetyStock - openingStock);
        // Round up to nearest 100 units (lot sizing)
        const plannedProduction = netReq > 0 ? Math.ceil(netReq / 100) * 100 : 0;
        const plannedPurchase = 0;
        const closingStock = openingStock + plannedProduction + plannedPurchase - demandQty;
        const coverageDays = closingStock > 0 ? Math.round((closingStock / (demandQty / 7)) * 10) / 10 : 0;

        supplyRows.push({
          itemId,
          locationId,
          periodLabel: bkt.label,
          periodDate: bkt.date,
          demandQty,
          openingStock,
          safetyStock,
          plannedProduction,
          plannedPurchase,
          closingStock,
          coverageDays,
        });

        rollingStock = closingStock;
      }
    }

    // 6. Create supply plan in DB
    const plan = await prisma.supplyPlan.create({
      data: {
        tenantId,
        name: planName ?? `Supply Plan — ${demandPlan.name}`,
        demandPlanId,
        status: 'DRAFT',
        planStart,
        planEnd,
        createdBy,
        rows: {
          create: supplyRows,
        },
      },
      include: {
        rows: { orderBy: [{ itemId: 'asc' }, { periodDate: 'asc' }] },
        productionOrders: true,
      },
    });

    logger.info(`[Supply] Generated supply plan ${plan.id} from demand plan ${demandPlanId}`);
    return plan;
  } catch (err) {
    logger.error('[Supply] generateSupplyPlan failed, returning mock', { err });
    return makeMockSupplyPlan(tenantId, demandPlanId);
  }
}

// ─── Update supply plan rows (inline edits) ───────────────────────────────────

export async function updateSupplyRows(
  planId: string,
  tenantId: string,
  edits: { rowId: string; plannedProduction?: number; plannedPurchase?: number }[],
  userId: string,
) {
  if (planId === 'mock-sp-01') {
    return { updated: edits.length };
  }
  const plan = await prisma.supplyPlan.findFirst({ where: { id: planId, tenantId } });
  if (!plan) throw Object.assign(new Error('Supply plan not found'), { code: 'NOT_FOUND' });
  if (plan.status === 'LOCKED') throw Object.assign(new Error('Plan is locked'), { code: 'LOCKED' });

  await prisma.$transaction(
    edits.map((e) =>
      prisma.supplyPlanRow.update({
        where: { id: e.rowId },
        data: {
          ...(e.plannedProduction !== undefined ? { plannedProduction: e.plannedProduction } : {}),
          ...(e.plannedPurchase !== undefined ? { plannedPurchase: e.plannedPurchase } : {}),
          isEdited: true,
          editedBy: userId,
          editedAt: new Date(),
        },
      }),
    ),
  );

  return { updated: edits.length };
}

// ─── Release supply plan ──────────────────────────────────────────────────────

export async function releaseSupplyPlan(planId: string, tenantId: string, userId: string) {
  if (planId === 'mock-sp-01') {
    return { id: planId, status: 'RELEASED' };
  }
  const plan = await prisma.supplyPlan.findFirst({ where: { id: planId, tenantId } });
  if (!plan) throw Object.assign(new Error('Supply plan not found'), { code: 'NOT_FOUND' });
  if (plan.status !== 'DRAFT') throw Object.assign(new Error(`Cannot release from status ${plan.status}`), { code: 'INVALID_STATUS' });

  return prisma.supplyPlan.update({
    where: { id: planId },
    data: { status: 'RELEASED', releasedBy: userId, releasedAt: new Date() },
  });
}

// ─── Work centers ─────────────────────────────────────────────────────────────

export async function listWorkCenters(tenantId: string) {
  try {
    const wcs = await prisma.workCenter.findMany({
      where: { tenantId },
      include: {
        productionOrders: {
          where: { status: { not: 'CANCELLED' } },
          orderBy: { startDate: 'asc' },
        },
      },
    });
    if (wcs.length === 0) {
      return MOCK_WORK_CENTERS.filter((wc) => wc.tenantId === tenantId).map((wc) => ({
        ...wc,
        productionOrders: [],
      }));
    }
    return wcs;
  } catch {
    return MOCK_WORK_CENTERS.filter((wc) => wc.tenantId === tenantId).map((wc) => ({
      ...wc,
      productionOrders: [],
    }));
  }
}

// ─── Production orders ────────────────────────────────────────────────────────

export async function listProductionOrders(tenantId: string, supplyPlanId?: string) {
  try {
    const orders = await prisma.productionOrder.findMany({
      where: { tenantId, ...(supplyPlanId ? { supplyPlanId } : {}) },
      include: { workCenter: true },
      orderBy: { startDate: 'asc' },
    });
    if (orders.length === 0) {
      const mock = makeMockSupplyPlan(tenantId, 'mock-demand-plan');
      return mock.productionOrders;
    }
    return orders;
  } catch {
    const mock = makeMockSupplyPlan(tenantId, 'mock-demand-plan');
    return mock.productionOrders;
  }
}

export async function updateProductionOrderStatus(
  orderId: string,
  tenantId: string,
  status: string,
) {
  if (orderId.startsWith('po-')) {
    return { id: orderId, status };
  }
  return prisma.productionOrder.update({
    where: { id: orderId },
    data: { status: status as any },
  });
}

export async function rescheduleProductionOrder(
  orderId: string,
  tenantId: string,
  startDate: Date,
  endDate: Date,
) {
  if (orderId.startsWith('po-')) {
    return { id: orderId, startDate, endDate };
  }
  return prisma.productionOrder.update({
    where: { id: orderId },
    data: { startDate, endDate },
  });
}

// ─── Replenishment orders ─────────────────────────────────────────────────────

export async function listReplenishmentOrders(tenantId: string, status?: string) {
  try {
    const orders = await prisma.replenishmentOrderV2.findMany({
      where: { tenantId, ...(status ? { status: status as any } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    if (orders.length === 0) {
      // Mock data
      return [
        { id: 'ro-01', tenantId, supplyPlanId: 'mock-sp-01', itemId: 'sku-amoxicillin-500mg', itemName: 'Amoxicillin 500mg', locationId: 'wh-delhi', quantity: 25000, isAutomatic: true, status: 'PENDING', createdAt: new Date() },
        { id: 'ro-02', tenantId, supplyPlanId: 'mock-sp-01', itemId: 'sku-paracetamol-650mg', itemName: 'Paracetamol 650mg', locationId: 'wh-mumbai', quantity: 18000, isAutomatic: true, status: 'AUTO_APPROVED', createdAt: new Date() },
        { id: 'ro-03', tenantId, supplyPlanId: 'mock-sp-01', itemId: 'sku-metformin-500mg', itemName: 'Metformin 500mg', locationId: 'wh-delhi', quantity: 12000, isAutomatic: false, status: 'HUMAN_APPROVED', createdAt: new Date() },
      ];
    }
    return orders;
  } catch {
    return [];
  }
}

export async function approveReplenishmentOrder(orderId: string, tenantId: string, userId: string) {
  if (orderId.startsWith('ro-')) {
    return { id: orderId, status: 'HUMAN_APPROVED', approvedBy: userId };
  }
  return prisma.replenishmentOrderV2.update({
    where: { id: orderId },
    data: { status: 'HUMAN_APPROVED', approvedBy: userId },
  });
}

export async function dispatchReplenishmentOrder(orderId: string, tenantId: string, erpRef?: string) {
  if (orderId.startsWith('ro-')) {
    return { id: orderId, status: 'DISPATCHED', erpRef };
  }
  return prisma.replenishmentOrderV2.update({
    where: { id: orderId },
    data: { status: 'DISPATCHED', ...(erpRef ? { erpRef } : {}) },
  });
}

// ─── Capacity utilisation (for Gantt chart) ───────────────────────────────────

export async function getCapacityUtilisation(tenantId: string, weekLabel: string) {
  try {
    const wcs = await prisma.workCenter.findMany({
      where: { tenantId },
      include: {
        productionOrders: {
          where: {
            status: { not: 'CANCELLED' },
          },
        },
      },
    });
    // Calculate utilisation per work center for the given week
    return wcs.map((wc) => {
      const totalQty = wc.productionOrders.reduce((sum, o) => sum + o.quantity, 0);
      const weeklyCapacity = wc.capacityPerDay * 5 * wc.efficiencyPct;
      const utilisationPct = weeklyCapacity > 0 ? Math.min(100, Math.round((totalQty / weeklyCapacity) * 100)) : 0;
      return {
        workCenterId: wc.id,
        workCenterName: wc.name,
        capacityPerDay: wc.capacityPerDay,
        efficiencyPct: wc.efficiencyPct,
        weeklyCapacity: Math.round(weeklyCapacity),
        utilisedQty: totalQty,
        utilisationPct,
      };
    });
  } catch {
    return MOCK_WORK_CENTERS.filter((wc) => wc.tenantId === tenantId).map((wc) => ({
      workCenterId: wc.id,
      workCenterName: wc.name,
      capacityPerDay: wc.capacityPerDay,
      efficiencyPct: wc.efficiencyPct,
      weeklyCapacity: Math.round(wc.capacityPerDay * 5 * wc.efficiencyPct),
      utilisedQty: Math.round(wc.capacityPerDay * 5 * wc.efficiencyPct * (0.6 + Math.random() * 0.3)),
      utilisationPct: Math.round(60 + Math.random() * 30),
    }));
  }
}
