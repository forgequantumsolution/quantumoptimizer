import { prisma } from '../../config/database';
import { eventBus } from '../../events/eventBus';
import { logger } from '../../config/logger';

// ─── Roles allowed to edit plan cells ────────────────────────────────────────
export const EDITOR_ROLES = ['SUPPLY_PLANNER', 'SUPER_ADMIN'];
export const APPROVER_ROLES = ['FINANCE', 'SUPER_ADMIN'];

// ─── Week utilities ───────────────────────────────────────────────────────────

function getISOWeek(date: Date): number {
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
    )
  );
}

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function generateWeekBuckets(start: Date, end: Date): { label: string; date: Date }[] {
  const buckets: { label: string; date: Date }[] = [];
  const current = getMondayOf(start);
  const endMonday = getMondayOf(end);
  while (current <= endMonday) {
    const year = current.getFullYear();
    const week = getISOWeek(current);
    buckets.push({
      label: `${year}-W${String(week).padStart(2, '0')}`,
      date: new Date(current),
    });
    current.setDate(current.getDate() + 7);
  }
  return buckets;
}

// ─── Plan CRUD ────────────────────────────────────────────────────────────────

export async function listPlans(tenantId: string, status?: string) {
  return prisma.planVersion.findMany({
    where: {
      tenantId,
      ...(status ? { status: status as any } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      approvals: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { cells: true } },
    },
  });
}

export async function createPlan(
  tenantId: string,
  userId: string,
  data: {
    name: string;
    periodStart: Date;
    periodEnd: Date;
    baselineId?: string;
    locationId: string;
  },
) {
  const { name, periodStart, periodEnd, baselineId, locationId } = data;
  const buckets = generateWeekBuckets(periodStart, periodEnd);

  // Seed cells from ForecastResult (ensemble model) or synthetic baseline
  const forecasts = await prisma.forecastResult.findMany({
    where: {
      tenantId,
      locationId,
      modelUsed: 'ENSEMBLE',
      forecastDate: { gte: periodStart, lte: periodEnd },
    },
    orderBy: { forecastDate: 'asc' },
  });

  // Group forecast by itemId + week label
  const forecastMap = new Map<string, number>();
  for (const f of forecasts) {
    const bucket = getMondayOf(f.forecastDate);
    const week = getISOWeek(bucket);
    const label = `${bucket.getFullYear()}-W${String(week).padStart(2, '0')}`;
    const key = `${f.itemId}::${label}`;
    forecastMap.set(key, f.pointForecast);
  }

  // Get prior version cells for baseline comparison
  const priorMap = new Map<string, number>();
  if (baselineId) {
    const priorCells = await prisma.planCell.findMany({
      where: { planVersionId: baselineId },
      select: { itemId: true, periodLabel: true, consensusValue: true },
    });
    for (const c of priorCells) {
      priorMap.set(`${c.itemId}::${c.periodLabel}`, c.consensusValue);
    }
  }

  // Get all active SKUs for this tenant
  const skus = await prisma.sKU.findMany({ where: { tenantId }, select: { id: true } });

  // Create plan + cells in transaction
  const plan = await prisma.planVersion.create({
    data: {
      tenantId,
      name,
      periodStart,
      periodEnd,
      status: 'DRAFT',
      baselineId: baselineId || null,
      createdBy: userId,
    },
  });

  // Bulk create cells (SKU × week)
  const AVG_PRICE = 850; // INR placeholder — real price from SKU.price when available
  const cellData = [];
  for (const sku of skus) {
    for (const bucket of buckets) {
      const key = `${sku.id}::${bucket.label}`;
      const statForecast = forecastMap.get(key) ?? (100 + Math.random() * 200);
      const priorValue = priorMap.get(key) ?? null;
      cellData.push({
        planVersionId: plan.id,
        itemId: sku.id,
        locationId,
        periodLabel: bucket.label,
        periodDate: bucket.date,
        statForecast: Math.round(statForecast),
        consensusValue: Math.round(statForecast),
        priorValue,
        revenueImpact: 0,
      });
    }
  }

  // Insert in batches of 500
  for (let i = 0; i < cellData.length; i += 500) {
    await prisma.planCell.createMany({ data: cellData.slice(i, i + 500) });
  }

  return prisma.planVersion.findUnique({
    where: { id: plan.id },
    include: { _count: { select: { cells: true } } },
  });
}

