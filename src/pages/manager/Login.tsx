import { useState } from "react";
import { commonStyles, defaultSetting } from "../../components/theme/default";
import { hash512 } from "../../security/encryptor";

const BASE = "/testme";
function navigate(to: string) {
  const target = window.location.pathname.startsWith(BASE) ? `${BASE}${to}` : to;
  window.history.pushState({}, "", target);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

type Props = { onLogin: (token: string) => void };

export default function AdminLogin({ onLogin }: Props) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const PASSWORD_MAX_LENGTH = 255;
  const CODE_MAX_LENGTH = 255;

  const handleLogin = async () => {
    if (!code || !password) {
      setError("All fields are required");
      return;
    }

    const url = `${defaultSetting.api_url}/logina`;
    const hash_password = await hash512(password);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: code, password: hash_password }),
      });

      const text = await response.text();

      if (text.startsWith("OK:")) {
        const userCode = text.slice(3);
        console.log("Login success for:", userCode);
        onLogin(userCode);
        return;
      } else {
        const reason = text.startsWith("FAIL:") ? text.slice(5) : text;
        setError(reason);
      }
    } catch (err) {
      setError("Network error: " + (err as Error).message);
    }
  };

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

  return (
    <div
      className="page-transition"
      style={{
        width: "100%",
        minHeight: "100vh",
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
          <label>Welcome to <strong>TestMe</strong></label>
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
                setCode(e.target.value);
                setError("");
              }}
              placeholder="Teacher Name"
            />
          </div>

          <div style={{ width: "100%" }}>
            <input
              type="password"
              maxLength={PASSWORD_MAX_LENGTH}
              style={inputStyle}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
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

        {/* Bottom link — switch to student */}
        <button
          onClick={() => navigate("/student")}
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
          I'm a student
        </button>
      </div>
    </div>
  );
}