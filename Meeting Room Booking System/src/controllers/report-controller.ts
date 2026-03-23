/**
 * Report controller handling HTTP requests for reporting operations
 */

import { Request, Response } from "express";
import { reportService } from "../services/report-service";
import { UtilizationReportQuery, HTTP_STATUS } from "../models/types";
import { utilizationReportQuerySchema } from "../models/validation";

export class ReportController {
  /**
   * GET /reports/room-utilization - Generate room utilization report
   */
  async getRoomUtilizationReport(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const { error, value } = utilizationReportQuerySchema.validate(req.query);
      if (error) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "ValidationError",
          message: error.details[0].message,
        });
        return;
      }

      const query: UtilizationReportQuery = value;

      // Generate report via service
      const report = await reportService.generateRoomUtilizationReport(query);

      res.status(HTTP_STATUS.OK).json(report);
    } catch (error: any) {
      console.error("Error generating utilization report:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: "InternalServerError",
        message: "An unexpected error occurred",
      });
    }
  }
}

// Export singleton instance
export const reportController = new ReportController();
