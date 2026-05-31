import { apiClient } from "@/lib/axios";
import type { LoginPayload, LoginResponse } from "@/features/auth/types";

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>("/users/login/", payload).then((r) => r.data as unknown as LoginResponse),

  me: () =>
    apiClient.get("/users/me/").then((r) => r.data),
};
