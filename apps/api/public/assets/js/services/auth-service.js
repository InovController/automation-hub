import { api } from './api.js';
import { getStoredToken, setStoredToken } from './session-storage.js';
import { state } from '../state/app-state.js';

export async function restoreSession() {
  const token = getStoredToken();
  if (!token) {
    state.currentUser = null;
    return null;
  }

  try {
    const user = await api('/auth/me');
    state.currentUser = user;
    return user;
  } catch {
    setStoredToken(null);
    state.currentUser = null;
    return null;
  }
}

export async function registerAccount(payload) {
  const session = await api('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  setStoredToken(session.token);
  state.currentUser = session.user;
  return session.user;
}

export async function loginAccount(payload) {
  const session = await api('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  setStoredToken(session.token);
  state.currentUser = session.user;
  return session.user;
}

export async function logoutAccount() {
  try {
    await api('/auth/logout', { method: 'POST' });
  } finally {
    setStoredToken(null);
    state.currentUser = null;
  }
}
