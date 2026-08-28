import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminSiteConfig,
  usePublishLiveFromDraftSiteConfig,
  useRetrievePreviousLiveSiteConfig,
  useSaveDraftSiteConfig,
} from "@/hooks/use-site-config";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { sanitizeThemeConfig, type ThemeConfig, type ThemePalette } from "@/lib/theme";

type PreviewPage = "home" | "products" | "product-detail" | "custom" | "track" | "cart" | "profile";

const PREVIEW_PAGES: Array<{ value: PreviewPage; label: string }> = [
  { value: "home", label: "Home" },
  { value: "products", label: "Products" },
  { value: "product-detail", label: "Product Detail" },
  { value: "custom", label: "Custom Request" },
  { value: "track", label: "Track" },
  { value: "cart", label: "Cart" },
  { value: "profile", label: "Profile" },
];

const PREVIEW_PATHS: Record<PreviewPage, string> = {
  home: "/",
  products: "/products",
  "product-detail": "/products/1",
  custom: "/custom",
  track: "/track",
  cart: "/cart",
  profile: "/profile",
};

export default function AdminThemeConfig() {
  const { data, isLoading } = useAdminSiteConfig();
  const saveDraft = useSaveDraftSiteConfig();
  const publishLive = usePublishLiveFromDraftSiteConfig();
  const retrievePreviousLive = useRetrievePreviousLiveSiteConfig();
  const { toast } = useToast();
  const [previewPage, setPreviewPage] = useState<PreviewPage>("home");
  const [configStatus, setConfigStatus] = useState<"draft" | "live">("draft");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerLinkUrl, setBannerLinkUrl] = useState("");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [theme, setTheme] = useState<ThemeConfig>(sanitizeThemeConfig());
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [previewRefreshToken, setPreviewRefreshToken] = useState(0);

  const effectiveDraft = useMemo(
    () => ({
      bannerImageUrl: data?.draftBannerImageUrl ?? data?.bannerImageUrl ?? "",
      bannerLinkUrl: data?.draftBannerLinkUrl ?? data?.bannerLinkUrl ?? "",
      theme: sanitizeThemeConfig(data?.draftTheme ?? data?.theme),
    }),
    [data],
  );

  const effectiveLive = useMemo(
    () => ({
      bannerImageUrl: data?.bannerImageUrl ?? "",
      bannerLinkUrl: data?.bannerLinkUrl ?? "",
      theme: sanitizeThemeConfig(data?.theme),
    }),
    [data],
  );

  useEffect(() => {
    if (!data) return;
    const selected = configStatus === "draft" ? effectiveDraft : effectiveLive;
    setBannerImageUrl(selected.bannerImageUrl);
    setBannerLinkUrl(selected.bannerLinkUrl);
    setTheme(selected.theme);
  }, [configStatus, data, effectiveDraft, effectiveLive]);

  const onSaveDraft = async () => {
    try {
      await saveDraft.mutateAsync({
        bannerImageUrl: bannerImageUrl.trim() ? bannerImageUrl.trim() : null,
        bannerLinkUrl: bannerLinkUrl.trim() ? bannerLinkUrl.trim() : null,
        theme,
      });
      if (configStatus === "draft") setPreviewRefreshToken((prev) => prev + 1);
      toast({ title: "Draft saved", description: "Theme draft saved successfully." });
    } catch {
      toast({
        variant: "destructive",
        title: "Draft save failed",
        description: "Could not save draft config.",
      });
    }
  };

  const onPublishLive = async () => {
    try {
      await publishLive.mutateAsync();
      if (configStatus === "live") setPreviewRefreshToken((prev) => prev + 1);
      toast({ title: "Live published", description: "Draft is now published as live." });
    } catch {
      toast({
        variant: "destructive",
        title: "Publish failed",
        description: "Could not publish draft to live.",
      });
    }
  };

  const onRetrievePreviousLive = async () => {
    try {
      await retrievePreviousLive.mutateAsync();
      if (configStatus === "live") setPreviewRefreshToken((prev) => prev + 1);
      toast({ title: "Live restored", description: "Previous live config has been restored." });
    } catch {
      toast({
        variant: "destructive",
        title: "Restore failed",
        description: "Could not retrieve previous live config.",
      });
    }
  };

  const applyThemeToPreviewFrame = () => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc) return;
    const root = doc.documentElement;
    root.classList.toggle("dark", themeMode === "dark");
    let blocker = doc.getElementById("preview-interaction-blocker") as HTMLStyleElement | null;
    if (!blocker) {
      blocker = doc.createElement("style");
      blocker.id = "preview-interaction-blocker";
      blocker.innerHTML = `
        a, button, input, select, textarea, [role="button"], form {
          pointer-events: none !important;
          cursor: default !important;
        }
      `;
      doc.head.appendChild(blocker);
    }
    const body = doc.body;
    if (body && body.dataset.previewClickBlockerAttached !== "1") {
      const blockClick = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
      };
      body.addEventListener("click", blockClick, true);
      body.addEventListener("submit", blockClick, true);
      body.dataset.previewClickBlockerAttached = "1";
    }
  };

  useEffect(() => {
    applyThemeToPreviewFrame();
  }, [themeMode, previewPage, configStatus, previewRefreshToken]);

  if (isLoading) return <AdminTableSkeleton title="Theme Config" columns={2} rows={8} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Theme Config</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Left side controls, right side preview. Theme applies to all customer pages.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-6">
          <div className="space-y-3">
            <h2 className="font-semibold">Banner</h2>
            <div className="space-y-2">
              <Label>Banner Image URL</Label>
              <Input
                value={bannerImageUrl}
                onChange={(e) => setBannerImageUrl(e.target.value)}
                placeholder="https://..."
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Banner Link URL (optional)</Label>
              <Input
                value={bannerLinkUrl}
                onChange={(e) => setBannerLinkUrl(e.target.value)}
                placeholder="https://..."
                className="rounded-xl"
              />
            </div>
            <p className="text-xs text-muted-foreground">Banner shows below Shop by Category when image URL is set.</p>
          </div>

          <div className="space-y-3 rounded-xl border border-border/50 p-3 bg-muted/20">
            <Label className="text-xs">Config status</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={configStatus === "draft" ? "default" : "outline"}
                className="rounded-lg h-9"
                onClick={() => setConfigStatus("draft")}
              >
                DRAFT
              </Button>
              <Button
                type="button"
                variant={configStatus === "live" ? "default" : "outline"}
                className="rounded-lg h-9"
                onClick={() => setConfigStatus("live")}
              >
                LIVE
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Colors</h2>
              <select
                value={themeMode}
                onChange={(e) => setThemeMode(e.target.value as "light" | "dark")}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="light">Light theme</option>
                <option value="dark">Dark theme</option>
              </select>
            </div>
            {(
              [
                ["primary", "Primary"],
                ["primaryForeground", "Primary Foreground"],
                ["background", "Background"],
                ["foreground", "Foreground"],
                ["card", "Card"],
                ["muted", "Muted"],
                ["border", "Border"],
              ] as Array<[keyof ThemePalette, string]>
            ).map(([key, label]) => (
              <div key={key} className="grid grid-cols-[160px,1fr] items-center gap-3">
                <Label>{label}</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme[themeMode][key]}
                    onChange={(e) =>
                      setTheme((prev) => ({
                        ...prev,
                        [themeMode]: { ...prev[themeMode], [key]: e.target.value },
                      }))
                    }
                    className="h-9 w-12 rounded border border-border bg-transparent p-1"
                  />
                  <Input
                    value={theme[themeMode][key]}
                    onChange={(e) =>
                      setTheme((prev) => ({
                        ...prev,
                        [themeMode]: { ...prev[themeMode], [key]: e.target.value },
                      }))
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              onClick={onSaveDraft}
              disabled={saveDraft.isPending}
              className="w-full rounded-xl h-10"
            >
              {saveDraft.isPending ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onPublishLive}
              disabled={publishLive.isPending}
              className="w-full rounded-xl h-10"
            >
              {publishLive.isPending ? "Publishing..." : "Publish LIVE"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onRetrievePreviousLive}
              disabled={retrievePreviousLive.isPending || !data?.previousLiveTheme}
              className="w-full rounded-xl h-10"
            >
              {retrievePreviousLive.isPending ? "Restoring..." : "RETRIVE_PREVIOUS"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Preview</h2>
            <select
              value={previewPage}
              onChange={(e) => setPreviewPage(e.target.value as PreviewPage)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              {PREVIEW_PAGES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border p-3 min-h-[620px] bg-muted/10 relative overflow-hidden">
            <div className="absolute right-4 top-4 z-20 rounded-md bg-background/90 px-2 py-1 text-[10px] text-muted-foreground border border-border/60">
              Preview only (no interaction)
            </div>
            <iframe
              ref={iframeRef}
              title="Customer UI preview"
              key={`${previewPage}-${configStatus}-${previewRefreshToken}`}
              src={`${PREVIEW_PATHS[previewPage]}?themePreviewStatus=${configStatus}&previewMode=1`}
              onLoad={applyThemeToPreviewFrame}
              className="h-[600px] w-full rounded-xl border border-border/60 bg-background"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

