"use client";
import { useEffect, useState, useCallback } from "react";
export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options?.headers,
    },
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error?.message ?? "Request failed. Please try again.");
  return data as T;
}
export function useResource<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(Boolean(url));
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    if (!url) {
      setLoading(false);
      setData(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    api<T>(url, { signal: controller.signal })
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [url, version]);
  return { data, error, loading, reload };
}
