// PermissionsGate.tsx
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";


type GateStatus = "idle" | "blocked" | "granted";

type Ctx = {
  status: GateStatus;
  errorMsg: string;
  /** call this from a click handler; resolves true if everything is granted */
  requestPermissions: () => Promise<boolean>;
};

const PermissionsContext = createContext<Ctx | null>(null);

export function PermissionsGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const lockedRef = useRef(false); // prevents double-fire during a pending request

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (lockedRef.current) return false;
    lockedRef.current = true;

    // 1. unlock audio (silent)
    const a = new Audio();
    a.muted = true;
    a.play().catch(() => {});

    // 2. ask for mic
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setStatus("granted");
      setErrorMsg("");
      lockedRef.current = false;
      return true;
    } catch (err: any) {
      console.warn("[PermissionsGate] mic denied:", err?.name, err?.message);
      if (err?.name === "NotFoundError") setErrorMsg("No microphone detected on this device.");
      else if (err?.name === "NotAllowedError") setErrorMsg("Microphone access was blocked.");
      else setErrorMsg(err?.message ?? "Could not access the microphone.");

      setStatus("blocked");
      lockedRef.current = false;
      return false;
    }
  }, []);

  return (
    <PermissionsContext.Provider value={{ status, errorMsg, requestPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissions must be used inside <PermissionsGate>");
  return ctx;
}