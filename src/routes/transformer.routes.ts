import { Router } from 'express';
import { getTransformers } from '../controllers/meter.controller';

const router = Router();
router.get('/', getTransformers);

export default router;
