// ---------------------------------------------------------------------------
// Building blocks

import { commonStyles } from "../../components/theme/default";

// ---------------------------------------------------------------------------
export default function Section({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count: number;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span
          style={{
            color: commonStyles.purple,
            fontSize: commonStyles.button_fontSize,
            fontWeight: "bold",
          }}
        >
          {title}
        </span>
        <span
          style={{
            backgroundColor: accent,
            borderRadius: "12px",
            padding: "2px 10px",
            fontSize: "13px",
            fontWeight: "bold",
            color: commonStyles.white,
          }}
        >
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}