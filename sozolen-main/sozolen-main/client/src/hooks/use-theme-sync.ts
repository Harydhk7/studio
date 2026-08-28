import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getApiUrl } from "@/lib/api-base";
import { applyThemePalette } from "@/lib/theme";

export function useThemeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    let stream: EventSource | null = null;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("themePreviewStatus") === "draft" ? "draft" : "live";
    const isPreviewMode = params.get("previewMode") === "1";
    const statusQuery = `?status=${status}`;

    const hydrate = async () => {
      try {
        const res = await fetch(getApiUrl(`${api.siteConfig.get.path}${statusQuery}`));
        if (!res.ok) return;
        const data = api.siteConfig.get.responses[200].parse(await res.json());
        if (cancelled) return;
        queryClient.setQueryData([api.siteConfig.get.path], data);
        applyThemePalette(data.theme);
      } catch {
        // Ignore theme hydration errors and keep static defaults.
      }
    };

    hydrate();

    if (!isPreviewMode) {
      try {
        stream = new EventSource(getApiUrl(`${api.siteConfig.stream.path}${statusQuery}`));
        stream.addEventListener("site-config", (event) => {
          try {
            const data = api.siteConfig.get.responses[200].parse(
              JSON.parse((event as MessageEvent).data),
            );
            queryClient.setQueryData([api.siteConfig.get.path], data);
            applyThemePalette(data.theme);
          } catch {
            // Ignore malformed stream updates.
          }
        });
      } catch {
        // Stream is optional; initial fetch is enough.
      }
    }

    return () => {
      cancelled = true;
      if (stream) stream.close();
    };
  }, [queryClient]);
}

