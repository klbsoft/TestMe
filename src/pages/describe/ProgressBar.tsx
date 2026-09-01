import { useState } from "react";
import { commonStyles } from "../../components/theme/default";

export default function ProgressBar(){
    const [progress, setProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const total = 10;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        setProgress(Math.min(100, Math.max(0, percentage)));
    };

    const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) {
            handleClick(e);
        }
    };

    const currentValue = Math.round((progress / 100) * total);

    return (
        <div style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
        }}>
            <div style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}>
                <label style={{
                    fontSize: commonStyles.button_fontSize,
                    fontWeight: commonStyles.button_fontWeight,
                    color: commonStyles.green,
                }}>
                    {currentValue}/{total}
                </label>
                <label style={{
                    fontSize: commonStyles.button_fontSize,
                    fontWeight: commonStyles.button_fontWeight,
                    color: commonStyles.green,
                }}>
                    {Math.round(progress)}%
                </label>
            </div>
            <div
                onMouseDown={(e) => {
                    setIsDragging(true);
                    handleClick(e);
                }}
                onMouseMove={handleDrag}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                style={{
                    width: "100%",
                    height: "20px",
                    backgroundColor: commonStyles.green,
                    borderRadius: "10px",
                    cursor: "pointer",
                    position: "relative",
                    userSelect: "none",
                }}
            >
                <div style={{
                    width: `${progress}%`,
                    height: "100%",
                    backgroundColor: commonStyles.green,
                    borderRadius: "10px",
                    transition: isDragging ? "none" : "width 0.3s ease",
                }} />
            </div>
        </div>
    )
}