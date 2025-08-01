import { Router } from 'express';
import { generateSequence, status } from '../controllers/aiController';

const router = Router();

router.get('/status', status);
router.post('/generate-sequence', generateSequence);

export default router;