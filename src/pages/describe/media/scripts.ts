


// recorder.ts
let recorder: MediaRecorder | null = null;
let stream: MediaStream | null = null;
let chunks: Blob[] = [];
let resolveStop: ((b: Blob) => void) | null = null;

export async function startRecording(): Promise<void> {
  if (recorder) return;

  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  recorder = new MediaRecorder(stream);
  chunks = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: recorder?.mimeType || "audio/webm" });
    resolveStop?.(blob);
    resolveStop = null;
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    recorder = null;
  };

  recorder.start();
}

/** Stop and resolve with the finished blob. Call ONLY when you intend to save it. */
export function finishRecording(): Promise<Blob> {
  if (!recorder || recorder.state === "inactive") {
    return Promise.reject(new Error("Not recording"));
  }
  const p = new Promise<Blob>((resolve) => { resolveStop = resolve; });
  recorder.stop();
  return p;
}

/** Stop and throw the blob away. Call on unmount / cancel. */
export function cancelRecording(): void {
  if (!recorder || recorder.state === "inactive") return;
  resolveStop = null;             // drop the blob
  chunks = [];
  recorder.stop();
}

export function isRecording(): boolean {
  return !!recorder && recorder.state === "recording";
}


import { useEffect, useRef } from "react";
import { defaultSetting } from "../../../components/theme/default";


const BEEP_VOLUME = 0.8;

export default function useBeep() {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // create the element exactly once, outside effect lifecycle
    if (audioRef.current === null && typeof window !== "undefined") {
        const audio = new Audio(`${defaultSetting.base_audio}beep.mp3`);
        audio.preload = "auto";
        audio.volume = BEEP_VOLUME;
        audio.load();
        audioRef.current = audio;
    }

    useEffect(() => {
        const audio = audioRef.current;
        return () => {
            // only clean up on real unmount, and don't nuke the buffer in dev
            if (audio) audio.pause();
        };
    }, []);

    const beep = () => {
        const audio = audioRef.current;
        if (!audio) return;

        const start = () => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = BEEP_VOLUME;
            audio.play().catch(err => console.error("beep failed", err));
        };

        if (audio.readyState >= 4) start();
        else {
            const onCanPlayThrough = () => {
                audio.removeEventListener("canplaythrough", onCanPlayThrough);
                start();
            };
            audio.addEventListener("canplaythrough", onCanPlayThrough);
        }
    };

    return { beep };
}