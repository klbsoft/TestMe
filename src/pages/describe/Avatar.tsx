import { useEffect, useRef, useState } from "react";
import Message from "./Message";
import { defaultSetting } from "../../components/theme/default";
// import { playAudio } from "./media/scripts";
import { useAssignmentState, useUpdateAssignment } from "../../context/AssignmentStateContext";
import type { SpeakingAssignment, SpeakingUnit } from "../../session/UserSession";

// import { useFooter } from "../../context/FooterContext";
import AudioFile from "./Audio";
 

export default function Avatar() {

    const [bot, setBot] = useState<string>(`${defaultSetting.base_bot}bot.svg`);
    const update = useUpdateAssignment();
    const { is_recording,isTicking,isListening,answer_state, session, unitIndex, answer_saved, completed ,isPlaying} = useAssignmentState();
    // const [audioFile, setAudio] = useState<string>(null); //`${defaultSetting.base_dialogs}test.mp3`;
    // const [isTicking, setTickState] = useState(false);
    // const [isListening, setListenState] = useState(false);
    // const LISTENING_TIMER = defaultSetting.think_about_listening;//20; 
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    useEffect(()=>{
        const base = `${defaultSetting.base_bot}`;
        if(is_recording === true){
            setBot(`${base}bot-listen-static.svg`)
            return; 
        }
        if(isTicking === true){
            setBot(`${base}bot-questions-no-marks.svg`)
            return;
        }
        if(isPlaying === true){
            setBot(`${base}bot-talks-static.svg`)
            return; 
        }
        setBot(`${base}bot.svg`)
    },[isTicking,is_recording,isPlaying]);
    useEffect(()=>{
        // console.log(isTicking);
        if(isTicking === false)return;
        // if(isTicking===true)return;
        // console.log("ok");
        // kill ANY previous interval before starting a new one
        if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        // if (isTicking === true) {
        //     return;
        // }
        // setTickState(true);
        // setListenState(true);

        // setStart(true);
        // setButtonColor(commonStyles.faded_purple);
        // setButtonLabel("In Progress...");
        // console.log({index:unitIndex,state:answer_state});
        update((prev)=>{
            const assigment = prev.session.assignment as SpeakingAssignment; 
            const units = assigment.units as SpeakingUnit[]; 
            const unit = units[prev.unitIndex]; 
                return {
                timer_current: unit.thinking_time,
                timer_started: unit.thinking_time,
                label_message: "Wait for the timer to talk..."
            }
        });

        // const assigment = session.assignment as SpeakingAssignment;
        // const units = assigment.units as SpeakingUnit[];

        timerRef.current = setInterval(() => {
            update((prev) => {
                if (prev.timer_current > 0) {
                    return { timer_current: prev.timer_current - 1 };
                }
                clearInterval(timerRef.current);
                timerRef.current = null;
                return { 
                    // label_message: "SPEAK NOW!!!",
                    is_recording: true,
                    answer_saved: false,
                    isTicking: false, 
                    isListening: true,
                    message_note: " : SPEAK NOW!!!",
                };
            });
        }, 1000);
    },[isTicking]);
    
    useEffect(()=>{
        // if(unitIndex===0){
            update((prev)=>{
                if(prev.unitIndex === 0){
                    const assigment = prev.session.assignment as SpeakingAssignment;
                    const units = assigment.units as SpeakingUnit[];
                    const content = units[prev.unitIndex].content; 
                    return {
                        audio_file: content,
                        isPlaying: true,
                        label_message: "Listen to the bot."
                    }
                }
                return prev; 
            })
        // }
            // update((prev)=>{
            //     if(prev.unitIndex === 0){
            //         return {unitIndex:6,answer_state:5};
            //     }else{
            //         return prev; 
            //     }
            // }); 
            // update({unitIndex:6,answer_state:5});
        // }
    },[]);

    useEffect(()=>{
        update((prev)=>{
            if(prev.unitIndex === 6 && prev.answer_state === 5){
                        // console.log(prev);
                        const assigment = prev.session.assignment as SpeakingAssignment;
                        const units = assigment.units as SpeakingUnit[];
                        const content = units[prev.unitIndex].content; 
                            
                    return {
                        audio_file: content,
                        isPlaying: true, 
                        label_message: "Listen to the bot."
                    }
            }
            return prev; 
        })
        
    },[unitIndex,answer_state])

    useEffect(()=>{
         update((prev)=>{
                // console.log(prev);
             if(prev.unitIndex > 7){
                    const assigment = prev.session.assignment as SpeakingAssignment;
                    const units = assigment.units as SpeakingUnit[];
                    const content = units[prev.unitIndex].content; 
                return {
                    audio_file: content,
                    isPlaying: true, 
                    message_note: "",
                    label_message:"Listen to the bot.",
                }
             }
             return prev; 
        })
    },[unitIndex]);
    
    // useEffect(()=>{
    //     // console.log({unitIndex,isPlaying})
    //     if(unitIndex > 6 && isPlaying === false){
    //         update((prev)=>{
    //             console.log(prev);
    //             const assigment = prev.session.assignment as SpeakingAssignment;
    //             const units = assigment.units as SpeakingUnit[];
    //             const content = units[prev.unitIndex].content; 
    //             return{
    //                 audio_file: content,
    //                 isPlaying: true,
    //             }
    //         });
    //     }
    // },[unitIndex,isPlaying]);

    return (
        <div 
            className="page-transition"
            style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "8px",
        }}>
            <Message />

            <AudioFile/>

            <img
                onDragStart={(e) => e.preventDefault()}
                src={bot}
                width={"140px"}
                height={"140px"}
                style={{ marginTop: "10px" }}
            // onClick={() => { playAudio(audioRef) }}
            />
        </div>
    );
}


/*

                   

              

*/
