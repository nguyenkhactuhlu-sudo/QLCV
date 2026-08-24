// Constants for the QLCV system

export const STORAGE_KEYS = {
  WORKLOGS: 'vks-worklog-demo-v3',
  MONTHLY: 'vks-monthly-demo-v1',
  PERSONNEL: 'vks-personnel-demo-v1',
  AUDIT: 'vks-audit-demo-v1',
  REGISTRATION_CODES: 'vks-registration-codes-demo-v1',
  REGISTERED_ACCOUNTS: 'vks-registered-accounts-demo-v1',
  NOTIFICATION_READ: 'vks-notification-read-demo-v1',
};

export const ROLES = Object.freeze({
  PROVINCE_HEAD: 'province_head',
  PROVINCE_DEPUTY: 'province_deputy',
  UNIT_HEAD: 'unit_head',
  UNIT_DEPUTY: 'unit_deputy',
  STAFF: 'staff',
  ADMINISTRATOR: 'administrator',
});

export const STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REVISION: 'revision',
});

export const APP_CONFIG = {
  DEMO_MODE: import.meta.env.VITE_DEMO_MODE === 'true',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  TIMEZONE: 'Asia/Ho_Chi_Minh',
};
