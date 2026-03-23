/**
 * Room controller handling HTTP requests for room operations
 */

import { Request, Response } from "express";
import { roomService } from "../services/room-service";
import {
  CreateRoomRequest,
  ListRoomsQuery,
  HTTP_STATUS,
} from "../models/types";
import { createRoomSchema, listRoomsQuerySchema } from "../models/validation";

export class RoomController {
  /**
   * POST /rooms - Create a new room
   */
  async createRoom(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = createRoomSchema.validate(req.body);
      if (error) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "ValidationError",
          message: error.details[0].message,
        });
        return;
      }

      const createRoomRequest: CreateRoomRequest = value;

      // Create room via service
      const room = await roomService.createRoom(createRoomRequest);

      res.status(HTTP_STATUS.CREATED).json(room);
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        res.status(HTTP_STATUS.CONFLICT).json({
          error: "ConflictError",
          message: error.message,
        });
      } else {
        console.error("Error creating room:", error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          error: "InternalServerError",
          message: "An unexpected error occurred",
        });
      }
    }
  }

  /**
   * GET /rooms - List rooms with optional filtering
   */
  async listRooms(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const { error, value } = listRoomsQuerySchema.validate(req.query);
      if (error) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "ValidationError",
          message: error.details[0].message,
        });
        return;
      }

      const query: ListRoomsQuery = value;

      // Get rooms via service
      const rooms = await roomService.listRooms(query);

      res.status(HTTP_STATUS.OK).json(rooms);
    } catch (error: any) {
      console.error("Error listing rooms:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: "InternalServerError",
        message: "An unexpected error occurred",
      });
    }
  }
}

// Export singleton instance
export const roomController = new RoomController();
