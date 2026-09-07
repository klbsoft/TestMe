import { commonStyles } from "../../components/theme/default";

export default function Groups() {
  return (
    <div>
      <h2 style={{ 
        color: commonStyles.purple, 
        fontSize: commonStyles.button_fontSize,
        fontWeight: commonStyles.button_fontWeight,
        
      }}>
       <strong>Groups</strong>
      </h2>
    </div>
  );
}