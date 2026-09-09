import { useState } from "react";
import { commonStyles } from "../../components/theme/default";
import Header from "./Header";
import NavigationBar from "./NavigationBar";
import Assignments from "./Schedule";
import Grades from "./Grades";
import Groups from "./Groups";
import Schedule from "./Schedule";
import Create from "./Create";

export default function Management() {
  const [activeSection, setActiveSection] = useState<string>("Create");

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
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <Header />
      <NavigationBar onSectionChange={setActiveSection} />
      <div
        style={{
          minHeight: "calc(100vh - 120px)",
          background: commonStyles.white,
          padding: "30px",
        }}
      >
        {renderSection()}
      </div>
    </div>
  );
}