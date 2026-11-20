import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { createSession, deleteSession, getSessionUser, type SessionUser } from './db-runtime.ts';
export { registerUser, validateCredentials, verifyUser } from './credentials.ts';

const COOKIE = 'pennywise_session';
const SESSION_DAYS = 30;

export async function startSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await createSession(userId, tokenHash, expiresAt);
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires: new Date(expiresAt) });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  try {
    if (token) await deleteSession(createHash('sha256').update(token).digest('hex'));
  } finally {
    // Always clear the browser cookie, even if the persistence layer is temporarily unavailable.
    jar.set(COOKIE, '', { httpOnly: true, expires: new Date(0), sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
  }
}

export async function getCurrentUser(): Promise<SessionUser|null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return await getSessionUser(createHash('sha256').update(token).digest('hex'));
}

export function publicUser(user: { id: string; email: string }) { return { id: user.id, email: user.email }; }

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHENTICATED');
  return user;
}
