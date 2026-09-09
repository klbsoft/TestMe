import { useState } from "react";
import { commonStyles, defaultSetting } from "../../components/theme/default";

type AssignmentType = "speaking" | "listening" | "writing";

const assignmentIcons: Record<AssignmentType, { normal: string; white: string }> = {
  speaking: {
    normal: `${defaultSetting.base_icons}x_speaking.png`,
    white: `${defaultSetting.base_icons}white_speaking.png`,
  },
  listening: {
    normal: `${defaultSetting.base_icons}x_listening.png`,
    white: `${defaultSetting.base_icons}white_listening.png`,
  },
  writing: {
    normal: `${defaultSetting.base_icons}x_writing.png`,
    white: `${defaultSetting.base_icons}white_writing.png`,
  },
};

export default function Create() {
  const [selectedType, setSelectedType] = useState<AssignmentType | "">("");
  const [showDropdown, setShowDropdown] = useState(false);

  const assignmentTypes: AssignmentType[] = ["speaking", "listening", "writing"];
  const availableTypes = assignmentTypes.filter(type => type !== selectedType);

  return (
    <div>
      <h2 style={{ 
        color: commonStyles.purple, 
        fontSize: commonStyles.button_fontSize,
        fontWeight: commonStyles.button_fontWeight,
        marginBottom: "20px",
      }}>
        <strong>Create</strong>
      </h2>

      <div style={{
        display: "flex",
        gap: "20px",
        alignItems: "flex-start",
      }}>
        {/* Dropdown section */}
        <div style={{
          width: "200px",
          position: "relative",
          flexShrink: 0,
        }}>
          <div
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              width: "100%",
              borderRadius: "15px",
              padding: "12px 16px",
              border: `2px solid ${commonStyles.faded_purple}`,
              backgroundColor: commonStyles.white,
              color: selectedType ? commonStyles.purple : commonStyles.faded_purple,
              fontSize: commonStyles.button_fontSize,
              fontWeight: commonStyles.button_fontWeight,
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxSizing: "border-box",
            }}
          >
            <span>
              {selectedType 
                ? selectedType.charAt(0).toUpperCase() + selectedType.slice(1) 
                : "Assignment Type"}
            </span>
            <span style={{ 
              color: commonStyles.purple,
              transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}>
              ▼
            </span>
          </div>

          {showDropdown && (
            <>
              <div
                onClick={() => setShowDropdown(false)}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9998,
                }}
              />
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: commonStyles.white,
                border: `2px solid ${commonStyles.faded_purple}`,
                borderRadius: "0 0 15px 15px",
                marginTop: "4px",
                zIndex: 9999,
                overflow: "hidden",
              }}>
                {availableTypes.map((type, index) => (
                  <div
                    key={type}
                    onClick={() => {
                      setSelectedType(type);
                      setShowDropdown(false);
                    }}
                    style={{
                      padding: "12px 16px",
                      color: commonStyles.purple,
                      fontSize: commonStyles.button_fontSize,
                      fontWeight: commonStyles.button_fontWeight,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      borderBottom: index < availableTypes.length - 1 
                        ? `1px solid ${commonStyles.faded_purple}` 
                        : "none",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(231, 208, 250, 0.23)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <img 
                      src={assignmentIcons[type].normal}
                      alt={type}
                      style={{
                        width: "18px",
                        height: "18px",
                      }}
                    />
                    <span>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content section */}
        <div style={{
          flex: 1,
          minWidth: 0,
        }}>
          {selectedType && (
            <p style={{
              color: commonStyles.purple,
              fontSize: commonStyles.button_fontSize,
              fontWeight: commonStyles.button_fontWeight,
            }}>
              {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} assignment coming soon
            </p>
          )}
        </div>
      </div>
    </div>
  );
}