import { useState, useEffect } from "react";
import { commonStyles } from "../../components/theme/default";

export default function ActionBtn(){
    const [isRecording, setIsRecording] = useState(false);
    const [waveHeights, setWaveHeights] = useState<number[]>([10, 20, 15, 30, 25, 35, 20, 15, 25, 30, 15, 20]);

    useEffect(() => {
        if (isRecording) {
            const interval = setInterval(() => {
                setWaveHeights(prev => 
                    prev.map(() => Math.floor(Math.random() * 40) + 5)
                );
            }, 100);
            return () => clearInterval(interval);
        }
    }, [isRecording]);

    return (
        <div 
            onClick={() => setIsRecording(!isRecording)}
            style={{
                backgroundColor: isRecording?commonStyles.faded_purple:commonStyles.purple,
                borderRadius: "15px",
                padding: "15px 20px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                gap: "5px",
                height: isRecording?"12px":"25px",
            }}
        >
            {isRecording ? (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    height: "25px",
                }}>
                    {waveHeights.map((height, index) => (
                        <div
                            key={index}
                            style={{
                                width: "4px",
                                height: `${height}px`,
                                backgroundColor: commonStyles.white,
                                borderRadius: "2px",
                                transition: "height 0.15s ease-in-out",
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div style={{
                    color: commonStyles.white,
                    fontSize: commonStyles.button_fontSize,
                    fontWeight: commonStyles.button_fontWeight,
                }}>
                   Start Assigment
                </div>
            )}
        </div>
    )
}