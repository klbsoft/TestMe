import { useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { commonStyles } from "../theme/default";

// 0 = info, 1 = success, 2 = error
export type ToastKind = 0 | 1 | 2;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function ensureContainer() {
  if (container) return;
  container = document.createElement("div");
  container.id = "toast-root";
  document.body.appendChild(container);
  root = createRoot(container);
}

function ToastView({
  message,
  kind,
  onClose,
}: {
  message: string;
  kind: ToastKind;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const bg =
    kind === 1
      ? commonStyles.purple
      : kind === 2
      ? "#d32f2f"
      : commonStyles.clear_purple;

  const icon = kind === 1 ? "✓" : kind === 2 ? "✕" : "ℹ";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.9})`,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease, transform 0.2s ease",
        backgroundColor: bg,
        color: commonStyles.white,
        padding: "20px 32px",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        fontSize: commonStyles.button_fontSize,
        fontWeight: commonStyles.button_fontWeight,
        display: "flex",
        alignItems: "center",
        gap: 12,
        zIndex: 10000,
        cursor: "pointer",
        maxWidth: "80vw",
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: "1.4em", lineHeight: 1 }}>{icon}</span>
      <span>{message}</span>
    </div>
  );
}

function render(message: string, kind: ToastKind, duration: number) {
  ensureContainer();
  if (!root) return;

  const cleanup = () => {
    if (root) root.render(null);
  };

  root.render(<ToastView message={message} kind={kind} onClose={cleanup} />);
  window.setTimeout(cleanup, duration);
}

/**
 * Manual toast — display `text` exactly as given.
 * kind: 0 = info, 1 = success, 2 = error
 */
export function Toast(text: string, kind: ToastKind = 0): void {
  render(text, kind, 3000);
}

/**
 * Parse a server response of the form `OK:...` / `FAIL:...`.
 * - `OK:` prefix → success toast, strips the prefix
 * - `FAIL:` prefix → error toast, strips the prefix
 * - anything else → error toast, shows the raw text
 */
export function showToast(result: string): void {
  if (result.startsWith("OK:")) {
    render(result.slice(3), 1, 3000);
  } else if (result.startsWith("FAIL:")) {
    render(result.slice(5), 2, 3000);
  } else {
    render(result, 2, 3000);
  }
}

/**
 * Same as `Toast`, but with a custom duration in milliseconds.
 */
export function ShowPreciseToast(
  text: string,
  kind: ToastKind = 0,
  durationMs: number = 3000
): void {
  render(text, kind, durationMs);
}