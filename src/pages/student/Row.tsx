import { commonStyles } from "../../components/theme/default";

export default function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span
        style={{
          color: commonStyles.purple,
          opacity: 0.7,
          fontSize: commonStyles.button_fontSize,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: commonStyles.purple,
          fontWeight: "bold",
          fontSize: commonStyles.button_fontSize,
        }}
      >
        {value}
      </span>
    </div>
  );
}

