// All `import.meta.env.*` reads live here. Never reach into `import.meta.env`
// directly from feature code — import `env` instead.

interface Env {
  API_URL: string;
  API_VERSION: string;
  APP_NAME: string;
  APP_VERSION: string;
  IS_DEV: boolean;
  IS_PROD: boolean;
}

export const env: Env = {
  API_URL:     import.meta.env.VITE_API_URL     ?? 'http://localhost:8000',
  API_VERSION: import.meta.env.VITE_API_VERSION ?? 'v1',
  APP_NAME:    'RetailFlow',
  APP_VERSION: '1.0.0',
  IS_DEV:      import.meta.env.DEV,
  IS_PROD:     import.meta.env.PROD,
};

// Legacy default export — keep for backward compatibility
export default {
  API_BASE_URL: env.API_URL,
  API_VERSION:  env.API_VERSION,
} as const;
