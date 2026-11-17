import { useState, useEffect, useRef } from "react";
import { commonStyles, defaultSetting } from "../../components/theme/default";
import { useAssignmentState, useIsDialog, useUpdateAssignment } from "../../context/AssignmentStateContext";
import { SpeakingPhase, type SpeakingAssignment, type SpeakingUnit } from "../../session/UserSession";
import useBeep, { cancelRecording, finishRecording, startRecording } from "./media/scripts";


export default function ActionBtn() {
    const [waveHeights, setWaveHeights] = useState<number[]>([10, 20, 15, 30, 25, 35, 20, 15, 25, 30, 15, 20]);
    const { unitIndex, session, timer_current, is_recording, answer_state, label_message } = useAssignmentState();
    const {beep} = useBeep();
   
  
    // const [answer_state,setAswerState] = useState(0); 
    // const [dialog_state,setDialogState] = useState(0); 
    // const [button_label,setButtonLabel] = useState("Look at the image carefully...");//useState("Start Assigment");
    // const [buttonState,setButtonState] = useState(true); 
    const [buttonColor, setButtonColor] = useState(commonStyles.purple);
    // const [started,setStart] = useState(false); 
    const update = useUpdateAssignment();
    // const isDialog = useIsDialog(); 
    // const [completed,setCompleted] = useState(false); 
    const [buffer, setBuffer] = useState(null);
    // const ANALIZE_TIMER = defaultSetting.analize_picture_timer;
    // const ANWSWER_TIMER = defaultSetting.answer_picture_timer;

    useEffect(() => {
        if (buffer === null) return;

        // console.log("[recorder] blob ready:", buffer.size, "bytes");

        update((prev) => {
            const assignment = prev.session.assignment as SpeakingAssignment;

            const units = assignment.units.map((unit, index) => {
                const isCurrentUnit = index === prev.unitIndex;
                if (!isCurrentUnit) return unit;
                return { ...unit, answer: buffer };
            });
            const isLast = prev.unitIndex >= assignment.units.length - 1;

            const nextAssignment = { ...assignment, units };
            const nextSession = { ...prev.session, assignment: nextAssignment };
            // console.log(nextSession);
            // if (answer_state < 5) {
            return {
                session: nextSession,
                answer: buffer,
                is_recording: false,
                isListening: false, 
                unitIndex: isLast ? prev.unitIndex : prev.unitIndex + 1,
                answer_state: prev.answer_state + 1,
                answer_saved:true,
                completed:isLast
            };
            // }
            // return {
            //     session: nextSession,
            //     answer: buffer,
            //     is_recording: false,
            // };
        });
        
    }, [buffer]);
    // console.log(session);
    useEffect(() => {
        if (!is_recording) return;
        beep();
        // 1️⃣ kick off the actual recorder
        startRecording().catch((err) => {
            console.error("[recorder] start failed:", err);
            update({ is_recording: false });
        });

        // 2️⃣ reset the timer state now that recording has begun
        update((prev)=>{
            const assigment = prev.session.assignment as SpeakingAssignment; 
            const units = assigment.units as SpeakingUnit[]; 
            const unit = units[prev.unitIndex]; 
            const answer_timer = unit.speaking_time; 
            return { timer_current: answer_timer, timer_started: answer_timer }
        });

        // 3️⃣ wave animation (fast, visual only)
        const waveId = setInterval(() => {
            setWaveHeights((prev) =>
                prev.map(() => Math.floor(Math.random() * 10) + 2)
            );
        }, 100);

        // 4️⃣ countdown timer (1/sec)
        const timerId = setInterval(() => {
            update((prev) => {
                if (prev.timer_current === 0) {
                    // ⏹ time's up → stop & save the recording
                    finishRecording()
                        .then((blob) => {
                            setBuffer(blob);
                            // console.log("[recorder] blob ready:", blob.size, "bytes");
                            // const url = URL.createObjectURL(blob);
                            // const a = document.createElement("a");
                            // a.href = url;
                            // a.download = `unitIndex[${unitIndex}]_answerState[${answer_state}]_audio.webm`;
                            // a.click();
                            // URL.revokeObjectURL(url);
                        })
                        .catch((err) => {
                            console.warn("[recorder] finish failed:", err);
                            setBuffer(null);
                            return {
                                answer: null,
                                is_recording: false,
                                unitIndex: prev.unitIndex + 1,
                                answer_state: prev.answer_state + 1,
                                message_note:""
                            }
                        });

                    clearInterval(timerId);
                    return { timer_current: 0 ,message_note: ""};
                }
                return { timer_current: prev.timer_current - 1 };
            });
        }, 1000);

        // cleanup: if the component unmounts or is_recording flips off
        return () => {
            clearInterval(waveId);
            clearInterval(timerId);
            cancelRecording(); // discard if it was still going
        };
    }, [is_recording]);




    useEffect(() => {
        if (unitIndex > 0 && answer_state < 5) {
            Start();
        }
    }, [unitIndex]);
    // useEffect(()=>{
    //     const interval = setInterval(()=>{
    //         update({timer_current:timer_current-1})
    //     },1000);
    // },[unitIndex])

    // console.log(isDialog);

    // if (!isDialog && answer_state === 1){
    //     button_label = "View Image"
    // }
    /*
       0 = Dialog
       1 = Test
       2 = q1
       3 = q2
       4 = q3
       5 = q4
       6 = Dialog
       7 = Test
       8 = q1
       9 = q2
       10 = q3
       11 = q4
    */

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const unitIndexRef = useRef(unitIndex);
    unitIndexRef.current = unitIndex;

    async function Start() {
        // kill ANY previous interval before starting a new one
        if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // setStart(true);
        // setButtonColor(commonStyles.faded_purple);
        // setButtonLabel("In Progress...");
        // console.log({index:unitIndex,state:answer_state});
       
        update((prev)=>{
            const assigment = prev.session.assignment as SpeakingAssignment; 
            const units = assigment.units as SpeakingUnit[]; 
            const unit = units[prev.unitIndex]; 
            const analize_timer = unit.thinking_time; 
            return {
                timer_current: analize_timer,
                timer_started: analize_timer,
                label_message: "Look at the image carefully...",
            }
        });

        // const assigment = session.assignment as SpeakingAssignment;
        // const units = assigment.units as SpeakingUnit[];

        timerRef.current = setInterval(() => {
            update((prev) => {
                if (prev.timer_current > 0) {
                    return { timer_current: prev.timer_current - 1 };
                }

                if (prev.timer_current === 0) {
                    if (timerRef.current !== null) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    return { 
                        is_recording: true,
                        message_note: " : SPEAK NOW!!!",
                    };
                }

                return {};
            });
        }, 1000);
    }
    // if(!isRecording && !buttonState){
    //     setButtonColor("#b100ae")
    // }
    return (
        <div

            onClick={async () => {
                // if(!started){
                //     await Start();
                // }
            }}
            style={{

                backgroundColor: is_recording ? commonStyles.faded_purple : buttonColor,
                borderRadius: "15px",
                padding: is_recording ? "5px 20px" : "15px 20px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                gap: "5px",
                minHeight: is_recording ? "12px" : "50px",
                boxSizing: "border-box",
            }}
        >
            {is_recording ? (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    height: "10px",
                }}>
                    {waveHeights.map((height, index) => (
                        <div
                            key={index}
                            style={{
                                width: "4px",
                                height: `${height}px`,
                                maxHeight: "10px",
                                backgroundColor: commonStyles.white,
                                borderRadius: "2px",
                                transition: "height 0.15s ease-in-out",
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div id="something"
                    style={{
                        color: commonStyles.white,
                        fontSize: commonStyles.button_fontSize,
                        fontWeight: commonStyles.button_fontWeight,
                        minWidth: "80px",
                        textAlign: "center",
                    }}>
                    {label_message}
                </div>
            )}
        </div>
    )
}