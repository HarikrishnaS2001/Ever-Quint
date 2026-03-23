/**
 * Integration tests for the HTTP API endpoints
 */

import request from "supertest";
import app from "../src/index";
import { storage } from "../src/storage/in-memory-storage";

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

describe("API Integration Tests", () => {
  beforeEach(() => {
    // Clear storage before each test
    (storage as any).rooms.clear();
    (storage as any).bookings.clear();
    (storage as any).idempotencyCache.clear();
  });

  describe("POST /rooms", () => {
    test("should create room successfully", async () => {
      const roomData = {
        name: "Conference Room A",
        capacity: 12,
        floor: 1,
        amenities: ["WiFi", "Projector"],
      };

      const response = await request(app)
        .post("/rooms")
        .send(roomData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe("Conference Room A");
      expect(response.body.capacity).toBe(12);
      expect(response.body.floor).toBe(1);
      expect(response.body.amenities).toEqual(["WiFi", "Projector"]);
    });

    test("should reject room with duplicate name", async () => {
      const roomData = {
        name: "Meeting Room",
        capacity: 10,
        floor: 1,
        amenities: [],
      };

      // Create first room
      await request(app).post("/rooms").send(roomData).expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post("/rooms")
        .send(roomData)
        .expect(409);

      expect(response.body.error).toBe("ConflictError");
      expect(response.body.message).toContain("already exists");
    });

    test("should validate required fields", async () => {
      const response = await request(app)
        .post("/rooms")
        .send({
          // Missing required fields
          capacity: 10,
        })
        .expect(400);

      expect(response.body.error).toBe("ValidationError");
    });

    test("should validate capacity is positive", async () => {
      const response = await request(app)
        .post("/rooms")
        .send({
          name: "Invalid Room",
          capacity: 0, // Invalid capacity
          floor: 1,
          amenities: [],
        })
        .expect(400);

      expect(response.body.error).toBe("ValidationError");
      expect(response.body.message).toContain("capacity must be positive");
    });
  });

  describe("GET /rooms", () => {
    beforeEach(async () => {
      // Create test rooms
      await request(app)
        .post("/rooms")
        .send({
          name: "Small Room",
          capacity: 5,
          floor: 1,
          amenities: ["WiFi"],
        });

      await request(app)
        .post("/rooms")
        .send({
          name: "Large Room",
          capacity: 20,
          floor: 2,
          amenities: ["WiFi", "Projector"],
        });
    });

    test("should list all rooms", async () => {
      const response = await request(app).get("/rooms").expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe("Large Room"); // Alphabetical order
      expect(response.body[1].name).toBe("Small Room");
    });

    test("should filter by minimum capacity", async () => {
      const response = await request(app)
        .get("/rooms?minCapacity=10")
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe("Large Room");
    });

    test("should filter by amenity", async () => {
      const response = await request(app)
        .get("/rooms?amenity=Projector")
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe("Large Room");
    });
  });

  describe("POST /bookings", () => {
    let roomId: string;

    beforeEach(async () => {
      // Create a test room
      const roomResponse = await request(app).post("/rooms").send({
        name: "Test Room",
        capacity: 10,
        floor: 1,
        amenities: [],
      });
      roomId = roomResponse.body.id;
    });

    test("should create booking successfully (happy path)", async () => {
      const monday = getNextWeekday(1); // Monday
      const bookingData = {
        roomId,
        title: "Team Meeting",
        organizerEmail: "test@example.com",
        startTime: createDateWithTime(monday, 10).toISOString(), // Monday 10AM
        endTime: createDateWithTime(monday, 11).toISOString(), // Monday 11AM
      };

      const response = await request(app)
        .post("/bookings")
        .send(bookingData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.roomId).toBe(roomId);
      expect(response.body.title).toBe("Team Meeting");
      expect(response.body.status).toBe("confirmed");
    });

    test("should reject overlapping bookings (conflict case)", async () => {
      const monday = getNextWeekday(1); // Monday
      const firstBooking = {
        roomId,
        title: "First Meeting",
        organizerEmail: "user1@example.com",
        startTime: createDateWithTime(monday, 10).toISOString(),
        endTime: createDateWithTime(monday, 12).toISOString(),
      };

      // Create first booking
      await request(app).post("/bookings").send(firstBooking).expect(201);

      // Try to create overlapping booking
      const overlappingBooking = {
        roomId,
        title: "Overlapping Meeting",
        organizerEmail: "user2@example.com",
        startTime: createDateWithTime(monday, 11).toISOString(), // Overlaps with first
        endTime: createDateWithTime(monday, 13).toISOString(),
      };

      const response = await request(app)
        .post("/bookings")
        .send(overlappingBooking)
        .expect(409);

      expect(response.body.error).toBe("ConflictError");
      expect(response.body.message).toContain("overlapping");
    });

    test("should handle idempotent requests", async () => {
      const monday = getNextWeekday(1); // Monday
      const bookingData = {
        roomId,
        title: "Meeting",
        organizerEmail: "test@example.com",
        startTime: createDateWithTime(monday, 10).toISOString(),
        endTime: createDateWithTime(monday, 11).toISOString(),
      };

      const idempotencyKey = "unique-key-123";

      // First request
      const firstResponse = await request(app)
        .post("/bookings")
        .set("Idempotency-Key", idempotencyKey)
        .send(bookingData)
        .expect(201);

      // Second request with same key - should return same booking
      const secondResponse = await request(app)
        .post("/bookings")
        .set("Idempotency-Key", idempotencyKey)
        .send(bookingData)
        .expect(201);

      expect(firstResponse.body.id).toBe(secondResponse.body.id);
    });

    test("should validate working hours", async () => {
      const saturday = getNextWeekday(6); // Saturday
      const bookingData = {
        roomId,
        title: "Weekend Meeting",
        organizerEmail: "test@example.com",
        startTime: createDateWithTime(saturday, 10).toISOString(), // Saturday
        endTime: createDateWithTime(saturday, 11).toISOString(),
      };

      const response = await request(app)
        .post("/bookings")
        .send(bookingData)
        .expect(409);

      expect(response.body.error).toBe("ConflictError");
      expect(response.body.message).toContain("Bookings only allowed");
    });

    test("should validate room exists", async () => {
      const monday = getNextWeekday(1); // Monday
      const bookingData = {
        roomId: "00000000-0000-0000-0000-000000000000",
        title: "Meeting",
        organizerEmail: "test@example.com",
        startTime: createDateWithTime(monday, 10).toISOString(),
        endTime: createDateWithTime(monday, 11).toISOString(),
      };

      const response = await request(app)
        .post("/bookings")
        .send(bookingData)
        .expect(404);

      expect(response.body.error).toBe("NotFoundError");
      expect(response.body.message).toContain("not found");
    });
  });

  describe("GET /bookings", () => {
    let roomId: string;
    let bookingIds: string[] = [];

    beforeEach(async () => {
      // Create test room
      const roomResponse = await request(app).post("/rooms").send({
        name: "Test Room",
        capacity: 10,
        floor: 1,
        amenities: [],
      });
      roomId = roomResponse.body.id;

      // Create test bookings
      const monday = getNextWeekday(1); // Monday
      const bookings = [
        {
          title: "Meeting 1",
          startTime: createDateWithTime(monday, 10).toISOString(),
          endTime: createDateWithTime(monday, 11).toISOString(),
        },
        {
          title: "Meeting 2",
          startTime: createDateWithTime(monday, 14).toISOString(),
          endTime: createDateWithTime(monday, 15).toISOString(),
        },
      ];

      for (const booking of bookings) {
        const response = await request(app)
          .post("/bookings")
          .send({
            roomId,
            organizerEmail: "test@example.com",
            ...booking,
          });
        bookingIds.push(response.body.id);
      }
    });

    test("should list bookings with pagination", async () => {
      const response = await request(app).get("/bookings").expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.limit).toBe(50);
      expect(response.body.offset).toBe(0);
    });

    test("should filter by room ID", async () => {
      const response = await request(app)
        .get(`/bookings?roomId=${roomId}`)
        .expect(200);

      expect(response.body.items).toHaveLength(2);
    });

    test("should handle pagination parameters", async () => {
      const response = await request(app)
        .get("/bookings?limit=1&offset=0")
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.limit).toBe(1);
      expect(response.body.offset).toBe(0);
    });
  });

  describe("POST /bookings/:id/cancel", () => {
    let roomId: string;
    let bookingId: string;

    beforeEach(async () => {
      // Create test room
      const roomResponse = await request(app).post("/rooms").send({
        name: "Test Room",
        capacity: 10,
        floor: 1,
        amenities: [],
      });
      roomId = roomResponse.body.id;

      // Create test booking (far in future to allow cancellation)
      const futureDate = getNextWeekday(1); // Monday
      const bookingResponse = await request(app)
        .post("/bookings")
        .send({
          roomId,
          title: "Future Meeting",
          organizerEmail: "test@example.com",
          startTime: createDateWithTime(futureDate, 10, 0).toISOString(),
          endTime: createDateWithTime(futureDate, 11, 0).toISOString(),
        });
      bookingId = bookingResponse.body.id;
    });

    test("should cancel booking within grace period", async () => {
      const response = await request(app)
        .post(`/bookings/${bookingId}/cancel`)
        .expect(200);

      expect(response.body.status).toBe("cancelled");
      expect(response.body.cancelledAt).toBeDefined();
    });

    test("should not allow cancellation of non-existent booking", async () => {
      const response = await request(app)
        .post("/bookings/00000000-0000-0000-0000-000000000000/cancel")
        .expect(404);

      expect(response.body.error).toBe("NotFoundError");
    });

    test("should not allow duplicate cancellation", async () => {
      // Cancel first time
      await request(app).post(`/bookings/${bookingId}/cancel`).expect(200);

      // Try to cancel again
      const response = await request(app)
        .post(`/bookings/${bookingId}/cancel`)
        .expect(400);

      expect(response.body.error).toBe("ValidationError");
      expect(response.body.message).toContain("already cancelled");
    });
  });

  describe("GET /reports/room-utilization", () => {
    let roomId: string;

    beforeEach(async () => {
      // Create test room
      const roomResponse = await request(app).post("/rooms").send({
        name: "Test Room",
        capacity: 10,
        floor: 1,
        amenities: [],
      });
      roomId = roomResponse.body.id;

      // Create test booking
      const monday = getNextWeekday(1); // Monday
      await request(app)
        .post("/bookings")
        .send({
          roomId,
          title: "Test Meeting",
          organizerEmail: "test@example.com",
          startTime: createDateWithTime(monday, 10).toISOString(), // Monday 10AM
          endTime: createDateWithTime(monday, 12).toISOString(), // Monday 12PM (2 hours)
        });
    });

    test("should generate utilization report", async () => {
      const monday = getNextWeekday(1); // Monday
      const fromDate = createDateWithTime(monday, 8); // 8AM
      const toDate = createDateWithTime(monday, 20); // 8PM

      const response = await request(app)
        .get(
          `/reports/room-utilization?from=${fromDate.toISOString()}&to=${toDate.toISOString()}`,
        )
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].roomId).toBe(roomId);
      expect(response.body[0].roomName).toBe("Test Room");
      expect(response.body[0].totalBookingHours).toBe(2);
      expect(response.body[0].utilizationPercent).toBe(16.67); // 2/12 hours
    });

    test("should require from and to parameters", async () => {
      const response = await request(app)
        .get("/reports/room-utilization")
        .expect(400);

      expect(response.body.error).toBe("ValidationError");
    });

    test("should validate date format", async () => {
      const response = await request(app)
        .get(
          "/reports/room-utilization?from=invalid-date&to=2024-01-08T20:00:00",
        )
        .expect(400);

      expect(response.body.error).toBe("ValidationError");
    });
  });

  describe("Error handling", () => {
    test("should handle 404 for non-existent routes", async () => {
      const response = await request(app)
        .get("/non-existent-route")
        .expect(404);

      expect(response.body.error).toBe("NotFoundError");
      expect(response.body.message).toContain("not found");
    });

    test("should handle invalid JSON gracefully", async () => {
      await request(app)
        .post("/rooms")
        .set("Content-Type", "application/json")
        .send("invalid json")
        .expect(400);
    });
  });
});
