/**
 * Core domain models for the meeting room booking system
 */

export interface Room {
  id: string;
  name: string;
  capacity: number;
  floor: number;
  amenities: string[];
  createdAt: Date;
}

export interface Booking {
  id: string;
  roomId: string;
  title: string;
  organizerEmail: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  createdAt: Date;
  cancelledAt?: Date;
}

export enum BookingStatus {
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
}

export interface CreateRoomRequest {
  name: string;
  capacity: number;
  floor: number;
  amenities: string[];
}

export interface CreateBookingRequest {
  roomId: string | number;
  title: string;
  organizerEmail: string;
  startTime: string; // ISO-8601 format
  endTime: string; // ISO-8601 format
}

export interface CreateBookingRequestWithIdempotency extends CreateBookingRequest {
  idempotencyKey?: string;
}

export interface ListRoomsQuery {
  minCapacity?: number;
  amenity?: string;
}

export interface ListBookingsQuery {
  roomId?: string;
  from?: string; // ISO-8601 format
  to?: string; // ISO-8601 format
  limit?: number;
  offset?: number;
}

export interface RoomUtilizationReport {
  roomId: string;
  roomName: string;
  totalBookingHours: number;
  utilizationPercent: number;
}

export interface UtilizationReportQuery {
  from: string; // required ISO-8601 format
  to: string; // required ISO-8601 format
}

export interface ApiError {
  error: string;
  message: string;
}

export interface ValidationError extends ApiError {
  error: "ValidationError";
}

export interface ConflictError extends ApiError {
  error: "ConflictError";
}

export interface NotFoundError extends ApiError {
  error: "NotFoundError";
}

// HTTP Status codes used in the API
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Business rule constants
export const BUSINESS_RULES = {
  MIN_BOOKING_DURATION_MINUTES: 15,
  MAX_BOOKING_DURATION_HOURS: 4,
  WORKING_HOURS_START: "08:00",
  WORKING_HOURS_END: "20:00",
  WORKING_DAYS: [1, 2, 3, 4, 5] as const, // Monday to Friday
  CANCELLATION_GRACE_PERIOD_MINUTES: 60,
} as const;
