import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { getAuthHeaders } from "@/lib/auth";
import { getApiUrl } from "@/lib/api-base";

export function useAdmins() {
  return useQuery({
    queryKey: [api.admins.list.path],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.admins.list.path), {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (res.status === 403) throw new Error("Forbidden: Super admin only");
      if (!res.ok) throw new Error("Failed to fetch admins");
      return api.admins.list.responses[200].parse(await res.json());
    },
    retry: false,
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const validated = api.admins.create.input.parse(data);
      const res = await fetch(getApiUrl(api.admins.create.path), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body && body.message) || res.statusText);
      }
      return api.admins.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.admins.list.path] }),
  });
}

export function useUpdateAdminPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      const validated = api.admins.updatePassword.input.parse({ password });
      const res = await fetch(
        getApiUrl(buildUrl(api.admins.updatePassword.path, { id })),
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body && body.message) || res.statusText);
      }
      return api.admins.updatePassword.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.admins.list.path] }),
  });
}
