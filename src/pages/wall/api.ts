// src/pages/login/api.ts

import { defaultSetting, setToken } from "../../components/theme/default";

const HEARTBEAT_OPEN_TIMEOUT_MS = 10_000;
const HEARTBEAT_MAX_ATTEMPTS = 10;
const HEARTBEAT_RETRY_DELAY_MS = 1000;

const log = (...args: unknown[]) => console.log("[heartbeat]", ...args);
const warn = (...args: unknown[]) => console.warn("[heartbeat]", ...args);

export function startHeartbeat(
  token: string,
  onLost: () => void,
): () => void {
  const base = defaultSetting.api_url.replace(/^http/, "ws");
  const url = `${base}/heartbeat?token=${encodeURIComponent(token)}`;

  let stopped = false;
  let activeSocket: WebSocket | null = null;
  let activeOpenTimer: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;

  const cleanupSocket = () => {
    if (activeOpenTimer) {
      clearTimeout(activeOpenTimer);
      activeOpenTimer = null;
    }
    if (activeSocket) {
      activeSocket.onopen = null;
      activeSocket.onmessage = null;
      activeSocket.onerror = null;
      activeSocket.onclose = null;
      try { activeSocket.close(); } catch { /* ignore */ }
      activeSocket = null;
    }
  };

  const cleanupRetry = () => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  };

  const attemptConnect = () => {
    if (stopped) return;
    attempt += 1;
    log(`attempt ${attempt}/${HEARTBEAT_MAX_ATTEMPTS} connecting…`);

    const connectedAt = Date.now();
    let openedAt: number | null = null;
    let framesReceived = 0;

    const socket = new WebSocket(url);
    activeSocket = socket;

    // open timeout
    activeOpenTimer = setTimeout(() => {
      if (stopped) return;
      warn(`attempt ${attempt} did not open in ${HEARTBEAT_OPEN_TIMEOUT_MS} ms`);
      cleanupSocket();
      scheduleRetry();
    }, HEARTBEAT_OPEN_TIMEOUT_MS);

    socket.onopen = () => {
      openedAt = Date.now();
      if (activeOpenTimer) {
        clearTimeout(activeOpenTimer);
        activeOpenTimer = null;
      }
      // ✅ Successful open: reset the consecutive-failure counter so that
      // future drops start counting from zero again.
      attempt = 0;
      // log(`attempt connected (${openedAt - connectedAt} ms)`);
    };

    socket.onmessage = (event) => {
      framesReceived += 1;
      const data = typeof event.data === "string" ? event.data : "<binary>";
      // log(`← frame #${framesReceived} = ${data.slice(0, 80)}`);
    };

    socket.onerror = () => {
      // onclose always follows; handled there
    };

    socket.onclose = (event) => {
      if (stopped) return;
      const lifetime = openedAt ? Date.now() - openedAt : 0;
      // log(
      //   `✖ closed (code=${event.code}, wasClean=${event.wasClean}, lived=${lifetime} ms)`
      // );
      setToken("");
      window.location.replace("/testme/student");
      cleanupSocket();
      scheduleRetry();
    };
  };

  const scheduleRetry = () => {
    if (stopped) return;
    if (attempt >= HEARTBEAT_MAX_ATTEMPTS) {
      warn(`giving up after ${attempt} consecutive failed attempt(s)`);
      onLost();
      return;
    }
    // log(`retrying in ${HEARTBEAT_RETRY_DELAY_MS} ms…`);
    cleanupRetry();
    retryTimer = setTimeout(() => {
      retryTimer = null;
      if (stopped) return;
      attemptConnect();
    }, HEARTBEAT_RETRY_DELAY_MS);
  };

  attemptConnect();

  return () => {
    stopped = true;
    cleanupRetry();
    cleanupSocket();
  };
}