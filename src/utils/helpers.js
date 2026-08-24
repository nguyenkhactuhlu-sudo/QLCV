// Utility helper functions
import { authService } from "../auth/authService.js";

/**
 * Generate a UUID v4
 */
export function generateId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });
}

/**
 * Safe HTML escape to prevent XSS
 */
export function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Debounce function
 */
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Format date to locale string
 */
export function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Get current period (YYYY-MM)
 */
export function getCurrentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Check if user has permission for an action
 * Re-exports from permissions module for convenience
 */
export function can(user, action) {
  if (!user) return false;
  const permissions = getRolePermissions(user.role);
  return permissions.includes(action);
}

function getRolePermissions(role) {
  const map = {
    province_head: [
      "view:dashboard", "view:all", "approve:direct", "reject:direct",
      "rate:direct", "export:all",
    ],
    province_deputy: [
      "view:dashboard", "view:assigned", "approve:assigned",
      "reject:assigned", "rate:assigned", "export:assigned",
    ],
    unit_head: [
      "view:unit", "approve:unit", "reject:unit", "rate:unit", "export:unit",
    ],
    unit_deputy: ["create:log", "edit:own", "rate:delegated"],
    staff: ["create:log", "edit:own"],
    administrator: [
      "manage:users", "manage:units", "manage:delegations",
      "manage:registration", "view:audit",
    ],
  };
  return map[role] || [];
}
