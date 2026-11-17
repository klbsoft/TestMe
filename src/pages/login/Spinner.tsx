// src/components/Spinner.tsx

import React, { useEffect } from "react";
import { commonStyles } from "../../components/theme/default";

const SPINNER_STYLES_ID = "app-spinner-styles";
function ensureSpinnerStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(SPINNER_STYLES_ID)) return;

  const style = document.createElement("style");
  style.id = SPINNER_STYLES_ID;
  style.textContent = `
    @keyframes app-spin {
      to { transform: rotate(360deg); }
    }

    @keyframes app-dot-pulse {
      0%, 100% { opacity: 0.25; transform: scale(0.75); }
      50%      { opacity: 1;    transform: scale(1);    }
    }

    .app-spinner {
      position: relative;
      display: inline-block;
      animation: app-spin 1.2s linear infinite;
    }

    .app-spinner__dot {
      position: absolute;
      border-radius: 50%;
      background-color: ${commonStyles.purple};
      animation: app-dot-pulse 1.2s ease-in-out infinite;
    }

    .app-spinner__dot--accent {
      background-color: ${commonStyles.clear_purple};
    }
  `;
  document.head.appendChild(style);
}

type SpinnerProps = {
  /** Outer diameter in px. Dots and radius scale with it. */
  size?: number;
  /** Number of dots around the circle. */
  dots?: number;
  /** Optional label under the spinner. */
  label?: string;
  /**
   * If true (default), the spinner is centered in its container via a
   * full-screen flex wrapper. Set false when embedding inline.
   */
  centered?: boolean;
};

export default function Spinner({
  size = 64,
  dots = 8,
  label,
  centered = true,
}: SpinnerProps): React.JSX.Element {
  useEffect(() => {
    ensureSpinnerStyles();
  }, []);

  const dotSize = Math.max(4, Math.round(size * 0.14));
  const radius = size / 2 - dotSize / 2;

  const spinner = (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
      }}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
    >
      <div
        className="app-spinner"
        style={{ width: size, height: size }}
      >
        {Array.from({ length: dots }).map((_, i) => {
          const angle = (360 / dots) * i;
          const rad = (angle * Math.PI) / 180;
          const cx = size / 2 + radius * Math.cos(rad);
          const cy = size / 2 + radius * Math.sin(rad);

          const delay = -(1.2 / dots) * i;
          const accent = i % 2 === 1;

          return (
            <span
              key={i}
              className={
                "app-spinner__dot" +
                (accent ? " app-spinner__dot--accent" : "")
              }
              style={{
                width: dotSize,
                height: dotSize,
                left: cx - dotSize / 2,
                top: cy - dotSize / 2,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>

      {label && (
        <span
          style={{
            color: commonStyles.purple,
            fontSize: commonStyles.button_fontSize,
            fontWeight: commonStyles.button_fontWeight,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );

  if (!centered) return spinner;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: commonStyles.white,
        zIndex: 999,
      }}
    >
      {spinner}
    </div>
  );
}