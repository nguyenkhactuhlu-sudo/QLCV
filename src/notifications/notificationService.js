// Notification service
import { getAdapter } from "../api/dataAdapter.js";
import { authService } from "../auth/authService.js";
import { STORAGE_KEYS } from "../utils/constants.js";

export async function getNotifications() {
  const user = authService.currentUser;
  if (!user) return [];

  const adapter = getAdapter();
  const logs = await adapter.getLogs({ status: "pending" });

  const notifications = [];

  // Pending logs needing review
  const pendingCount = logs.filter(l => l.reviewerId !== user.id).length;
  if (pendingCount > 0) {
    notifications.push({
      id: "pending-reviews",
      type: "pending_review",
      title: `${pendingCount} nhật ký chờ chấm`,
      referenceType: "review",
    });
  }

  // Revisions for the current user
  const userLogs = await adapter.getLogs({ authorId: user.id, status: "revision" });
  if (userLogs.length > 0) {
    notifications.push({
      id: "revisions",
      type: "revision_requested",
      title: `${userLogs.length} nhật ký bị trả lại`,
      referenceType: "journal",
    });
  }

  return notifications;
}

export async function markAsRead(notificationId) {
  const user = authService.currentUser;
  if (!user) return;

  const key = `${STORAGE_KEYS.NOTIFICATION_READ}_${user.id}`;
  const readIds = JSON.parse(localStorage.getItem(key) || "[]");
  if (!readIds.includes(notificationId)) {
    readIds.push(notificationId);
    localStorage.setItem(key, JSON.stringify(readIds));
  }
}

export function isRead(notificationId) {
  const user = authService.currentUser;
  if (!user) return false;

  const key = `${STORAGE_KEYS.NOTIFICATION_READ}_${user.id}`;
  const readIds = JSON.parse(localStorage.getItem(key) || "[]");
  return readIds.includes(notificationId);
}
