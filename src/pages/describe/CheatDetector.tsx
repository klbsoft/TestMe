import { useEffect, useState, type ReactNode } from "react";
import CheatDetected from "./CheatDetected";

type Props = {
  children: ReactNode;
  enabled?: boolean;
  onCheatDetected?: (reason: string) => void;
};

export default function CheatDetector({ children, enabled = true, onCheatDetected }: Props) {
  const [cheatReason, setCheatReason] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;   // don't attach listeners when disabled

    const flag = (reason: string) => {
      setCheatReason((prev) => prev ?? reason);
      onCheatDetected?.(reason);
    };

    const handleBlur = () => flag("window-blur");
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) flag("exited-fullscreen");
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [enabled, onCheatDetected]);

  if (cheatReason) {
    return (
      <>
        <div style={{ display: "none" }}>{children}</div>
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "#fff", overflow: "auto" }}>
          <CheatDetected reason={cheatReason} />
        </div>
      </>
    );
  }

  return <>{children}</>;
}