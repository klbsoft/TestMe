import { useView } from "../../context/ViewContext";
import { commonStyles, defaultSetting } from "../theme/default";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import "../../animation.css"

function Menu({ onSelected }: { onSelected: () => void }) {
  const { setCurrentView } = useView();
  const { logout } = useAuth();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowWidth > 450;

  const menuItems = [
    { label: "Exit", view: null }
  ];

  return (
    <div 
      className="page-transition"
      style={{ 
        width: "100%",
        height: "99%",
        boxSizing: "border-box",
        backgroundColor: commonStyles.purple,
        padding: "20px",
        position: "relative",
      }}
    >
      <div style={{
        width: isDesktop ? "400px" : "100%",
        maxWidth: "400px",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: commonStyles.button_fontSize,
          fontWeight: commonStyles.button_fontWeight,
          color: commonStyles.white,
          padding: "20px",
          textAlign: "center",
          opacity: 0.8,
          lineHeight: "1.5",
        }}> 
          More tools coming soon. <br/>
          For now, only the Describe The Image is available.
        </span>
        
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={() => {
              if (item.view) {
                setCurrentView(item.view);
              } else {
                logout();
                window.location.reload();
              }
              onSelected(); 
            }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontSize: commonStyles.button_fontSize,
              fontWeight: commonStyles.button_fontWeight,
              color: "white",
              padding: "20px",
              cursor: "pointer",
              backgroundColor: commonStyles.purple,
              border: "1px solid white",
            }}
          >
            {item.label}
          </div>
        ))}
      </div>

      {isDesktop && (
        <img 
          src={`${defaultSetting.base_icons}white_app.png`}            
          alt="TestMe illustration"
          style={{
            position: "absolute",
            left: "calc(400px + 40px)",
            right: "20px",
            top: "50%",
            transform: "translateY(-50%)",
            height: "60%",
            width: "calc(100% - 440px)",
            objectFit: "contain",
          }}
        />
      )}
    </div>
  );
}

export default Menu;