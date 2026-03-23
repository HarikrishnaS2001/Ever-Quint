/**
 * Booking controller handling HTTP requests for booking operations
 */

import { Request, Response } from "express";
import { bookingService } from "../services/booking-service";
import {
  CreateBookingRequest,
  ListBookingsQuery,
  HTTP_STATUS,
} from "../models/types";
import {
  createBookingSchema,
  listBookingsQuerySchema,
  idempotencyKeySchema,
} from "../models/validation";

export class BookingController {
  /**
   * POST /bookings - Create a new booking with optional idempotency
   */
  async createBooking(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = createBookingSchema.validate(req.body);
      if (error) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "ValidationError",
          message: error.details[0].message,
        });
        return;
      }

      const createBookingRequest: CreateBookingRequest = value;

      // Handle idempotency key if provided
      let idempotencyKey: string | undefined;
      const idempotencyHeader = req.get("Idempotency-Key");

      if (idempotencyHeader) {
        const { error: keyError, value: keyValue } =
          idempotencyKeySchema.validate(idempotencyHeader);
        if (keyError) {
          res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: "ValidationError",
            message: keyError.message,
          });
          return;
        }
        idempotencyKey = keyValue;
      }

      // Create booking via service
      const booking = await bookingService.createBooking(
        createBookingRequest,
        idempotencyKey,
      );

      res.status(HTTP_STATUS.CREATED).json(booking);
    } catch (error: any) {
      if (error.message.includes("not found")) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: "NotFoundError",
          message: error.message,
        });
      } else if (
        error.message.includes("working hours") ||
        error.message.includes("overlapping") ||
        error.message.includes("duration")
      ) {
        res.status(HTTP_STATUS.CONFLICT).json({
          error: "ConflictError",
          message: error.message,
        });
      } else {
        console.error("Error creating booking:", error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          error: "InternalServerError",
          message: "An unexpected error occurred",
        });
      }
    }
  }

  /**
   * GET /bookings - List bookings with filtering and pagination
   */
  async listBookings(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const { error, value } = listBookingsQuerySchema.validate(req.query);
      if (error) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "ValidationError",
          message: error.details[0].message,
        });
        return;
      }

      const query: ListBookingsQuery = value;

      // Get bookings via service
      const result = await bookingService.listBookings(query);

      res.status(HTTP_STATUS.OK).json(result);
    } catch (error: any) {
      console.error("Error listing bookings:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: "InternalServerError",
        message: "An unexpected error occurred",
      });
    }
  }

  /**
   * POST /bookings/:id/cancel - Cancel a booking
   */
  async cancelBooking(req: Request, res: Response): Promise<void> {
    try {
      const bookingId = req.params.id;

      if (!bookingId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "ValidationError",
          message: "Booking ID is required",
        });
        return;
      }

      // Cancel booking via service
      const booking = await bookingService.cancelBooking(bookingId);

      res.status(HTTP_STATUS.OK).json(booking);
    } catch (error: any) {
      if (error.message.includes("not found")) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: "NotFoundError",
          message: error.message,
        });
      } else if (
        error.message.includes("already cancelled") ||
        error.message.includes("cancelled up to")
      ) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "ValidationError",
          message: error.message,
        });
      } else {
        console.error("Error cancelling booking:", error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          error: "InternalServerError",
          message: "An unexpected error occurred",
        });
      }
    }
  }
}

// Export singleton instance
export const bookingController = new BookingController();
