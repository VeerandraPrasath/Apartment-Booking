import express from 'express';
import {
getCityAvailability,
checkAvailability
} from '../controllers/availabilityController.js';

const router = express.Router();

router.post('/check/:cityId', checkAvailability);

router.post('/city/:cityId', getCityAvailability);

export default router;