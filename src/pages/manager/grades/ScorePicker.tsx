import { commonStyles } from "../../../components/theme/default";

const SCORES = [0, 1, 2, 3, 4] as const;

export default function ScorePicker({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (n: number) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {SCORES.map((n) => {
        const active = n === value;
        return (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-pressed={active}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              border: `2px solid ${
                active ? commonStyles.purple : commonStyles.faded_purple
              }`,
              backgroundColor: active
                ? commonStyles.purple
                : commonStyles.white,
              color: active ? commonStyles.white : commonStyles.purple,
              fontSize: "14px",
              fontWeight: active ? "bold" : "normal",
              cursor: "pointer",
              transition:
                "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
              boxShadow: active
                ? `0 0 0 3px ${commonStyles.faded_purple}`
                : "none",
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
  );
}