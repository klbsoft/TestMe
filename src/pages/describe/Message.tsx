import { useState, useEffect, useRef } from "react";
import { commonStyles } from "../../components/theme/default";
import { useAssignmentState, useIsDialog } from "../../context/AssignmentStateContext";
import {
    AssignmentType,
    SpeakingPhase,
    type SpeakingAssignment,
    type SpeakingUnit,
} from "../../session/UserSession";

// --- single shared resize hook; move to hooks/useWindowSize.ts ---
function useWindowSize() {
    const [size, setSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    useEffect(() => {
        const onResize = () =>
            setSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);
    return size;
}

function normalizeSentence(input?: string | string[]): string[] {
    if (!input) return [];
    return Array.isArray(input) ? input : [input];
}

export default function Message() {
    const {is_recording, isPlaying,message_note,session, unitIndex, timeElapsed, maxTimePerAnswer ,timer_current,timer_started} = useAssignmentState();
    const { width: windowWidth, height: windowHeight } = useWindowSize();

    const [showScrollIndicator, setShowScrollIndicator] = useState(false);
    const isDialog = useIsDialog();
 
    const contentRef = useRef<HTMLDivElement>(null);

    // --- narrow assignment/unit safely ---
    const assignment = session.assignment;
    const isSpeaking = assignment.type === AssignmentType.speaking;
    const unit: SpeakingUnit | null = isSpeaking
        ? assignment.units[unitIndex] ?? null
        : null;

    // const _type = unit?.id.substring(0,unit?.id.indexOf('_'));

    // const isDialog = _type === "dialog"

    // --- derive content flags ---
    // const isTestUnit =  _type === "dialog";
    const isDescribe = unit?.phase === SpeakingPhase.describe_image;
    const showHelpful = isDialog || isDescribe;
    const lines = showHelpful ? normalizeSentence(unit?.helpful_sentence) : [];

    // --- layout ---
    const isDesktop = windowWidth > 800;
    const maxContentHeight = isDesktop
        ? Math.min(windowHeight * 0.4, 300)
        : 90;

    // timer ring
const remaining = Math.max(0, timer_current);
const ringPercent = 100 - Math.floor((remaining / timer_started) * 100) ;

 
// console.log({remain:remaining,porcent:ringPercent})
    // --- scroll indicator ---
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const hasOverflow = el.scrollHeight > el.clientHeight;
        setShowScrollIndicator(hasOverflow);
    }, [maxContentHeight, lines.join("|")]);

    const handleScroll = () => {
        const el = contentRef.current;
        if (!el) return;
        const isAtBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < 5;
        const hasOverflow = el.scrollHeight > el.clientHeight;
        setShowScrollIndicator(hasOverflow && !isAtBottom);
    };

    // --- render guard ---
    // if (!unit) {
    //     return null;
    // }
    // if (!showHelpful || lines.length === 0) {
    //     return null;
    // }
    // console.log({isPlaying,isDialog})
    return (
        <div
            className="page-transition"
            style={{
                position: "relative",
                backgroundColor: commonStyles.purple,
                borderRadius: "15px",
                padding: "12px 15px",
                // left-aligned, wider on desktop
                width: isDesktop ? "min(520px, 60vw)" : "100%",
                maxWidth: isDesktop ? 520 : 350,
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                textAlign: "left",
            }}
        >
            {/* speech bubble tail */}
            <div
                style={{
                    position: "absolute",
                    bottom: "-10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "10px solid transparent",
                    borderRight: "10px solid transparent",
                    borderTop: `10px solid ${commonStyles.purple}`,
                }}
            />

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
               <label
                    style={{
                        color: commonStyles.white,
                        fontSize: commonStyles.button_fontSize,
                        fontWeight: "bold",
                        display: "block",
                        marginBottom: "5px",
                    }}
                >
                    
                    {unitIndex > 6 || isDialog ? "Info" : `Helpful sentence${message_note}`} 
                    {unitIndex > 6 ?`${message_note}`:""}
                </label>
                {/* <div
                     style={{
                        color: commonStyles.white,
                        fontWeight: commonStyles.button_fontWeight,
                        fontSize: commonStyles.button_fontSize,
                        margin: 0,
                        paddingLeft: "15px",
                        lineHeight: "1.4",
                        textAlign: "left",
                    }}
                >

                    {lines}
                </div>                 */}
                <ul
                    className="page-transition"
                    style={{
                        color: commonStyles.white,
                        fontWeight: commonStyles.button_fontWeight,
                        fontSize: commonStyles.button_fontSize,
                        margin: 0,
                        paddingLeft: "15px",
                        lineHeight: "1.4",
                        textAlign: "left",
                    }}
                >
                    {!isDialog && unitIndex < 6 ? (
                        is_recording ? (
                            <>
                            <li>Today, I will be describing the...</li>
                            <li>The first image that I see, shows an illustration of the ...</li>
                            <li>Also, the photo depicts...</li>
                            <li>Lastly, the photo shows...</li>
                            <li>The Landscape is characterized by...</li>
                            </>
                        ) : (<li>Carefully observe every detail of the image.</li>)
                    ) : (
                    lines
                    )}
                    {
                        unitIndex > 6?(
                            <li>Speak as clear as you can after the audio...</li>
                        ):""
                    }
                </ul>
            </div>

            {showScrollIndicator && (
                <div
                    style={{
                        position: "absolute",
                        right: "10px",
                        bottom: "15px",
                        pointerEvents: "none",
                    }}
                >
                    <span style={{ color: commonStyles.white, fontSize: "12px", opacity: 0.8 }}>
                        ▼
                    </span>
                </div>
            )}

            {/* timer ring */}
            {isDialog === false && isPlaying === false? (
                <div
                 style={{
            width: "84px",
            height: "84px",
            borderRadius: "50%",
            background: `conic-gradient(${commonStyles.faded_purple} ${ringPercent}%, ${commonStyles.white} ${ringPercent}%)`,
             display:"flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            alignSelf: "center",
        }}
                >
                    <div
                        style={{
                            width: "50px",
                            height: "50px",
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
                                fontSize: commonStyles.button_fontSize,
                                fontWeight: commonStyles.button_fontWeight,
                            }}
                        >
                            {remaining}s
                        </span>
                    </div>
                </div>
            ):null}

        </div>
    );
}