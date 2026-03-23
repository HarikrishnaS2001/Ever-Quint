/**
 * Booking routes
 */

import { Router } from "express";
import { bookingController } from "../controllers/booking-controller";

const router = Router();

// POST /bookings - Create a booking
router.post("/", (req, res) => bookingController.createBooking(req, res));

// GET /bookings - List bookings
router.get("/", (req, res) => bookingController.listBookings(req, res));

// POST /bookings/:id/cancel - Cancel a booking
router.post("/:id/cancel", (req, res) =>
  bookingController.cancelBooking(req, res),
);

export default router;
