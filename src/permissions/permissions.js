// Permission checking logic
import { ROLES, APP_CONFIG } from '../utils/constants.js';

/**
 * Check if a user can perform a specific action.
 * @param {Object} user - The current user
 * @param {string} action - The action to check
 * @param {Object} context - Additional context (target user, unit, etc.)
 * @returns {boolean}
 */
export function can(user, action, context = {}) {
  if (!user) return false;

  const roleActions = {
    [ROLES.PROVINCE_HEAD]: [
      'view:all',
      'view:dashboard',
      'approve:direct',
      'reject:direct',
      'rate:direct',
      'export:all',
    ],
    [ROLES.PROVINCE_DEPUTY]: [
      'view:dashboard',
      'view:assigned',
      'approve:assigned',
      'reject:assigned',
      'rate:assigned',
      'export:assigned',
    ],
    [ROLES.UNIT_HEAD]: ['view:unit', 'approve:unit', 'reject:unit', 'rate:unit', 'export:unit'],
    [ROLES.UNIT_DEPUTY]: ['create:log', 'edit:own', 'rate:delegated'],
    [ROLES.STAFF]: ['create:log', 'edit:own'],
    [ROLES.ADMINISTRATOR]: [
      'manage:users',
      'manage:units',
      'manage:delegations',
      'manage:registration',
      'view:audit',
    ],
  };

  return (roleActions[user.role] || []).includes(action);
}

export function canViewDashboard(user) {
  return can(user, 'view:dashboard') || can(user, 'view:all');
}

export function canCreateLog(user) {
  return can(user, 'create:log');
}

export function canEditLog(user, log) {
  if (!can(user, 'edit:own')) return false;
  if (!log) return false;
  return log.authorId === user.id && log.status !== 'approved';
}

export function canApprove(user, log) {
  return can(user, 'approve:direct') || can(user, 'approve:unit');
}
