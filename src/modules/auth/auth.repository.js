/**
 * Auth repository – find user by username.
 * backend/src/modules/auth/auth.repository.js
 */

import { prisma } from '../../lib/prisma.js';

export const findUserByUsername = async (username) => {
  return await prisma.users.findUnique({
    where: { username },
  });
};
