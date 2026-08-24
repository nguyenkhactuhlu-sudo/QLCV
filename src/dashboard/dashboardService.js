// Dashboard service
import { getAdapter } from "../api/dataAdapter.js";
import { authService } from "../auth/authService.js";

export async function getDashboardData(filters = {}) {
  const adapter = getAdapter();
  const logs = await adapter.getLogs(filters);

  const approved = logs.filter(l => l.status === "approved");
  const pending = logs.filter(l => l.status === "pending");
  const revision = logs.filter(l => l.status === "revision");

  const complexityAvg = approved.length > 0
    ? approved.reduce((sum, l) => sum + (l.complexityScore || 0), 0) / approved.length
    : 0;

  const qualityAvg = approved.length > 0
    ? approved.reduce((sum, l) => sum + (l.qualityScore || 0), 0) / approved.length
    : 0;

  const highQualityCount = approved.filter(l => (l.qualityScore || 0) >= 8).length;
  const highQualityRate = approved.length > 0
    ? (highQualityCount / approved.length) * 100
    : 0;

  return {
    totalLogs: logs.length,
    approvedLogs: approved.length,
    pendingLogs: pending.length,
    revisionLogs: revision.length,
    avgComplexity: Math.round(complexityAvg * 10) / 10,
    avgQuality: Math.round(qualityAvg * 10) / 10,
    highQualityRate: Math.round(highQualityRate * 10) / 10,
  };
}

export async function getDashboardByUnit(unitId, filters = {}) {
  return await getDashboardData({ ...filters, unitId });
}
