import { useState, useEffect } from "react";
import Cat from "./Cat";
import Management from "./pages/manager/Manager";
import StudentDoor from "./StudentDoor";
import { commonStyles, defaultSetting } from "./components/theme/default";

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Render based on the current path
  const renderPage = () => {
    if (path === "/testme/admin") {
      return <Management />;
    }
    if (path === "/testme/student") {
      return <StudentDoor />;
    }
    // Default → student
    return <RoleChooser />;
  };

  // console.log(path); 
  return (
    <div>
      {renderPage()}
      <Cat />
    </div>
  );
}




function navigate(to: string) {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}


export function RoleChooser() {
  return (
    <div
      className="page-transition"
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: commonStyles.white,
      }}
    >
      {/* Centered card — same shape as Login */}
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
        {/* Logo / Pet icon — same as Login */}
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
          <label style={{ color: commonStyles.white }}>Please choose your role</label>

          <button
            onClick={() => navigate("/testme/admin")}
            style={{
              backgroundColor: commonStyles.white,
              border: "none",
              width: "100%",
              borderRadius: "15px",
              padding: "12px",
              color: commonStyles.purple,
              fontSize: commonStyles.button_fontSize,
              fontWeight: commonStyles.button_fontWeight,
              cursor: "pointer",
            }}
          >
            Teacher
          </button>

          <button
            onClick={() => navigate("/testme/student")}
            style={{
              backgroundColor: commonStyles.white,
              border: "none",
              width: "100%",
              borderRadius: "15px",
              padding: "12px",
              color: commonStyles.purple,
              fontSize: commonStyles.button_fontSize,
              fontWeight: commonStyles.button_fontWeight,
              cursor: "pointer",
            }}
          >
            Student
          </button>
        </div>
      </div>
    </div>
  );
}