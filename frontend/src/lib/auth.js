/**
 * auth.js — Direct Google OAuth helpers (no Supabase)
 *
 * Flow:
 *  1. signInWithGoogle() → navigates to /api/v1/auth/google/login
 *  2. Google redirects to backend callback → backend issues JWT
 *  3. Backend redirects to /auth/callback#token=<JWT>
 *  4. AuthCallback.jsx stores token in localStorage
 */

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'agneyaa_token';

/** Redirect to Google OAuth (backend handles the code exchange) */
export function signInWithGoogle() {
  window.location.href = `${API}/auth/google/login`;
}

/** Store JWT in localStorage */
export function storeToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Get stored JWT string or null */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** Remove JWT (sign out) */
export function signOut() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Decode JWT payload (no verification — just reads claims).
 * Returns null if missing or malformed.
 */
export function decodeToken(token) {
  if (!token) return null;
  try {
    const [, payloadB64] = token.split('.');
    // Base64url → Base64
    const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/** Get current user from stored token, or null if not logged in / expired */
export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  const payload = decodeToken(token);
  if (!payload) return null;
  // Check expiry (exp is in seconds)
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    signOut(); // auto-clear expired token
    return null;
  }
  return {
    id:         payload.sub,
    email:      payload.email,
    name:       payload.name,
    avatar_url: payload.avatar_url,
    provider:   payload.provider,
  };
}
