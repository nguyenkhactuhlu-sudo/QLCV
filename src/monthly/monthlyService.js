// Monthly review service
import { getAdapter } from "../api/dataAdapter.js";
import { authService } from "../auth/authService.js";

export async function submitSelfReview(period, data) {
  const user = authService.currentUser;
  if (!user) throw new Error("Not authenticated");

  const adapter = getAdapter();
  return await adapter.saveMonthlyReview({
    userId: user.id,
    period,
    ...data,
  });
}

export async function approveMonthlyReview(userId, period) {
  const user = authService.currentUser;
  if (!user) throw new Error("Not authenticated");

  const adapter = getAdapter();
  return await adapter.saveMonthlyReview({
    userId,
    period,
    reviewerId: user.id,
    reviewedAt: new Date().toISOString(),
    isLocked: true,
  });
}

export async function getMonthlyReviews(filters = {}) {
  const adapter = getAdapter();
  return await adapter.getMonthlyReviews(filters);
}

export async function getMyMonthlyReviews(period = null) {
  const user = authService.currentUser;
  if (!user) return [];
  return await getMonthlyReviews({
    userId: user.id,
    ...(period ? { period } : {}),
  });
}
