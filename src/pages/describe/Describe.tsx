import { useState } from "react";
import "../../animation.css"
import Image from "./Image";
import Avatar from "./Avatar";
import ActionBtn from "./ActionBtn";

export default function DescribeTheImage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  
  // Placeholder image - replace with actual assignment image
  const sampleImage = "/path/to/sample/image.jpg";

  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      overflowY: "auto",
      padding: "20px",
      boxSizing: "border-box",
    }}>
      <Image/>
      <Avatar/>
      <ActionBtn/>
    </div>
  );
}