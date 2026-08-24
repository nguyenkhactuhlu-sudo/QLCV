// Demo data and mock functions for development/testing
// This module provides sample data that was previously in app.js

export const units = [
  { id: 'province', name: 'VKSND tỉnh', short: 'VKSND tỉnh', type: 'province', parentId: null },
  {
    id: 'p1',
    name: 'Phòng Thực hành quyền công tố, kiểm sát điều tra án trật tự xã hội',
    short: 'Phòng 1',
    type: 'department',
    parentId: 'province',
  },
  {
    id: 'p2',
    name: 'Phòng nghiệp vụ 2',
    short: 'Phòng 2',
    type: 'department',
    parentId: 'province',
  },
  {
    id: 'p3',
    name: 'Phòng nghiệp vụ 3',
    short: 'Phòng 3',
    type: 'department',
    parentId: 'province',
  },
  {
    id: 'p7',
    name: 'Phòng Kiểm sát thi hành án dân sự',
    short: 'Phòng 7',
    type: 'department',
    parentId: 'province',
  },
  {
    id: 'p8',
    name: 'Phòng nghiệp vụ 8',
    short: 'Phòng 8',
    type: 'department',
    parentId: 'province',
  },
  {
    id: 'p9',
    name: 'Phòng nghiệp vụ 9',
    short: 'Phòng 9',
    type: 'department',
    parentId: 'province',
  },
  {
    id: 'p10',
    name: 'Phòng nghiệp vụ 10',
    short: 'Phòng 10',
    type: 'department',
    parentId: 'province',
  },
  {
    id: 'p15',
    name: 'Phòng nghiệp vụ 15',
    short: 'Phòng 15',
    type: 'department',
    parentId: 'province',
  },
  {
    id: 'tt',
    name: 'Thanh tra - Khiếu tố',
    short: 'Thanh tra - Khiếu tố',
    type: 'department',
    parentId: 'province',
  },
  {
    id: 'vp',
    name: 'Văn phòng tổng hợp',
    short: 'Văn phòng',
    type: 'department',
    parentId: 'province',
  },
  {
    id: 'kv1',
    name: 'VKSND Khu vực 1',
    short: 'Khu vực 1',
    type: 'regional',
    parentId: 'province',
  },
  {
    id: 'kv2',
    name: 'VKSND Khu vực 2',
    short: 'Khu vực 2',
    type: 'regional',
    parentId: 'province',
  },
  {
    id: 'kv3',
    name: 'VKSND Khu vực 3',
    short: 'Khu vực 3',
    type: 'regional',
    parentId: 'province',
  },
  {
    id: 'kv4',
    name: 'VKSND Khu vực 4',
    short: 'Khu vực 4',
    type: 'regional',
    parentId: 'province',
  },
  {
    id: 'kv5',
    name: 'VKSND Khu vực 5',
    short: 'Khu vực 5',
    type: 'regional',
    parentId: 'province',
  },
  {
    id: 'kv6',
    name: 'VKSND Khu vực 6',
    short: 'Khu vực 6',
    type: 'regional',
    parentId: 'province',
  },
  {
    id: 'kv7',
    name: 'VKSND Khu vực 7',
    short: 'Khu vực 7',
    type: 'regional',
    parentId: 'province',
  },
  {
    id: 'kv8',
    name: 'VKSND Khu vực 8',
    short: 'Khu vực 8',
    type: 'regional',
    parentId: 'province',
  },
  {
    id: 'kv9',
    name: 'VKSND Khu vực 9',
    short: 'Khu vực 9',
    type: 'regional',
    parentId: 'province',
  },
];

export const users = [
  {
    id: 'u01',
    name: 'Phạm Hải Anh',
    title: 'Viện trưởng',
    professionalTitle: 'KSV cao cấp',
    role: 'province_head',
    unitId: 'province',
    initials: 'PA',
  },
  {
    id: 'u02',
    name: 'Nguyễn Văn Lượng',
    title: 'Phó Viện trưởng',
    professionalTitle: 'KSV cao cấp',
    role: 'province_deputy',
    unitId: 'province',
    assignedUnits: ['p1', 'p7', 'kv1'],
    initials: 'NL',
  },
];

export function getUnitById(id) {
  return units.find((u) => u.id === id);
}

export function getUserById(id) {
  return users.find((u) => u.id === id);
}

export function getUsersByUnit(unitId) {
  return users.filter((u) => u.unitId === unitId);
}

export function getUsersByRole(role) {
  return users.filter((u) => u.role === role);
}

// Demo adapter functions for the data adapter interface
export async function getLogs(filters = {}) {
  return []; // Will be implemented from app.js migration
}

export async function saveLog(log) {
  return log;
}

export async function getMonthlyReviews(filters = {}) {
  return [];
}
