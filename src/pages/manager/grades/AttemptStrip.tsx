// src/pages/manager/grades/AttemptStrip.tsx
import { commonStyles } from "../../../components/theme/default";

export type AttemptState = "graded" | "ungraded" | "locked";

export interface AttemptCell {
  id: string;
  attempt: number;
  state: AttemptState;
  currentAttempt: string; 
}

export default function AttemptStrip({
  attempts,
  value,
  onChange,
  currentAttempt,
}: {
  attempts: AttemptCell[];
  value: number | null;
  onChange: (attempt: number) => void;
  currentAttempt: string; 
}) {
  if (attempts.length === 0) {
    return (
      <p
        style={{
          color: commonStyles.purple,
          fontSize: commonStyles.button_fontSize,
          opacity: 0.6,
          margin: 0,
        }}
      >
        No attempts yet.
      </p>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <span
        style={{
          color: commonStyles.purple,
          fontSize: "0.85em",
          fontWeight: 600,
          opacity: 0.8,
        }}
      >
        Assignment: {currentAttempt}
      </span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {attempts.map((a) => {
          const isSelected = a.attempt === value;
          const isLocked = a.state === "locked";

          const bg = isSelected
            ? commonStyles.purple
            : a.state === "graded"
            ? commonStyles.clear_purple
            : commonStyles.white;

          const color = isSelected ? commonStyles.white : commonStyles.purple;

          const border = isSelected
            ? `2px solid ${commonStyles.purple}`
            : a.state === "graded"
            ? `2px solid ${commonStyles.clear_purple}`
            : `2px solid ${commonStyles.faded_purple}`;

          const opacity = isLocked && !isSelected ? 0.35 : 1;

          return (
            <button
              key={a.id}
              onClick={() => {
                if (isLocked) return;
                onChange(a.attempt);
              }}
              disabled={isLocked}
              aria-label={`Attempt ${a.attempt}${isLocked ? " (locked)" : ""}`}
              aria-pressed={isSelected}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: bg,
                color,
                border,
                cursor: isLocked ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: isSelected ? "bold" : "normal",
                opacity,
                transition:
                  "background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                fontFamily: "inherit",
              }}
            >
              {a.attempt}
            </button>
          );
        })}
      </div>
    </div>
  );
}