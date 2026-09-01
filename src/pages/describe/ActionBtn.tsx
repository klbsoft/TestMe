import { commonStyles } from "../../components/theme/default";

export default function ActionBtn(){
    return (
        <div style={{
            backgroundColor: commonStyles.purple,
            borderRadius: "15px",
            padding: "15px 20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
        }}>
            <div style={{
                color: commonStyles.white,
                fontSize: commonStyles.button_fontSize,
                fontWeight: commonStyles.button_fontWeight,
            }}>
                Run Action
            </div>
        </div>
    )
}