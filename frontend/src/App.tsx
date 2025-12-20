// App shell with routes and shared state for analysis results.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { analyzeReceipt } from "./lib/api";
import { AnalyzeResponse } from "./lib/types";
import { loadSessionResult, saveSessionResult } from "./lib/storage";
import { Home } from "./pages/Home";
import { ResultPage } from "./pages/Result";
import { EditPage } from "./pages/Edit";
import { HistoryPage } from "./pages/History";

export default function App() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadSessionResult();
    if (stored) {
      setResult(stored);
    }
  }, []);

  const runAnalyze = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      try {
        const res = await analyzeReceipt(file);
        setSelectedFile(file);
        setResult(res);
        saveSessionResult(res);
        navigate("/result");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "解析に失敗しました";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const clearError = useCallback(() => setError(null), []);

  const summaryCount = useMemo(() => {
    return {
      deal: result?.summary?.deal_count ?? 0,
      overpay: result?.summary?.overpay_count ?? 0,
      unknown: result?.summary?.unknown_count ?? 0
    };
  }, [result]);

  return (
    <div className="container">
      <header className="flex space-between" style={{ alignItems: "center", marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: "0 0 6px" }}>Receipt Deal Checker</h1>
          <p className="muted" style={{ margin: 0 }}>
            レシート画像から e-Stat 価格と比較して DEAL/FAIR/OVERPAY を判定
          </p>
        </div>
        <nav className="flex gap">
          <Link to="/" className="btn btn-secondary">
            アップロード
          </Link>
          <Link to="/result" className="btn btn-secondary">
            結果
          </Link>
          <Link to="/edit" className="btn btn-secondary">
            修正
          </Link>
          <Link to="/history" className="btn btn-secondary">
            履歴
          </Link>
        </nav>
      </header>

      {loading && <p style={{ marginTop: 0 }}>⏳ 解析中...</p>}
      {error && (
        <div className="card" style={{ borderColor: "#fca5a5", background: "#fef2f2", marginBottom: 12 }}>
          <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p>
          <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={clearError}>
            閉じる
          </button>
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <Home
              file={selectedFile}
              onFileChange={setSelectedFile}
              onAnalyze={runAnalyze}
              isAnalyzing={loading}
              lastResult={result}
              clearError={clearError}
            />
          }
        />
        <Route
          path="/result"
          element={
            <ResultPage
              result={result}
              onEdit={() => navigate("/edit")}
              onReAnalyze={selectedFile ? () => runAnalyze(selectedFile) : undefined}
              summaryCount={summaryCount}
            />
          }
        />
        <Route
          path="/edit"
          element={
            <EditPage
              result={result}
              onUpdate={(updated) => {
                setResult(updated);
                saveSessionResult(updated);
                navigate("/result");
              }}
              onBack={() => navigate("/result")}
            />
          }
        />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </div>
  );
}
