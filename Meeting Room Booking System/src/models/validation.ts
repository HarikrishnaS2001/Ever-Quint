/**
 * Joi validation schemas for API request validation
 */

import Joi from "joi";
import { BUSINESS_RULES } from "./types";

// Helper function to validate ISO-8601 datetime strings
const isoDateTimeSchema = Joi.string().isoDate().required();

export const createRoomSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    "string.empty": "name is required",
    "string.min": "name must not be empty",
    "string.max": "name must be less than 100 characters",
  }),
  capacity: Joi.number().integer().min(1).required().messages({
    "number.base": "capacity must be a number",
    "number.integer": "capacity must be an integer",
    "number.min": "capacity must be positive",
  }),
  floor: Joi.number().integer().required().messages({
    "number.base": "floor must be a number",
    "number.integer": "floor must be an integer",
  }),
  amenities: Joi.array().items(Joi.string().min(1)).default([]).messages({
    "array.base": "amenities must be an array",
    "string.min": "amenity names must not be empty",
  }),
});

export const createBookingSchema = Joi.object({
  roomId: Joi.alternatives()
    .try(Joi.string().uuid(), Joi.number().integer().positive())
    .required()
    .messages({
      "any.required": "roomId is required",
      "alternatives.match": "roomId must be a valid UUID or positive integer",
    }),
  title: Joi.string().min(1).max(200).required().messages({
    "string.empty": "title is required",
    "string.min": "title must not be empty",
    "string.max": "title must be less than 200 characters",
  }),
  organizerEmail: Joi.string().email().required().messages({
    "string.email": "organizerEmail must be a valid email address",
    "any.required": "organizerEmail is required",
  }),
  startTime: isoDateTimeSchema.messages({
    "string.isoDate": "startTime must be a valid ISO-8601 datetime",
    "any.required": "startTime is required",
  }),
  endTime: isoDateTimeSchema.messages({
    "string.isoDate": "endTime must be a valid ISO-8601 datetime",
    "any.required": "endTime is required",
  }),
})
  .custom((value, helpers) => {
    const { startTime, endTime } = value;
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate that endTime is after startTime
    if (end <= start) {
      return helpers.error("custom.endTimeBeforeStart");
    }

    // Validate booking duration
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    if (durationMinutes < BUSINESS_RULES.MIN_BOOKING_DURATION_MINUTES) {
      return helpers.error("custom.durationTooShort");
    }

    if (durationMinutes > BUSINESS_RULES.MAX_BOOKING_DURATION_HOURS * 60) {
      return helpers.error("custom.durationTooLong");
    }

    return value;
  }, "Booking duration validation")
  .messages({
    "custom.endTimeBeforeStart": "endTime must be after startTime",
    "custom.durationTooShort": `Booking duration must be at least ${BUSINESS_RULES.MIN_BOOKING_DURATION_MINUTES} minutes`,
    "custom.durationTooLong": `Booking duration must not exceed ${BUSINESS_RULES.MAX_BOOKING_DURATION_HOURS} hours`,
  });

export const listRoomsQuerySchema = Joi.object({
  minCapacity: Joi.number().integer().min(1).optional().messages({
    "number.base": "minCapacity must be a number",
    "number.integer": "minCapacity must be an integer",
    "number.min": "minCapacity must be positive",
  }),
  amenity: Joi.string().min(1).optional().messages({
    "string.min": "amenity filter must not be empty",
  }),
});

export const listBookingsQuerySchema = Joi.object({
  roomId: Joi.string().uuid().optional().messages({
    "string.uuid": "roomId must be a valid UUID",
  }),
  from: Joi.string().isoDate().optional().messages({
    "string.isoDate": "from must be a valid ISO-8601 datetime",
  }),
  to: Joi.string().isoDate().optional().messages({
    "string.isoDate": "to must be a valid ISO-8601 datetime",
  }),
  limit: Joi.number().integer().min(1).max(1000).default(50).messages({
    "number.base": "limit must be a number",
    "number.integer": "limit must be an integer",
    "number.min": "limit must be at least 1",
    "number.max": "limit must not exceed 1000",
  }),
  offset: Joi.number().integer().min(0).default(0).messages({
    "number.base": "offset must be a number",
    "number.integer": "offset must be an integer",
    "number.min": "offset cannot be negative",
  }),
})
  .custom((value, helpers) => {
    const { from, to } = value;

    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (toDate <= fromDate) {
        return helpers.error("custom.invalidDateRange");
      }
    }

    return value;
  }, "Date range validation")
  .messages({
    "custom.invalidDateRange": "to must be after from",
  });

export const utilizationReportQuerySchema = Joi.object({
  from: isoDateTimeSchema.messages({
    "string.isoDate": "from must be a valid ISO-8601 datetime",
    "any.required": "from is required",
  }),
  to: isoDateTimeSchema.messages({
    "string.isoDate": "to must be a valid ISO-8601 datetime",
    "any.required": "to is required",
  }),
})
  .custom((value, helpers) => {
    const { from, to } = value;
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (toDate <= fromDate) {
      return helpers.error("custom.invalidDateRange");
    }

    return value;
  }, "Date range validation")
  .messages({
    "custom.invalidDateRange": "to must be after from",
  });

export const idempotencyKeySchema = Joi.string()
  .min(1)
  .max(255)
  .pattern(/^[a-zA-Z0-9_\-]+$/)
  .messages({
    "string.pattern.base":
      "Idempotency-Key must contain only alphanumeric characters, hyphens, and underscores",
    "string.min": "Idempotency-Key must not be empty",
    "string.max": "Idempotency-Key must be less than 255 characters",
  });
