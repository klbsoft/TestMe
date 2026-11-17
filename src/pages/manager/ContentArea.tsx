import { useState } from "react";
import { commonStyles } from "../../components/theme/default";
import Assignments from "./Schedule";
import Groups from "./Groups";
import Grades from "./grades/Grades";

export default function ContentArea() {
  const [activeSection, setActiveSection] = useState<string>("Assignments");

  const renderSection = () => {
    switch (activeSection) {
      case "Assignments":
        return <Assignments />;
      case "Grades":
        return <Grades />;
      case "Groups":
        return <Groups />;
      default:
        return <Assignments />;
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 120px)",
        background: commonStyles.white,
        padding: "30px",
      }}
    >
      {renderSection()}
    </div>
  );
}