// Review service - approve/reject work logs
import { getAdapter } from "../api/dataAdapter.js";
import { authService } from "../auth/authService.js";

export async function approveLog(logId, complexity, quality, comment = "") {
  const user = authService.currentUser;
  if (!user) throw new Error("Not authenticated");

  // Validate
  if (complexity < 1 || complexity > 10) throw new Error("Complexity must be 1-10");
  if (quality < 1 || quality > 10) throw new Error("Quality must be 1-10");

  const adapter = getAdapter();
  return await adapter.updateLogStatus(logId, "approved", {
    complexity,
    quality,
    comment,
    reviewerId: user.id,
  });
}

export async function rejectLog(logId, comment) {
  const user = authService.currentUser;
  if (!user) throw new Error("Not authenticated");
  if (!comment || comment.trim().length === 0) {
    throw new Error("Comment is required when rejecting");
  }

  const adapter = getAdapter();
  return await adapter.updateLogStatus(logId, "revision", {
    comment: comment.trim(),
    reviewerId: user.id,
  });
}

export async function resubmitLog(logId, title, result) {
  const user = authService.currentUser;
  if (!user) throw new Error("Not authenticated");

  const adapter = getAdapter();
  return await adapter.updateLogStatus(logId, "pending", {
    title,
    result,
    authorId: user.id,
  });
}
