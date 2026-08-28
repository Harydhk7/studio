import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { getAuthHeaders } from "@/lib/auth";
import { getApiUrl } from "@/lib/api-base";

export function useCustomers() {
  return useQuery({
    queryKey: [api.customers.list.path],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.customers.list.path), {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch customers");
      return api.customers.list.responses[200].parse(await res.json());
    },
  });
}

export function useCustomerOrders(customerId: number | null) {
  return useQuery({
    queryKey: [api.customers.orders.path, customerId],
    queryFn: async () => {
      if (customerId == null) return [];
      const res = await fetch(
        getApiUrl(buildUrl(api.customers.orders.path, { id: customerId })),
      {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return api.customers.orders.responses[200].parse(await res.json());
    },
    enabled: customerId != null && customerId > 0,
  });
}

export function useCustomerCustomRequests(customerId: number | null) {
  return useQuery({
    queryKey: [api.customers.customRequests.path, customerId],
    queryFn: async () => {
      if (customerId == null) return [];
      const res = await fetch(
        getApiUrl(
          buildUrl(api.customers.customRequests.path, { id: customerId }),
        ),
      {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch custom requests");
      return api.customers.customRequests.responses[200].parse(await res.json());
    },
    enabled: customerId != null && customerId > 0,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string; password: string }) => {
      const validated = api.customers.create.input.parse(data);
      const res = await fetch(getApiUrl(api.customers.create.path), {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to create customer");
      return api.customers.create.responses[201].parse(json);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.customers.list.path] });
    },
  });
}
