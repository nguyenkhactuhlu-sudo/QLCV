// Admin service - manages users, units, registrations
import { getAdapter } from "../api/dataAdapter.js";
import { authService } from "../auth/authService.js";

export async function getUsers() {
  const adapter = getAdapter();
  const logs = await adapter.getAuditLogs();
  return logs;
}

export async function createRegistrationCode(unitId) {
  const user = authService.currentUser;
  if (!user || user.role !== "administrator") {
    throw new Error("Only administrators can create registration codes");
  }

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "P";
  for (let i = 0; i < 11; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const adapter = getAdapter();
  await adapter.saveAuditLog({
    actorId: user.id,
    action: "CREATE_REGISTRATION_CODE",
    entityType: "registration_code",
    newValues: { code, unitId },
  });

  return { code };
}

export async function approveUser(userId) {
  const user = authService.currentUser;
  if (!user || user.role !== "administrator") {
    throw new Error("Only administrators can approve users");
  }

  const adapter = getAdapter();
  await adapter.saveAuditLog({
    actorId: user.id,
    action: "APPROVE_USER",
    entityType: "user",
    entityId: userId,
  });

  return { success: true };
}

export async function getAuditLogs() {
  const adapter = getAdapter();
  return await adapter.getAuditLogs();
}
