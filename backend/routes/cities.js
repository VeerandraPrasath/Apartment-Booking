// routes/cities.js
import express from 'express';
import { getAllCities, createCity ,EditCity,deleteCity,getAvailabilityByCityId} from '../controllers/citiesController.js';

const router = express.Router();

router.get('/', getAllCities);
router.post('/', createCity);
router.put('/:id',EditCity)
router.delete('/:id',deleteCity)
router.post('/:cityId',getAvailabilityByCityId)

export default router;
