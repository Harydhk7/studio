const AUTH_TOKEN_KEY = "auth_token";
const CUSTOMER_TOKEN_KEY = "customer_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  return headers;
}

// Customer auth (separate from admin)
export function getCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function setCustomerToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  }
}

export function clearCustomerToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  }
}

export function getCustomerAuthHeaders(): HeadersInit {
  const token = getCustomerToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  return headers;
}
