import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { getCustomerAuthHeaders, getCustomerToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api-base";

export function useCustomerAddresses() {
  const hasToken = !!getCustomerToken();
  return useQuery({
    queryKey: [api.customer.addresses.path],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.customer.addresses.path), {
        credentials: "include",
        headers: getCustomerAuthHeaders(),
      });
      if (res.status === 401) return [];
      if (!res.ok) throw new Error("Failed to fetch addresses");
      return api.customer.addresses.responses[200].parse(await res.json());
    },
    enabled: hasToken,
    retry: false,
  });
}

export function useCreateCustomerAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof api.customer.addressCreate.input.parse>[0]) => {
      const validated = api.customer.addressCreate.input.parse(data);
      const res = await fetch(getApiUrl(api.customer.addressCreate.path), {
        method: "POST",
        headers: getCustomerAuthHeaders(),
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to add address");
      return api.customer.addressCreate.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.customer.addresses.path] }),
  });
}

export function useUpdateCustomerAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Parameters<typeof api.customer.addressUpdate.input.parse>[0]) => {
      const path = getApiUrl(buildUrl(api.customer.addressUpdate.path, { id }));
      const validated = api.customer.addressUpdate.input.parse(data);
      const res = await fetch(path, {
        method: "PATCH",
        headers: getCustomerAuthHeaders(),
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to update address");
      return api.customer.addressUpdate.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.customer.addresses.path] }),
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const path = getApiUrl(buildUrl(api.customer.addressSetDefault.path, { id }));
      const res = await fetch(path, {
        method: "PATCH",
        headers: getCustomerAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to set default");
      return api.customer.addressSetDefault.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.customer.addresses.path] }),
  });
}

export function useDeleteCustomerAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const path = getApiUrl(buildUrl(api.customer.addressDelete.path, { id }));
      const res = await fetch(path, {
        method: "DELETE",
        headers: getCustomerAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete address");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.customer.addresses.path] }),
  });
}
