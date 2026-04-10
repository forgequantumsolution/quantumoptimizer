import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getScenarios, createScenario, runScenario } from './scenarios.controller';

const router = Router();
router.use(authenticate);
router.get('/', getScenarios);
router.post('/', createScenario);
router.post('/:id/run', runScenario);

export default router;
