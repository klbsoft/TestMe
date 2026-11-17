import { useState } from "react";
import { commonStyles } from "../../../components/theme/default";

type Props = {
  students: string[];
  selected: string;
  onSelect: (code: string) => void;
  /** Codes of students who have at least one attempt with units. */
  completed?: Set<string>;
};

export default function Students({
  students,
  selected,
  onSelect,
  completed,
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: commonStyles.button_fontSize,
        fontWeight: commonStyles.button_fontWeight,
        paddingTop: "1.5em",
      }}
    >
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          border: `2px solid ${commonStyles.faded_purple}`,
          borderRadius: "8px",
          overflow: "hidden",
          background: commonStyles.white,
          display: "inline-block",
          minWidth: "clamp(140px, 30vw, 220px)",
        }}
      >
        {students.length === 0 && (
          <li style={{ padding: "0.5em 1em", color: commonStyles.purple, opacity: 0.6 }}>
            No students
          </li>
        )}

        {students.map((code, i) => {
          const isSelected = code === selected;
          const isHovered = code === hovered;
          const highlight = isSelected || isHovered;
          const done = completed?.has(code) ?? false;

          return (
            <li
              key={code}
              onClick={() => onSelect(code)}
              onMouseEnter={() => setHovered(code)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: "0.5em 1em",
                cursor: "pointer",
                color: highlight ? commonStyles.white : commonStyles.purple,
                background: highlight ? commonStyles.purple : commonStyles.white,
                borderTop: i === 0 ? "none" : `1px solid ${commonStyles.faded_purple}`,
                fontWeight: isSelected ? "bold" : "normal",
                transition: "background-color 0.15s ease, color 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5em",
              }}
            >
              <span>{code}</span>
              <span
                aria-label={done ? "completed" : "not completed"}
                style={{
                  fontSize: "0.9em",
                  fontWeight: "bold",
                  color: highlight
                    ? commonStyles.white
                    : done
                    ? commonStyles.purple
                    : commonStyles.faded_purple,
                  opacity: highlight ? 1 : done ? 1 : 0.6,
                  transition: "color 0.15s ease, opacity 0.15s ease",
                }}
              >
                {done ? "✓" : "✕"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}