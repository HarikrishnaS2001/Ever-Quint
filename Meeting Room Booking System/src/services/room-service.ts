/**
 * Room service containing business logic for room management
 */

import { v4 as uuidv4 } from "uuid";
import { Room, CreateRoomRequest, ListRoomsQuery } from "../models/types";
import { storage, StorageInterface } from "../storage/in-memory-storage";
import { normalizeForUniqueness } from "../utils/business-utils";

export class RoomService {
  constructor(private storageService: StorageInterface = storage) {}

  /**
   * Create a new room with validation
   */
  async createRoom(request: CreateRoomRequest): Promise<Room> {
    // Check for unique name constraint (case-insensitive)
    const existingRoom = await this.storageService.getRoomByName(request.name);
    if (existingRoom) {
      throw new Error(`Room name '${request.name}' already exists`);
    }

    // Validate capacity is positive (schema validation should catch this, but double-check)
    if (request.capacity <= 0) {
      throw new Error("Room capacity must be positive");
    }

    // Create room object
    const room: Room = {
      id: uuidv4(),
      name: request.name.trim(),
      capacity: request.capacity,
      floor: request.floor,
      amenities: request.amenities.map((amenity) => amenity.trim()),
      createdAt: new Date(),
    };

    // Store the room
    return await this.storageService.createRoom(room);
  }

  /**
   * List rooms with optional filtering
   */
  async listRooms(query: ListRoomsQuery = {}): Promise<Room[]> {
    const allRooms = await this.storageService.listRooms();

    let filteredRooms = allRooms;

    // Filter by minimum capacity if specified
    if (query.minCapacity !== undefined) {
      filteredRooms = filteredRooms.filter(
        (room) => room.capacity >= query.minCapacity!,
      );
    }

    // Filter by amenity if specified
    if (query.amenity) {
      const amenityFilter = normalizeForUniqueness(query.amenity);
      filteredRooms = filteredRooms.filter((room) =>
        room.amenities.some(
          (amenity) => normalizeForUniqueness(amenity) === amenityFilter,
        ),
      );
    }

    // Sort by name for consistent ordering
    filteredRooms.sort((a, b) => a.name.localeCompare(b.name));

    return filteredRooms;
  }

  /**
   * Get room by ID
   */
  async getRoomById(roomId: string): Promise<Room | null> {
    return await this.storageService.getRoomById(roomId);
  }

  /**
   * Check if room exists (utility method for other services)
   */
  async roomExists(roomId: string): Promise<boolean> {
    const room = await this.storageService.getRoomById(roomId);
    return room !== null;
  }
}

// Export singleton instance
export const roomService = new RoomService();
