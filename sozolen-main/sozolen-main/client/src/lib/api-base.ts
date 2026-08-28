// Keep API calls on the frontend origin (Netlify) and rely on netlify.toml proxy.
const basePath = "/api";

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath.startsWith("/api/") || normalizedPath === "/api") {
    return normalizedPath;
  }
  return `${basePath}${normalizedPath}`;
}

