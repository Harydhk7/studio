import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api, buildUrl } from "@shared/routes";
import { getApiUrl } from "@/lib/api-base";
import { getAuthHeaders } from "@/lib/auth";

export function useCategories() {
  return useQuery({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.categories.list.path));
      if (!res.ok) throw new Error("Failed to fetch categories");
      return api.categories.list.responses[200].parse(await res.json());
    },
  });
}

export function useCategory(id: number | null) {
  return useQuery({
    queryKey: [api.categories.get.path, id],
    queryFn: async () => {
      if (id == null) return null;
      const res = await fetch(getApiUrl(buildUrl(api.categories.get.path, { id })));
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch category");
      return api.categories.get.responses[200].parse(await res.json());
    },
    enabled: id != null && id > 0,
  });
}

export function useProductsByCategory(categoryId: number | null) {
  return useQuery({
    queryKey: [api.categories.products.path, categoryId],
    queryFn: async () => {
      if (categoryId == null) return [];
      const res = await fetch(
        getApiUrl(buildUrl(api.categories.products.path, { id: categoryId })),
      );
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.categories.products.responses[200].parse(await res.json());
    },
    enabled: categoryId != null && categoryId > 0,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof api.categories.create.input.parse>[0]) => {
      const validated = api.categories.create.input.parse(data);
      const res = await fetch(getApiUrl(api.categories.create.path), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create category");
      return api.categories.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.categories.list.path] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  type UpdateInput = z.infer<typeof api.categories.update.input>;
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateInput) => {
      const validated = api.categories.update.input.parse(data);
      const res = await fetch(
        getApiUrl(buildUrl(api.categories.update.path, { id })),
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update category");
      return api.categories.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.categories.list.path] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(
        getApiUrl(buildUrl(api.categories.delete.path, { id })),
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete category");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.categories.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}
