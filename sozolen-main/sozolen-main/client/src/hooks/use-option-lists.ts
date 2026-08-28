import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { getAuthHeaders } from "@/lib/auth";
import { getApiUrl } from "@/lib/api-base";

export function useColorOptions() {
  return useQuery({
    queryKey: [api.options.colors.list.path],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.options.colors.list.path));
      if (!res.ok) throw new Error("Failed to fetch colors");
      return api.options.colors.list.responses[200].parse(await res.json());
    },
  });
}

export function useSizeOptions() {
  return useQuery({
    queryKey: [api.options.sizes.list.path],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.options.sizes.list.path));
      if (!res.ok) throw new Error("Failed to fetch sizes");
      return api.options.sizes.list.responses[200].parse(await res.json());
    },
  });
}

export function useOtherOptions() {
  return useQuery({
    queryKey: [api.options.others.list.path],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.options.others.list.path));
      if (!res.ok) throw new Error("Failed to fetch options");
      return api.options.others.list.responses[200].parse(await res.json());
    },
  });
}

type OptionType = "colors" | "sizes" | "others";

const optionApi = {
  colors: api.options.colors,
  sizes: api.options.sizes,
  others: api.options.others,
} as const;

export function useCreateOption(type: OptionType) {
  const queryClient = useQueryClient();
  const routes = optionApi[type];
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const validated = routes.create.input.parse(data);
      const res = await fetch(getApiUrl(routes.create.path), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return routes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [routes.list.path] });
    },
  });
}

export function useUpdateOption(type: OptionType) {
  const queryClient = useQueryClient();
  const routes = optionApi[type];
  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const validated = routes.update.input.parse({ name });
      const res = await fetch(
        getApiUrl(buildUrl(routes.update.path, { id })),
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return routes.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [routes.list.path] });
    },
  });
}

export function useDeleteOption(type: OptionType) {
  const queryClient = useQueryClient();
  const routes = optionApi[type];
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(
        getApiUrl(buildUrl(routes.delete.path, { id })),
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [routes.list.path] });
    },
  });
}
