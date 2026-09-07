import { useState, useEffect, useRef } from "react";
import { commonStyles } from "../../components/theme/default";

export default function Message(){
    const [timeLeft, setTimeLeft] = useState(60);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const totalTime = 20;
    const percentage = 5;

    const isDesktop = windowWidth > 800;
    
    const maxContentHeight = isDesktop 
        ? Math.min(windowHeight * 0.4, 300)
        : 55;// 80 default

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
            setWindowHeight(window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const element = contentRef.current;
        if (element) {
            const hasOverflow = element.scrollHeight > element.clientHeight;
            setShowScrollIndicator(hasOverflow);
        }
    }, [maxContentHeight]);

    const handleScroll = () => {
        const element = contentRef.current;
        if (element) {
            const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 5;
            const hasOverflow = element.scrollHeight > element.clientHeight;
            setShowScrollIndicator(hasOverflow && !isAtBottom);
        }
    };

    return (
        <div style={{
            position: "relative",
            backgroundColor: commonStyles.purple,
            borderRadius: "15px",
            padding: "12px 15px",
            maxWidth: "350px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
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
            
            {/* Content area */}
            <div 
                ref={contentRef}
                onScroll={handleScroll}
                style={{
                    flex: 1,
                    minWidth: 0,
                    maxHeight: maxContentHeight,
                    overflowY: "auto",
                    paddingRight: "5px",
                    position: "relative",
                    paddingBottom: "10px",
                }}
            >
                <label style={{
                    color: commonStyles.white,
                    fontSize: commonStyles.button_fontSize,
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: "5px",
                }}>
                    Helpful sentences
                </label>
                <ul style={{
                    color: commonStyles.white,
                    fontWeight: commonStyles.button_fontWeight,
                    fontSize: commonStyles.button_fontSize,
                    margin: 0,
                    paddingLeft: "15px",
                    lineHeight: "1.4",
                }}>
                    <li>The amazing view of the picture is stunning</li>
                    <li>I can see a beautiful landscape with vibrant colors</li>
                    <li>In the foreground, there appears to be an interesting subject</li>
                </ul>
            </div>

            {/* Scroll indicator arrow - only when content overflows */}
            {showScrollIndicator && (
                <div style={{
                    position: "absolute",
                    right: "10px",
                    bottom: "15px",
                    pointerEvents: "none",
                }}>
                    <span style={{
                        color: commonStyles.white,
                        fontSize: "12px",
                        opacity: 0.8,
                    }}>
                        ▼
                    </span>
                </div>
            )}

            {/* Timer circle */}
            <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: `conic-gradient(${commonStyles.faded_purple} ${percentage}%, ${commonStyles.white} ${percentage}%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                flexShrink: 0,
            }}>
                <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: commonStyles.purple,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <span style={{
                        color: commonStyles.white,
                        fontSize: "12px",
                        fontWeight: "bold",
                    }}>
                        {timeLeft}
                    </span>
                </div>
            </div>
        </div>
    )
}