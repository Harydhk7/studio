import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { getAuthHeaders, getCustomerAuthHeaders } from "@/lib/auth";
import { getApiUrl } from "@/lib/api-base";

export function useCustomRequests() {
  return useQuery({
    queryKey: [api.customRequests.list.path],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.customRequests.list.path), {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch requests");
      return api.customRequests.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCustomRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const validated = api.customRequests.create.input.parse(data);
      const res = await fetch(getApiUrl(api.customRequests.create.path), {
        method: "POST",
        headers: getCustomerAuthHeaders(),
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to create custom request");
      return api.customRequests.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.customRequests.list.path] }),
  });
}

export function useUpdateCustomRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const validated = api.customRequests.updateStatus.input.parse({ status });
      const res = await fetch(
        getApiUrl(buildUrl(api.customRequests.updateStatus.path, { id })),
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.customRequests.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.customRequests.list.path] }),
  });
}

export function useSendCustomRequestQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      quotedPrice,
      quoteNotes,
      quoteEta,
    }: {
      id: number;
      quotedPrice: number;
      quoteNotes?: string;
      quoteEta?: string;
    }) => {
      const validated = api.customRequests.sendQuote.input.parse({
        quotedPrice,
        quoteNotes,
        quoteEta,
      });
      const res = await fetch(
        getApiUrl(buildUrl(api.customRequests.sendQuote.path, { id })),
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send quote");
      return api.customRequests.sendQuote.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.customRequests.list.path] }),
  });
}

export function useConvertCustomRequestToOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      adminOverride,
      shippingPincode,
    }: {
      id: number;
      adminOverride?: boolean;
      shippingPincode?: string;
    }) => {
      const validated = api.customRequests.convertToOrder.input.parse({
        adminOverride,
        shippingPincode,
      });
      const res = await fetch(
        getApiUrl(buildUrl(api.customRequests.convertToOrder.path, { id })),
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to convert request");
      }
      return api.customRequests.convertToOrder.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.customRequests.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
    },
  });
}

export type TrackRequestResult = {
  trackingId: string;
  id: number;
  customerId?: number | null;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  description: string;
  status: string;
  quotedPrice?: number | null;
  quoteNotes?: string | null;
  quoteEta?: string | null;
  quoteStatus?: string;
  quoteSentAt?: string | null;
  convertedOrderId?: number | null;
  timeline: { at: string; type: string; message: string; actor?: string; meta?: Record<string, unknown> }[];
  imageUrls: string[];
  createdAt: string | null;
};

export function useTrackRequest() {
  return useMutation({
    mutationFn: async (trackingId: string): Promise<TrackRequestResult> => {
      const trimmed = trackingId.trim();
      const res = await fetch(
        getApiUrl(buildUrl(api.track.get.path, { trackingId: trimmed })),
      );
      const data = await res.json();
      if (res.status === 200) {
        return api.track.get.responses[200].parse(data);
      }
      if (res.status === 400) {
        throw new Error((data as { message?: string }).message ?? "Invalid tracking ID format.");
      }
      if (res.status === 404) {
        throw new Error((data as { message?: string }).message ?? "No request found for this tracking ID.");
      }
      throw new Error((data as { message?: string }).message ?? "Something went wrong. Please try again.");
    },
  });
}

export function useRespondToCustomRequestQuote() {
  return useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "accepted" | "rejected" }) => {
      const validated =
        api.customer.customRequestQuoteResponse.input.parse({ action });
      const res = await fetch(
        getApiUrl(
          buildUrl(api.customer.customRequestQuoteResponse.path, { id }),
        ),
      {
        method: "POST",
        headers: getCustomerAuthHeaders(),
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update quote response");
      }
      return api.customer.customRequestQuoteResponse.responses[200].parse(await res.json());
    },
  });
}
