import { useState } from "react";
import { commonStyles, defaultSetting } from "../../components/theme/default";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState(false);

  // const { logout } = useAuth();

  const menuItems = [
    // {
    //   key: "settings",
    //   label: "Settings",
    //   icon: `${defaultSetting.base_icons}x_settings.png`,
    //   onHoverIcon: `${defaultSetting.base_icons}white_settings.png`,
    //   onClick: () => {
    //     console.log("open settings");
    //     setOpen(false);
    //   },
    // },
    {
      key: "logout",
      label: "Log out",
      icon: `${defaultSetting.base_icons}x_logout.png`,
      onHoverIcon: `${defaultSetting.base_icons}white_logout.png`,
      onClick: () => {
        // logout();
        setOpen(false);
        window.location.reload();
      },
    },
  ];

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
      {/* LEFT — logo */}
      <img
        src={`${defaultSetting.base_bot}bot.svg`}
        alt="TestMe"
        style={{
          height: "50px",
          width: "auto",
          display: "block",
        }}
      />

      {/* RIGHT — settings button + popup */}
      <div style={{ position: "relative" }}>
        {/* The purple circle — now the actual button */}
        <button
          onClick={() => setOpen((v) => !v)}
          onMouseEnter={() => setHoveredButton(true)}
          onMouseLeave={() => setHoveredButton(false)}
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            border: "none",
            padding: 0,
            backgroundColor: hoveredButton || open
              ? commonStyles.white
              : commonStyles.faded_purple,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background-color 0.2s ease",
            boxSizing: "border-box",
          }}
        >
          <img
            src={
              hoveredButton || open
                ? `${defaultSetting.base_icons}x_settings.png`
                : `${defaultSetting.base_icons}white_settings.png`
            }
            alt="menu"
            style={{
              height: "28px",
              width: "28px",
              objectFit: "contain",
              display: "block",
            }}
          />
        </button>

        {/* Click-away backdrop */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
            }}
          />
        )}

        {/* Popup menu */}
        {open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              right: 0,
              minWidth: "200px",
              backgroundColor: commonStyles.white,
              border: `2px solid ${commonStyles.faded_purple}`,
              borderRadius: "14px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              overflow: "hidden",
              zIndex: 9999,
            }}
          >
            {menuItems.map((item, index) => {
              const isHovered = hoveredItem === item.key;
              return (
                <button
                  key={item.key}
                  onClick={item.onClick}
                  onMouseEnter={() => setHoveredItem(item.key)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 16px",
                    border: "none",
                    background: isHovered ? commonStyles.purple : "transparent",
                    color: isHovered ? commonStyles.white : commonStyles.purple,
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: commonStyles.button_fontSize,
                    fontWeight: commonStyles.button_fontWeight,
                    transition: "background-color 0.15s ease, color 0.15s ease",
                    borderBottom:
                      index < menuItems.length - 1
                        ? `1px solid ${commonStyles.faded_purple}`
                        : "none",
                  }}
                >
                  {/* Icon on the LEFT */}
                  <img
                    src={isHovered ? item.onHoverIcon : item.icon}
                    alt=""
                    style={{
                      width: "20px",
                      height: "20px",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}