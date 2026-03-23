/**
 * Error handling middleware
 */

import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../models/types";

/**
 * Global error handler middleware
 * This catches any unhandled errors and formats them consistently
 */
export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  console.error("Unhandled error:", error.message);
  console.error("Stack trace:", error.stack);

  // If headers are already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: "InternalServerError",
    message: "An unexpected error occurred",
  });
}

/**
 * 404 handler for routes that don't exist
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: "NotFoundError",
    message: `Route ${req.method} ${req.path} not found`,
  });
}

/**
 * Request logging middleware
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  // Log when response finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`,
    );
  });

  next();
}
