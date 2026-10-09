import { Router } from 'express';
import { getMeters, getMeterDetail, getMeterLocation, getMeterConsumption } from '../controllers/meter.controller';

const router = Router();

router.get('/', getMeters);
router.get('/:meterId', getMeterDetail);
router.get('/:meterId/location', getMeterLocation);
router.get('/:meterId/consumption', getMeterConsumption);

export default router;
