import { z } from 'zod';
import { VALID_BLOOD_GROUPS, SEARCH_BLOOD_GROUPS } from '../utils/bloodCompatibility.js';

export const validateRequest = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.validatedBody = parsed;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    next(error);
  }
};

export const hospitalRegisterSchema = z.object({
  name: z.string().min(2, 'Contact person name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  hospitalName: z.string().min(3, 'Hospital name must be at least 3 characters'),
  syntheticRegistrationNumber: z.string().min(3, 'Registration number required'),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
});

export const donorRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  bloodGroup: z.enum(VALID_BLOOD_GROUPS, {
    errorMap: () => ({ message: `Blood group must be one of: ${VALID_BLOOD_GROUPS.join(', ')}` }),
  }),
  city: z.string().min(2, 'City is required'),
  latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  isAvailable: z.boolean().optional().default(true),
  acceptsUrgentAlerts: z.boolean().optional().default(true),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const bloodRequestCreateSchema = z.object({
  bloodGroup: z.enum(SEARCH_BLOOD_GROUPS, {
    errorMap: () => ({ message: `Blood group must be one of: ${SEARCH_BLOOD_GROUPS.join(', ')}` }),
  }),
  unitsRequired: z.number().int().min(1, 'Must request at least 1 unit').default(1),
  urgency: z.enum(['CRITICAL', 'HIGH', 'NORMAL']).default('HIGH'),
  searchRadiusKm: z.number().min(1).max(100, 'Search radius must be between 1 and 100 km').default(10),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  requiredBy: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format for requiredBy',
  }),
  notes: z.string().max(500).optional(),
});

export const donorUpdateSchema = z.object({
  displayName: z.string().min(2).optional(),
  bloodGroup: z.enum(VALID_BLOOD_GROUPS).optional(),
  city: z.string().min(2).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isAvailable: z.boolean().optional(),
  acceptsUrgentAlerts: z.boolean().optional(),
});

export const donorAvailabilityToggleSchema = z.object({
  isAvailable: z.boolean(),
});

export const hospitalRejectSchema = z.object({
  rejectionReason: z.string().min(3, 'Rejection reason is required').optional(),
});

export const alertResponseSchema = z.object({
  response: z.enum(['ACCEPT', 'DECLINE']),
  notes: z.string().max(250).optional(),
});

export default {
  validateRequest,
  hospitalRegisterSchema,
  donorRegisterSchema,
  loginSchema,
  bloodRequestCreateSchema,
  donorUpdateSchema,
  donorAvailabilityToggleSchema,
  hospitalRejectSchema,
  alertResponseSchema,
};
