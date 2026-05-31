import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/features/auth/api/authApi";
import { storage } from "@/lib/storage";
import { ROUTES } from "@/config/routes";
import type { LoginPayload, LoginResponse, AuthUser } from "@/features/auth/types";

const ME_KEY = ["auth", "me"] as const;

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      storage.setTokens(data.access, data.refresh);
      queryClient.setQueryData(ME_KEY, data.user);
      navigate(ROUTES.DASHBOARD);
    },
  });
}

export function useMe() {
  return useQuery<AuthUser>({
    queryKey: ME_KEY,
    queryFn: authApi.me,
    enabled: !!storage.getAccessToken(),
    staleTime: Infinity,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return () => {
    storage.clearTokens();
    queryClient.clear();
    navigate(ROUTES.LOGIN);
  };
}
