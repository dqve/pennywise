import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { createUser, getUserByEmail, type User } from './db-runtime.ts';

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString('hex');
}

export function validateCredentials(email: unknown, password: unknown) {
  const normalized = String(email ?? '').trim().toLowerCase();
  const secret = String(password ?? '');
  if (normalized.length > 254 || !/^\S+@\S+\.\S+$/.test(normalized)) throw new Error('Enter a valid email address');
  if (secret.length < 8 || secret.length > 200) throw new Error('Password must be between 8 and 200 characters');
  return { email: normalized, password: secret };
}

export async function registerUser(email: string, password: string): Promise<User> {
  if (await getUserByEmail(email)) throw new Error('An account with this email already exists');
  const salt = randomBytes(16).toString('hex');
  try {
    return await createUser({ email, passwordHash: hashPassword(password, salt), passwordSalt: salt });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') throw new Error('An account with this email already exists');
    throw error;
  }
}

export async function verifyUser(email: string, password: string): Promise<User> {
  const user = await getUserByEmail(email);
  if (!user) throw new Error('Email or password is incorrect');
  const candidate = Buffer.from(hashPassword(password, user.passwordSalt), 'hex');
  const stored = Buffer.from(user.passwordHash, 'hex');
  if (candidate.length !== stored.length || !timingSafeEqual(candidate, stored)) throw new Error('Email or password is incorrect');
  return user;
}
