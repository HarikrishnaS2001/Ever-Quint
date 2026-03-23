/**
 * Unit tests for ReportService utilization calculations
 */

import { ReportService } from "../src/services/report-service";
import { RoomService } from "../src/services/room-service";
import { InMemoryStorage } from "../src/storage/in-memory-storage";
import { BookingStatus, UtilizationReportQuery } from "../src/models/types";

describe("ReportService", () => {
  let reportService: ReportService;
  let roomService: RoomService;
  let storage: InMemoryStorage;

  beforeEach(async () => {
    storage = new InMemoryStorage();
    roomService = new RoomService(storage);
    reportService = new ReportService(storage, roomService);

    // Create test rooms
    await storage.createRoom({
      id: "room-1",
      name: "Meeting Room A",
      capacity: 10,
      floor: 1,
      amenities: ["WiFi"],
      createdAt: new Date(),
    });
    await storage.createRoom({
      id: "room-2",
      name: "Conference Room B",
      capacity: 20,
      floor: 2,
      amenities: ["Projector"],
      createdAt: new Date(),
    });
  });

  describe("generateRoomUtilizationReport", () => {
    test("should calculate correct utilization for single day with full booking", async () => {
      // Create booking that covers entire business day
      await storage.createBooking({
        id: "booking-1",
        roomId: "room-1",
        title: "All Day Meeting",
        organizerEmail: "test@example.com",
        startTime: new Date("2024-01-08T08:00:00"), // Monday 8AM
        endTime: new Date("2024-01-08T20:00:00"), // Monday 8PM
        status: BookingStatus.CONFIRMED,
        createdAt: new Date(),
      });

      const query: UtilizationReportQuery = {
        from: "2024-01-08T08:00:00",
        to: "2024-01-08T20:00:00",
      };

      const report = await reportService.generateRoomUtilizationReport(query);

      expect(report).toHaveLength(2); // Both rooms should be in report

      const roomAReport = report.find((r) => r.roomId === "room-1");
      expect(roomAReport).toBeDefined();
      expect(roomAReport!.totalBookingHours).toBe(12);
      expect(roomAReport!.utilizationPercent).toBe(100); // 12/12 hours = 100%

      const roomBReport = report.find((r) => r.roomId === "room-2");
      expect(roomBReport).toBeDefined();
      expect(roomBReport!.totalBookingHours).toBe(0);
      expect(roomBReport!.utilizationPercent).toBe(0);
    });

    test("should handle partial day bookings correctly", async () => {
      // Create 2-hour booking
      await storage.createBooking({
        id: "booking-1",
        roomId: "room-1",
        title: "Partial Day Meeting",
        organizerEmail: "test@example.com",
        startTime: new Date("2024-01-08T10:00:00"), // Monday 10AM
        endTime: new Date("2024-01-08T12:00:00"), // Monday 12PM
        status: BookingStatus.CONFIRMED,
        createdAt: new Date(),
      });

      const query: UtilizationReportQuery = {
        from: "2024-01-08T08:00:00",
        to: "2024-01-08T20:00:00",
      };

      const report = await reportService.generateRoomUtilizationReport(query);
      const roomAReport = report.find((r) => r.roomId === "room-1");

      expect(roomAReport!.totalBookingHours).toBe(2);
      expect(roomAReport!.utilizationPercent).toBe(16.67); // 2/12 hours ≈ 16.67%
    });

    test("should exclude cancelled bookings from utilization", async () => {
      // Create confirmed booking
      await storage.createBooking({
        id: "booking-1",
        roomId: "room-1",
        title: "Confirmed Meeting",
        organizerEmail: "test@example.com",
        startTime: new Date("2024-01-08T10:00:00"),
        endTime: new Date("2024-01-08T12:00:00"),
        status: BookingStatus.CONFIRMED,
        createdAt: new Date(),
      });

      // Create cancelled booking
      await storage.createBooking({
        id: "booking-2",
        roomId: "room-1",
        title: "Cancelled Meeting",
        organizerEmail: "test@example.com",
        startTime: new Date("2024-01-08T14:00:00"),
        endTime: new Date("2024-01-08T16:00:00"),
        status: BookingStatus.CANCELLED,
        createdAt: new Date(),
        cancelledAt: new Date(),
      });

      const query: UtilizationReportQuery = {
        from: "2024-01-08T08:00:00",
        to: "2024-01-08T20:00:00",
      };

      const report = await reportService.generateRoomUtilizationReport(query);
      const roomAReport = report.find((r) => r.roomId === "room-1");

      expect(roomAReport!.totalBookingHours).toBe(2); // Only confirmed booking counted
      expect(roomAReport!.utilizationPercent).toBe(16.67);
    });

    test("should handle bookings that partially overlap with report period", async () => {
      // Booking starts before report period and ends within it
      await storage.createBooking({
        id: "booking-1",
        roomId: "room-1",
        title: "Overlapping Start",
        organizerEmail: "test@example.com",
        startTime: new Date("2024-01-08T07:00:00"), // Before business hours
        endTime: new Date("2024-01-08T10:00:00"), // Within business hours
        status: BookingStatus.CONFIRMED,
        createdAt: new Date(),
      });

      // Booking starts within period and ends after it
      await storage.createBooking({
        id: "booking-2",
        roomId: "room-1",
        title: "Overlapping End",
        organizerEmail: "test@example.com",
        startTime: new Date("2024-01-08T18:00:00"), // Within business hours
        endTime: new Date("2024-01-08T22:00:00"), // After business hours
        status: BookingStatus.CONFIRMED,
        createdAt: new Date(),
      });

      const query: UtilizationReportQuery = {
        from: "2024-01-08T08:00:00",
        to: "2024-01-08T20:00:00",
      };

      const report = await reportService.generateRoomUtilizationReport(query);
      const roomAReport = report.find((r) => r.roomId === "room-1");

      // Should count: 2 hours from first booking (8-10AM) + 2 hours from second booking (18-20PM) = 4 hours
      expect(roomAReport!.totalBookingHours).toBe(4);
      expect(roomAReport!.utilizationPercent).toBe(33.33); // 4/12 hours
    });

    test("should handle multi-day periods correctly", async () => {
      // Monday booking
      await storage.createBooking({
        id: "booking-1",
        roomId: "room-1",
        title: "Monday Meeting",
        organizerEmail: "test@example.com",
        startTime: new Date("2024-01-08T10:00:00"), // Monday 10AM
        endTime: new Date("2024-01-08T12:00:00"), // Monday 12PM
        status: BookingStatus.CONFIRMED,
        createdAt: new Date(),
      });

      // Tuesday booking
      await storage.createBooking({
        id: "booking-2",
        roomId: "room-1",
        title: "Tuesday Meeting",
        organizerEmail: "test@example.com",
        startTime: new Date("2024-01-09T14:00:00"), // Tuesday 2PM
        endTime: new Date("2024-01-09T17:00:00"), // Tuesday 5PM
        status: BookingStatus.CONFIRMED,
        createdAt: new Date(),
      });

      const query: UtilizationReportQuery = {
        from: "2024-01-08T08:00:00", // Monday
        to: "2024-01-09T20:00:00", // Tuesday
      };

      const report = await reportService.generateRoomUtilizationReport(query);
      const roomAReport = report.find((r) => r.roomId === "room-1");

      // Total available hours: 2 days × 12 hours = 24 hours
      // Total booked hours: 2 hours (Monday) + 3 hours (Tuesday) = 5 hours
      expect(roomAReport!.totalBookingHours).toBe(5);
      expect(roomAReport!.utilizationPercent).toBe(20.83); // 5/24 hours ≈ 20.83%
    });

    test("should skip weekends in multi-day calculations", async () => {
      // Friday booking
      await storage.createBooking({
        id: "booking-1",
        roomId: "room-1",
        title: "Friday Meeting",
        organizerEmail: "test@example.com",
        startTime: new Date("2024-01-05T10:00:00"), // Friday 10AM
        endTime: new Date("2024-01-05T12:00:00"), // Friday 12PM
        status: BookingStatus.CONFIRMED,
        createdAt: new Date(),
      });

      // Monday booking (next week)
      await storage.createBooking({
        id: "booking-2",
        roomId: "room-1",
        title: "Monday Meeting",
        organizerEmail: "test@example.com",
        startTime: new Date("2024-01-08T14:00:00"), // Monday 2PM
        endTime: new Date("2024-01-08T16:00:00"), // Monday 4PM
        status: BookingStatus.CONFIRMED,
        createdAt: new Date(),
      });

      const query: UtilizationReportQuery = {
        from: "2024-01-05T08:00:00", // Friday
        to: "2024-01-08T20:00:00", // Monday
      };

      const report = await reportService.generateRoomUtilizationReport(query);
      const roomAReport = report.find((r) => r.roomId === "room-1");

      // Total available hours: 2 business days (Fri, Mon) × 12 hours = 24 hours
      // Total booked hours: 2 hours (Friday) + 2 hours (Monday) = 4 hours
      expect(roomAReport!.totalBookingHours).toBe(4);
      expect(roomAReport!.utilizationPercent).toBe(16.67); // 4/24 hours ≈ 16.67%
    });

    test("should sort results by utilization percentage descending", async () => {
      // Room 1: 25% utilization (3 hours out of 12)
      await storage.createBooking({
        id: "booking-1",
        roomId: "room-1",
        title: "Room A Meeting",
        organizerEmail: "test@example.com",
        startTime: new Date("2024-01-08T10:00:00"),
        endTime: new Date("2024-01-08T13:00:00"),
        status: BookingStatus.CONFIRMED,
        createdAt: new Date(),
      });

      // Room 2: 50% utilization (6 hours out of 12)
      await storage.createBooking({
        id: "booking-2",
        roomId: "room-2",
        title: "Room B Meeting",
        organizerEmail: "test@example.com",
        startTime: new Date("2024-01-08T10:00:00"),
        endTime: new Date("2024-01-08T16:00:00"),
        status: BookingStatus.CONFIRMED,
        createdAt: new Date(),
      });

      const query: UtilizationReportQuery = {
        from: "2024-01-08T08:00:00",
        to: "2024-01-08T20:00:00",
      };

      const report = await reportService.generateRoomUtilizationReport(query);

      // Should be sorted by utilization descending
      expect(report[0].roomId).toBe("room-2"); // 50% utilization
      expect(report[0].utilizationPercent).toBe(50);
      expect(report[1].roomId).toBe("room-1"); // 25% utilization
      expect(report[1].utilizationPercent).toBe(25);
    });
  });
});
