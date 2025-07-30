// routes/cities.js
import express from 'express';
import {exportBookingHistory,getAllPendingRequests,approveRequest,rejectRequest  } from '../controllers/requestController.js';

const router = express.Router();

router.get('/',getAllPendingRequests);
// router.get('/history', getBookingHistory);
router.post('/history/export',exportBookingHistory);
router.post('/:id/approve',approveRequest);
router.post('/:id/reject',rejectRequest);

export default router;