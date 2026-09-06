import { useState, useEffect } from "react";
import "../../animation.css"
import Image from "./Image";
import Avatar from "./Avatar";
import ActionBtn from "./ActionBtn";

export default function DescribeTheImage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowWidth > 400;

  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: isDesktop ? "row" : "column",
      alignItems: isDesktop ? "flex-start" : "center",
      overflowY: "auto",
      padding: "20px",
      boxSizing: "border-box",
      gap: "20px",
    }}>
      {/* Left side - Avatar and ActionBtn */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: isDesktop ? "40%" : "100%",
        order: isDesktop ? 1 : 2,
      }}>
        <Avatar/>
        <ActionBtn/>
      </div>

      {/* Right side - Image */}
      <div style={{
        width: isDesktop ? "60%" : "100%",
        order: isDesktop ? 2 : 1,
      }}>
        <Image/>
      </div>
    </div>
  );
}