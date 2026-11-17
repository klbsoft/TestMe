import { commonStyles } from "../../components/theme/default";
import { getStatus, STATUS_STYLE, typeLabel, type DashItem } from "./common";

export default function AssignmentCard({
  item,
  selected,
  onClick,
}: {
  item: DashItem;
  selected: boolean;
  onClick: () => void;
}) {
  const status = getStatus(item);
  const style = STATUS_STYLE[status];

  return (
    <div
      onClick={onClick}
      style={{
        border: `2px solid ${selected ? commonStyles.purple : commonStyles.faded_purple}`,
        borderRadius: "18px",
        padding: "16px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        backgroundColor: commonStyles.white,
        transition:
          "border-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease",
        boxShadow: selected
          ? "0 4px 12px rgba(170, 59, 255, 0.25)"
          : "0 2px 6px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div style={{ 
           display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",


       }}>
        <span
          style={{
            color: commonStyles.purple,
            fontSize: "13px",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {typeLabel(item.type)}
        </span>

        <span
          style={{
            backgroundColor: style.bg,
            color: commonStyles.white,
            fontSize: "11px",
            fontWeight: "bold",
            borderRadius: "10px",
            padding: "3px 9px",
            textTransform: "uppercase",
            letterSpacing: "0.4px",
          }}
        >
          {style.label}
        </span>
      </div>

      <span
        style={{
          color: commonStyles.purple,
          fontSize: commonStyles.button_fontSize,
          fontWeight: commonStyles.button_fontWeight,
        }}
      >
        {item.label}
      </span>

      <span
        style={{
          color: commonStyles.purple,
          fontSize: commonStyles.button_fontSize,
          opacity: 0.75,
        }}
      >
        {status === "completed"
          ? item.grade
            ? `Grade: ${item.grade}`
            : "Awaiting grade"
          : item.attemptsMade > 0 && item.attemptsMax > 0
          ? `${item.attemptsMade} / ${item.attemptsMax} attempts`
          : "Pending"}
      </span>
    </div>
  );
}