import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Hospital } from '../models/Hospital.js';
import { Donor } from '../models/Donor.js';
import { generateToken } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/auditLogger.js';

/**
 * Register Hospital Account
 */
export async function registerHospital(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      hospitalName,
      syntheticRegistrationNumber,
      address,
      city,
      latitude,
      longitude,
    } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'HOSPITAL',
      accountStatus: 'PENDING',
    });

    const hospital = await Hospital.create({
      userId: user._id,
      hospitalName,
      syntheticRegistrationNumber,
      address,
      city,
      latitude,
      longitude,
      approvalStatus: 'PENDING',
    });

    await logAuditEvent({
      actorUserId: user._id,
      action: 'HOSPITAL_REGISTERED',
      entityType: 'HOSPITAL',
      entityId: hospital._id,
      safeMetadata: { hospitalName, city, email: user.email },
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Hospital registered successfully. Account is pending administrator approval.',
      token,
      user,
      hospital,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Register Synthetic Donor Account
 */
export async function registerDonor(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      displayName,
      bloodGroup,
      city,
      latitude,
      longitude,
      isAvailable = true,
      acceptsUrgentAlerts = true,
    } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'DONOR',
      accountStatus: 'ACTIVE',
    });

    const syntheticDonorId = `DONOR-SYN-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const donor = await Donor.create({
      userId: user._id,
      syntheticDonorId,
      displayName,
      bloodGroup,
      city,
      latitude,
      longitude,
      isAvailable,
      acceptsUrgentAlerts,
      isSynthetic: true,
    });

    await logAuditEvent({
      actorUserId: user._id,
      action: 'DONOR_REGISTERED',
      entityType: 'DONOR',
      entityId: donor._id,
      safeMetadata: { syntheticDonorId, bloodGroup, city },
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Synthetic donor account registered successfully for demo.',
      token,
      user,
      donor,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * User Login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password credentials.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password credentials.',
      });
    }

    let profile = null;
    if (user.role === 'HOSPITAL') {
      profile = await Hospital.findOne({ userId: user._id });
    } else if (user.role === 'DONOR') {
      profile = await Donor.findOne({ userId: user._id });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user,
      profile,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user details
 */
export async function getMe(req, res, next) {
  try {
    let profile = null;
    if (req.user.role === 'HOSPITAL') {
      profile = await Hospital.findOne({ userId: req.user._id });
    } else if (req.user.role === 'DONOR') {
      profile = await Donor.findOne({ userId: req.user._id });
    }

    res.status(200).json({
      success: true,
      user: req.user,
      profile,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  registerHospital,
  registerDonor,
  login,
  getMe,
};
