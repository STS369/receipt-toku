// Minimal API client wrappers for the frontend.
import { AnalyzeResponse, HealthResponse, MetaHit, Profile, ProfileUpdate, RankingResponse, Receipt, ReceiptCreate, ReceiptUpdate } from "./types";
import { supabase } from "./supabase";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";

const buildUrl = (path: string) => {
  if (!BASE_URL) return path;
  const base = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
};

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const url = buildUrl(path);
  const authHeaders = await getAuthHeaders();
  const headers = { ...authHeaders, ...opts.headers };
  let res: Response;
  try {
    res = await fetch(url, { ...opts, headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "通信に失敗しました";
    throw new Error(msg);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("レスポンスの解析に失敗しました");
    }
  }

  if (!res.ok) {
    const detail =
      data && typeof data === "object" && ("detail" in data || "message" in data)
        ? String((data as { detail?: unknown; message?: unknown }).detail ?? (data as { message?: unknown }).message ?? "")
        : res.statusText;
    throw new Error(`HTTP ${res.status}${detail ? `: ${detail}` : ""}`);
  }

  return data as T;
}

export async function healthCheck(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

export async function metaSearch(keyword: string): Promise<MetaHit[]> {
  const params = new URLSearchParams({ q: keyword });
  const res = await request<MetaHit[] | { hits?: MetaHit[] }>(`/metaSearch?${params.toString()}`);
  return Array.isArray(res) ? res : res?.hits ?? [];
}

export async function analyzeReceipt(file: File): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("file", file);
  return request<AnalyzeResponse>("/analyzeReceipt", {
    method: "POST",
    body: form
  });
}

export async function getRanking(limit: number = 10): Promise<RankingResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  return request<RankingResponse>(`/ranking?${params.toString()}`);
}

export async function getProfile(): Promise<Profile> {
  return request<Profile>("/profile");
}

export async function updateProfile(data: ProfileUpdate): Promise<Profile> {
  return request<Profile>("/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

// =================================================================
// レシート履歴 API
// =================================================================

export async function listReceipts(): Promise<Receipt[]> {
  return request<Receipt[]>("/receipts");
}

export async function createReceipt(data: ReceiptCreate): Promise<Receipt> {
  return request<Receipt>("/receipts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

export async function updateReceipt(id: string, data: ReceiptUpdate): Promise<Receipt> {
  return request<Receipt>(`/receipts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

export async function deleteReceipt(id: string): Promise<void> {
  await request<{ success: boolean }>(`/receipts/${id}`, {
    method: "DELETE"
  });
}

export async function clearReceipts(): Promise<void> {
  await request<{ success: boolean }>("/receipts", {
    method: "DELETE"
  });
}
