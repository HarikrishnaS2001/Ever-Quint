/**
 * Report service for generating room utilization reports and analytics
 */

import {
  RoomUtilizationReport,
  UtilizationReportQuery,
  BookingStatus,
} from "../models/types";
import { storage, StorageInterface } from "../storage/in-memory-storage";
import { RoomService } from "./room-service";
import {
  calculateTotalBusinessHours,
  doTimeRangesOverlap,
  parseISODate,
} from "../utils/business-utils";

export class ReportService {
  constructor(
    private storageService: StorageInterface = storage,
    private roomService: RoomService = new RoomService(storage),
  ) {}

  /**
   * Generate room utilization report for a date range
   */
  async generateRoomUtilizationReport(
    query: UtilizationReportQuery,
  ): Promise<RoomUtilizationReport[]> {
    // Parse date range
    const fromDate = parseISODate(query.from);
    const toDate = parseISODate(query.to);

    // Get all rooms and bookings
    const [allRooms, allBookings] = await Promise.all([
      this.roomService.listRooms(),
      this.storageService.listBookings(),
    ]);

    // Calculate total business hours in the period
    const totalBusinessHours = calculateTotalBusinessHours(fromDate, toDate);

    // Generate report for each room
    const reports: RoomUtilizationReport[] = [];

    for (const room of allRooms) {
      // Find confirmed bookings for this room that overlap with the date range
      const roomBookings = allBookings.filter((booking) => {
        return (
          booking.roomId === room.id &&
          booking.status === BookingStatus.CONFIRMED &&
          doTimeRangesOverlap(
            booking.startTime,
            booking.endTime,
            fromDate,
            toDate,
          )
        );
      });

      // Calculate total booked hours for this room
      let totalBookingHours = 0;

      for (const booking of roomBookings) {
        // Calculate overlap between booking and report period
        const overlapStart = new Date(
          Math.max(booking.startTime.getTime(), fromDate.getTime()),
        );
        const overlapEnd = new Date(
          Math.min(booking.endTime.getTime(), toDate.getTime()),
        );

        if (overlapStart < overlapEnd) {
          const overlapHours =
            (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
          totalBookingHours += overlapHours;
        }
      }

      // Calculate utilization percentage
      let utilizationPercent = 0;
      if (totalBusinessHours > 0) {
        utilizationPercent =
          Math.round((totalBookingHours / totalBusinessHours) * 100 * 100) /
          100; // Round to 2 decimal places
      }

      // Add to report
      reports.push({
        roomId: room.id,
        roomName: room.name,
        totalBookingHours: Math.round(totalBookingHours * 100) / 100, // Round to 2 decimal places
        utilizationPercent,
      });
    }

    // Sort by utilization percentage (highest first), then by room name
    reports.sort((a, b) => {
      if (b.utilizationPercent !== a.utilizationPercent) {
        return b.utilizationPercent - a.utilizationPercent;
      }
      return a.roomName.localeCompare(b.roomName);
    });

    return reports;
  }

  /**
   * Get booking statistics for a room in a date range
   * This could be useful for extended reporting features
   */
  async getRoomBookingStats(
    roomId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    totalBookedHours: number;
    averageBookingDuration: number;
  }> {
    const allBookings = await this.storageService.listBookings();

    const roomBookings = allBookings.filter((booking) => {
      return (
        booking.roomId === roomId &&
        doTimeRangesOverlap(
          booking.startTime,
          booking.endTime,
          fromDate,
          toDate,
        )
      );
    });

    const confirmedBookings = roomBookings.filter(
      (booking) => booking.status === BookingStatus.CONFIRMED,
    );
    const cancelledBookings = roomBookings.filter(
      (booking) => booking.status === BookingStatus.CANCELLED,
    );

    let totalBookedHours = 0;
    let totalDurationMinutes = 0;

    for (const booking of confirmedBookings) {
      const durationMs =
        booking.endTime.getTime() - booking.startTime.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      const durationMinutes = durationMs / (1000 * 60);

      totalBookedHours += durationHours;
      totalDurationMinutes += durationMinutes;
    }

    const averageBookingDuration =
      confirmedBookings.length > 0
        ? totalDurationMinutes / confirmedBookings.length
        : 0;

    return {
      totalBookings: roomBookings.length,
      confirmedBookings: confirmedBookings.length,
      cancelledBookings: cancelledBookings.length,
      totalBookedHours: Math.round(totalBookedHours * 100) / 100,
      averageBookingDuration: Math.round(averageBookingDuration),
    };
  }

  /**
   * Get overall system utilization summary
   * This could be useful for dashboard views
   */
  async getSystemUtilizationSummary(
    fromDate: Date,
    toDate: Date,
  ): Promise<{
    totalRooms: number;
    totalBookings: number;
    totalBookedHours: number;
    overallUtilizationPercent: number;
  }> {
    const [allRooms, allBookings] = await Promise.all([
      this.roomService.listRooms(),
      this.storageService.listBookings(),
    ]);

    const relevantBookings = allBookings.filter((booking) => {
      return (
        booking.status === BookingStatus.CONFIRMED &&
        doTimeRangesOverlap(
          booking.startTime,
          booking.endTime,
          fromDate,
          toDate,
        )
      );
    });

    let totalBookedHours = 0;
    for (const booking of relevantBookings) {
      const durationMs =
        booking.endTime.getTime() - booking.startTime.getTime();
      totalBookedHours += durationMs / (1000 * 60 * 60);
    }

    const totalBusinessHours = calculateTotalBusinessHours(fromDate, toDate);
    const totalPossibleHours = allRooms.length * totalBusinessHours;

    const overallUtilizationPercent =
      totalPossibleHours > 0
        ? Math.round((totalBookedHours / totalPossibleHours) * 100 * 100) / 100
        : 0;

    return {
      totalRooms: allRooms.length,
      totalBookings: relevantBookings.length,
      totalBookedHours: Math.round(totalBookedHours * 100) / 100,
      overallUtilizationPercent,
    };
  }
}

// Export singleton instance
export const reportService = new ReportService();
