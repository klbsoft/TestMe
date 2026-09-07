import Container from "./components/container/Container";
import { ViewProvider } from "./context/ViewContext";
import "./animation.css"
import { commonStyles } from "./components/theme/default";

export default function App() {
  return (
    <div 
      className="page-transition"
      style={{ 
        width: "100%",
        height: "98dvh",
        margin: "0",
        padding: "0",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        overflow: "hidden",
        boxSizing: "border-box",
        border: `solid 2px ${commonStyles.purple}`,
        borderRadius: "22px",
      }}
    >
      <ViewProvider>
        <Container />
      </ViewProvider>
    </div>
  );
}