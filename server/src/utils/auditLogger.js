import { AuditLog } from '../models/AuditLog.js';

/**
 * Records an audit log event
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} [params.actorUserId]
 * @param {string} params.action - E.g. 'HOSPITAL_APPROVED', 'REQUEST_CREATED'
 * @param {string} params.entityType - E.g. 'HOSPITAL', 'BLOOD_REQUEST'
 * @param {string} params.entityId
 * @param {Object} [params.safeMetadata]
 */
export async function logAuditEvent({ actorUserId, action, entityType, entityId, safeMetadata = {} }) {
  try {
    // Sanitize metadata to avoid recording sensitive data like passwords or tokens
    const sanitized = { ...safeMetadata };
    delete sanitized.password;
    delete sanitized.passwordHash;
    delete sanitized.token;

    await AuditLog.create({
      actorUserId,
      action,
      entityType,
      entityId: String(entityId),
      safeMetadata: sanitized,
    });
  } catch (error) {
    // Audit logging should not crash the main transaction, but log the failure
    console.error(`[AuditLog Error] Failed to record audit log for action ${action}:`, error.message);
  }
}

export default { logAuditEvent };
