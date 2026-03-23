/**
 * Report routes
 */

import { Router } from "express";
import { reportController } from "../controllers/report-controller";

const router = Router();

// GET /reports/room-utilization - Room utilization report
router.get("/room-utilization", (req, res) =>
  reportController.getRoomUtilizationReport(req, res),
);

export default router;
