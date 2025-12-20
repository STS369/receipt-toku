// Upload and health-check page for starting analysis.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dropzone } from "../components/Dropzone";
import { Loading } from "../components/Loading";
import { ErrorBox } from "../components/ErrorBox";
import { healthCheck } from "../lib/api";
import type { AnalyzeResponse } from "../lib/types";

type Props = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onAnalyze: (file: File) => Promise<void>;
  isAnalyzing: boolean;
  lastResult: AnalyzeResponse | null;
  clearError: () => void;
};

export function Home({ file, onFileChange, onAnalyze, isAnalyzing, lastResult, clearError }: Props) {
  const navigate = useNavigate();
  const [healthStatus, setHealthStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleAnalyze = async () => {
    if (!file) {
      setError("画像ファイルを選択してください");
      return;
    }
    clearError();
    setError(null);
    try {
      await onAnalyze(file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "解析に失敗しました";
      setError(msg);
    }
  };

  const doHealthCheck = async () => {
    setChecking(true);
    setHealthStatus("");
    try {
      const res = await healthCheck();
      const ok = res.ok ? "OK" : "NG";
      const model = res.vision_model?.join(", ") || "unknown";
      setHealthStatus(`バックエンド: ${ok} / Vision: ${model} / APP_ID: ${res.estat_app_id_set ? "set" : "unset"}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "接続テストに失敗しました";
      setHealthStatus(msg);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="card">
      <h2 className="section-title">レシート画像をアップロード</h2>
      <Dropzone onFileSelected={(f) => onFileChange(f)} />
      {file && (
        <p style={{ marginTop: 8 }}>
          選択中: <strong>{file.name}</strong>
        </p>
      )}

      <div className="flex gap" style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={!file || isAnalyzing}>
          {isAnalyzing ? "解析中..." : "解析する"}
        </button>
        <button className="btn btn-secondary" onClick={doHealthCheck} disabled={checking}>
          {checking ? "確認中..." : "接続テスト"}
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("/edit")}>
          手入力で進む
        </button>
        {lastResult && (
          <button className="btn btn-secondary" onClick={() => navigate("/result")}>
            前回の結果を見る
          </button>
        )}
      </div>

      {isAnalyzing && (
        <div style={{ marginTop: 10 }}>
          <Loading label="解析中..." />
        </div>
      )}

      {healthStatus && (
        <p className="muted" style={{ marginTop: 10 }}>
          {healthStatus}
        </p>
      )}

      {error && (
        <div style={{ marginTop: 12 }}>
          <ErrorBox message="エラー" detail={error} onRetry={handleAnalyze} onAlternate={() => navigate("/edit")} />
        </div>
      )}
    </div>
  );
}
