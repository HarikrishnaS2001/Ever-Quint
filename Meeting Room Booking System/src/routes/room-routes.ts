/**
 * Room routes
 */

import { Router } from "express";
import { roomController } from "../controllers/room-controller";

const router = Router();

// POST /rooms - Create a room
router.post("/", (req, res) => roomController.createRoom(req, res));

// GET /rooms - List rooms
router.get("/", (req, res) => roomController.listRooms(req, res));

export default router;
