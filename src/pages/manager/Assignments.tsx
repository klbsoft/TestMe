import { useState } from "react";
import { commonStyles } from "../../components/theme/default";
import Calendar from "./Calendar";

export default function Assignments() {
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const groups = ["Group A", "Group B", "Group C"];
  const availableGroups = groups.filter(group => group !== selectedGroup);

  return (
    <div>
      <h2 style={{ 
        color: commonStyles.purple, 
        fontSize: commonStyles.button_fontSize,
        fontWeight: commonStyles.button_fontWeight,
        marginBottom: "20px",
      }}>
        <strong>Assignments</strong>
      </h2>

      <div style={{
        width: "100%",
        maxWidth: "400px",
        marginBottom: "20px",
        position: "relative",
      }}>
        {/* Custom dropdown trigger */}
        <div
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            width: "100%",
            borderRadius: "15px",
            padding: "12px 16px",
            border: `2px solid ${commonStyles.faded_purple}`,
            backgroundColor: commonStyles.white,
            color: selectedGroup ? commonStyles.purple : commonStyles.faded_purple,
            fontSize: commonStyles.button_fontSize,
            fontWeight: commonStyles.button_fontWeight,
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxSizing: "border-box",
          }}
        >
          <span>{selectedGroup || "Groups"}</span>
          <span style={{ 
            color: commonStyles.purple,
            transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}>
            ▼
          </span>
        </div>

        {/* Dropdown options */}
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
              {availableGroups.map((group, index) => (
                <div
                  key={group}
                  onClick={() => {
                    setSelectedGroup(group);
                    setShowDropdown(false);
                  }}
                  style={{
                    padding: "12px 16px",
                    color: commonStyles.purple,
                    fontSize: commonStyles.button_fontSize,
                    fontWeight: commonStyles.button_fontWeight,
                    cursor: "pointer",
                    borderBottom: index < availableGroups.length - 1 
                      ? `1px solid ${commonStyles.faded_purple}` 
                      : "none",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = commonStyles.faded_purple;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {group}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedGroup && (
        <div style={{ marginTop: "20px" }}>
          <Calendar />
        </div>
      )}
    </div>
  );
}