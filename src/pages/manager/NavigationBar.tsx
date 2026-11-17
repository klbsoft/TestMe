import { useState } from "react";
import { commonStyles, defaultSetting } from "../../components/theme/default";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// A single row inside a dropdown (e.g. "Create", "Grade", "Groups").
// Each one carries two icon variants: normal + white (used when hovered/active).
type SubMenuItem = {
  label: string;
  icon: string;
  on_hover: string;
  onClick?: () => void;
};

// A top-level nav button (e.g. "Students", "Assignments").
// It may have a dropdown of subItems, or act as a direct link if subItems is missing.
type MenuItem = {
  icon: string;
  on_hover: string;
  label: string;
  subItems?: SubMenuItem[];
};

// The only prop the component takes is a callback that fires when
// the user picks a sub item, so the parent knows which section to show.
interface NavigationBarProps {
  onSectionChange: (section: string) => void;
}

export default function NavigationBar({ onSectionChange }: NavigationBarProps) {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  // Which top-level menu's dropdown is currently OPEN (transient — toggled by
  // clicking the main button, closed by click-away or selecting a sub item).
  // `null` means no dropdown is open.
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  // Which sub item is currently SELECTED (persistent — the purple highlight).
  // It stays even after the dropdown closes, so the user knows where they are.
  const [activeSubItem, setActiveSubItem] = useState<string>(null);

  // Tracks which main button the mouse is currently over (used for hover styling).
  // Currently stored but not used in the JSX — hover styling is done imperatively.
  const [hoveredMain, setHoveredMain] = useState<number | null>(null);

  // Same idea as hoveredMain, but for sub items.
  const [hoveredSub, setHoveredSub] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Menu configuration
  // -------------------------------------------------------------------------
  // The full nav structure. Adding/removing entries here changes the nav bar.
  // Each item is a main button; each subItems array drives its dropdown.
  const menuItems: MenuItem[] = [
    // "Students" main button — has one sub item ("Groups").
      {
      icon: `${defaultSetting.base_icons}x_global_view.png`,        // purple variant
      on_hover: `${defaultSetting.base_icons}white_global_view.png`, // white variant
      label: "Overview",
      subItems: [
        {
          label: "All Groups",
          icon: `${defaultSetting.base_icons}x_group_view.png`,
          on_hover: `${defaultSetting.base_icons}white_group_view.png`,
        },
      ],
    },
    {
      icon: `${defaultSetting.base_icons}x_students.png`,        // purple variant
      on_hover: `${defaultSetting.base_icons}white_students.png`, // white variant
      label: "Students",
      subItems: [
        {
          label: "Groups",
          icon: `${defaultSetting.base_icons}x_group.png`,
          on_hover: `${defaultSetting.base_icons}white_group.png`,
        },
      ],
    },

    // "Assignments" main button — has three sub items.
    {
      icon: `${defaultSetting.base_icons}x_target_b.png`,
      on_hover: `${defaultSetting.base_icons}white_target_b.png`,
      label: "Assignments",
      subItems: [
        {
          label: "Create",
          icon: `${defaultSetting.base_icons}x_add.png`,
          on_hover: `${defaultSetting.base_icons}white_add.png`,
        },
        {
          label: "Schedule",
          icon: `${defaultSetting.base_icons}x_schedule.png`,
          on_hover: `${defaultSetting.base_icons}white_schedule.png`,
        },
        {
          label: "Grade",
          icon: `${defaultSetting.base_icons}x_grade.png`,
          on_hover: `${defaultSetting.base_icons}white_grade.png`,
        },
      ],
    },
  ];

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  // Clicking a main button toggles its dropdown:
  // - if it was already open, close it (null)
  // - if a different one was open, switch to this one
  // NOTE: this does NOT clear `activeSubItem`, so the previous selection
  // stays highlighted when the dropdown is reopened.
  const handleMainButtonClick = (index: number) => {
    setActiveMenu(activeMenu === index ? null : index);
  };

  // Clicking a sub item:
  // 1. persists it as the "active" sub (purple highlight)
  // 2. tells the parent which section to render
  // 3. closes the dropdown (but the highlight remains)
  const handleSubItemClick = (mainLabel: string, subLabel: string) => {
    setActiveSubItem(subLabel);
    onSectionChange(subLabel);
    setActiveMenu(null);
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    // Outer wrapper — white background, holds the horizontal row of nav buttons.
    <div style={{ background: commonStyles.white }}>
      <div
        style={{
          display: "flex",                       // horizontal row of main buttons
          flexWrap: "wrap",                      // wrap on narrow screens
          padding: "0 10px",
          borderBottom: `2px solid ${commonStyles.faded_purple}`, // underline for the bar
        }}
      >
        {menuItems.map((item, index) => {
          // Is THIS main button's dropdown currently open?
          // Used for: purple background, white icon, rotated chevron, showing dropdown.
          const isMainActive = activeMenu === index;

          return (
            // Each main button lives in a relatively-positioned wrapper so the
            // dropdown panel below can be absolutely positioned to it.
            <div key={index} style={{ position: "relative" }}>

              {/* ----- MAIN BUTTON ---------------------------------------------- */}
              <button
                // Toggle this dropdown open/closed.
                onClick={() => handleMainButtonClick(index)}

                // Hover in — apply a light purple tint if this isn't already
                // the active/selected one. (Imperative style; not from state.)
                onMouseEnter={(e) => {
                  setHoveredMain(index);
                  if (!isMainActive) {
                    e.currentTarget.style.background = "rgba(231, 208, 250, 0.23)";
                  }
                }}

                // Hover out — clear the tint unless it's the active one.
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
                  // Active = solid purple bg + white text; otherwise transparent + purple text.
                  background: isMainActive ? commonStyles.purple : "transparent",
                  color: isMainActive ? commonStyles.white : commonStyles.purple,
                  cursor: "pointer",
                  fontSize: commonStyles.button_fontSize,
                  fontWeight: commonStyles.button_fontWeight,
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                  // Purple underline only when active.
                  borderBottom: isMainActive
                    ? `3px solid ${commonStyles.purple}`
                    : "3px solid transparent",
                }}
              >
                {/* Icon swaps to the white version when active. */}
                <img
                  src={isMainActive ? item.on_hover : item.icon}
                  alt={item.label}
                  style={{ width: "22px", height: "22px" }}
                />

                {/* Main label text (e.g. "Assignments"). */}
                <span>{item.label}</span>

                {/* Chevron ▼ — only rendered if this item has a dropdown.
                    Rotates 180° when the dropdown is open. */}
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

              {/* ----- DROPDOWN ------------------------------------------------ */}
              {/* Only rendered when this main button is the open one AND it has subItems. */}
              {isMainActive && item.subItems && (
                <>
                  {/* Click-away backdrop: a full-screen invisible layer that
                      closes the dropdown when the user clicks outside of it.
                      Sits BELOW the dropdown (z-index 9998 vs 9999). */}
                  <div
                    onClick={() => setActiveMenu(null)}
                    style={{
                      position: "fixed",
                      top: 0, left: 0, right: 0, bottom: 0,
                      zIndex: 9998,
                    }}
                  />

                  {/* The actual dropdown panel — absolutely positioned just
                      under the main button (top: "100%"), left-aligned to it. */}
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      background: commonStyles.white,
                      border: `1px solid ${commonStyles.faded_purple}`,
                      borderRadius: "0 0 8px 8px", // rounded only at the bottom
                      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      minWidth: "280px",
                      zIndex: 9999,
                    }}
                  >
                    {/* Render each sub item as a row (icon + label). */}
                    {item.subItems.map((subItem, subIndex) => {
                      // Is THIS sub item the currently selected one?
                      // Drives the persistent purple highlight.
                      const isSubActive = activeSubItem === subItem.label;

                      return (
                        <button
                          key={subIndex}
                          // Selecting a sub item: persist highlight + notify parent + close.
                          onClick={() => handleSubItemClick(item.label, subItem.label)}

                          // Hover in — tint if not already the active sub item.
                          onMouseEnter={(e) => {
                            setHoveredSub(subItem.label);
                            if (!isSubActive) {
                              e.currentTarget.style.background = "rgba(231, 208, 250, 0.23)";
                            }
                          }}

                          // Hover out — clear tint unless active.
                          onMouseLeave={(e) => {
                            setHoveredSub(null);
                            if (!isSubActive) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}

                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            width: "100%",
                            padding: "12px 20px",
                            border: "none",
                            // Active = solid purple; otherwise transparent.
                            background: isSubActive ? commonStyles.purple : "transparent",
                            color: isSubActive ? commonStyles.white : commonStyles.purple,
                            cursor: "pointer",
                            textAlign: "left",
                            fontSize: commonStyles.button_fontSize,
                            fontWeight: commonStyles.button_fontWeight,
                            // Divider between rows (not after the last one).
                            borderBottom:
                              subIndex < item.subItems!.length - 1
                                ? `1px solid ${commonStyles.faded_purple}`
                                : "none",
                            // Rounded bottom corners only on the LAST row.
                            borderRadius:
                              subIndex === 0
                                ? "0"
                                : subIndex === item.subItems!.length - 1
                                  ? "0 0 8px 8px"
                                  : "0",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {/* Sub item icon — left side. Swaps to white when active. */}
                          <img
                            src={isSubActive ? subItem.on_hover : subItem.icon}
                            alt={subItem.label}
                            style={{ width: "18px", height: "18px" }}
                          />

                          {/* Sub item label — right of the icon. */}
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