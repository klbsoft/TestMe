import { useState, useEffect } from "react";

export default function ScreenSizeTracker() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      document.title = `${window.innerWidth}x${window.innerHeight}`;
    };

    // Set initial title
    document.title = `${windowSize.width}x${windowSize.height}`;

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return null;
}