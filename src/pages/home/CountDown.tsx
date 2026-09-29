// CountDown.tsx
import { commonStyles } from "../../components/theme/default";

type Props = {
    current: number;
    started: number;
    label?: string;
    finished?: boolean;
};

export default function CountDown({
    current,
    started,
    label = "Be seated",
    finished = false,
}: Props) {
    const remaining = Math.max(0, current);
    const ringPercent = 100 - Math.floor((remaining / started) * 100);

    return (
        <div
       
            style={{
                display: finished ? "none" : "flex",
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 9999,
                pointerEvents: "none",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
            }}
        >
            <span
                style={{
                    color: commonStyles.purple,
                    fontSize: "54px",
                    fontWeight: "bold",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                }}
            >
                {label}
            </span>

            <div
                style={{
                    width: "220px",
                    height: "220px",
                    borderRadius: "50%",
                    background: `conic-gradient(${commonStyles.faded_purple} ${ringPercent}%, ${commonStyles.white} ${ringPercent}%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
                }}
            >
                <div
                    style={{
                        width: "190px",
                        height: "190px",
                        borderRadius: "50%",
                        backgroundColor: commonStyles.purple,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span
                        style={{
                            color: commonStyles.white,
                            fontSize: "64px",
                            fontWeight: commonStyles.button_fontWeight,
                            lineHeight: 1,
                        }}
                    >
                        {remaining}s
                    </span>
                </div>
            </div>
        </div>
    );
}