export async function getPlanWithCells(
  planId: string,
  tenantId: string,
  itemFilter?: string,
  periodFilter?: string,
) {
  const plan = await prisma.planVersion.findFirst({
    where: { id: planId, tenantId },
    include: { approvals: { orderBy: { createdAt: 'asc' } } },
  });
  if (!plan) return null;

  const cells = await prisma.planCell.findMany({
    where: {
      planVersionId: planId,
      ...(itemFilter ? { itemId: itemFilter } : {}),
      ...(periodFilter ? { periodLabel: { contains: periodFilter } } : {}),
    },
    include: { _count: { select: { comments: true } } },
    orderBy: [{ itemId: 'asc' }, { periodDate: 'asc' }],
  });

  // Attach SKU metadata
  const skuIds = [...new Set(cells.map((c) => c.itemId))];
  const skus = await prisma.sKU.findMany({
    where: { id: { in: skuIds } },
    select: { id: true, code: true, name: true, category: true },
  });
  const skuMap = new Map(skus.map((s) => [s.id, s]));

  const cellsWithMeta = cells.map((c) => ({ ...c, sku: skuMap.get(c.itemId) }));

  return { plan, cells: cellsWithMeta };
}

// ─── Cell editing ─────────────────────────────────────────────────────────────

export async function upsertCells(
  planVersionId: string,
  tenantId: string,
  userId: string,
  edits: { cellId: string; consensusValue: number }[],
) {
  const plan = await prisma.planVersion.findFirst({ where: { id: planVersionId, tenantId } });
  if (!plan) throw new Error('Plan not found');
  if (plan.status !== 'DRAFT') throw new Error('Only DRAFT plans can be edited');

  const AVG_PRICE = 850;
  const now = new Date();

  await prisma.$transaction(
    edits.map(({ cellId, consensusValue }) =>
      prisma.planCell.update({
        where: { id: cellId },
        data: {
          consensusValue,
          revenueImpact: 0, // will be recalculated below
          editedBy: userId,
          editedAt: now,
        },
      }),
    ),
  );

  // Recalculate revenue impact for changed cells
  const updatedCells = await prisma.planCell.findMany({
    where: { id: { in: edits.map((e) => e.cellId) } },
  });
  await prisma.$transaction(
    updatedCells.map((c) =>
      prisma.planCell.update({
        where: { id: c.id },
        data: { revenueImpact: (c.consensusValue - c.statForecast) * AVG_PRICE },
      }),
    ),
  );

  return { updated: edits.length };
}

// ─── Approval workflow ────────────────────────────────────────────────────────

export async function submitPlan(
  planId: string,
  tenantId: string,
  userId: string,
  userEmail: string,
  userName: string,
) {
  const plan = await prisma.planVersion.findFirst({ where: { id: planId, tenantId } });
  if (!plan) throw new Error('Plan not found');
  if (plan.status !== 'DRAFT') throw new Error('Only DRAFT plans can be submitted');

  const now = new Date();
  await prisma.$transaction([
    prisma.planVersion.update({
      where: { id: planId },
      data: { status: 'SUBMITTED', submittedAt: now, submittedBy: userId },
    }),
    prisma.planApproval.create({
      data: { planVersionId: planId, action: 'SUBMITTED', userId, userEmail, userName },
    }),
    prisma.auditLog.create({
      data: {
        userId,
        action: 'PLAN_SUBMITTED',
        entity: 'PlanVersion',
        entityId: planId,
        metadata: { planName: plan.name },
      },
    }),
  ]);

  return prisma.planVersion.findUnique({ where: { id: planId } });
}

