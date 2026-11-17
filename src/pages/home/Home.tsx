import { useEffect, useState } from "react";
import { AssignmentStateProvider } from "../../context/AssignmentStateContext";
import { type AssignmentSession } from "../../session/UserSession";
import { commonStyles, defaultSetting } from "../../components/theme/default";
import CountDown from "./CountDown";
import DescribeTheImage from "../describe/Describe";
import { PermissionsGate, usePermissions } from "./PermitionsGate";
import { startAttempt } from "./api";

export default function Home({
  state,
  setter,
}: {
  state: boolean;
  setter: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <PermissionsGate>
      <HomeInner state={state} setter={setter} />
    </PermissionsGate>
  );
}

function HomeInner({
  state,
  setter,
}: {
  state: boolean;
  setter: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { status, errorMsg, requestPermissions } = usePermissions();
  const COUNTDOWN_SECONDS = defaultSetting.initial_count_down;

  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [timer, setTimer] = useState(COUNTDOWN_SECONDS);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [session, setSession] = useState<AssignmentSession | null>(null);

  const done = timer <= 0;

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }
  };

  const handleStart = async () => {
    if (loading) return;

    setLoading(true);
    setLoadError(null);

    try {
      const loadedSession = await startAttempt();
      if (!loadedSession) {
        setLoadError("Could not load the assignment. Please try again.");
        return;
      }

      setSession(loadedSession);

      enterFullscreen();
      const ok = await requestPermissions();
      if (!ok) return;

      setTimer(COUNTDOWN_SECONDS);
      setPhase("running");
    }catch{
      setter(false); 
    } 
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => setTimer((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "running" && done) setPhase("done");
  }, [done, phase]);

  // don't mount the provider until the session is available
  if (phase === "running" && session) {
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
          answer_state: 0,
          is_recording: false,
          label_message: "",
          message_note: "",
          answer_saved: false,
          completed: false,
          audio_file: null,
          isPlaying: false,
          isListening: false,
          isTicking: false,
        }}
      >
        <CountDown current={timer} started={COUNTDOWN_SECONDS} label="Be seated" />
      </AssignmentStateProvider>
    );
  }

  if (phase === "done" && session) {
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
          answer_state: 0,
          is_recording: false,
          label_message: "",
          message_note: "",
          answer_saved: false,
          completed: false,
          audio_file: null,
          isPlaying: false,
          isListening: false,
          isTicking: false,
        }}
      >
        <DescribeTheImage setter={setter}/>
      </AssignmentStateProvider>
    );
  }

  return (
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
        disabled={loading}
        style={{
          padding: "24px 64px",
          fontSize: "28px",
          fontWeight: "bold",
          color: commonStyles.white,
          backgroundColor: loading ? commonStyles.faded_purple : commonStyles.purple,
          border: "none",
          borderRadius: "16px",
          cursor: loading ? "not-allowed" : "pointer",
          letterSpacing: "1px",
          textTransform: "uppercase",
          boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
        }}
      >
        {loading ? "Loading…" : "Start"}
      </button>

      {loadError && (
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
          {loadError}
        </p>
      )}

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
  );
}