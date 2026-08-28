import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getAuthHeaders } from "@/lib/auth";
import { buildUrl } from "@shared/routes";
import { getApiUrl } from "@/lib/api-base";

export function useOrders() {
  return useQuery({
    queryKey: [api.orders.list.path],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.orders.list.path), {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return api.orders.list.responses[200].parse(await res.json());
    },
  });
}

export function useOrder(id: number | null) {
  return useQuery({
    queryKey: [api.orders.get.path, id],
    queryFn: async () => {
      if (id == null) return null;
      const res = await fetch(
        getApiUrl(buildUrl(api.orders.get.path, { id })),
        { credentials: "include", headers: getAuthHeaders() },
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch order");
      return api.orders.get.responses[200].parse(await res.json());
    },
    enabled: id != null && id > 0,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const validated = api.orders.create.input.parse(data);
      const res = await fetch(getApiUrl(api.orders.create.path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to create order");
      return api.orders.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.customer.orders.path] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const path = getApiUrl(buildUrl(api.orders.updateStatus.path, { id }));
      const res = await fetch(path, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.orders.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.customer.orders.path] });
    },
  });
}

export function useAdminCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof api.orders.adminCreate.input.parse>[0]) => {
      const validated = api.orders.adminCreate.input.parse(data);
      const res = await fetch(getApiUrl(api.orders.adminCreate.path), {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to create order");
      return api.orders.adminCreate.responses[201].parse(json);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: number;
      status?: string;
      paymentStatus?: string;
      paymentMode?: string;
      totalPrice?: number;
      adminNotes?: string | null;
    }) => {
      const res = await fetch(
        getApiUrl(buildUrl(api.orders.update.path, { id })),
      {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update order");
      return api.orders.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.orders.get.path, v.id] });
      queryClient.invalidateQueries({ queryKey: [api.customer.orders.path] });
    },
  });
}
