import { useState, useEffect } from "react";
import "../../animation.css"
import Image from "./Image";
import Avatar from "./Avatar";
import ActionBtn from "./ActionBtn";

export default function DescribeTheImage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowWidth > 800;

  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: isDesktop ? "row" : "column",
      alignItems: "center",
      justifyContent: "center",
      overflowY: "auto",
      padding: "20px",
      boxSizing: "border-box",
      gap: isDesktop ? "40px" : "5px",    }} // default 40px
>
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
        <ActionBtn/>
      </div>

      {/* Right side - Image */}
      <div style={{
        width: isDesktop ? "auto" : "100%",
        order: isDesktop ? 2 : 1,
        flexShrink: 1,
        minWidth: 0,
      }}>
        <Image windowHeight={windowHeight} />
      </div>
    </div>
  );
}