/**
 * useSessionStore — localStorage-backed session management for Beej chats.
 * Persists: appState, businessContext, formData, all chat sessions.
 */

const SESSIONS_KEY      = 'beej_sessions';
const CURRENT_ID_KEY    = 'beej_current_session_id';
const SESSION_PREFIX    = 'beej_session_';
const APP_STATE_KEY     = 'beej_app_state';
const FORM_DATA_KEY     = 'beej_form_data';

const CAT_LABELS = {
  agriculture: '🌾 Agriculture',
  retail:      '🏪 Retail',
  food:        '🍱 Food Processing',
  handicraft:  '🧵 Handicraft',
  dairy:       '🐄 Dairy',
  services:    '🔧 Local Services',
  tailoring:   '🧶 Tailoring',
  transport:   '🚛 Transport',
  beauty:      '💇 Beauty & Wellness',
  education:   '📚 Education',
  technology:  '💻 Technology',
  construction:'🏗️ Construction',
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function generateSessionTitle(businessContext) {
  const cat = CAT_LABELS[businessContext?.category] || businessContext?.category || 'Business';
  const loc = businessContext?.district || businessContext?.village || '';
  return loc ? `${cat} — ${loc}` : `${cat} Analysis`;
}

function safeGet(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function useSessionStore() {

  function getAllSessions() {
    return safeGet(SESSIONS_KEY, []);
  }

  function getSession(id) {
    return safeGet(SESSION_PREFIX + id, null);
  }

  function createSession(businessContext) {
    const id    = genId();
    const now   = new Date().toISOString();
    const title = generateSessionTitle(businessContext);
    const session = {
      id,
      title,
      createdAt:       now,
      updatedAt:       now,
      category:        businessContext?.category || '',
      district:        businessContext?.district || '',
      businessContext: businessContext || {},
      datasetData:     {},
      messages:        [],
      followups:       [],
      report:          null,
    };
    safeSet(SESSION_PREFIX + id, session);

    const list = getAllSessions();
    list.unshift({ id, title, createdAt: now, updatedAt: now, category: session.category, district: session.district });
    safeSet(SESSIONS_KEY, list);
    safeSet(CURRENT_ID_KEY, id);
    return session;
  }

  function updateSession(id, patch) {
    const existing = getSession(id);
    if (!existing) return;
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    // Recompute title if businessContext changed
    if (patch.businessContext) updated.title = generateSessionTitle(patch.businessContext);
    safeSet(SESSION_PREFIX + id, updated);

    const list = getAllSessions();
    const idx  = list.findIndex(s => s.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], title: updated.title, updatedAt: updated.updatedAt };
      safeSet(SESSIONS_KEY, list);
    }
  }

  function deleteSession(id) {
    localStorage.removeItem(SESSION_PREFIX + id);
    safeSet(SESSIONS_KEY, getAllSessions().filter(s => s.id !== id));
    if (safeGet(CURRENT_ID_KEY) === id) localStorage.removeItem(CURRENT_ID_KEY);
  }

  function getCurrentSessionId() {
    return localStorage.getItem(CURRENT_ID_KEY) || null;
  }

  function setCurrentSessionId(id) {
    safeSet(CURRENT_ID_KEY, id);
  }

  // ── App-level state persistence ────────────────────────────────
  function saveAppState(state, businessContext) {
    safeSet(APP_STATE_KEY, { state, businessContext });
  }

  function getAppState() {
    return safeGet(APP_STATE_KEY, null);
  }

  function clearAppState() {
    localStorage.removeItem(APP_STATE_KEY);
  }

  // ── Form data persistence ──────────────────────────────────────
  function saveFormData(data) {
    safeSet(FORM_DATA_KEY, data);
  }

  function getFormData() {
    return safeGet(FORM_DATA_KEY, null);
  }

  function clearFormData() {
    localStorage.removeItem(FORM_DATA_KEY);
  }

  return {
    getAllSessions,
    getSession,
    createSession,
    updateSession,
    deleteSession,
    getCurrentSessionId,
    setCurrentSessionId,
    saveAppState,
    getAppState,
    clearAppState,
    saveFormData,
    getFormData,
    clearFormData,
  };
}
