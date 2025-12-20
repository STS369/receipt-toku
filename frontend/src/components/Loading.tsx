// Simple loading indicator with optional label.
export function Loading({ label = "読み込み中..." }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "3px solid #cbd5e1",
          borderTopColor: "#2563eb",
          animation: "spin 0.9s linear infinite",
          display: "inline-block"
        }}
      />
      <span>{label}</span>
      <style>
        {`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}
      </style>
    </div>
  );
}
