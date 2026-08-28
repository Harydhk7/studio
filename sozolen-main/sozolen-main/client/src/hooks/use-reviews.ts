import { useQueries, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { getAuthHeaders, getCustomerAuthHeaders } from "@/lib/auth";
import { getApiUrl } from "@/lib/api-base";

type ReviewItem = {
  id: number;
  productId: number;
  customerId: number | null;
  orderId: number | null;
  rating: number;
  comment: string | null;
  createdAt: string | null;
  customerName?: string;
};

export function useProductReviews(productId: number | null) {
  return useQuery({
    queryKey: [api.reviews.listByProduct.path, productId],
    queryFn: async () => {
      if (productId == null) return [];
      const res = await fetch(
        getApiUrl(buildUrl(api.reviews.listByProduct.path, { id: productId })),
      );
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return api.reviews.listByProduct.responses[200].parse(await res.json());
    },
    enabled: productId != null && productId > 0,
  });
}

export function useProductRating(productId: number | null) {
  return useQuery({
    queryKey: [api.reviews.productRating.path, productId],
    queryFn: async () => {
      if (productId == null) return { average: 0, count: 0 };
      const res = await fetch(
        getApiUrl(buildUrl(api.reviews.productRating.path, { id: productId })),
      );
      if (!res.ok) throw new Error("Failed to fetch rating");
      return api.reviews.productRating.responses[200].parse(await res.json());
    },
    enabled: productId != null && productId > 0,
  });
}

/** Returns a map of productId -> reviews[] for this order (for admin: customer reviews on this order). */
export function useOrderReviewsForAdmin(
  orderId: number | null,
  productIds: number[]
) {
  const results = useQueries({
    queries: productIds.map((productId) => ({
      queryKey: [api.reviews.listByProduct.path, productId] as const,
      queryFn: async () => {
        const res = await fetch(
          getApiUrl(buildUrl(api.reviews.listByProduct.path, { id: productId })),
        );
        if (!res.ok) throw new Error("Failed to fetch reviews");
        return api.reviews.listByProduct.responses[200].parse(await res.json()) as ReviewItem[];
      },
      enabled: orderId != null && orderId > 0 && productId > 0,
    })),
  });

  const map: Record<number, ReviewItem[]> = {};
  if (orderId == null) return map;
  results.forEach((result, i) => {
    const list = result.data ?? [];
    const productId = productIds[i];
    map[productId] = list.filter((r) => r.orderId === orderId);
  });
  return map;
}

/** Returns a map of productId -> review for reviews by this customer for this order. */
export function useReviewsForOrderItems(
  productIds: number[],
  orderId: number,
  customerId: number | null | undefined
) {
  const results = useQueries({
    queries: productIds.map((productId) => ({
      queryKey: [api.reviews.listByProduct.path, productId] as const,
      queryFn: async () => {
        const res = await fetch(
          getApiUrl(buildUrl(api.reviews.listByProduct.path, { id: productId })),
        );
        if (!res.ok) throw new Error("Failed to fetch reviews");
        return api.reviews.listByProduct.responses[200].parse(await res.json()) as ReviewItem[];
      },
      enabled: productId > 0 && orderId > 0 && customerId != null,
    })),
  });

  const map: Record<number, ReviewItem> = {};
  if (customerId == null) return map;
  results.forEach((result, i) => {
    const list = result.data ?? [];
    const productId = productIds[i];
    const found = list.find(
      (r) => r.orderId === orderId && r.customerId === customerId
    );
    if (found) map[productId] = found;
  });
  return map;
}

export function useProductRatingsBatch(productIds: number[]) {
  const ids = productIds.filter((id) => id > 0);
  return useQuery({
    queryKey: [api.reviews.ratingsBatch.path, ids.join(",")],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const res = await fetch(
        getApiUrl(
          `${api.reviews.ratingsBatch.path}?productIds=${ids.join(",")}`,
        ),
      );
      if (!res.ok) throw new Error("Failed to fetch ratings");
      return api.reviews.ratingsBatch.responses[200].parse(await res.json());
    },
    enabled: ids.length > 0,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { productId: number; orderId: number; rating: number; comment?: string }) => {
      const validated = api.reviews.create.input.parse(data);
      const res = await fetch(getApiUrl(api.reviews.create.path), {
        method: "POST",
        headers: { ...getCustomerAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit review");
      return api.reviews.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: [api.reviews.listByProduct.path, v.productId] });
      queryClient.invalidateQueries({ queryKey: [api.reviews.productRating.path, v.productId] });
      queryClient.invalidateQueries({ queryKey: [api.customer.orders.path] });
    },
  });
}

export function useCreateAdminReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, rating, comment, imageUrl }: { productId: number; rating: number; comment?: string; imageUrl?: string | null }) => {
      const payload: { rating: number; comment?: string; imageUrl?: string } = {
        rating: Number(rating),
      };
      if (comment != null && comment.trim() !== "") payload.comment = comment.trim();
      if (imageUrl != null && imageUrl !== "") payload.imageUrl = imageUrl;
      const validated = api.reviews.createAdmin.input.parse(payload);
      const url = getApiUrl(
        buildUrl(api.reviews.createAdmin.path, { id: productId }),
      );
      const res = await fetch(url, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as { message?: string }).message || "Failed to create review");
      }
      const data = await res.json();
      return { ...data, productId } as { id: number; productId: number; rating: number; comment: string | null; imageUrl?: string | null; createdAt: string | null };
    },
    onSuccess: (data) => {
      const pid = data.productId;
      queryClient.invalidateQueries({ queryKey: [api.reviews.listByProduct.path, pid] });
      queryClient.invalidateQueries({ queryKey: [api.reviews.productRating.path, pid] });
      queryClient.invalidateQueries({ queryKey: [api.reviews.ratingsBatch.path] });
    },
  });
}
