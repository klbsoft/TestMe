import { useEffect, useState } from "react";
import { AssignmentStateProvider } from "../../context/AssignmentStateContext";
import { type AssignmentSession } from "../../session/UserSession";
import { commonStyles, defaultSetting } from "../../components/theme/default";
import CountDown from "./CountDown";
import DescribeTheImage from "../describe/Describe";
import { fetchAssigmentSession } from "../../session/fetcher";
import { PermissionsGate, usePermissions } from "./PermitionsGate"
// import Completed from "../describe/Completed";
export default function Home() {
  return (
    <PermissionsGate>
      <HomeInner />
    </PermissionsGate>
  );
}

function HomeInner() {
  const { status, errorMsg, requestPermissions } = usePermissions();
  // const {completed} = useAssignmentState();
  const COUNTDOWN_SECONDS = defaultSetting.initial_count_down;

  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [timer, setTimer] = useState(COUNTDOWN_SECONDS);
  const done = timer <= 0;

  const handleStart = async () => {
    // 🔑 the click is the gesture — request permissions here
    const ok = await requestPermissions();
    if (!ok) return; // stay on the Start screen (loop)

    setTimer(COUNTDOWN_SECONDS);
    setPhase("running");
  };

  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => setTimer((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "running" && done) setPhase("done");
  }, [done, phase]);

  const session: AssignmentSession = fetchAssigmentSession();
  
  return (
    <AssignmentStateProvider
      initial={{
        session,
        unitIndex: 0,
        timeElapsed: 0,
        maxTimePerAnswer: 45,
        maxSessionTime: 900,
        timer_current: 0,
        timer_started: 0,
        answer_state:0,
        is_recording: false,
        label_message:"",
        message_note: "",
        answer_saved: false, 
        completed: false,
        audio_file: null,
        isPlaying: false, 
        isListening: false,
        isTicking: false,
      }}
    >
      {phase === "idle" && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <button
            onClick={handleStart}
            style={{
              padding: "24px 64px",
              fontSize: "28px",
              fontWeight: "bold",
              color: commonStyles.white,
              backgroundColor: commonStyles.purple,
              border: "none",
              borderRadius: "16px",
              cursor: "pointer",
              letterSpacing: "1px",
              textTransform: "uppercase",
              boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
            }}
          >
            Start
          </button>

          {status === "blocked" && (
            <p
              style={{
                color: commonStyles.purple,
                fontSize: 16,
                fontWeight: "bold",
                margin: 0,
                textAlign: "center",
                maxWidth: 320,
              }}
            >
              {errorMsg} Please allow the microphone in your browser, then press Start again.
            </p>
          )}
        </div>
      )}

      {phase === "running" && !done && (
        <CountDown current={timer} started={1} label="Be seated" />
      )}
      
      {phase === "done"&&<DescribeTheImage />}

    </AssignmentStateProvider>
  );
}