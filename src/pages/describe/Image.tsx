import { defaultSetting, commonStyles } from "../../components/theme/default";
import { useState, useEffect } from "react";
import ProgressBar from "./ProgressBar";
import { useAssignmentState, useIsDialog } from "../../context/AssignmentStateContext";
import type { SpeakingAssignment } from "../../session/UserSession";



export default function Image(){
    const {session,unitIndex} = useAssignmentState(); 
    const isDialog = useIsDialog(); 
    // const isDialog = useIsDialog(); 
    // Calculate max size based on viewport height
    // let maxImageSize = Math.min(
    //     window.innerWidth > 800 ? 600 : 400,
    //     window.innerHeight * 0.6 // 60% of viewport height
    // );
    const maxImageSize = 580;
    const assigment = session.assignment as SpeakingAssignment;
    const unit = assigment.units[unitIndex];
    const is_a_test = isDialog || unitIndex > 6; 
    const imageUrl = is_a_test?`${defaultSetting.base_icons}x_listening.png`:unit.content;
  
    // console.log({index:unitIndex,content:unit.content});
    return (
        <div style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        }}
        // onClick={() => {
        //     setIsBlurred(isBlurred ? false : true);
        // }}
        >
            <div style={{
                width: "100%",
                maxWidth: maxImageSize,
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                alignItems: "center",
            }}>
                <img 
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    key={unitIndex}
                    src={imageUrl}
                    style={{
                        width: "100%",
                        maxWidth: maxImageSize,
                        maxHeight: maxImageSize,
                        aspectRatio: "1 / 1",
                        objectFit: "cover",
                        border: `solid 2px ${commonStyles.white}`,
                        borderRadius: "22px",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                        filter: false ? "blur(8px)" : "blur(0px)",
                        transition: "filter 0.5s ease-in-out",
                        WebkitTransition: "filter 0.5s ease-in-out",
                        MozTransition: "filter 0.5s ease-in-out",
                    }}
                />
                <ProgressBar/>
            </div>
        </div>
    )
}