import type { SessionData } from '../types';

const SESSION_KEY = 'polling_session';

export const saveSession = (session: SessionData): void => {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const getSession = (): SessionData | null => {
  const data = sessionStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearSession = (): void => {
  sessionStorage.removeItem(SESSION_KEY);
};

export const generateSessionId = (role: string, name: string): string => {
  // Deterministic: same role+name always produces the same sessionId
  // This ensures refresh doesn't create a new session that bypasses vote-once protection
  return `${role}-${name.trim().toLowerCase().replace(/\s+/g, '-')}`;
};

const KICKED_KEY = 'polling_kicked_name';

export const setKicked = (name: string): void => {
  localStorage.setItem(KICKED_KEY, name);
};

export const getKickedName = (): string | null => {
  return localStorage.getItem(KICKED_KEY);
};

export const clearKicked = (): void => {
  localStorage.removeItem(KICKED_KEY);
};