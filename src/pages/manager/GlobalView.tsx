import { useState } from "react";
import { commonStyles } from "../../components/theme/default";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Student = {
  id: number;
  name: string;
  score: number; // 0, 1, 2, 3, or 4
};

type Group = {
  id: string;
  label: string;
  students: Student[];
};

const MAX_STUDENTS = 30;
const MAX_SCORE = 4;

// ---------------------------------------------------------------------------
// Mock data — replace with your real source later
// ---------------------------------------------------------------------------
function makeStudents(prefix: string): Student[] {
  return Array.from({ length: MAX_STUDENTS }, (_, i) => ({
    id: i + 1,
    name: `${prefix}-${String(i + 1).padStart(2, "0")}`,
    score: Math.floor(Math.random() * (MAX_SCORE + 1)),
  }));
}

const MOCK_GROUPS: Group[] = [
  { id: "g1", label: "Group A", students: makeStudents("GA") },
  { id: "g2", label: "Group B", students: makeStudents("GB") },
  { id: "g3", label: "Group C", students: makeStudents("GC") },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function GlobalView() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MOCK_GROUPS.map((g) => [g.id, true]))
  );

  const toggleGroup = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      className="page-transition"
      style={{
        width: "100%",
        minHeight: "100dvh",        // ← was height:100dvh — this is the fix
        padding: "24px",
        boxSizing: "border-box",
        backgroundColor: commonStyles.white,
        overflowY: "auto",
        overscrollBehavior: "contain",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* Title */}
      <h1
        style={{
          color: commonStyles.purple,
          fontSize: commonStyles.button_fontSize,
          fontWeight: "bold",
          margin: 0,
        }}
      >
        Global View
      </h1>

      {/* Group tabs */}
      {MOCK_GROUPS.map((group) => {
        const isOpen = expanded[group.id];

        return (
          <div
            key={group.id}
            style={{
              border: `2px solid ${commonStyles.faded_purple}`,
              borderRadius: "18px",
              overflow: "hidden",
              backgroundColor: commonStyles.white,
            }}
          >
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px",
                border: "none",
                background: commonStyles.purple,
                color: commonStyles.white,
                cursor: "pointer",
                fontSize: commonStyles.button_fontSize,
                fontWeight: "bold",
                transition: "background-color 0.2s ease",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {group.label}
                <span
                  style={{
                    backgroundColor: commonStyles.faded_purple,
                    borderRadius: "10px",
                    padding: "2px 10px",
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: commonStyles.white,
                  }}
                >
                  {group.students.length}
                </span>
              </span>

              <span
                style={{
                  fontSize: "14px",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.25s ease",
                }}
              >
                ▼
              </span>
            </button>

            {/* Student list — scrolls inside this box */}
            {isOpen && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "12px 20px 18px",
                  gap: "10px",
                  maxHeight: "320px",
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                }}
              >
                {group.students.map((student) => (
                  <StudentRow key={student.id} student={student} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Student row
// ---------------------------------------------------------------------------
function StudentRow({ student }: { student: Student }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "10px 14px",
        borderRadius: "12px",
        border: `1px solid ${commonStyles.faded_purple}`,
        backgroundColor: commonStyles.white,
      }}
    >
      <span
        style={{
          color: commonStyles.purple,
          fontSize: commonStyles.button_fontSize,
          fontWeight: commonStyles.button_fontWeight,
          minWidth: "90px",
        }}
      >
        {student.name}
      </span>
<span
  style={{
    color: commonStyles.purple,
    fontSize: commonStyles.button_fontSize,
    fontWeight: "bold",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `2px solid ${commonStyles.purple}`,
    borderRadius: "10px",
    flexShrink: 0,
  }}
>
  {student.score}
</span>
      <RulerBar value={student.score} max={MAX_SCORE} />

    </div>
  );
}

// ---------------------------------------------------------------------------
// RulerBar
// ---------------------------------------------------------------------------
function RulerBar({ value, max }: { value: number; max: number }) {
  const segments = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        position: "relative",
      }}
    >
      {segments.map((seg) => {
        const filled = value >= seg;
        return (
          <div
            key={seg}
            style={{
              flex: 1,
              height: "14px",
              borderRadius: "4px",
              backgroundColor: filled
                ? commonStyles.purple
                : commonStyles.faded_purple,
              transition: "background-color 0.2s ease",
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                right: "-3px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "2px",
                height: "20px",
                backgroundColor: commonStyles.purple,
                opacity: filled ? 1 : 0.4,
                borderRadius: "1px",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}