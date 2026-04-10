import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  getPlans, postCreatePlan, getPlan, getWeekBuckets,
  patchCells, postSubmit, postApprove, postReject,
  getCellCommentsHandler, postCellComment,
  getAnalogues,
} from './consensus.controller';

const router = Router();
router.use(authenticate);

// Plan CRUD
router.get('/', getPlans);
router.post('/', postCreatePlan);
router.get('/buckets', getWeekBuckets);
router.get('/npi/analogues', getAnalogues);

// Plan detail & workflow (must come after static routes)
router.get('/:id', getPlan);
router.patch('/:id/cells', patchCells);
router.post('/:id/submit', postSubmit);
router.post('/:id/approve', postApprove);
router.post('/:id/reject', postReject);

// Cell comments
router.get('/cells/:cellId/comments', getCellCommentsHandler);
router.post('/cells/:cellId/comments', postCellComment);

export default router;
