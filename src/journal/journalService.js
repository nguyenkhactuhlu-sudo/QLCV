// Journal (nhật ký) service - uses unified data adapter
import { getAdapter } from "../api/dataAdapter.js";
import { authService } from "../auth/authService.js";

export async function createLog(data) {
  const user = authService.currentUser;
  if (!user) throw new Error("Not authenticated");

  const adapter = getAdapter();
  return await adapter.saveLog({
    ...data,
    authorId: user.id,
    unitId: user.unitId,
  });
}

export async function getLogs(filters = {}) {
  const adapter = getAdapter();
  return await adapter.getLogs(filters);
}

export async function getMyLogs(filters = {}) {
  const user = authService.currentUser;
  if (!user) return [];
  return await getLogs({ ...filters, authorId: user.id });
}

export async function getPendingLogs(unitId = null) {
  const user = authService.currentUser;
  if (!user) return [];
  const filters = { status: "pending" };
  if (unitId) filters.unitId = unitId;
  return await getLogs(filters);
}

export async function updateLog(id, data) {
  const adapter = getAdapter();
  return await adapter.saveLog({ id, ...data });
}
