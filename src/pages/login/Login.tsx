import { useState } from "react";
import { commonStyles, defaultSetting } from "../../components/theme/default";
import { useAuth } from "../../context/AuthContext";

function Login() {
  const { login } = useAuth();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [group, setGroup] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!code || !password || !group) {
      setError("All fields are required");
      return;
    }

    console.log("Login:", { code, password, group });
    
    // Mock login for now
    login();
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

  const labelStyle: React.CSSProperties = {
    fontSize: commonStyles.button_fontSize,
    fontWeight: commonStyles.button_fontWeight,
    color: commonStyles.white,
    marginBottom: "6px",
    opacity: 0.8,
    textAlign: "center",
  };

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
      {/* Centered card */}
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
        {/* Logo / App Name */}
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
          <label style={{color:commonStyles.white}}>Please enter your information</label>
          {/* Code */}
          <div style={{ width: "100%" }}>
            {/* <div style={labelStyle}>Code</div> */}
            <input
              type="text"
              maxLength={2}
              style={inputStyle}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              placeholder="Code"
            />
          </div>

          {/* Password */}
          <div style={{ width: "100%" }}>
            {/* <div style={labelStyle}>Password</div> */}
            <input
              type="password"
              maxLength={10}
              style={inputStyle}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Password"
            />
          </div>

          {/* Group */}
          {/* <div style={{ width: "100%" }}>
            <select
              style={inputStyle}
              value={group}
              onChange={(e) => {
                setGroup(e.target.value);
                setError("");
              }}
            >
              <option value="">Group</option>
              <option value="Group 1">Group 1</option>
              <option value="Group 4">Group 4</option>
              <option value="Group 7">Group 7</option>
            </select>
          </div> */}

          {/* Error Message */}
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
      </div>
    </div>
  );
}

export default Login;