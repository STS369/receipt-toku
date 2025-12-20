// Results page showing summary counts and the item table.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DebugPanel } from "../components/DebugPanel";
import { ItemTable } from "../components/ItemTable";
import { saveHistory } from "../lib/storage";
import type { AnalyzeResponse, StoredResult } from "../lib/types";

type Props = {
  result: AnalyzeResponse | null;
  onEdit: () => void;
  onReAnalyze?: () => Promise<void>;
  summaryCount: { deal: number; overpay: number; unknown: number };
};

export function ResultPage({ result, onEdit, onReAnalyze, summaryCount }: Props) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const items = useMemo(() => result?.items || [], [result]);

  if (!result) {
    return (
      <div className="card">
        <p>結果がまだありません。まずはレシートをアップロードしてください。</p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          アップロードへ
        </button>
      </div>
    );
  }

  const save = () => {
    const stored: StoredResult = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: Date.now(),
      result
    };
    saveHistory(stored);
    setSaved(true);
    setNote("ローカル履歴に保存しました");
  };

  const unknownItems = items.filter((i) => (i.estat?.judgement || "UNKNOWN") === "UNKNOWN");

  return (
    <div className="card">
      <div className="flex space-between" style={{ alignItems: "center" }}>
        <div>
          <h2 className="section-title">解析結果</h2>
          <p className="muted" style={{ margin: 0 }}>
            購入日: {result.purchase_date || "-"}
          </p>
        </div>
        <div className="flex gap">
          <button className="btn btn-secondary" onClick={onEdit}>
            修正する
          </button>
          {onReAnalyze && (
            <button className="btn btn-primary" onClick={() => onReAnalyze()}>
              もう一度解析
            </button>
          )}
        </div>
      </div>

      <div className="flex gap" style={{ marginTop: 10 }}>
        <div className="card" style={{ flex: 1 }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700 }}>DEAL</p>
          <p style={{ margin: 0 }}>{summaryCount.deal} 件</p>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700 }}>OVERPAY</p>
          <p style={{ margin: 0 }}>{summaryCount.overpay} 件</p>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700 }}>UNKNOWN</p>
          <p style={{ margin: 0 }}>{summaryCount.unknown} 件</p>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <ItemTable items={items} />
      </div>

      {unknownItems.length > 0 && (
        <div className="card" style={{ borderColor: "#facc15", background: "#fef9c3", marginTop: 12 }}>
          <p style={{ margin: "0 0 6px", fontWeight: 700 }}>比較対象がありませんでした</p>
          <p className="muted" style={{ margin: 0 }}>
            UNKNOWN の行を修正して再解析するか、「新規データとしてローカル保存」を試してください。
          </p>
        </div>
      )}

      <div className="flex gap" style={{ marginTop: 12 }}>
        <button className="btn btn-secondary" onClick={save} disabled={saved}>
          {saved ? "保存済み" : "新規データとしてローカル保存"}
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("/history")}>
          履歴を見る
        </button>
      </div>
      {note && (
        <p className="muted" style={{ marginTop: 8 }}>
          {note}
        </p>
      )}

      <DebugPanel data={result.debug as Record<string, unknown> | undefined} />
    </div>
  );
}
