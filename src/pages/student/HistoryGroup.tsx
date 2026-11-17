import { commonStyles } from "../../components/theme/default";
import { typeLabel, type DashItem } from "./common";

export default function HistoryGroup({
  title,
  items,
  empty,
  onSelect,
}: {
  title: string;
  items: DashItem[];
  empty: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <span
        style={{
          color: commonStyles.white,
          fontSize: "13px",
          fontWeight: "bold",
          opacity: 0.85,
          textTransform: "uppercase",
          letterSpacing: "0.6px",
        }}
      >
        {title}
      </span>

      {items.length === 0 ? (
        <span
          style={{
            color: commonStyles.white,
            fontSize: commonStyles.button_fontSize,
            opacity: 0.55,
          }}
        >
          {empty}
        </span>
      ) : (
        items.map((a) => (
          <div
            key={a.id}
            onClick={() => onSelect(a.id)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: commonStyles.white,
              borderRadius: "14px",
              padding: "10px 14px",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                color: commonStyles.purple,
                fontSize: commonStyles.button_fontSize,
                fontWeight: commonStyles.button_fontWeight,
              }}
            >
              {typeLabel(a.type)} · {a.label}
            </span>
            <span
              style={{
                color: commonStyles.purple,
                fontSize: commonStyles.button_fontSize,
                fontWeight: "bold",
              }}
            >
              {a.grade ?? "—"}
            </span>
          </div>
        ))
      )}
    </div>
  );
}