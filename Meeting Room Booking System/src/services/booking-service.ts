/**
 * Booking service containing business logic for booking management
 */

import { v4 as uuidv4 } from "uuid";
import {
  Booking,
  BookingStatus,
  CreateBookingRequest,
  ListBookingsQuery,
  BUSINESS_RULES,
} from "../models/types";
import { storage, StorageInterface } from "../storage/in-memory-storage";
import { RoomService } from "./room-service";
import {
  isValidBookingTimeRange,
  doTimeRangesOverlap,
  canCancelBooking,
  parseISODate,
  getRoomNotFoundError,
  getBookingNotFoundError,
} from "../utils/business-utils";

export class BookingService {
  constructor(
    private storageService: StorageInterface = storage,
    private roomService: RoomService = new RoomService(storage),
  ) {}

  /**
   * Create a new booking with full validation
   */
  async createBooking(
    request: CreateBookingRequest,
    idempotencyKey?: string,
  ): Promise<Booking> {
    // Handle idempotency if key is provided
    if (idempotencyKey) {
      const existingBooking = await this.storageService.getIdempotentBooking(
        idempotencyKey,
        request.organizerEmail,
      );
      if (existingBooking) {
        return existingBooking;
      }
    }

    // Parse dates
    const startTime = parseISODate(request.startTime);
    const endTime = parseISODate(request.endTime);

    // Convert roomId to string for consistent handling
    const roomId = String(request.roomId);

    // Validate room exists
    const roomExists = await this.roomService.roomExists(roomId);
    if (!roomExists) {
      throw new Error(getRoomNotFoundError(roomId));
    }

    // Validate business rules
    await this.validateBookingBusinessRules(roomId, startTime, endTime);

    // Create booking object
    const booking: Booking = {
      id: uuidv4(),
      roomId,
      title: request.title.trim(),
      organizerEmail: request.organizerEmail.toLowerCase().trim(),
      startTime,
      endTime,
      status: BookingStatus.CONFIRMED,
      createdAt: new Date(),
    };

    // Store the booking
    const createdBooking = await this.storageService.createBooking(booking);

    // Store idempotency mapping if key was provided
    if (idempotencyKey) {
      await this.storageService.setIdempotentBooking(
        idempotencyKey,
        request.organizerEmail,
        createdBooking,
      );
    }

    return createdBooking;
  }

  /**
   * Validate all booking business rules
   */
  private async validateBookingBusinessRules(
    roomId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    // Validate working hours
    if (!isValidBookingTimeRange(startTime, endTime)) {
      throw new Error(
        `Bookings only allowed Mon-Fri, ${BUSINESS_RULES.WORKING_HOURS_START}-${BUSINESS_RULES.WORKING_HOURS_END} (room's local time)`,
      );
    }

    // Check for overlapping bookings
    const overlappingBookings = await this.findOverlappingBookings(
      roomId,
      startTime,
      endTime,
    );

    if (overlappingBookings.length > 0) {
      throw new Error("No overlapping confirmed bookings for the same roomId");
    }
  }

  /**
   * Find overlapping confirmed bookings for a room in a time range
   */
  private async findOverlappingBookings(
    roomId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ): Promise<Booking[]> {
    const allBookings = await this.storageService.listBookings();

    return allBookings.filter((booking) => {
      // Skip cancelled bookings
      if (booking.status === BookingStatus.CANCELLED) {
        return false;
      }

      // Skip the booking being excluded (for updates)
      if (excludeBookingId && booking.id === excludeBookingId) {
        return false;
      }

      // Only check bookings for the same room
      if (booking.roomId !== roomId) {
        return false;
      }

      // Check for time overlap
      return doTimeRangesOverlap(
        booking.startTime,
        booking.endTime,
        startTime,
        endTime,
      );
    });
  }

  /**
   * List bookings with filtering and pagination
   */
  async listBookings(query: ListBookingsQuery = {}): Promise<{
    items: Booking[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const allBookings = await this.storageService.listBookings();

    let filteredBookings = allBookings;

    // Filter by room ID if specified
    if (query.roomId) {
      filteredBookings = filteredBookings.filter(
        (booking) => booking.roomId === query.roomId,
      );
    }

    // Filter by date range if specified
    if (query.from || query.to) {
      const fromDate = query.from ? parseISODate(query.from) : new Date(0);
      const toDate = query.to
        ? parseISODate(query.to)
        : new Date(8640000000000000); // Max date

      filteredBookings = filteredBookings.filter((booking) => {
        return booking.startTime < toDate && booking.endTime > fromDate;
      });
    }

    // Sort by start time (most recent first)
    filteredBookings.sort(
      (a, b) => b.startTime.getTime() - a.startTime.getTime(),
    );

    // Apply pagination
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    const paginatedItems = filteredBookings.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total: filteredBookings.length,
      limit,
      offset,
    };
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId: string): Promise<Booking | null> {
    return await this.storageService.getBookingById(bookingId);
  }

  /**
   * Cancel a booking with validation
   */
  async cancelBooking(bookingId: string): Promise<Booking> {
    const booking = await this.storageService.getBookingById(bookingId);
    if (!booking) {
      throw new Error(getBookingNotFoundError(bookingId));
    }

    // Check if booking is already cancelled
    if (booking.status === BookingStatus.CANCELLED) {
      throw new Error("Booking is already cancelled");
    }

    // Check if booking can still be cancelled (grace period)
    if (!canCancelBooking(booking)) {
      throw new Error(
        `A booking can only be cancelled up to ${BUSINESS_RULES.CANCELLATION_GRACE_PERIOD_MINUTES} minutes before startTime. After that, cancellation returns 400 with a clear message.`,
      );
    }

    // Update booking status
    const cancelledBooking = await this.storageService.updateBooking(
      bookingId,
      {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    );

    if (!cancelledBooking) {
      throw new Error("Failed to cancel booking");
    }

    return cancelledBooking;
  }
}

// Export singleton instance
export const bookingService = new BookingService();
