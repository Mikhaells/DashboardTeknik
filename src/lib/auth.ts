import { getSession } from './session';

export interface UserSession {
  id: number;
  username: string;
  fullname: string;
  levelId: number;
  level?: string;
  levelDescription?: string;
}

export async function getUserSession(): Promise<UserSession | null> {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !session.user) {
      return null;
    }
    
    return {
      id: session.user.id,
      username: session.user.username,
      fullname: session.user.fullname,
      levelId: session.user.levelId,
      level: session.user.level,
      levelDescription: session.user.levelDescription
    };
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}
