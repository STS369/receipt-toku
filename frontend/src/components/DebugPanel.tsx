// Toggleable panel to view debug payloads.
import { useState } from "react";

type Props = {
  data?: Record<string, unknown>;
};

export function DebugPanel({ data }: Props) {
  const [open, setOpen] = useState(false);
  if (!data) return null;
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="flex space-between" style={{ alignItems: "center" }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>
          デバッグ情報
        </h3>
        <button className="btn btn-secondary" onClick={() => setOpen((v) => !v)}>
          {open ? "閉じる" : "開く"}
        </button>
      </div>
      {open && (
        <pre style={{ maxHeight: 320, overflow: "auto", background: "#0f172a", color: "#e2e8f0", padding: 12, borderRadius: 8 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
