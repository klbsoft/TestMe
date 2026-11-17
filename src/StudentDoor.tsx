// import Container from "./components/container/Container";
// import { ViewProvider } from "./context/ViewContext";
import "./animation.css";
import { commonStyles } from "./components/theme/default";
import Cat from "./Cat";
// import CheatDetector from "./CheatDetector"
import { useEffect } from "react";
import Login from "./pages/login/Login";
import StudentDashboard from "./pages/student/StudentDashboard";

export default function StudentDoor() {
  const blockCopyPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

const blockKeys = (e: React.KeyboardEvent) => {
  const mod = e.ctrlKey || e.metaKey;

  // Block all function keys: F1 through F12
  if (/^F([1-9]|1[0-2])$/.test(e.key)) {
    e.preventDefault();
    return;
  }

  // Block Ctrl+A / Cmd+A
  if (mod && e.key.toLowerCase() === "a") {
    e.preventDefault();
    return;
  }
  if (e.key === "Tab") {
    e.preventDefault();
    return;
  }
};

    useEffect(() => {
    const block = (e: MouseEvent) => e.preventDefault();

    document.addEventListener("contextmenu", block);

    return () => {
      document.removeEventListener("contextmenu", block);
    };
  }, []);

  return (
    // <CheatDetector
    //   onCheatDetected={() => {
    //     // Later: trigger something here (log, API call, play another TSX, etc.)
    //     console.log("Cheating condition detected — focus lost.");
    //   }}
    // >
      <div
        tabIndex={0}
        onKeyDown={blockKeys}
        onCopy={blockCopyPaste}
        onPaste={blockCopyPaste}
        onCut={blockCopyPaste}
        onDragCapture={(e) => e.preventDefault()}
        // onContextMenu={(e) => e.preventDefault()}
        // onClick={enterFullscreen} // fullscreen needs a user gesture
        className="page-transition"
        style={{
          width: "100%",
          height: "98dvh",
          margin: "0",
          padding: "0",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          overflow: "hidden",
          boxSizing: "border-box",
          border: `solid 2px ${commonStyles.purple}`,
          borderRadius: "22px",
        }}
      >
        <Login/>
      </div>
  );
}