import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getInventory, getExpiryRisk } from './inventory.controller';

const router = Router();
router.use(authenticate);
router.get('/', getInventory);
router.get('/expiry-risk', getExpiryRisk);

export default router;
