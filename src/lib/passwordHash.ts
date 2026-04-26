import bcrypt from "bcryptjs";

const ROUNDS = 12;

/**
 * One-way password hashing for server-side storage. Never log or return hashes to clients in JSON.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(
  plain: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plain, passwordHash);
}
