const env = {
  API_BASE_URL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  API_VERSION: import.meta.env.VITE_API_VERSION ?? "v1",
} as const;

export default env;
