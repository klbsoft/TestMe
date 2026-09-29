import { defaultSetting, commonStyles } from "../../components/theme/default";

export default function Completed() {
    return (
        <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            boxSizing: "border-box",
        }}>
            <div style={{
                backgroundColor: commonStyles.clear_purple,
                borderRadius: "22px",
                padding: "40px 60px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                border: `solid 2px ${commonStyles.white}`,
                maxWidth: "500px",
                width: "100%",
            }}>
                <img
                    src={`${defaultSetting.base_bot}bot-exited-static.svg`}
                    width={"140px"}
                    height={"140px"}
                    alt="bot"
                />
                <h1 style={{
                    color: commonStyles.white,
                    fontSize: "24px",
                    fontWeight: "bold",
                    margin: 0,
                    textAlign: "center",
                }}>
                    Congratulations!
                </h1>
                <p style={{
                    color: commonStyles.white,
                    fontSize: commonStyles.button_fontSize,
                    fontWeight: commonStyles.button_fontWeight,
                    margin: 0,
                    textAlign: "center",
                    lineHeight: "1.4",
                }}>
                    You have completed this assignment.
                </p>
            </div>
        </div>
    );
}