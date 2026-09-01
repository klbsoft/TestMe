import { commonStyles } from "../../components/theme/default";

export default function Message(){
    return (
        <div style={{
            position: "relative",
            backgroundColor: commonStyles.purple,
            borderRadius: "15px",
            padding: "15px 20px",
            maxWidth: "300px",
        }}>
            {/* Triangle spike */}
            <div style={{
                position: "absolute",
                bottom: "-10px",
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: `10px solid ${commonStyles.purple}`,
            }} />
            
            <label style={{
                color: commonStyles.white,
                fontSize: commonStyles.button_fontSize,
                fontWeight: commonStyles.button_fontWeight,
            }}>
                For now the bot is just saying something
            </label>
        </div>
    )
}