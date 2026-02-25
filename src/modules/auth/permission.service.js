/**
 * Permission Service – Admin UI: get all roles with their permissions.
 * Uses findMany + map for efficient many-to-many join.
 */

import { prisma } from '../../lib/prisma.js';

/**
 * Get all roles with their permissions, formatted for Admin Dashboard toggle UI.
 * Single query with include; maps role_permissions to permission names.
 */
export async function getRolePermissions() {
  const roles = await prisma.roles.findMany({
    where: {},
    select: {
      id: true,
      name: true,
      role_permissions: {
        select: { permission: { select: { id: true, name: true } } },
      },
    },
    orderBy: { id: 'asc' },
  });

  const permissions = await prisma.permissions.findMany({
    select: { id: true, name: true },
    orderBy: { id: 'asc' },
  });

  return {
    roles: roles.map((r) => ({
      id: r.id,
      name: r.name,
      permissions: r.role_permissions.map((rp) => rp.permission),
    })),
    allPermissions: permissions,
  };
}
