import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

// Session configuration
export const sessionOptions = {
  password: process.env.SESSION_PASSWORD || 'default-session-password-change-in-production',
  cookieName: 'dashboard-teknik-tvri-session',
  cookieOptions: {
    // Secure cookies only work on HTTPS. Browsers also allow them on http://localhost,
    // but NOT on http://192.168.x.x — which breaks login over LAN unless HTTPS is used.
    secure: process.env.SESSION_COOKIE_SECURE === 'true',
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

// Type definition for session data
export interface SessionData {
  user?: {
    id: number;
    username: string;
    fullname: string;
    levelId: number;
    level?: string;
    levelDescription?: string;
  };
  isLoggedIn: boolean;
}

// Default session data
export const defaultSession: SessionData = {
  isLoggedIn: false,
};

/**
 * Get session data from iron-session
 * @returns Promise<SessionData> - Current session data
 */
export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  
  // Ensure session has default values
  if (!session.isLoggedIn) {
    session.isLoggedIn = false;
  }
  
  return session;
}

/**
 * Save session data to iron-session
 * @param session - Session data to save
 */
export async function saveSession(session: SessionData): Promise<void> {
  const cookieStore = await cookies();
  const ironSession = await getIronSession<SessionData>(cookieStore, sessionOptions);
  Object.assign(ironSession, session);
  await ironSession.save();
}

/**
 * Create user session after successful login
 * @param user - User data from database
 * @returns Promise<SessionData> - Created session data
 */
export async function createUserSession(user: {
  id: number;
  username: string;
  fullname: string;
  levelId: number;
  level?: string;
  levelDescription?: string;
}): Promise<SessionData> {
  const sessionData: SessionData = {
    user: {
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      levelId: user.levelId,
      level: user.level,
      levelDescription: user.levelDescription,
    },
    isLoggedIn: true,
  };
  
  await saveSession(sessionData);
  return sessionData;
}

/**
 * Destroy user session (logout)
 * @returns Promise<void>
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  session.destroy();
}

/**
 * Check if user is authenticated
 * @returns Promise<boolean> - True if user is logged in
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isLoggedIn && !!session.user;
}

/**
 * Get current authenticated user
 * @returns Promise<User | null> - Current user data or null if not authenticated
 */
export async function getCurrentUser(): Promise<{
  id: number;
  username: string;
  fullname: string;
  levelId: number;
  level?: string;
  levelDescription?: string;
} | null> {
  const session = await getSession();
  return session.user || null;
}

/**
 * Middleware helper to protect routes
 * Can be used in API routes and server components
 * @returns Promise<User | null> - User data if authenticated, null otherwise
 */
export async function requireAuth(): Promise<{
  id: number;
  username: string;
  fullname: string;
  levelId: number;
  level?: string;
  levelDescription?: string;
} | null> {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }
  
  return user;
}

export default {
  getSession,
  saveSession,
  createUserSession,
  destroySession,
  isAuthenticated,
  getCurrentUser,
  requireAuth,
  sessionOptions,
};
