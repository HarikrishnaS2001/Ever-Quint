/**
 * Unit tests for business utilities and rules
 */

import {
  isWithinWorkingHours,
  doTimeRangesOverlap,
  getBookingDurationMinutes,
  canCancelBooking,
  calculateTotalBusinessHours,
} from "../src/utils/business-utils";

describe("Business Utils", () => {
  describe("isWithinWorkingHours", () => {
    test("should return true for Monday 10:00", () => {
      // Find next Monday from today
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7));
      monday.setHours(10, 0, 0, 0);
      expect(isWithinWorkingHours(monday)).toBe(true);
    });

    test("should return false for Saturday 10:00", () => {
      // Find next Saturday from today
      const today = new Date();
      const saturday = new Date(today);
      saturday.setDate(today.getDate() + ((6 + 7 - today.getDay()) % 7));
      saturday.setHours(10, 0, 0, 0);
      expect(isWithinWorkingHours(saturday)).toBe(false);
    });

    test("should return false for Sunday 10:00", () => {
      // Find next Sunday from today
      const today = new Date();
      const sunday = new Date(today);
      sunday.setDate(today.getDate() + ((0 + 7 - today.getDay()) % 7));
      sunday.setHours(10, 0, 0, 0);
      expect(isWithinWorkingHours(sunday)).toBe(false);
    });

    test("should return false for Monday 7:00 (before working hours)", () => {
      // Find next Monday from today
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7));
      monday.setHours(7, 0, 0, 0);
      expect(isWithinWorkingHours(monday)).toBe(false);
    });

    test("should return false for Monday 20:00 (at end of working hours)", () => {
      // Find next Monday from today
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7));
      monday.setHours(20, 0, 0, 0);
      expect(isWithinWorkingHours(monday)).toBe(false);
    });

    test("should return true for Friday 19:59", () => {
      // Find next Friday from today
      const today = new Date();
      const friday = new Date(today);
      friday.setDate(today.getDate() + ((5 + 7 - today.getDay()) % 7));
      friday.setHours(19, 59, 0, 0);
      expect(isWithinWorkingHours(friday)).toBe(true);
    });
  });

  describe("doTimeRangesOverlap", () => {
    test("should return true for overlapping ranges", () => {
      const baseDate = new Date();
      const start1 = new Date(baseDate.getTime() + 60 * 60 * 1000); // +1 hour
      const end1 = new Date(baseDate.getTime() + 3 * 60 * 60 * 1000); // +3 hours
      const start2 = new Date(baseDate.getTime() + 2 * 60 * 60 * 1000); // +2 hours
      const end2 = new Date(baseDate.getTime() + 4 * 60 * 60 * 1000); // +4 hours

      expect(doTimeRangesOverlap(start1, end1, start2, end2)).toBe(true);
    });

    test("should return false for non-overlapping ranges", () => {
      const baseDate = new Date();
      const start1 = new Date(baseDate.getTime() + 60 * 60 * 1000); // +1 hour
      const end1 = new Date(baseDate.getTime() + 3 * 60 * 60 * 1000); // +3 hours
      const start2 = new Date(baseDate.getTime() + 3 * 60 * 60 * 1000); // +3 hours
      const end2 = new Date(baseDate.getTime() + 5 * 60 * 60 * 1000); // +5 hours

      expect(doTimeRangesOverlap(start1, end1, start2, end2)).toBe(false);
    });

    test("should return true for contained range", () => {
      const baseDate = new Date();
      const start1 = new Date(baseDate.getTime() + 60 * 60 * 1000); // +1 hour
      const end1 = new Date(baseDate.getTime() + 5 * 60 * 60 * 1000); // +5 hours
      const start2 = new Date(baseDate.getTime() + 2 * 60 * 60 * 1000); // +2 hours
      const end2 = new Date(baseDate.getTime() + 3 * 60 * 60 * 1000); // +3 hours

      expect(doTimeRangesOverlap(start1, end1, start2, end2)).toBe(true);
    });

    test("should return false for adjacent ranges", () => {
      const baseDate = new Date();
      const start1 = new Date(baseDate.getTime() + 60 * 60 * 1000); // +1 hour
      const end1 = new Date(baseDate.getTime() + 2 * 60 * 60 * 1000); // +2 hours
      const start2 = new Date(baseDate.getTime() + 2 * 60 * 60 * 1000); // +2 hours
      const end2 = new Date(baseDate.getTime() + 3 * 60 * 60 * 1000); // +3 hours

      expect(doTimeRangesOverlap(start1, end1, start2, end2)).toBe(false);
    });
  });

  describe("getBookingDurationMinutes", () => {
    test("should calculate duration correctly", () => {
      const baseDate = new Date();
      const start = new Date(baseDate.getTime());
      const end = new Date(baseDate.getTime() + 30 * 60 * 1000); // +30 minutes

      expect(getBookingDurationMinutes(start, end)).toBe(30);
    });

    test("should handle hour durations", () => {
      const baseDate = new Date();
      const start = new Date(baseDate.getTime());
      const end = new Date(baseDate.getTime() + 120 * 60 * 1000); // +120 minutes

      expect(getBookingDurationMinutes(start, end)).toBe(120);
    });
  });

  describe("canCancelBooking", () => {
    test("should allow cancellation when within grace period", () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 2.5 * 60 * 60 * 1000); // 2.5 hours later
      const createdAt = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

      // Use jest.useFakeTimers to control time
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const booking = { startTime, createdAt };
      expect(canCancelBooking(booking)).toBe(true);

      jest.useRealTimers();
    });

    test("should not allow cancellation when outside grace period", () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes later (less than 1 hour)
      const createdAt = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

      // Use jest.useFakeTimers to control time
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const booking = { startTime, createdAt };
      expect(canCancelBooking(booking)).toBe(false);

      jest.useRealTimers();
    });
  });

  describe("calculateTotalBusinessHours", () => {
    test("should calculate single day business hours", () => {
      // Create a Monday date dynamically
      const today = new Date();
      const monday = new Date(today);
      // Get next Monday (or today if it's Monday)
      monday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));

      const fromDate = new Date(monday);
      fromDate.setHours(8, 0, 0, 0); // 8AM

      const toDate = new Date(monday);
      toDate.setHours(20, 0, 0, 0); // 8PM

      expect(calculateTotalBusinessHours(fromDate, toDate)).toBe(12);
    });

    test("should skip weekends", () => {
      // Create a Monday and Wednesday date dynamically
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));

      const fromDate = new Date(monday);
      fromDate.setHours(8, 0, 0, 0); // Monday 8AM

      const wednesday = new Date(monday);
      wednesday.setDate(monday.getDate() + 2); // Wednesday
      const toDate = new Date(wednesday);
      toDate.setHours(20, 0, 0, 0); // Wednesday 8PM

      // Should be 3 full business days (Mon, Tue, Wed) = 36 hours
      expect(calculateTotalBusinessHours(fromDate, toDate)).toBe(36);
    });

    test("should handle partial days", () => {
      // Create a Monday date dynamically
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));

      const fromDate = new Date(monday);
      fromDate.setHours(10, 0, 0, 0); // Monday 10AM

      const toDate = new Date(monday);
      toDate.setHours(15, 0, 0, 0); // Monday 3PM

      expect(calculateTotalBusinessHours(fromDate, toDate)).toBe(5);
    });

    test("should handle cross-weekend periods", () => {
      // Create a Friday and next Monday date dynamically
      const today = new Date();
      const friday = new Date(today);
      friday.setDate(today.getDate() + ((5 + 7 - today.getDay()) % 7 || 7));

      const fromDate = new Date(friday);
      fromDate.setHours(8, 0, 0, 0); // Friday 8AM

      const monday = new Date(friday);
      monday.setDate(friday.getDate() + 3); // Next Monday
      const toDate = new Date(monday);
      toDate.setHours(20, 0, 0, 0); // Monday 8PM

      // Should be 2 full business days (Fri, Mon) = 24 hours
      expect(calculateTotalBusinessHours(fromDate, toDate)).toBe(24);
    });
  });
});
