import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  getForecasts, runForecastForItem, getForecastForSku,
  overrideForecast, getAccuracyTrend, getModelPerformance,
} from './forecast.controller';
import { getPromos, createPromo } from './promo.controller';

const router = Router();
router.use(authenticate);

router.get('/', getForecasts);
router.post('/run', runForecastForItem);
router.get('/accuracy-trend', getAccuracyTrend);
router.get('/model-performance', getModelPerformance);
router.get('/promos', getPromos);
router.post('/promos', createPromo);
router.get('/:skuId', getForecastForSku);
router.patch('/:id/override', overrideForecast);

export default router;
