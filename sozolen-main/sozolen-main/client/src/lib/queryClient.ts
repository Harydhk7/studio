import { QueryClient, QueryFunction, QueryCache, MutationCache } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api-base";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    // Try to extract JSON message from "401: {\"message\":\"...\"}"
    const jsonMatch = msg.match(/\d+:\s*(\{.+\})/);
    if (jsonMatch) {
      try {
        const o = JSON.parse(jsonMatch[1]);
        if (o && typeof o.message === "string") return o.message;
      } catch {
        // ignore
      }
    }
    return msg;
  }
  return String(error);
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let message = text;
    try {
      const o = JSON.parse(text);
      if (o && typeof o.message === "string") message = o.message;
    } catch {
      // use raw text
    }
    throw new Error(`${res.status}: ${message}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const [path, ...rest] = queryKey as [string, ...unknown[]];
    const suffix = rest.length > 0 ? `/${rest.map(String).join("/")}` : "";
    const url = getApiUrl(`${path}${suffix}`);
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

const queryCache = new QueryCache({
  onError: (error) => {
    toast({ title: "Error", description: getErrorMessage(error), variant: "destructive" });
  },
});

const mutationCache = new MutationCache({
  onError: (error) => {
    toast({ title: "Error", description: getErrorMessage(error), variant: "destructive" });
  },
});

export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
