// src/pages/manager/grades/GradeStrip.tsx
import { commonStyles } from "../../../components/theme/default";

const GRADES = [0, 1, 2, 3, 4] as const;

/**
 * Row of 0-4 grade buttons. Same look-and-feel as AttemptStrip, but the
 * label reads "General score" and the value is the overall grade for the
 * attempt rather than an attempt index.
 */
export default function GradeStrip({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (grade: number) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <span
        style={{
          color: commonStyles.purple,
          fontSize: "0.85em",
          fontWeight: 600,
          opacity: 0.8,
        }}
      >
        General score
      </span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {GRADES.map((n) => {
          const active = n === value;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              aria-pressed={active}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: active
                  ? commonStyles.purple
                  : commonStyles.white,
                color: active ? commonStyles.white : commonStyles.purple,
                border: active
                  ? `2px solid ${commonStyles.purple}`
                  : `2px solid ${commonStyles.faded_purple}`,
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: active ? "bold" : "normal",
                transition:
                  "background-color 0.15s ease, border-color 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                fontFamily: "inherit",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}