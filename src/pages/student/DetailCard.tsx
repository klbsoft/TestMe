import { commonStyles } from "../../components/theme/default";
import { getStatus, STATUS_STYLE, typeLabel, type DashItem } from "./common";
import Row from "./Row";

export default function DetailCard({
  item,
  onClose,
  onStart,
}: {
  item: DashItem;
  onClose: () => void;
  onStart: () => void;
}) {
  const status = getStatus(item);
  const style = STATUS_STYLE[status];

  const maxedOut = item.attemptsMax > 0 && item.attemptsMade >= item.attemptsMax;
  const canEnter = !maxedOut && item.attemptsMade === 0;

  return (
    <div
      style={{
        backgroundColor: commonStyles.white,
        borderRadius: "18px",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            color: commonStyles.purple,
            fontSize: commonStyles.button_fontSize,
            fontWeight: "bold",
          }}
        >
          {typeLabel(item.type)} · {item.label}
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: commonStyles.purple,
            fontSize: "22px",
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      <span
        style={{
          alignSelf: "flex-start",
          backgroundColor: style.bg,
          color: commonStyles.white,
          fontSize: "12px",
          fontWeight: "bold",
          borderRadius: "10px",
          padding: "3px 10px",
          textTransform: "uppercase",
        }}
      >
        {style.label}
      </span>

      <Row label="Grade" value={item.grade ?? "—"} />
      <Row label="Type" value={typeLabel(item.type)} />
      <Row label="Attempts" value={`${item.attemptsMade} / ${item.attemptsMax}`} />

      <button
        onClick={onStart}
        disabled={!canEnter}
        style={{
          padding: "12px",
          border: `2px solid ${commonStyles.purple}`,
          borderRadius: "15px",
          backgroundColor: canEnter
            ? commonStyles.purple
            : commonStyles.faded_purple,
          color: commonStyles.white,
          fontSize: commonStyles.button_fontSize,
          fontWeight: commonStyles.button_fontWeight,
          cursor: canEnter ? "pointer" : "not-allowed",
        }}
      >
        {maxedOut
          ? "Attempts exhausted"
          : item.attemptsMade > 0
          ? "Already attempted"
          : "Enter"}
      </button>
    </div>
  );
}