/**
 * Unit tests for BookingService business logic
 */

import { BookingService } from "../src/services/booking-service";
import { RoomService } from "../src/services/room-service";
import { InMemoryStorage } from "../src/storage/in-memory-storage";
import { BookingStatus, CreateBookingRequest, Room } from "../src/models/types";

describe("BookingService", () => {
  let bookingService: BookingService;
  let roomService: RoomService;
  let storage: InMemoryStorage;
  let testRoom: Room;

  // Helper function to get next weekday
  const getNextWeekday = (dayOfWeek: number): Date => {
    const today = new Date();
    const nextDay = new Date(today);
    nextDay.setDate(
      today.getDate() + ((dayOfWeek + 7 - today.getDay()) % 7 || 7),
    );
    return nextDay;
  };

  // Helper function to create time on a specific date
  const createDateWithTime = (
    date: Date,
    hours: number,
    minutes: number = 0,
  ): Date => {
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  beforeEach(async () => {
    storage = new InMemoryStorage();
    roomService = new RoomService(storage);
    bookingService = new BookingService(storage, roomService);

    // Create a test room
    testRoom = await storage.createRoom({
      id: "test-room-1",
      name: "Test Room",
      capacity: 10,
      floor: 1,
      amenities: ["WiFi", "Projector"],
      createdAt: new Date(),
    });
  });

  describe("createBooking", () => {
    test("should create valid booking within working hours", async () => {
      // Get next Monday
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));

      const startTime = new Date(monday);
      startTime.setHours(10, 0, 0, 0);

      const endTime = new Date(monday);
      endTime.setHours(11, 0, 0, 0);

      const request: CreateBookingRequest = {
        roomId: testRoom.id,
        title: "Team Meeting",
        organizerEmail: "test@example.com",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      const booking = await bookingService.createBooking(request);

      expect(booking).toBeDefined();
      expect(booking.roomId).toBe(testRoom.id);
      expect(booking.title).toBe("Team Meeting");
      expect(booking.status).toBe(BookingStatus.CONFIRMED);
    });

    test("should reject booking outside working hours", async () => {
      // Get next Monday
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));

      const startTime = new Date(monday);
      startTime.setHours(7, 0, 0, 0); // 7AM (before working hours)

      const endTime = new Date(monday);
      endTime.setHours(8, 0, 0, 0); // 8AM

      const request: CreateBookingRequest = {
        roomId: testRoom.id,
        title: "Early Meeting",
        organizerEmail: "test@example.com",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      await expect(bookingService.createBooking(request)).rejects.toThrow(
        "Bookings only allowed Mon-Fri",
      );
    });

    test("should reject weekend booking", async () => {
      // Get next Saturday
      const today = new Date();
      const saturday = new Date(today);
      saturday.setDate(today.getDate() + ((6 + 7 - today.getDay()) % 7 || 7));

      const startTime = new Date(saturday);
      startTime.setHours(10, 0, 0, 0);

      const endTime = new Date(saturday);
      endTime.setHours(11, 0, 0, 0);

      const request: CreateBookingRequest = {
        roomId: testRoom.id,
        title: "Weekend Meeting",
        organizerEmail: "test@example.com",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      await expect(bookingService.createBooking(request)).rejects.toThrow(
        "Bookings only allowed Mon-Fri",
      );
    });

    test("should reject booking for non-existent room", async () => {
      const monday = getNextWeekday(1); // Monday
      const startTime = createDateWithTime(monday, 10); // 10AM
      const endTime = createDateWithTime(monday, 11); // 11AM

      const request: CreateBookingRequest = {
        roomId: "non-existent-room",
        title: "Meeting",
        organizerEmail: "test@example.com",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      await expect(bookingService.createBooking(request)).rejects.toThrow(
        "Room with ID 'non-existent-room' not found",
      );
    });

    test("should reject overlapping bookings", async () => {
      // Create first booking
      const firstRequest: CreateBookingRequest = {
        roomId: testRoom.id,
        title: "First Meeting",
        organizerEmail: "user1@example.com",
        startTime: createDateWithTime(getNextWeekday(1), 10).toISOString(),
        endTime: createDateWithTime(getNextWeekday(1), 12).toISOString(),
      };

      await bookingService.createBooking(firstRequest);

      // Try to create overlapping booking
      const secondRequest: CreateBookingRequest = {
        roomId: testRoom.id,
        title: "Overlapping Meeting",
        organizerEmail: "user2@example.com",
        startTime: createDateWithTime(getNextWeekday(1), 11).toISOString(), // Overlaps with first booking
        endTime: createDateWithTime(getNextWeekday(1), 13).toISOString(),
      };

      await expect(bookingService.createBooking(secondRequest)).rejects.toThrow(
        "No overlapping confirmed bookings for the same roomId",
      );
    });

    test("should allow adjacent bookings (no overlap)", async () => {
      // Create first booking
      const firstRequest: CreateBookingRequest = {
        roomId: testRoom.id,
        title: "First Meeting",
        organizerEmail: "user1@example.com",
        startTime: createDateWithTime(getNextWeekday(1), 10).toISOString(),
        endTime: createDateWithTime(getNextWeekday(1), 11).toISOString(),
      };

      await bookingService.createBooking(firstRequest);

      // Create adjacent booking (starts when first ends)
      const secondRequest: CreateBookingRequest = {
        roomId: testRoom.id,
        title: "Adjacent Meeting",
        organizerEmail: "user2@example.com",
        startTime: createDateWithTime(getNextWeekday(1), 11).toISOString(), // Starts when first ends
        endTime: createDateWithTime(getNextWeekday(1), 12).toISOString(),
      };

      const secondBooking = await bookingService.createBooking(secondRequest);
      expect(secondBooking).toBeDefined();
      expect(secondBooking.title).toBe("Adjacent Meeting");
    });
  });

  describe("idempotency", () => {
    test("should return same booking for duplicate request with same key", async () => {
      const request: CreateBookingRequest = {
        roomId: testRoom.id,
        title: "Team Meeting",
        organizerEmail: "test@example.com",
        startTime: createDateWithTime(getNextWeekday(1), 10).toISOString(),
        endTime: createDateWithTime(getNextWeekday(1), 11).toISOString(),
      };

      const idempotencyKey = "test-key-123";

      // Create booking first time
      const firstBooking = await bookingService.createBooking(
        request,
        idempotencyKey,
      );

      // Create booking second time with same key - should return same booking
      const secondBooking = await bookingService.createBooking(
        request,
        idempotencyKey,
      );

      expect(firstBooking.id).toBe(secondBooking.id);
      expect(firstBooking.title).toBe(secondBooking.title);
    });

    test("should create new booking for same key but different organizer", async () => {
      const firstRequest: CreateBookingRequest = {
        roomId: testRoom.id,
        title: "Meeting 1",
        organizerEmail: "user1@example.com",
        startTime: createDateWithTime(getNextWeekday(1), 10).toISOString(),
        endTime: createDateWithTime(getNextWeekday(1), 11).toISOString(),
      };

      const secondRequest: CreateBookingRequest = {
        roomId: testRoom.id,
        title: "Meeting 2",
        organizerEmail: "user2@example.com",
        startTime: createDateWithTime(getNextWeekday(1), 12).toISOString(), // Different time to avoid overlap
        endTime: createDateWithTime(getNextWeekday(1), 13).toISOString(),
      };

      const idempotencyKey = "same-key";

      const firstBooking = await bookingService.createBooking(
        firstRequest,
        idempotencyKey,
      );
      const secondBooking = await bookingService.createBooking(
        secondRequest,
        idempotencyKey,
      );

      expect(firstBooking.id).not.toBe(secondBooking.id);
      expect(firstBooking.organizerEmail).toBe("user1@example.com");
      expect(secondBooking.organizerEmail).toBe("user2@example.com");
    });
  });

  describe("cancelBooking", () => {
    test("should cancel booking within grace period", async () => {
      // Create booking
      const request: CreateBookingRequest = {
        roomId: testRoom.id,
        title: "Future Meeting",
        organizerEmail: "test@example.com",
        startTime: createDateWithTime(getNextWeekday(1), 15).toISOString(), // 3PM
        endTime: createDateWithTime(getNextWeekday(1), 16).toISOString(), // 4PM
      };

      const booking = await bookingService.createBooking(request);

      // Mock current time to be within grace period (before 2PM)
      const now = createDateWithTime(getNextWeekday(1), 13); // 1PM
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const cancelledBooking = await bookingService.cancelBooking(booking.id);

      expect(cancelledBooking.status).toBe(BookingStatus.CANCELLED);
      expect(cancelledBooking.cancelledAt).toBeDefined();

      jest.useRealTimers();
    });

    test("should reject cancellation outside grace period", async () => {
      // Create booking
      const request: CreateBookingRequest = {
        roomId: testRoom.id,
        title: "Soon Meeting",
        organizerEmail: "test@example.com",
        startTime: createDateWithTime(getNextWeekday(1), 14).toISOString(), // 2PM
        endTime: createDateWithTime(getNextWeekday(1), 15).toISOString(), // 3PM
      };

      const booking = await bookingService.createBooking(request);

      // Mock current time to be outside grace period (30 min before start, but grace period is 60 min)
      const now = createDateWithTime(getNextWeekday(1), 13, 30); // 1:30PM (only 30 min before start)
      jest.useFakeTimers();
      jest.setSystemTime(now);

      await expect(bookingService.cancelBooking(booking.id)).rejects.toThrow(
        "A booking can only be cancelled up to 60 minutes before startTime",
      );

      jest.useRealTimers();
    });

    test("should reject cancellation of already cancelled booking", async () => {
      const request: CreateBookingRequest = {
        roomId: testRoom.id,
        title: "Meeting",
        organizerEmail: "test@example.com",
        startTime: createDateWithTime(getNextWeekday(1), 15).toISOString(),
        endTime: createDateWithTime(getNextWeekday(1), 16).toISOString(),
      };

      const booking = await bookingService.createBooking(request);

      // Mock current time for first cancellation
      const now = new Date(
        createDateWithTime(getNextWeekday(1), 13).toISOString(),
      );
      jest.spyOn(global, "Date").mockImplementation(() => now as any);

      // Cancel first time
      await bookingService.cancelBooking(booking.id);

      // Try to cancel again
      await expect(bookingService.cancelBooking(booking.id)).rejects.toThrow(
        "Booking is already cancelled",
      );

      (global.Date as any).mockRestore();
    });

    test("should reject cancellation of non-existent booking", async () => {
      await expect(
        bookingService.cancelBooking("non-existent-id"),
      ).rejects.toThrow("Booking with ID 'non-existent-id' not found");
    });
  });
});
