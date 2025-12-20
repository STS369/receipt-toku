// Reusable error display with optional actions.
type Props = {
  message: string;
  detail?: string;
  onRetry?: () => void;
  onAlternate?: () => void;
  alternateLabel?: string;
};

export function ErrorBox({ message, detail, onRetry, onAlternate, alternateLabel }: Props) {
  return (
    <div className="card" style={{ borderColor: "#fca5a5", background: "#fef2f2" }}>
      <p style={{ margin: 0, fontWeight: 700, color: "#b91c1c" }}>{message}</p>
      {detail && (
        <p className="muted" style={{ marginTop: 6 }}>
          {detail}
        </p>
      )}
      <div className="flex gap" style={{ marginTop: 10 }}>
        {onRetry && (
          <button className="btn btn-secondary" onClick={onRetry}>
            再試行
          </button>
        )}
        {onAlternate && (
          <button className="btn btn-primary" onClick={onAlternate}>
            {alternateLabel || "手入力で進む"}
          </button>
        )}
      </div>
    </div>
  );
}
