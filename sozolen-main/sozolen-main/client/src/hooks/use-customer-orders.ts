import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getCustomerToken, getCustomerAuthHeaders } from "@/lib/auth";
import { getApiUrl } from "@/lib/api-base";

export function useCustomerOrders() {
  const hasToken = !!getCustomerToken();
  return useQuery({
    queryKey: [api.customer.orders.path],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.customer.orders.path), {
        credentials: "include",
        headers: getCustomerAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return api.customer.orders.responses[200].parse(await res.json());
    },
    enabled: hasToken,
    retry: false,
  });
}
