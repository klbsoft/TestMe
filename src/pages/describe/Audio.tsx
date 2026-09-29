
import { useEffect, useRef } from 'react';
import { useAssignmentState, useUpdateAssignment } from '../../context/AssignmentStateContext';
import type { SpeakingAssignment, SpeakingUnit } from '../../session/UserSession';


export default function AudioFile() {
    const {isPlaying, audio_file } = useAssignmentState();
    const update = useUpdateAssignment();

    // one persistent audio element for this component's lifetime
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // ---- 1. create the element once, attach the ended handler ----
    useEffect(() => {
        const audio = new Audio();
        audio.preload = 'auto';

        const handleEnded = () => {
            // reflect reality back into state
            update((prev)=>{
                // console.log(prev);
                if(prev.unitIndex === 0){
                        const index = prev.unitIndex+1; 
                        // const assigment = prev.session.assignment as SpeakingAssignment;
                        // const units = assigment.units as SpeakingUnit[];
                        // const content = units[index].content; 
                          return {
                        unitIndex: index,
                        // audio_file: content,
                        // isPlaying: true,
                        // isTicking: false,
                        // message_note: "",
                    }
                }
                if(prev.unitIndex === 6){
                        const index = prev.unitIndex+1; 
                        const assigment = prev.session.assignment as SpeakingAssignment;
                        const units = assigment.units as SpeakingUnit[];
                        const content = units[index].content; 
                        // console.log({content,index})
                    return {
                        unitIndex: index,
                        audio_file: content,
                        isPlaying: true,
                        isTicking: false,
                        message_note: "",
                    }
                }
                  
                return {
                        isPlaying: false,
                        isTicking: prev.unitIndex > 6 ? true:false,
                        message_note: "",
                }
            });

        };
        audio.addEventListener('ended', handleEnded);

        audioRef.current = audio;

        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
            audio.src = '';           // release buffered data
            audioRef.current = null;
        };
        // update is stable from your store; if not, include it
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---- 2. whenever audio_file changes, swap src and reload ----
    useEffect(() => {
        // console.log("changed");
        const audio = audioRef.current;
        // console.log({current:audio.src}); 
        // console.log({new:audio_file});
        if (!audio) return;
         
        // only touch src if it actually changed
        if (audio_file && audio.src !== audio_file) {
            audio.src = audio_file;
            audio.load();             // forces reload of the new file
        }
    }, [audio_file]);

    // ---- 3. whenever isPlaying changes, play / pause ----
useEffect(() => {

  const timeoutId = setTimeout(() => {
        const audio = audioRef.current;
        // console.log(audio.src);
        if (!audio) return;
            if (isPlaying) {
            if (!audio.src) return;
            audio.play().catch((err) => {
                console.error('play failed', err);
                update({ isPlaying: false });
            });
            } else {
            audio.pause();
            }
        }, 500);

  return () => clearTimeout(timeoutId);
}, [isPlaying, audio_file]);

    return <div />;
}



















// import { useCallback, useEffect, useRef, useState } from "react";
// import type { RefObject } from "react";
// import { useAssignmentState, useUpdateAssignment } from "../../context/AssignmentStateContext";
// import type { SpeakingAssignment, SpeakingUnit } from "../../session/UserSession";

// const DEBUG_MODE = false;

// const log = (...args: unknown[]) => { if (DEBUG_MODE) console.log(...args); };
// const warn = (...args: unknown[]) => { if (DEBUG_MODE) console.warn(...args); };
// const error = (...args: unknown[]) => { if (DEBUG_MODE) console.error(...args); };


// export default function AudioFile(){
//     const {session,unitIndex} = useAssignmentState();
//     const update = useUpdateAssignment(); 
//     useEffect(()=>{
//         update({unitIndex:6,answer_state:5});
//     },[])
    
//     function onEnded(e){
//         update({isPlaying:false})
//     }
//     function element(){
//         // update((prev)=>{return {unitIndex:prev.unitIndex+1}})
//         const assigment = session.assignment as SpeakingAssignment;
//         const units = assigment.units as SpeakingUnit[];
//         const content = units[unitIndex]?.content; 
//         console.log({unitIndex,content})
//         const audio = new Audio(content);
//         audio.onended = onEnded; 
//         audio.load(); 
//         audio.play(); 
//         // update((prev)=>{
//         //         const assigment = prev.session.assignment as SpeakingAssignment;
//         //         const units = assigment.units as SpeakingUnit[];
//         //         const content = units[0]?.content; 
//         //         // const audio = new Audio(content);
//         //     return prev; 
//         // })
//         return audio; 
//     }
// return (
//     <div onLoad={element}>
         
//     </div>
// )
// }

// export default function Audio() {

//     const audioRef = useRef<HTMLAudioElement | null>(null);
//     const {audio_file,isPlaying} = useAssignmentState(); 
//     const [ended,setEnded] = useState(false); 
//     const update = useUpdateAssignment();
//     useEffect(()=>{
//         if(ended === true){
//             // console.log(ended);
//             update((prev)=>{
//                     // console.log(prev); 
//                     if(prev.unitIndex === 0){
//                         return {unitIndex: 1};
//                     }
        
//                     if(prev.unitIndex === 6)
//                     {
//                         // console.log("ok");
//                         const index = prev.unitIndex + 1; // this should be 7 
//                         const assigment = prev.session.assignment as SpeakingAssignment;
//                         const units = assigment.units as SpeakingUnit[];
//                         const content = units[index]?.content; 
//                         //    console.log("ok");
//                         return {
//                             audio_file: content,
//                             isPlaying: false, 
//                             unitIndex: index,
//                         }
//                     }
//                     // console.log("ok")
//                     return prev; 
//                 });
//         }
//         setEnded(false);
//     },[ended]);

//     useEffect(() => {
//         // console.log({audio_file,isPlaying})
//         if (audio_file === "" || audio_file === null) {
//             return;
//         }
//         if(isPlaying===true){
//             setTimeout(()=>{
//                 playAudio(audioRef);
//             },500);
//         }
//     }, [audio_file,isPlaying]);
//     return (
//         <audio
//             ref={audioRef}
//             src={audio_file===""||audio_file===null?null:audio_file}
//             onEnded={()=>{
//                 setEnded(true)
//             }}
//         />
//     );
// }


// export function playAudio(audioRef: RefObject<HTMLAudioElement | null>) {
//     const a = audioRef.current;

//     if (!a) {
//         warn("[audio] playAudio: no audio element (ref is null)");
//         return;
//     }

//     if (!a.src && !a.currentSrc) {
//         warn("[audio] playAudio: no source yet", {
//             src: a.src,
//             currentSrc: a.currentSrc,
//             readyState: a.readyState,
//         });
//         return;
//     }

//     log("[audio] playAudio: attempting", {
//         src: a.src,
//         currentSrc: a.currentSrc,
//         readyState: a.readyState,
//         networkState: a.networkState,
//         paused: a.paused,
//         muted: a.muted,
//         volume: a.volume,
//         duration: a.duration,
//     });

//     const attemptPlay = (reason: string) => {
//         a.play()
//             .then(() => log(`[audio] play succeeded (${reason})`))
//             .catch((err) => {
//                 error(`[audio] play FAILED (${reason}):`, err.name, err.message, err);
//             });
//     };

//     if (a.readyState === 0) {
//         warn("[audio] readyState is 0 — waiting for 'canplay'");
//         a.addEventListener("canplay", () => attemptPlay("after canplay"), { once: true });
//         a.addEventListener("error", () => {
//             error("[audio] error event while loading:", a.error);
//         }, { once: true });
//         a.load();
//         return;
//     }

//     attemptPlay("immediate");
// }

// interface AudioProps {
//     onEnded?: () => void;
// }