export async function approvePlan(
  planId: string,
  tenantId: string,
  userId: string,
  userEmail: string,
  userName: string,
  note?: string,
) {
  const plan = await prisma.planVersion.findFirst({ where: { id: planId, tenantId } });
  if (!plan) throw new Error('Plan not found');
  if (plan.status !== 'SUBMITTED') throw new Error('Only SUBMITTED plans can be approved');

  const now = new Date();
  await prisma.$transaction([
    prisma.planVersion.update({
      where: { id: planId },
      data: { status: 'APPROVED', reviewedAt: now, reviewedBy: userId, reviewNote: note || null },
    }),
    prisma.planApproval.create({
      data: { planVersionId: planId, action: 'APPROVED', userId, userEmail, userName, note: note || null },
    }),
    prisma.auditLog.create({
      data: {
        userId,
        action: 'PLAN_APPROVED',
        entity: 'PlanVersion',
        entityId: planId,
        metadata: { planName: plan.name, note },
      },
    }),
  ]);

  // Fire event so supply engine can kick off replenishment
  eventBus.emitPlanApproved({ tenantId, planId, approvedBy: userId, timestamp: new Date() });

  return prisma.planVersion.findUnique({ where: { id: planId } });
}

export async function rejectPlan(
  planId: string,
  tenantId: string,
  userId: string,
  userEmail: string,
  userName: string,
  note: string,
) {
  const plan = await prisma.planVersion.findFirst({ where: { id: planId, tenantId } });
  if (!plan) throw new Error('Plan not found');
  if (plan.status !== 'SUBMITTED') throw new Error('Only SUBMITTED plans can be rejected');

  const now = new Date();
  await prisma.$transaction([
    prisma.planVersion.update({
      where: { id: planId },
      data: { status: 'REJECTED', reviewedAt: now, reviewedBy: userId, reviewNote: note },
    }),
    prisma.planApproval.create({
      data: { planVersionId: planId, action: 'REJECTED', userId, userEmail, userName, note },
    }),
    prisma.auditLog.create({
      data: {
        userId,
        action: 'PLAN_REJECTED',
        entity: 'PlanVersion',
        entityId: planId,
        metadata: { planName: plan.name, note },
      },
    }),
  ]);

  return prisma.planVersion.findUnique({ where: { id: planId } });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function getCellComments(cellId: string) {
  return prisma.planCellComment.findMany({
    where: { cellId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function addCellComment(
  cellId: string,
  userId: string,
  userEmail: string,
  userName: string,
  body: string,
) {
  if (!body.trim()) throw new Error('Comment body is required');
  return prisma.planCellComment.create({
    data: { cellId, userId, userEmail, userName, body: body.trim() },
  });
}

// ─── NPI: Analogue-based forecasting ─────────────────────────────────────────

export async function findAnalogueSKUs(tenantId: string, category: string, excludeItemId?: string) {
  const skus = await prisma.sKU.findMany({
    where: {
      tenantId,
      category,
      ...(excludeItemId ? { id: { not: excludeItemId } } : {}),
    },
    select: { id: true, code: true, name: true, category: true },
    take: 10,
  });

  // For each candidate, fetch last 12 weeks of demand history to show profile
  const profiles = await Promise.all(
    skus.map(async (sku) => {
      const history = await prisma.demandHistory.findMany({
        where: {
          tenantId,
          itemId: sku.id,
          date: { gte: new Date(Date.now() - 84 * 86400000) }, // last 12 weeks
        },
        orderBy: { date: 'asc' },
        select: { date: true, quantity: true },
      });
      const avgWeekly =
        history.length > 0
          ? Math.round(history.reduce((s, h) => s + h.quantity, 0) / Math.max(history.length / 7, 1))
          : Math.round(100 + Math.random() * 300);
      return { ...sku, avgWeeklyDemand: avgWeekly, historyWeeks: Math.floor(history.length / 7) };
    }),
  );

  return profiles;
}
