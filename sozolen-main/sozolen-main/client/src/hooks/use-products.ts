import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { getAuthHeaders } from "@/lib/auth";
import { getApiUrl } from "@/lib/api-base";
import { z } from "zod";

export function useProducts(categoryId?: number | null, enabled = true) {
  return useQuery({
    queryKey: [api.products.list.path, categoryId ?? "all"],
    queryFn: async () => {
      const url = categoryId != null && categoryId > 0
        ? `${api.products.list.path}?categoryId=${categoryId}`
        : api.products.list.path;
      const res = await fetch(getApiUrl(url));
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.products.list.responses[200].parse(await res.json());
    },
    enabled,
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: async () => {
      const res = await fetch(
        getApiUrl(buildUrl(api.products.get.path, { id })),
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch product");
      return api.products.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

const homeSliderProductsSchema = z.object({
  topOrdered: api.products.list.responses[200],
  recent: api.products.list.responses[200],
});

export function useHomeSliderProducts(limit = 12) {
  return useQuery({
    queryKey: [api.products.homeSlider.path, limit],
    queryFn: async () => {
      const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(15, Math.floor(limit))) : 12;
      const res = await fetch(getApiUrl(`${api.products.homeSlider.path}?limit=${safeLimit}`));
      if (!res.ok) throw new Error("Failed to fetch slider products");
      return homeSliderProductsSchema.parse(await res.json());
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const validated = api.products.create.input.parse(data);
      const res = await fetch(getApiUrl(api.products.create.path), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create product");
      return api.products.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.products.list.path] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & any) => {
      const validated = api.products.update.input.parse(data);
      const res = await fetch(
        getApiUrl(buildUrl(api.products.update.path, { id })),
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update product");
      return api.products.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.products.list.path] }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(
        getApiUrl(buildUrl(api.products.delete.path, { id })),
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete product");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.products.list.path] }),
  });
}
