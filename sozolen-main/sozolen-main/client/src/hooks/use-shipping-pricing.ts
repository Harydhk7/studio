import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { getAuthHeaders } from "@/lib/auth";
import { getApiUrl } from "@/lib/api-base";

export function useShippingSettings() {
  return useQuery({
    queryKey: [api.shipping.settings.get.path],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.shipping.settings.get.path), {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return api.shipping.settings.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateShippingSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { warehousePincode: string }) => {
      const validated = api.shipping.settings.update.input.parse(data);
      const res = await fetch(getApiUrl(api.shipping.settings.update.path), {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error(await res.text());
      return api.shipping.settings.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shipping.settings.get.path] });
    },
  });
}

export function useShippingRanges() {
  return useQuery({
    queryKey: [api.shipping.ranges.list.path],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.shipping.ranges.list.path), {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return api.shipping.ranges.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateShippingRange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { minKm: number; maxKm: number; price: number }) => {
      const validated = api.shipping.ranges.create.input.parse(data);
      const res = await fetch(getApiUrl(api.shipping.ranges.create.path), {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error(await res.text());
      return api.shipping.ranges.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shipping.ranges.list.path] });
    },
  });
}

export function useUpdateShippingRange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; minKm: number; maxKm: number; price: number }) => {
      const { id, ...rest } = data;
      const validated = api.shipping.ranges.update.input.parse(rest);
      const res = await fetch(
        getApiUrl(buildUrl(api.shipping.ranges.update.path, { id })),
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error(await res.text());
      return api.shipping.ranges.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shipping.ranges.list.path] });
    },
  });
}

export function useDeleteShippingRange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(
        getApiUrl(buildUrl(api.shipping.ranges.delete.path, { id })),
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shipping.ranges.list.path] });
    },
  });
}
