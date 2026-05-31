const KEYS = {
  ACCESS_TOKEN:      "rf_access",
  REFRESH_TOKEN:     "rf_refresh",
  CURRENT_STORE_ID:  "rf_store",
} as const;

export const storage = {
  getAccessToken:  (): string | null  => localStorage.getItem(KEYS.ACCESS_TOKEN),
  getRefreshToken: (): string | null  => localStorage.getItem(KEYS.REFRESH_TOKEN),

  setTokens: (access: string, refresh: string): void => {
    localStorage.setItem(KEYS.ACCESS_TOKEN,  access);
    localStorage.setItem(KEYS.REFRESH_TOKEN, refresh);
  },

  setAccessToken: (access: string): void => {
    localStorage.setItem(KEYS.ACCESS_TOKEN, access);
  },

  getCurrentStoreId: (): number | null => {
    const v = localStorage.getItem(KEYS.CURRENT_STORE_ID);
    return v ? parseInt(v, 10) : null;
  },

  setCurrentStoreId: (id: number): void => {
    localStorage.setItem(KEYS.CURRENT_STORE_ID, String(id));
  },

  clearTokens: (): void => {
    localStorage.removeItem(KEYS.ACCESS_TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
    localStorage.removeItem(KEYS.CURRENT_STORE_ID);
  },
};
