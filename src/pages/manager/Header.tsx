import { commonStyles, defaultSetting } from "../../components/theme/default";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const { logout } = useAuth();

  return (
    <header
      style={{
        height: "70px",
        background: commonStyles.purple,
        color: commonStyles.white,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 30px",
      }}
    >
      <img 
        src={`${defaultSetting.base_bot}bot.svg`}
        alt="TestMe"
        style={{ 
          height: "50px", 
          width: "auto",
          display: "block",
        }} 
      />
      <button
        style={{
          fontSize: commonStyles.button_fontSize,
          fontWeight: commonStyles.button_fontWeight,
          backgroundColor: commonStyles.faded_purple,
          color: commonStyles.white,
          border: "none",
          borderRadius: "8px",
          padding: "8px 16px",
          cursor: "pointer",
          transition: "background 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = commonStyles.purple;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = commonStyles.faded_purple;
        }}
        onClick={() => {
          logout();
          window.location.reload();
        }}
      >
        Log out
      </button>
    </header>
  );
}