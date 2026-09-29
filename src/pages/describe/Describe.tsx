import { useState, useEffect } from "react";
import "../../animation.css"
import Image from "./Image";
import Avatar from "./Avatar";
import ActionBtn from "./ActionBtn";
import type { AssignmentSession, SpeakingAssignment, SpeakingUnit } from "../../session/UserSession";
import { SpeakingPhase } from "../../session/UserSession";
import { commonStyles } from "../../components/theme/default";
import { useAssignmentState,useUpdateAssignment } from "../../context/AssignmentStateContext";
import Completed from "./Completed";

export default function DescribeTheImage(){
    const {completed} = useAssignmentState(); 
  return (
   <>
    {
      (completed===true)?<Completed/>:<Inner/>
    }
   </>
  )
}

function Inner() {
  // const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
  const {session,unitIndex} = useAssignmentState();
  const update = useUpdateAssignment();
  
  // const [isRecording, setIsRecording] = useState(false);
  // const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  // const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Loop over assignment units
  // useEffect(() => {
  //   if (session.assignment.type === "speaking") {
  //     const units = session.assignment.units;
  //     if (units && units.length > 0) {
  //       const unit = units[currentUnitIndex]; 
  //       console.log(unit); 
  //       setCurrentUnit(unit);
  //     }
  //   }
  // }, [currentUnitIndex]);

  

  const isDesktop = windowWidth > 800;

  // if (!currentUnit) {
  //   return (
  //     <div style={{
  //       width: "100%",
  //       height: "100%",
  //       display: "flex",
  //       alignItems: "center",
  //       justifyContent: "center",
  //       color: commonStyles.purple,
  //       fontSize: "20px",
  //     }}>
  //       Loading...
  //     </div>
  //   );
  // }
  const assigment = session.assignment as SpeakingAssignment;
  const unit = assigment.units[unitIndex] as SpeakingUnit;
  const currentUnit = unit; 
  // console.log(currentUnit)
  const isDescribePhase = currentUnit.phase === SpeakingPhase.describe_image;

  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflowY: "auto",
      padding: "20px",
      boxSizing: "border-box",
      gap: isDesktop ? "40px" : "5px",
    }}>
      {/* Unit counter */}
      {/* <div style={{
        position: "absolute",
        top: "10px",
        right: "20px",
        color: "#0367C7",
        fontSize: "16px",
        fontWeight: "500",
      }}>
        {currentUnitIndex + 1} / {session.assignment.type === "speaking" ? session.assignment.units.length : 0}
      </div> */}

      {/* Main content area */}
      <div style={{
        width: "100%",
        display: "flex",
        flexDirection: isDesktop ? "row" : "column",
        alignItems: "center",
        justifyContent: "center",
        gap: isDesktop ? "40px" : "5px",
      }}>
        {/* Left side - Avatar and ActionBtn */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: isDesktop ? "auto" : "100%",
          order: isDesktop ? 1 : 2,
          flexShrink: 0,
        }}>
          <Avatar/>
          <ActionBtn />
        </div>

        {/* Right side - Image or Audio */}
        <div style={{
          width: isDesktop ? "auto" : "100%",
          order: isDesktop ? 2 : 1,
          flexShrink: 1,
          minWidth: 0,
        }}>
          <Image/>
          {/* {isDescribePhase ? (
            <Image />
            // <></>
          ) : (
            // <Image windowHeight={windowHeight} imageUrl={currentUnit.content} />

  
          )} */}
        </div>
      </div>

      {/* Navigation buttons */}
      {/* <div style={{
        display: "flex",
        gap: "10px",
        marginTop: "20px",
      }}>
        <button
          onClick={handlePreviousUnit}
          disabled={currentUnitIndex === 0}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "2px solid #aa3bff",
            backgroundColor: currentUnitIndex === 0 ? "#ccc" : "white",
            color: "#aa3bff",
            cursor: currentUnitIndex === 0 ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "500",
          }}
        >
          ← Previous
        </button>
        <button
          onClick={handleNextUnit}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "2px solid #aa3bff",
            backgroundColor: "#aa3bff",
            color: "white",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500",
          }}
        >
          {currentUnitIndex === (session.assignment.type === "speaking" ? session.assignment.units.length - 1 : 0) 
            ? "Finish" 
            : "Next →"}
        </button>
      </div>
    </div> */}
    </div>
  );
}