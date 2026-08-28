import { api } from "@shared/routes";
import { buildUrl } from "@shared/routes";

export async function openOrderInvoice(
  orderId: number,
  headers: HeadersInit,
): Promise<void> {
  const url = buildUrl(api.orders.getInvoice.path, { id: orderId });
  const res = await fetch(url, { credentials: "include", headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to load invoice (${res.status})`);
  }
  const html = await res.text();
  const win = window.open("", "_blank");
  if (!win) {
    throw new Error("Popup blocked. Please allow popups for this site.");
  }
  win.document.write(html);
  win.document.close();
}
