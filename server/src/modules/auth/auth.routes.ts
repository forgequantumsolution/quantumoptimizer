import { Router } from 'express';
import { login, demoRequest } from './auth.controller';

const router = Router();

router.post('/login', login);
router.post('/demo-request', demoRequest);

export default router;
