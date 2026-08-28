import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getApiUrl } from "@/lib/api-base";
import { getCustomerAuthHeaders, getCustomerToken, setCustomerToken, clearCustomerToken } from "@/lib/auth";
import { useEffect, useRef } from "react";

export function useCustomerAuth() {
  const queryClient = useQueryClient();
  const hasToken = !!getCustomerToken();
  const clearedRef = useRef(false);

  const { data: customer, isLoading } = useQuery({
    queryKey: [api.customer.me.path],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.customer.me.path), {
        credentials: "include",
        headers: getCustomerAuthHeaders(),
      });
      if (res.status === 401) {
        // Token is invalid or expired — clear it so other hooks stop firing
        clearCustomerToken();
        return null;
      }
      if (!res.ok) throw new Error("Failed to fetch customer");
      return api.customer.me.responses[200].parse(await res.json());
    },
    retry: false,
    enabled: hasToken,
  });

  // When the token is cleared due to a 401, invalidate dependent queries
  useEffect(() => {
    if (!getCustomerToken() && !clearedRef.current && hasToken) {
      clearedRef.current = true;
      queryClient.invalidateQueries({ queryKey: [api.customer.me.path] });
    }
  }, [customer, hasToken, queryClient]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const validated = api.customer.login.input.parse(credentials);
      const res = await fetch(getApiUrl(api.customer.login.path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Login failed");
      const data = await res.json();
      if (data.token) setCustomerToken(data.token);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.customer.me.path] }),
  });

  const sendOtpMutation = useMutation({
    mutationFn: async (data: { email: string; type: "signup" | "forgot_password" }) => {
      const validated = api.customer.sendOtp.input.parse(data);
      const res = await fetch(getApiUrl(api.customer.sendOtp.path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to send code");
      }
      return api.customer.sendOtp.responses[200].parse(await res.json());
    },
  });

  const verifyAndRegisterMutation = useMutation({
    mutationFn: async (data: { email: string; code: string; name: string; phone: string; password: string }) => {
      const validated = api.customer.verifyAndRegister.input.parse(data);
      const res = await fetch(getApiUrl(api.customer.verifyAndRegister.path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Verification failed");
      }
      const result = await res.json();
      if (result.token) setCustomerToken(result.token);
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.customer.me.path] }),
  });

  const verifyAndResetPasswordMutation = useMutation({
    mutationFn: async (data: { email: string; code: string; newPassword: string }) => {
      const validated = api.customer.verifyAndResetPassword.input.parse(data);
      const res = await fetch(
        getApiUrl(api.customer.verifyAndResetPassword.path),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Reset failed");
      }
      return api.customer.verifyAndResetPassword.responses[200].parse(await res.json());
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      clearCustomerToken();
    },
    onSuccess: () => {
      queryClient.setQueryData([api.customer.me.path], null);
      queryClient.invalidateQueries({ queryKey: [api.customer.me.path] });
    },
  });

  return {
    customer,
    isLoading,
    login: loginMutation,
    sendOtp: sendOtpMutation,
    verifyAndRegister: verifyAndRegisterMutation,
    verifyAndResetPassword: verifyAndResetPasswordMutation,
    logout: logoutMutation,
  };
}
