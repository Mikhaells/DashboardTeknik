/**
 * Authentication and User related type definitions
 * This file contains all the types used throughout the authentication system
 */

// User data from database
export interface User {
  id: number;
  username: string;
  fullname: string;
  password: string; // Note: Should be hashed in production
  levelId: number;
  createDate: Date;
}

// User data without sensitive information (for session and client-side)
export interface UserSafe {
  id: number;
  username: string;
  fullname: string;
  levelId: number;
  level?: string;
  levelDescription?: string;
}

// Login request payload
export interface LoginRequest {
  username: string;
  password: string;
}

// Login response from API
export interface LoginResponse {
  success: boolean;
  message: string;
  user?: UserSafe;
}

// User levels/roles (can be extended based on requirements)
export enum UserLevel {
  ADMIN = 1,
  MANAGER = 2,
  USER = 3,
  GUEST = 4,
}

// User role names for display
export const UserRoleNames: Record<UserLevel, string> = {
  [UserLevel.ADMIN]: 'Administrator',
  [UserLevel.MANAGER]: 'Manager',
  [UserLevel.USER]: 'User',
  [UserLevel.GUEST]: 'Guest',
};

// Session data structure (matches lib/session.ts)
export interface SessionData {
  user?: UserSafe;
  isLoggedIn: boolean;
}

// Form validation types for React Hook Form + Zod
export interface LoginFormData {
  username: string;
  password: string;
}

// API error response structure
export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

// API success response structure
export interface ApiSuccess<T = any> {
  success: true;
  message: string;
  data?: T;
}

// Authentication context type (if using React Context)
export interface AuthContextType {
  user: UserSafe | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

// Middleware protection options
export interface ProtectionOptions {
  requiredLevel?: UserLevel;
  redirectTo?: string;
}

// Database query result for user authentication
export interface UserQueryResult {
  Id: number;
  Username: string;
  Fullname: string;
  Password: string;
  LevelId: number;
  CreateDate: string;
  LevelUserId: number;
  Level: string;
  LevelDescription: string;
}

