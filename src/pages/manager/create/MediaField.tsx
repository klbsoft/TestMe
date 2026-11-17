import { useRef, useState } from "react";
import { commonStyles } from "../../../components/theme/default";
import { btnStyle, fileStyle, labelStyle, tabStyle, thumbStyle } from "./styles";

type Props = {
  label: string;
  accept: string;
  file?: File;
  path: string;
  previewUrl?: string;
  isImage: boolean;
  onChange: (f: File | undefined, name: string, preview?: string) => void;
};

export default function MediaField({
  label,
  accept,
  file,
  path,
  previewUrl,
  isImage,
  onChange,
}: Props) {
  const [mode, setMode] = useState<"upload" | "record">("upload");
  const [recording, setRecording] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    setRecError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      mediaRecorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        stopStream();
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const f = new File([blob], `recording-${Date.now()}.webm`, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        onChange(f, f.name, url);
        setRecording(false);
      };
      rec.start();
      setRecording(true);
    } catch {
      setRecError("Microphone access denied or unavailable.");
      setRecording(false);
    }
  };

  const stopRecording = () => mediaRecorderRef.current?.stop();

  return (
    <div>
      <label style={labelStyle}>{label}</label>

      {!isImage && (
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <div style={tabStyle(mode === "upload")} onClick={() => setMode("upload")}>Upload</div>
          <div style={tabStyle(mode === "record")} onClick={() => setMode("record")}>Record</div>
        </div>
      )}

      {(isImage || mode === "upload") && (
        <input
          type="file"
          accept={accept}
          style={fileStyle}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return onChange(undefined, "");
            const url = URL.createObjectURL(f);
            onChange(f, f.name, url);
          }}
        />
      )}

      {!isImage && mode === "record" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {!recording ? (
            <button type="button" style={btnStyle} onClick={startRecording}>
              ● Start recording
            </button>
          ) : (
            <button
              type="button"
              style={{ ...btnStyle, background: commonStyles.purple, color: commonStyles.white }}
              onClick={stopRecording}
            >
              ■ Stop
            </button>
          )}
          {recording && <span style={{ fontSize: "0.8em", color: commonStyles.purple }}>Recording…</span>}
          {recError && <span style={{ fontSize: "0.8em", color: commonStyles.purple }}>{recError}</span>}
        </div>
      )}

      {(previewUrl || path) && (
        <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center" }}>
          {isImage ? (
            <img src={previewUrl ?? path} alt="preview" style={thumbStyle} />
          ) : (
            <audio controls src={previewUrl ?? path} style={{ width: "100%", maxWidth: 320 }} />
          )}
        </div>
      )}

      {file && (
        <div style={{ fontSize: "0.75em", color: commonStyles.purple, opacity: 0.7, marginTop: 4 }}>
          📎 {file.name}
        </div>
      )}
    </div>
  );
}