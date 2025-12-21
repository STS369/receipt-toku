// Shared API response and domain types for the frontend.
export type Judgement = "DEAL" | "FAIR" | "OVERPAY" | "UNKNOWN";

export type EstatResult = {
  found?: boolean;
  stat_price?: number | null;
  stat_unit?: string | null;
  diff?: number | null;
  rate?: number | null;
  judgement?: Judgement;
  note?: string | null;
};

export type ItemResult = {
  raw_name: string;
  canonical?: string | null;
  paid_unit_price: number | null;
  quantity: number | null;
  estat?: EstatResult;
};

export type AnalyzeResponse = {
  purchase_date?: string;
  summary?: {
    deal_count?: number;
    overpay_count?: number;
    unknown_count?: number;
    total_diff?: number;
  };
  items: ItemResult[];
  debug?: Record<string, unknown>;
};

export type HealthResponse = {
  ok?: boolean;
  vision_model?: string[];
  estat_app_id_set?: boolean;
};

export type MetaHit = {
  id?: string;
  class_id?: string;
  name?: string;
  code?: string;
};

export type StoredResult = {
  id: string;
  timestamp: number;
  result: AnalyzeResponse;
};

// レシート履歴（DB保存用）
export type Receipt = {
  id: string;
  user_id: string;
  purchase_date: string | null;
  store_name: string | null;
  result: AnalyzeResponse;
  created_at: string;
  updated_at: string;
};

export type ReceiptCreate = {
  purchase_date: string | null;
  store_name: string | null;
  result: AnalyzeResponse;
};

export type ReceiptUpdate = {
  result: AnalyzeResponse;
};

// プロフィール関連
export type Profile = {
  id: string;
  nickname: string | null;
};

export type ProfileUpdate = {
  nickname: string | null;
};

// ランキング関連
export type RankingEntry = {
  rank: number;
  user_id: string;
  nickname: string | null;
  total_saved: number;      // 純節約額（節約額 - 過払い額）
  total_overpaid: number;   // 過払い額
};

export type RankingResponse = {
  rankings: RankingEntry[];
  my_rank: number | null;
  my_nickname: string | null;
  my_total_saved: number;
  my_total_overpaid: number;
};
