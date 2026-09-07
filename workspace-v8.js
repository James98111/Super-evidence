/* Super Evidence V8 local research workspace.
 * Stores only user-selected research state in this browser via localStorage.
 * No account, server profile or cross-device sync is required.
 */

const KEY = 'super_evidence_workspace_v8';
const MAX_RECENT = 12;
const MAX_SAVED = 20;

const emptyWorkspace = () => ({
  version: 1,
  preferredBalance: 100000,
  lastIntent: null,
  lastFund: null,
  lastOption: null,
  compareA: null,
  compareB: null,
  recent: [],
  saved: [],
  updatedAt: null,
});

function safeStorage() {
  try {
    const x = window.localStorage;
    const probe = '__se_probe__';
    x.setItem(probe, '1');
    x.removeItem(probe);
    return x;
  } catch {
    return null;
  }
}

export function loadWorkspace() {
  const store = safeStorage();
  if (!store) return emptyWorkspace();
  try {
    const raw = JSON.parse(store.getItem(KEY) || 'null');
    return raw && raw.version === 1 ? { ...emptyWorkspace(), ...raw } : emptyWorkspace();
  } catch {
    return emptyWorkspace();
  }
}

export function saveWorkspace(patch) {
  const store = safeStorage();
  const current = loadWorkspace();
  const next = { ...current, ...patch, version: 1, updatedAt: new Date().toISOString() };
  if (store) store.setItem(KEY, JSON.stringify(next));
  return next;
}

export function rememberViewedOption({ fund, optionId, optionName }) {
  if (!fund || !optionId) return loadWorkspace();
  const current = loadWorkspace();
  const row = { fund, optionId: String(optionId), optionName: optionName || String(optionId), viewedAt: new Date().toISOString() };
  const recent = [row, ...current.recent.filter(x => !(x.fund === fund && String(x.optionId) === String(optionId)))].slice(0, MAX_RECENT);
  return saveWorkspace({ lastFund: fund, lastOption: row, recent });
}

export function toggleSavedOption({ fund, optionId, optionName }) {
  if (!fund || !optionId) return loadWorkspace();
  const current = loadWorkspace();
  const exists = current.saved.some(x => x.fund === fund && String(x.optionId) === String(optionId));
  const saved = exists
    ? current.saved.filter(x => !(x.fund === fund && String(x.optionId) === String(optionId)))
    : [{ fund, optionId: String(optionId), optionName: optionName || String(optionId), savedAt: new Date().toISOString() }, ...current.saved].slice(0, MAX_SAVED);
  return saveWorkspace({ saved });
}

export function isSaved(fund, optionId) {
  return loadWorkspace().saved.some(x => x.fund === fund && String(x.optionId) === String(optionId));
}

export function saveComparison(a, b) {
  return saveWorkspace({ compareA: a || null, compareB: b || null });
}

export function setPreferredBalance(balance) {
  const n = Number(balance);
  if (!Number.isFinite(n) || n < 0) return loadWorkspace();
  return saveWorkspace({ preferredBalance: Math.round(n) });
}

export function clearWorkspace() {
  const store = safeStorage();
  if (store) store.removeItem(KEY);
  return emptyWorkspace();
}

export function workspacePrivacyText() {
  return 'Saved research is stored only in this browser on this device. Super Evidence does not require an account for this feature.';
}
