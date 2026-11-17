// src/pages/login/Login.tsx

import { useEffect, useRef, useState } from "react";
import { commonStyles, defaultSetting, setToken } from "../../components/theme/default";
import StudentDashboard from "../student/StudentDashboard";
// import { startHeartbeat } from "./api";
import Wall from "../wall/Wall";
import type { UserLogin } from "../../session/UserSession";
import Spinner from "./Spinner";

function navigate(to: string) {
  const BASE = "/testme";
  const target = window.location.pathname.startsWith(BASE) ? `${BASE}${to}` : to;
  window.history.pushState({}, "", target);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function Login() {
  // ── site-availability gate ─────────────────────────────────────────
  // `siteReady` is false until /site/check returns "TRUE" at least once.
  // While false we poll every 10s. Once true we stop polling forever.
  const [siteReady, setSiteReady] = useState(false);

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [credentials, setCredentials] = useState<UserLogin | null>(null);

  // const stopHeartbeatRef = useRef<(() => void) | null>(null);

  const PASSWORD_MAX_LENGTH = 4;
  const CODE_MAX_LENGTH = 4;

  // ── 1) POLL /site/check UNTIL IT RETURNS TRUE ──────────────────────
  useEffect(() => {
    if (siteReady) return; // already on — never poll again

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const check = async () => {
      try {
        const res = await fetch(`${defaultSetting.api_url}/site/check`, {
          method: "GET",
        });
        const text = (await res.text()).trim();

        if (cancelled) return;

        if (text === "TRUE") {
          setSiteReady(true); // stops the loop via the `if (siteReady) return`
          return;
        }

        // Not on yet — schedule the next poll in 10s
        timer = setTimeout(check, 60_000);
      } catch {
        if (cancelled) return;
        // Network error: keep polling, don't surface it as a hard error
        timer = setTimeout(check, 60_000);
      }
    };

    check();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [siteReady]);

  // ── 2) LOGIN ──────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError("");

    const data: UserLogin = { code, password };

    try {
      // If you have a real login endpoint, call it here and only proceed
      // on success. For now, accept the credentials locally.
      //
      // const res = await fetch(`${defaultSetting.api_url}/login`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(data),
      // });
      // if (!res.ok) throw new Error("Invalid credentials");
      // const body = await res.json();
      // setToken(body.token);
      // setResult(body.name ?? "");

      setCredentials(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  };

  // ── 3) HEARTBEAT LIFECYCLE ────────────────────────────────────────
  // useEffect(() => {
  //   if (!credentials) return;

  //   // const token = credentials.code;
  //   // stopHeartbeatRef.current = startHeartbeat(token, () => {
  //     // setCredentials(null);
  //   //   setError("Connection lost. Please log in again.");
  //   // });

  //   return () => {
  //     // stopHeartbeatRef.current?.();
  //     // stopHeartbeatRef.current = null;
  //   };
  // }, [credentials]);

  const inputStyle: React.CSSProperties = {
    borderRadius: "15px",
    padding: "12px 16px",
    border: `2px solid ${commonStyles.purple}`,
    backgroundColor: commonStyles.white,
    color: commonStyles.purple,
    width: "100%",
    outline: "none",
    fontSize: commonStyles.button_fontSize,
    fontWeight: commonStyles.button_fontWeight,
    boxSizing: "border-box",
    textAlign: "center",
  };

  // ── RENDER ORDER (logical, in sequence) ───────────────────────────
  // 1. Not yet logged in AND site is OFF  → spinner + "waiting for site"
  // 2. Logged in                            → Wall
  // 3. Site is ON, not logged in            → login form
  if (!siteReady && credentials === null) {
    return <Spinner/>;
  }

  if (credentials !== null) {
    return <Wall credentials={credentials} />;
  }

  return (
    <div
      className="page-transition"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "40%",
          minWidth: "280px",
          maxWidth: "400px",
          backgroundColor: commonStyles.purple,
          borderRadius: "25px",
          padding: "30px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            backgroundColor: commonStyles.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <img
            src={`${defaultSetting.base_bot}bot.svg`}
            alt="TestMe"
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              objectFit: "contain",
            }}
          />
        </div>

        <p
          style={{
            color: commonStyles.white,
            textAlign: "center",
            fontSize: commonStyles.button_fontSize,
            fontWeight: commonStyles.button_fontWeight,
            marginBottom: "20px",
          }}
        >
          <label>
            Welcome to <strong>TestMe</strong>
          </label>
        </p>

        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            alignItems: "center",
          }}
        >
          <label style={{ color: commonStyles.white }}>Please enter your information</label>

          <div style={{ width: "100%" }}>
            <input
              type="text"
              maxLength={CODE_MAX_LENGTH}
              style={inputStyle}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="Student Code"
            />
          </div>

          <div style={{ width: "100%" }}>
            <input
              type="password"
              maxLength={PASSWORD_MAX_LENGTH}
              style={inputStyle}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="Password"
            />
          </div>

          {error && (
            <p
              style={{
                color: commonStyles.white,
                fontSize: commonStyles.button_fontSize,
                fontWeight: commonStyles.button_fontWeight,
                textAlign: "center",
                backgroundColor: commonStyles.faded_purple,
                borderRadius: "10px",
                padding: "8px",
                width: "100%",
              }}
            >
              {error}
            </p>
          )}
        </div>

        {code && password && (
          <button
            onClick={handleLogin}
            style={{
              backgroundColor: commonStyles.white,
              border: "none",
              width: "100%",
              borderRadius: "15px",
              padding: "12px",
              color: commonStyles.purple,
              marginTop: "20px",
              fontSize: commonStyles.button_fontSize,
              fontWeight: commonStyles.button_fontWeight,
              cursor: "pointer",
            }}
          >
            Enter
          </button>
        )}

        {/* Bottom link — switch to the other role */}
        <button
          onClick={() => navigate("/admin")}
          style={{
            background: "transparent",
            border: "none",
            color: commonStyles.white,
            marginTop: "20px",
            fontSize: commonStyles.button_fontSize,
            fontWeight: commonStyles.button_fontWeight,
            opacity: 0.8,
            cursor: "pointer",
            textDecoration: "underline",
            padding: 0,
          }}
        >
          I'm a teacher
        </button>
      </div>
    </div>
  );
}

export default Login;