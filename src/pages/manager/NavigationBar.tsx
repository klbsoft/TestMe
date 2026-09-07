import { useState } from "react";
import { commonStyles, defaultSetting } from "../../components/theme/default";

type SubMenuItem = {
  label: string;
  icon: string;
  on_hover: string;
  onClick?: () => void;
};

type MenuItem = {
  icon: string;
  on_hover: string;
  label: string;
  subItems?: SubMenuItem[];
};

interface NavigationBarProps {
  onSectionChange: (section: string) => void;
}

export default function NavigationBar({ onSectionChange }: NavigationBarProps) {
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [hoveredMain, setHoveredMain] = useState<number | null>(null);
  const [hoveredSub, setHoveredSub] = useState<string | null>(null);

  const menuItems: MenuItem[] = [
    {
      icon: `${defaultSetting.base_icons}x_target_b.png`,
      on_hover: `${defaultSetting.base_icons}white_target_b.png`,
      label: "Assignments",
      subItems: [
        { 
          label: "Create",
          icon: `${defaultSetting.base_icons}x_create_b.png`,
          on_hover: `${defaultSetting.base_icons}white_create_b.png`,
        },
        { 
          label: "Grade",
          icon: `${defaultSetting.base_icons}x_grade_b.png`,
          on_hover: `${defaultSetting.base_icons}white_grade_b.png`,
        },
        { 
          label: "Groups",
          icon: `${defaultSetting.base_icons}x_groups_b.png`,
          on_hover: `${defaultSetting.base_icons}white_groups_b.png`,
        },
      ],
    },
  ];

  const handleMainButtonClick = (index: number) => {
    setActiveMenu(activeMenu === index ? null : index);
  };

  const handleSubItemClick = (mainLabel: string, subLabel: string) => {
    console.log(`Navigating to: ${mainLabel} > ${subLabel}`);
    onSectionChange(subLabel);
    setActiveMenu(null);
  };

  return (
    <div style={{ background: commonStyles.white }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          padding: "0 10px",
          borderBottom: `2px solid ${commonStyles.faded_purple}`,
        }}
      >
        {menuItems.map((item, index) => {
          const isMainActive = activeMenu === index;

          return (
            <div
              key={index}
              style={{
                position: "relative",
              }}
            >
              <button
                onClick={() => handleMainButtonClick(index)}
                onMouseEnter={(e) => {
                  setHoveredMain(index);
                  if (!isMainActive) {
                    e.currentTarget.style.background = "rgba(231, 208, 250, 0.23)";                  }
                }}
                onMouseLeave={(e) => {
                  setHoveredMain(null);
                  if (!isMainActive) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "15px 16px",
                  border: "none",
                  background: isMainActive ? commonStyles.purple : "transparent",
                  color: isMainActive ? commonStyles.white : commonStyles.purple,
                  cursor: "pointer",
                  fontSize: commonStyles.button_fontSize,
                  fontWeight: commonStyles.button_fontWeight,
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                  borderBottom: isMainActive
                    ? `3px solid ${commonStyles.purple}`
                    : "3px solid transparent",
                }}
              >
                <img 
                  src={isMainActive ? item.on_hover : item.icon}
                  alt={item.label}
                  style={{  
                    width: "22px",
                    height: "22px",
                  }}
                />
                <span>{item.label}</span>
                {item.subItems && (
                  <span
                    style={{
                      fontSize: "10px",
                      transform: isMainActive ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                    }}
                  >
                    ▼
                  </span>
                )}
              </button>

              {isMainActive && item.subItems && (
                <>
                  <div
                    onClick={() => setActiveMenu(null)}
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 9998,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      background: commonStyles.white,
                      border: `1px solid ${commonStyles.faded_purple}`,
                      borderRadius: "0 0 8px 8px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      minWidth: "280px",
                      zIndex: 9999,
                    }}
                  >
                    {item.subItems.map((subItem, subIndex) => {
                      const isSubHovered = hoveredSub === subItem.label;
                      
                      return (
                        <button
                          key={subIndex}
                          onClick={() => handleSubItemClick(item.label, subItem.label)}
                          onMouseEnter={(e) => {
                            setHoveredSub(subItem.label);
                            e.currentTarget.style.background = commonStyles.faded_purple;
                          }}
                          onMouseLeave={(e) => {
                            setHoveredSub(null);
                            e.currentTarget.style.background = "transparent";
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            width: "100%",
                            padding: "12px 20px",
                            border: "none",
                            background: "transparent",
                            color: commonStyles.purple,
                            cursor: "pointer",
                            textAlign: "left",
                            fontSize: commonStyles.button_fontSize,
                            fontWeight: commonStyles.button_fontWeight,
                            borderBottom:
                              subIndex < item.subItems!.length - 1
                                ? `1px solid ${commonStyles.faded_purple}`
                                : "none",
                            borderRadius:
                              subIndex === 0
                                ? "0"
                                : subIndex === item.subItems!.length - 1
                                ? "0 0 8px 8px"
                                : "0",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <img 
                            src={subItem.icon}
                            alt={subItem.label}
                            style={{
                              width: "18px",
                              height: "18px",
                            }}
                          />
                          <span>{subItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}