import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getApiUrl } from "@/lib/api-base";
import { getAuthHeaders } from "@/lib/auth";
import { applyThemePalette } from "@/lib/theme";
import type { z } from "zod";

type SiteConfigResponse = z.infer<typeof api.siteConfig.get.responses[200]>;

export function usePublicSiteConfig() {
  return useQuery<SiteConfigResponse>({
    queryKey: [api.siteConfig.get.path],
    // Hydrated once by useThemeSync at app level and updated via server push.
    queryFn: async () => {
      throw new Error("usePublicSiteConfig fetch is disabled; hydrated via stream");
    },
    enabled: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useAdminSiteConfig() {
  return useQuery({
    queryKey: [api.siteConfig.adminGet.path],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.siteConfig.adminGet.path), {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch site config");
      return api.siteConfig.adminGet.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateSiteConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<typeof api.siteConfig.adminUpdate.input.parse>[0],
    ) => {
      const validated = api.siteConfig.adminUpdate.input.parse(input);
      const res = await fetch(getApiUrl(api.siteConfig.adminUpdate.path), {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to update site config");
      return api.siteConfig.adminUpdate.responses[200].parse(await res.json());
    },
    onSuccess: (updated) => {
      queryClient.setQueryData([api.siteConfig.get.path], updated);
      queryClient.setQueryData([api.siteConfig.adminGet.path], updated);
      applyThemePalette(updated.theme);
    },
  });
}

export function useSaveDraftSiteConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<typeof api.siteConfig.adminSaveDraft.input.parse>[0],
    ) => {
      const validated = api.siteConfig.adminSaveDraft.input.parse(input);
      const res = await fetch(getApiUrl(api.siteConfig.adminSaveDraft.path), {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to save draft site config");
      return api.siteConfig.adminSaveDraft.responses[200].parse(await res.json());
    },
    onSuccess: (updated) => {
      queryClient.setQueryData([api.siteConfig.adminGet.path], updated);
    },
  });
}

export function usePublishLiveFromDraftSiteConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(getApiUrl(api.siteConfig.adminPublishLiveFromDraft.path), {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to publish live config from draft");
      return api.siteConfig.adminPublishLiveFromDraft.responses[200].parse(await res.json());
    },
    onSuccess: (updated) => {
      queryClient.setQueryData([api.siteConfig.get.path], updated);
      queryClient.setQueryData([api.siteConfig.adminGet.path], updated);
      applyThemePalette(updated.theme);
    },
  });
}

export function useRetrievePreviousLiveSiteConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(getApiUrl(api.siteConfig.adminRetrievePreviousLive.path), {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to restore previous live config");
      return api.siteConfig.adminRetrievePreviousLive.responses[200].parse(await res.json());
    },
    onSuccess: (updated) => {
      queryClient.setQueryData([api.siteConfig.get.path], updated);
      queryClient.setQueryData([api.siteConfig.adminGet.path], updated);
      applyThemePalette(updated.theme);
    },
  });
}

