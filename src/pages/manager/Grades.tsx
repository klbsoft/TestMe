import { commonStyles } from "../../components/theme/default";

export default function Grades() {
  return (
    <div>
      <h2 style={{ 
        color: commonStyles.purple, 
        fontSize: commonStyles.button_fontSize,
        fontWeight: commonStyles.button_fontWeight,
      }}>
        <strong>Grades</strong>
      </h2>
    </div>
  );
}