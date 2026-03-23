/**
 * Utility functions for business logic validation and common operations
 */

import { BUSINESS_RULES } from "../models/types";

/**
 * Check if a given datetime falls within working hours (Mon-Fri, 8:00-20:00)
 */
export function isWithinWorkingHours(date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const hour = date.getHours();
  const minute = date.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  // Check if it's a working day (Monday to Friday)
  if (!BUSINESS_RULES.WORKING_DAYS.includes(dayOfWeek as 1 | 2 | 3 | 4 | 5)) {
    return false;
  }

  // Parse working hours
  const [startHour, startMinute] =
    BUSINESS_RULES.WORKING_HOURS_START.split(":").map(Number);
  const [endHour, endMinute] =
    BUSINESS_RULES.WORKING_HOURS_END.split(":").map(Number);

  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;

  return (
    timeInMinutes >= startTimeInMinutes && timeInMinutes < endTimeInMinutes
  );
}

/**
 * Check if a booking time range is valid (within working hours)
 */
export function isValidBookingTimeRange(
  startTime: Date,
  endTime: Date,
): boolean {
  return isWithinWorkingHours(startTime) && isWithinWorkingHours(endTime);
}

/**
 * Check if two time ranges overlap
 */
export function doTimeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Calculate booking duration in minutes
 */
export function getBookingDurationMinutes(
  startTime: Date,
  endTime: Date,
): number {
  return (endTime.getTime() - startTime.getTime()) / (1000 * 60);
}

/**
 * Check if booking can still be cancelled (within grace period)
 */
export function canCancelBooking(booking: {
  startTime: Date;
  createdAt: Date;
}): boolean {
  const now = new Date();
  const gracePeriodEnd = new Date(
    booking.startTime.getTime() -
      BUSINESS_RULES.CANCELLATION_GRACE_PERIOD_MINUTES * 60 * 1000,
  );

  return now <= gracePeriodEnd;
}

/**
 * Calculate total business hours between two dates
 * This is used for utilization reporting
 */
export function calculateTotalBusinessHours(
  fromDate: Date,
  toDate: Date,
): number {
  const msPerHour = 60 * 60 * 1000;

  let totalHours = 0;
  const currentDate = new Date(fromDate);

  while (currentDate < toDate) {
    if (
      BUSINESS_RULES.WORKING_DAYS.includes(
        currentDate.getDay() as 1 | 2 | 3 | 4 | 5,
      )
    ) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(8, 0, 0, 0); // 8AM

      const dayEnd = new Date(currentDate);
      dayEnd.setHours(20, 0, 0, 0); // 8PM

      // Calculate overlap with the reporting period
      const periodStart = dayStart >= fromDate ? dayStart : fromDate;
      const periodEnd = dayEnd <= toDate ? dayEnd : toDate;

      if (periodStart < periodEnd) {
        totalHours += (periodEnd.getTime() - periodStart.getTime()) / msPerHour;
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);
  }

  return totalHours;
}

/**
 * Generate a consistent case-insensitive key for unique constraints
 */
export function normalizeForUniqueness(value: string): string {
  return value.toLowerCase().trim();
}

/**
 * Parse ISO date string safely with error handling
 */
export function parseISODate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  return date;
}

/**
 * Generate error message for room not found
 */
export function getRoomNotFoundError(roomId: string): string {
  return `Room with ID '${roomId}' not found`;
}

/**
 * Generate error message for booking not found
 */
export function getBookingNotFoundError(bookingId: string): string {
  return `Booking with ID '${bookingId}' not found`;
}
