// src/pages/wall/Wall.tsx

import React, { useEffect, useRef, useState } from "react";
import { commonStyles, defaultSetting, getToken, setToken } from "../../components/theme/default";
import { startHeartbeat } from "./api"
import type { UserLogin } from "../../session/UserSession";
import StudentDashboard from "../student/StudentDashboard";

export default function Wall({
  credentials,
}: {
  credentials: UserLogin;
}): React.JSX.Element {
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [next,setNext] = useState(false); 
  

  const stopHeartbeatRef = useRef<(() => void) | null>(null);

  // ── submit: called once accessCode reaches 4 digits ────────────────
  const handleCredentials = async (auth: string) => {
    setError("");
    setSubmitting(true);

    try {

      const payload = {
          code: credentials.code,
          password: credentials.password,
          auth: auth,
        };
        console.log(payload); 
      const res = await fetch(`${defaultSetting.api_url}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      if (!text.startsWith("OK:")) {
        const reason = text.startsWith("FAIL:") ? text.slice(5) : text;
        setError(reason);
        setAccessCode("");
        return;
      }

      const token = text.slice(3);
      setToken(token);

      // Start the heartbeat with the freshly issued session token.
      stopHeartbeatRef.current = startHeartbeat(token, () => {
        // Session lost — clear the token and bounce back to the code screen.
        setToken("");
        stopHeartbeatRef.current?.();
        stopHeartbeatRef.current = null;
        setAccessCode("");
        setError("Session lost. Please enter your access code again.");
      });
      setNext(true); 
    } catch (e) {
      setError(`Network error: ${(e as Error).message}`);
      setAccessCode("");
    } finally {
      setSubmitting(false);
    }
  };

  // ── auto-submit when the 4th digit lands ──────────────────────────
  const onChange = (raw: string) => {
    const next = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    setAccessCode(next);
    setError("");

    if (next.length === 4 && !submitting) {
      // Fire once on the transition to length 4. `submitting` guards
      // against double-fire if the user pastes or the state updates
      // twice in quick succession.
      void handleCredentials(next);
    }
  };

  // ── cleanup heartbeat on unmount ──────────────────────────────────
  useEffect(() => {
    return () => {
      stopHeartbeatRef.current?.();
      stopHeartbeatRef.current = null;
    };
  }, []);
  if(getToken() !== "" && next === true){
    return <StudentDashboard/>
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "28px",
          borderRadius: "16px",
          background: commonStyles.purple,
          boxShadow: `0 8px 24px ${commonStyles.faded_purple}`,
          border: `1px solid ${commonStyles.clear_purple}`,
        }}
      >
        {/* Pet avatar bubble */}
        <div
          style={{
            alignSelf: "center",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            overflow: "hidden",
            background: commonStyles.white,
            border: `2px solid ${commonStyles.clear_purple}`,
            boxShadow: `0 4px 16px ${commonStyles.faded_purple}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "4px",
          }}
        >
          <img
            src={`${defaultSetting.base_bot}bot.svg`}
            alt="Pet"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>

        <label
          htmlFor="access-code"
          style={{
            fontSize: commonStyles.text_font_size,
            fontWeight: commonStyles.text_font_weight,
            color: commonStyles.white,
          }}
        >
          Access Code
        </label>

        <input
          id="access-code"
          type="text"
          value={accessCode}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter access code"
          maxLength={4}
          autoComplete="off"
          disabled={submitting}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px",
            borderRadius: "10px",
            border: `1px solid ${commonStyles.clear_purple}`,
            outline: "none",
            textAlign: "center",
            fontSize: commonStyles.button_fontSize,
            fontWeight: commonStyles.button_fontWeight,
            color: commonStyles.purple,
            background: commonStyles.white,
            opacity: submitting ? 0.6 : 1,
          }}
        />

        {submitting && (
          <p
            style={{
              margin: 0,
              color: commonStyles.white,
              fontSize: commonStyles.text_font_size,
              fontWeight: commonStyles.text_font_weight,
              textAlign: "center",
              opacity: 0.85,
            }}
          >
            Checking…
          </p>
        )}

        {error && (
          <p
            style={{
              margin: 0,
              color: commonStyles.white,
              fontSize: commonStyles.text_font_size,
              fontWeight: commonStyles.text_font_weight,
              textAlign: "center",
              backgroundColor: commonStyles.faded_purple,
              borderRadius: "10px",
              padding: "8px",
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}