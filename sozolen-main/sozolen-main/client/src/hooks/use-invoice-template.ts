import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { buildUrl } from "@shared/routes";
import { getApiUrl } from "@/lib/api-base";
import { getAuthHeaders } from "@/lib/auth";

export function useInvoiceTemplate() {
  return useQuery({
    queryKey: [api.invoiceTemplate.get.path],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.invoiceTemplate.get.path), {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch invoice template");
      return res.json();
    },
  });
}

export function useSaveInvoiceTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      companyName?: string;
      logoUrl?: string | null;
      address?: string;
      phone?: string;
      email?: string;
      footerText?: string;
    }) => {
      const res = await fetch(getApiUrl(api.invoiceTemplate.update.path), {
        method: "PUT",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save invoice template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [api.invoiceTemplate.get.path],
      });
    },
  });
}
