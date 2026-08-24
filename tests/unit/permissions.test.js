import { describe, it, expect } from 'vitest';
import { can, canViewDashboard, canCreateLog } from '../../src/permissions/permissions.js';

describe('Permissions', () => {
  const users = {
    provinceHead: { id: 'u01', role: 'province_head' },
    provinceDeputy: { id: 'u02', role: 'province_deputy' },
    unitHead: { id: 'u03', role: 'unit_head' },
    unitDeputy: { id: 'u04', role: 'unit_deputy' },
    staff: { id: 'u05', role: 'staff' },
    admin: { id: 'u06', role: 'administrator' },
  };

  it('province_head can view all dashboard', () => {
    expect(canViewDashboard(users.provinceHead)).toBe(true);
  });

  it('staff can create log', () => {
    expect(canCreateLog(users.staff)).toBe(true);
  });

  it('province_head can rate direct', () => {
    expect(can(users.provinceHead, 'rate:direct')).toBe(true);
  });

  it('staff cannot approve', () => {
    expect(can(users.staff, 'approve:unit')).toBe(false);
  });

  it('admin cannot view dashboard', () => {
    expect(canViewDashboard(users.admin)).toBe(false);
  });

  it('unit_head can approve unit', () => {
    expect(can(users.unitHead, 'approve:unit')).toBe(true);
  });

  it('unit_deputy can rate with delegation', () => {
    expect(can(users.unitDeputy, 'rate:delegated')).toBe(true);
  });

  it('null user returns false for all', () => {
    expect(can(null, 'create:log')).toBe(false);
    expect(canViewDashboard(null)).toBe(false);
  });
});
