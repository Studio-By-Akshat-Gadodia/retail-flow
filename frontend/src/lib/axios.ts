import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import env from "@/config/env";
import { storage } from "@/lib/storage";
import type { ApiResponse } from "@/shared/types/api";

const BASE_URL = `${env.API_BASE_URL}/api/${env.API_VERSION}`;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = storage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = storage.getRefreshToken();
  if (!refresh) throw new Error("No refresh token.");

  // Use a plain axios call (not apiClient) to avoid interceptor loops
  const response = await axios.post<ApiResponse<{ access: string }>>(
    `${BASE_URL}/users/token/refresh/`,
    { refresh }
  );

  if (response.data.status !== "success") {
    throw new Error("Token refresh failed.");
  }

  const { access } = response.data.data;
  storage.setAccessToken(access);
  return access;
}

// On 401, refresh once then retry; on second 401, clear tokens
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse<unknown>;
    if (data.status === "failed") {
      return Promise.reject(Object.assign(new Error("API error"), { data: data.data }));
    }
    // Unwrap envelope so callers work with domain types directly
    response.data = data.data;
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      // Deduplicate concurrent refresh calls
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });

      try {
        const access = await refreshPromise;
        original.headers.Authorization = `Bearer ${access}`;
        return apiClient(original);
      } catch {
        storage.clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
