import { useState } from "react";
import { clearToken, commonStyles, defaultSetting, getToken, setToken } from "../../components/theme/default";
import Header from "./Header";
import NavigationBar from "./NavigationBar";
// import Assignments from "./Schedule";
import Grades from "./grades/Grades";
import Groups from "./Groups";
import Schedule from "./Schedule";

import GlobalView from "./GlobalView";
import Create from "./create/Create";
 import { useEffect } from "react";
import AdminLogin from "./Login";
 

// const TOKEN_KEY = "testme_token";

export default function Management() {
  const [apiToken, setApiToken] = useState("");
  const [checking, setChecking] = useState(true);

  // On first load: read localStorage, verify token, decide
  useEffect(() => {
    const stored = getToken()// localStorage.getItem(TOKEN_KEY);

    if (!stored) {
      setChecking(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${defaultSetting.api_url}/session/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: stored }),
        });

        const text = await res.text();

        if (text.startsWith("OK:")) {
          const newToken = text.slice(3);
          // localStorage.setItem(TOKEN_KEY, newToken); // rotate
          setToken(newToken);
          setApiToken(newToken);
          return;
        } else {
          clearToken();
          // EXPIRED / NOT_FOUND / ERROR
          // localStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        // localStorage.removeItem(TOKEN_KEY);
        clearToken();
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  // login success → store + set
  const handleLogin = (token: string) => {
    // localStorage.setItem(TOKEN_KEY, token);
    setToken(token);
    setApiToken(token);
  };

  // logout / forced invalidation → clear both
  const handleLogout = () => {
    // localStorage.removeItem(TOKEN_KEY);
    clearToken();
    setApiToken("");
  };

  if (checking) {
    return <p>Loading…</p>;
  }

  if (!apiToken) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <ManagmentDoor />;
}


function ManagmentDoor() {
  const [activeSection, setActiveSection] = useState<string>("");

  const renderSection = () => {
    switch (activeSection) {
      case "Schedule":
        return <Schedule />;
      case "Create":
        return <Create />;
      case "Grade":
        return <Grades />;
      case "Groups":
        return <Groups />;
      case "All Groups":
        return <GlobalView/>
    }
  };

  return (
    <div style={{
       fontFamily: "Arial, sans-serif",
  height: "100dvh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",


    }}>
      <Header />
      <NavigationBar onSectionChange={setActiveSection} />
      <div
        style={{
     flex: 1,
    minHeight: 0,
    background: commonStyles.white,
    padding: "30px",
    boxSizing: "border-box",
    overflowY: "auto", 
        }}
      >
        {renderSection()}
      </div>
    </div>
  );
}