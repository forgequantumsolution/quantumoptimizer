import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  listConnectors, syncConnector, getQualityIssues,
  resolveQualityIssue, getSyncLogs
} from './integrations.controller';

const router = Router();
router.use(authenticate);

router.get('/', listConnectors);
router.post('/sync', syncConnector);
router.get('/quality-issues', getQualityIssues);
router.patch('/quality-issues/:id/resolve', resolveQualityIssue);
router.get('/sync-logs', getSyncLogs);

export default router;
