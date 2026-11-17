import { commonStyles } from "../../../components/theme/default";

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5em 0.75em",
  border: `1px solid ${commonStyles.faded_purple}`,
  borderRadius: "6px",
  color: commonStyles.purple,
  fontSize: "0.95em",
  fontWeight: 400,
  boxSizing: "border-box",
  outline: "none",
  background: commonStyles.white,
};

export const labelStyle: React.CSSProperties = {
  fontSize: "0.8em",
  fontWeight: 500,
  color: commonStyles.purple,
  opacity: 0.75,
  marginBottom: 4,
  display: "block",
};

export const fileStyle: React.CSSProperties = {
  ...inputStyle,
  padding: "0.35em 0.5em",
  cursor: "pointer",
  color: commonStyles.purple,
};

export const thumbStyle: React.CSSProperties = {
  width: 96,
  height: 96,
  objectFit: "cover",
  borderRadius: 6,
  border: `1px solid ${commonStyles.faded_purple}`,
  background: commonStyles.white,
  display: "block",
};

export const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: "0.35em 0.85em",
  border: `1px solid ${commonStyles.faded_purple}`,
  borderRadius: 6,
  cursor: "pointer",
  fontSize: "0.8em",
  fontWeight: 500,
  color: active ? commonStyles.white : commonStyles.purple,
  background: active ? commonStyles.purple : commonStyles.white,
  transition: "background-color 0.15s ease, color 0.15s ease",
});

export const btnStyle: React.CSSProperties = {
  padding: "0.4em 0.9em",
  border: `1px solid ${commonStyles.purple}`,
  borderRadius: 6,
  cursor: "pointer",
  fontSize: "0.85em",
  fontWeight: 500,
  color: commonStyles.purple,
  background: commonStyles.white,
};