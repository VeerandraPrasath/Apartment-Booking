// routes/cities.js
import express from 'express';
import { createBooking,getUserUpcomingBookings ,getBookingHistory,cancelBooking,getUserBookingHistory } from '../controllers/bookingController.js';

const router = express.Router();

router.post('/', createBooking);
router.get('/history', getBookingHistory);
router.get('history/user/:userId', getUserBookingHistory);
router.get('/user/:userId', getUserUpcomingBookings);
router.patch(':requestId/cancel/:userId', cancelBooking);
export default router;