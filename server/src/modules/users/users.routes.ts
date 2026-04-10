import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getMe, listUsers } from './users.controller';

const router = Router();
router.use(authenticate);
router.get('/me', getMe);
router.get('/', listUsers);

export default router;
