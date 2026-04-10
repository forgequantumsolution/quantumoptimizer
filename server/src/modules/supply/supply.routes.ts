import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  getSupplyPlans,
  postGeneratePlan,
  getSupplyPlan,
  patchSupplyRows,
  postReleasePlan,
  getWorkCenters,
  getCapacity,
  getProductionOrders,
  patchProductionStatus,
  patchReschedule,
  getReplenishmentOrders,
  postApproveReplenishment,
  postDispatchReplenishment,
} from './supply.controller';

const router = Router();
router.use(authenticate);

// ─── Supply Plans ─────────────────────────────────────────────────────────────
router.get('/', getSupplyPlans);
router.post('/', postGeneratePlan);

// ─── Static sub-routes (must come before /:id) ───────────────────────────────
router.get('/work-centers', getWorkCenters);
router.get('/capacity', getCapacity);
router.get('/production-orders', getProductionOrders);
router.get('/replenishment', getReplenishmentOrders);

// ─── Supply Plan detail & workflow ───────────────────────────────────────────
router.get('/:id', getSupplyPlan);
router.patch('/:id/rows', patchSupplyRows);
router.post('/:id/release', postReleasePlan);

// ─── Production order actions ────────────────────────────────────────────────
router.patch('/production-orders/:orderId/status', patchProductionStatus);
router.patch('/production-orders/:orderId/reschedule', patchReschedule);

// ─── Replenishment order actions ─────────────────────────────────────────────
router.post('/replenishment/:orderId/approve', postApproveReplenishment);
router.post('/replenishment/:orderId/dispatch', postDispatchReplenishment);

export default router;
