// routes/cities.js
import express from 'express';
import { createBooking,getUserUpcomingBookings ,getBookingHistory } from '../controllers/bookingController.js';

const router = express.Router();

router.post('/', createBooking);
router.get('/history'   , getBookingHistory);
router.get('/user/:userId', getUserUpcomingBookings);
export default router;