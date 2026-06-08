export interface AccountSession {
  userId: string;
  email: string;
  first_name: string;
  last_name: string;
  access: string;
  refresh: string;
}

const SESSIONS_KEY = 'rf_sessions';
const ACTIVE_ID_KEY = 'rf_active_id';

export const sessionStore = {
  getAll(): AccountSession[] {
    try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]') as AccountSession[]; }
    catch { return []; }
  },

  get(userId: string): AccountSession | undefined {
    return this.getAll().find((s) => s.userId === userId);
  },

  upsert(session: AccountSession): void {
    const all = this.getAll().filter((s) => s.userId !== session.userId);
    all.push(session);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(all));
  },

  remove(userId: string): void {
    const all = this.getAll().filter((s) => s.userId !== userId);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(all));
    if (this.getActiveId() === userId) localStorage.removeItem(ACTIVE_ID_KEY);
  },

  clearAll(): void {
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(ACTIVE_ID_KEY);
  },

  setActiveId(userId: string): void {
    localStorage.setItem(ACTIVE_ID_KEY, userId);
  },

  getActiveId(): string | null {
    return localStorage.getItem(ACTIVE_ID_KEY);
  },

  syncActiveAccess(newAccess: string): void {
    const activeId = this.getActiveId();
    if (!activeId) return;
    const all = this.getAll();
    const idx = all.findIndex((s) => s.userId === activeId);
    if (idx >= 0) {
      all[idx].access = newAccess;
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(all));
    }
  },
};
