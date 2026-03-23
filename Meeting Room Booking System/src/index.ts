/**
 * Main application setup
 */

import express from "express";
import roomRoutes from "./routes/room-routes";
import bookingRoutes from "./routes/booking-routes";
import reportRoutes from "./routes/report-routes";
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
} from "./middleware/error-handler";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API routes
app.use("/rooms", roomRoutes);
app.use("/bookings", bookingRoutes);
app.use("/reports", reportRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `Meeting Room Booking System server is running on port ${PORT}`,
    );
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

export default app;
