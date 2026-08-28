import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getApiUrl } from "@/lib/api-base";
import { getAuthHeaders, setAuthToken, clearAuthToken } from "@/lib/auth";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.auth.me.path), {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.auth.me.responses[200].parse(await res.json());
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const validated = api.auth.login.input.parse(credentials);
      const res = await fetch(getApiUrl(api.auth.login.path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Login failed");
      const data = api.auth.login.responses[200].parse(await res.json());
      if (data.token) setAuthToken(data.token);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.auth.me.path] }),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(getApiUrl(api.auth.logout.path), {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Logout failed");
      clearAuthToken();
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
    },
  });

  return { user, isLoading, isError, login: loginMutation, logout: logoutMutation };
}
