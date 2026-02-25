/**
 * Permission repository – fetch role permissions in fewest queries.
 * Uses Prisma include for atomic, efficient lookup.
 */

import { prisma } from '../../lib/prisma.js';

/**
 * Get permission names for a role (by role name string).
 * Single query with include.
 */
export async function getPermissionsForRole(roleName) {
  const role = await prisma.roles.findUnique({
    where: { name: roleName },
    select: {
      role_permissions: {
        select: { permission: { select: { name: true } } },
      },
    },
  });

  if (!role) return [];

  return role.role_permissions.map((rp) => rp.permission.name);
}

/**
 * Get permission names for multiple roles in one query.
 */
export async function getPermissionsForRoles(roleNames) {
  const roles = await prisma.roles.findMany({
    where: { name: { in: roleNames } },
    select: {
      role_permissions: {
        select: { permission: { select: { name: true } } },
      },
    },
  });

  const set = new Set();
  roles.forEach((r) => r.role_permissions.forEach((rp) => set.add(rp.permission.name)));
  return [...set];
}
