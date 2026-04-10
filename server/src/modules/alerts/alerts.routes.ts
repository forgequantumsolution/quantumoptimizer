import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getAlerts, resolveAlert } from './alerts.controller';

const router = Router();
router.use(authenticate);
router.get('/', getAlerts);
router.patch('/:id/resolve', resolveAlert);

export default router;
