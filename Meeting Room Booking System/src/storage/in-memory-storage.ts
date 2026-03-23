/**
 * In-memory storage implementation for rooms and bookings
 * This provides a simple storage layer with basic CRUD operations
 */

import { Room, Booking } from "../models/types";

export interface StorageInterface {
  // Room operations
  createRoom(room: Room): Promise<Room>;
  getRoomById(id: string): Promise<Room | null>;
  getRoomByName(name: string): Promise<Room | null>;
  listRooms(): Promise<Room[]>;

  // Booking operations
  createBooking(booking: Booking): Promise<Booking>;
  getBookingById(id: string): Promise<Booking | null>;
  listBookings(): Promise<Booking[]>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | null>;

  // Idempotency tracking
  getIdempotentBooking(
    key: string,
    organizerEmail: string,
  ): Promise<Booking | null>;
  setIdempotentBooking(
    key: string,
    organizerEmail: string,
    booking: Booking,
  ): Promise<void>;
}

/**
 * In-memory implementation of the storage interface
 * Note: This is not suitable for production use
 */
export class InMemoryStorage implements StorageInterface {
  private rooms = new Map<string, Room>();
  private bookings = new Map<string, Booking>();
  private idempotencyCache = new Map<
    string,
    { organizerEmail: string; bookingId: string }
  >();

  async createRoom(room: Room): Promise<Room> {
    this.rooms.set(room.id, { ...room });
    return { ...room };
  }

  async getRoomById(id: string): Promise<Room | null> {
    const room = this.rooms.get(id);
    return room ? { ...room } : null;
  }

  async getRoomByName(name: string): Promise<Room | null> {
    for (const room of this.rooms.values()) {
      if (room.name.toLowerCase() === name.toLowerCase()) {
        return { ...room };
      }
    }
    return null;
  }

  async listRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values()).map((room) => ({ ...room }));
  }

  async createBooking(booking: Booking): Promise<Booking> {
    this.bookings.set(booking.id, { ...booking });
    return { ...booking };
  }

  async getBookingById(id: string): Promise<Booking | null> {
    const booking = this.bookings.get(id);
    return booking ? { ...booking } : null;
  }

  async listBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values()).map((booking) => ({
      ...booking,
    }));
  }

  async updateBooking(
    id: string,
    updates: Partial<Booking>,
  ): Promise<Booking | null> {
    const existingBooking = this.bookings.get(id);
    if (!existingBooking) {
      return null;
    }

    const updatedBooking = { ...existingBooking, ...updates };
    this.bookings.set(id, updatedBooking);
    return { ...updatedBooking };
  }

  async getIdempotentBooking(
    key: string,
    organizerEmail: string,
  ): Promise<Booking | null> {
    const cached = this.idempotencyCache.get(key);
    if (!cached || cached.organizerEmail !== organizerEmail) {
      return null;
    }

    return this.getBookingById(cached.bookingId);
  }

  async setIdempotentBooking(
    key: string,
    organizerEmail: string,
    booking: Booking,
  ): Promise<void> {
    this.idempotencyCache.set(key, {
      organizerEmail,
      bookingId: booking.id,
    });
  }
}

// Global singleton instance
export const storage = new InMemoryStorage();
