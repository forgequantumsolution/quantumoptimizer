import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getKPIs, getAccuracyTrend, getSkuStatus } from './dashboard.controller';

const router = Router();
router.use(authenticate);
router.get('/kpis', getKPIs);
router.get('/accuracy-trend', getAccuracyTrend);
router.get('/sku-status', getSkuStatus);

export default router;
