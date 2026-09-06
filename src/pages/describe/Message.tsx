import { useState } from "react";
import { commonStyles } from "../../components/theme/default";

export default function Message(){
    const [timeLeft, setTimeLeft] = useState(60); // Example: 60 seconds
    const totalTime = 20; // Total time for the countdown

    const percentage = 5; //(timeLeft / totalTime) * 100;

    return (
        <div style={{
            position: "relative",
            backgroundColor: commonStyles.purple,
            borderRadius: "15px",
            padding: "15px 20px",
            maxWidth: "350px",
            display: "flex",
            alignItems: "center",
            gap: "15px",
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
                flex: 1,
            }}>
                For now the bot is just saying something              
            </label>

            {/* Timer circle */}
            <div style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: `conic-gradient(${commonStyles.faded_purple} ${percentage}%, ${commonStyles.white} ${percentage}%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                flexShrink: 0,
            }}>
                {/* Inner circle */}
                <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: commonStyles.purple,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <span style={{
                        color: commonStyles.white,
                        fontSize: "14px",
                        fontWeight: "bold",
                    }}>
                        {timeLeft}
                    </span>
                </div>
            </div>
        </div>
    )
}