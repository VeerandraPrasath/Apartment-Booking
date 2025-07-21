import express from 'express';
import {
getAvailabilityByCityId
} from '../controllers/availabilityController.js';

const router = express.Router();


router.post('/city/:id', getAvailabilityByCityId);
router.get('/', async()=> {
  // This route can be used to get all availability data if needed
  res.status(200).json({ message: "Availability API is working" });

}); // Assuming you want to allow GET requests as well
export default router;