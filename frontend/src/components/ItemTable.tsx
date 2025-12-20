// Table view for analyzed items and price comparisons.
import { ItemResult } from "../lib/types";

type Props = {
  items: ItemResult[];
  showUnknownHighlight?: boolean;
};

function judgementTag(j?: string) {
  if (!j) return <span className="tag unknown">UNKNOWN</span>;
  const cls = j.toLowerCase();
  return <span className={`tag ${cls}`}>{j}</span>;
}

export function ItemTable({ items, showUnknownHighlight = true }: Props) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            <th>raw_name</th>
            <th>canonical</th>
            <th>paid_unit_price</th>
            <th>quantity</th>
            <th>stat_price</th>
            <th>diff</th>
            <th>rate</th>
            <th>judgement</th>
            <th>note</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const j = item.estat?.judgement || "UNKNOWN";
            const isUnknown = j === "UNKNOWN" && showUnknownHighlight;
            return (
              <tr key={`${item.raw_name}-${idx}`} style={{ background: isUnknown ? "#fef9c3" : undefined }}>
                <td>{item.raw_name}</td>
                <td>{item.canonical || "-"}</td>
                <td>{item.paid_unit_price ?? "-"}</td>
                <td>{item.quantity ?? "-"}</td>
                <td>{item.estat?.stat_price ?? "-"}</td>
                <td>{item.estat?.diff ?? "-"}</td>
                <td>
                  {item.estat?.rate === undefined || item.estat?.rate === null
                    ? "-"
                    : `${(item.estat.rate * 100).toFixed(1)}%`}
                </td>
                <td>{judgementTag(j)}</td>
                <td>{item.estat?.note || "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
