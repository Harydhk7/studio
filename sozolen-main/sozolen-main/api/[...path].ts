import type { IncomingMessage, ServerResponse } from "http";

let loaded:
  | {
      app: (req: IncomingMessage, res: ServerResponse) => unknown;
      initApp: () => Promise<void>;
    }
  | null = null;

async function getApp() {
  if (loaded) return loaded;
  // @ts-expect-error Built at deploy time via npm run build
  const mod = (await import("../dist/index.cjs")) as any;
  const app = mod.app ?? mod.default?.app;
  const initApp = mod.initApp ?? mod.default?.initApp;
  if (typeof app !== "function" || typeof initApp !== "function") {
    throw new Error("Invalid backend bundle exports from dist/index.cjs");
  }
  loaded = { app, initApp };
  return loaded;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const { app, initApp } = await getApp();
  await initApp();
  return app(req, res);
}
