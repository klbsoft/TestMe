import { useState } from "react";
import { commonStyles } from "../../components/theme/default";

type AssignmentType = "speaking" | "listening" | "writing";

interface DayAssignment {
  date: string;
  types: AssignmentType[];
}

const assignmentIcons: Record<AssignmentType, string> = {
  speaking: "🎤",
  listening: "🔊",
  writing: "📝",
};

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<DayAssignment[]>([]);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const monthName = currentMonth.toLocaleString("en-US", { month: "long" });

  const getAssignmentTypes = (date: string): AssignmentType[] => {
    const assignment = assignments.find(a => a.date === date);
    return assignment ? assignment.types : [];
  };

  const toggleAssignmentType = (date: string, type: AssignmentType) => {
    setAssignments(prev => {
      const existing = prev.find(a => a.date === date);
      if (existing) {
        const types = existing.types.includes(type)
          ? existing.types.filter(t => t !== type)
          : [...existing.types, type];
        if (types.length === 0) {
          return prev.filter(a => a.date !== date);
        }
        return prev.map(a => a.date === date ? { ...a, types } : a);
      }
      return [...prev, { date, types: [type] }];
    });
  };

  const handleDayClick = (day: number) => {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(date);
  };

  const isTomorrow = (day: number) => {
    return day === tomorrow.getDate() && month === tomorrow.getMonth() && year === tomorrow.getFullYear();
  };

  const isPastDay = (day: number) => {
    const date = new Date(year, month, day);
    return date < tomorrow;
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div style={{
      maxWidth: "400px",
      margin: "0 auto",
      backgroundColor: commonStyles.white,
      borderRadius: "15px",
      padding: "20px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    }}>
      {/* Month header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
      }}>
        <button
          onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
          style={{
            background: "none",
            border: `2px solid ${commonStyles.faded_purple}`,
            borderRadius: "8px",
            color: commonStyles.purple,
            cursor: "pointer",
            padding: "5px 10px",
          }}
        >
          ←
        </button>
        <span style={{
          color: commonStyles.purple,
          fontSize: commonStyles.button_fontSize,
          fontWeight: commonStyles.button_fontWeight,
        }}>
          {monthName} {year}
        </span>
        <button
          onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
          style={{
            background: "none",
            border: `2px solid ${commonStyles.faded_purple}`,
            borderRadius: "8px",
            color: commonStyles.purple,
            cursor: "pointer",
            padding: "5px 10px",
          }}
        >
          →
        </button>
      </div>

      {/* Day names */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "5px",
        marginBottom: "10px",
      }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} style={{
            textAlign: "center",
            color: commonStyles.faded_purple,
            fontSize: "12px",
            fontWeight: commonStyles.button_fontWeight,
          }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "5px",
      }}>
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} />;
          }

          const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isSelected = selectedDate === date;
          const isPast = isPastDay(day);
          const assignmentTypes = getAssignmentTypes(date);
          const hasAssignments = assignmentTypes.length > 0;

          return (
            <div key={day}>
              <button
                onClick={() => !isPast && handleDayClick(day)}
                disabled={isPast}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  border: `2px solid ${commonStyles.faded_purple}`,
                  borderRadius: "8px",
                  backgroundColor: isSelected ? commonStyles.purple : commonStyles.white,
                  color: isSelected ? commonStyles.white : commonStyles.purple,
                  cursor: isPast ? "not-allowed" : "pointer",
                  fontSize: commonStyles.button_fontSize,
                  fontWeight: commonStyles.button_fontWeight,
                  opacity: isPast ? 0.4 : 1,
                  display: "flex",
                  alignItems: hasAssignments ? "flex-start" : "center",
                  justifyContent: hasAssignments ? "space-between" : "center",
                  position: "relative",
                  padding: "3px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{
                  position: hasAssignments ? "absolute" : "static",
                  top: "2px",
                  left: "2px",
                }}>
                  {day}
                </span>
                
                {hasAssignments && (
                  <div style={{
                    display: "flex",
                    gap: "1px",
                    position: "absolute",
                    bottom: "2px",
                    left: "2px",
                  }}>
                    {assignmentTypes.map((type, i) => (
                      <span key={type} style={{
                        fontSize: "8px",
                        color: isSelected ? commonStyles.white : commonStyles.purple,
                      }}>
                        {assignmentIcons[type]}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Popup */}
      {selectedDate && (
        <>
          <div
            onClick={() => setSelectedDate(null)}
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
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: commonStyles.white,
            borderRadius: "15px",
            padding: "20px",
            zIndex: 9999,
            border: `2px solid ${commonStyles.faded_purple}`,
            minWidth: "280px",
          }}>
            <p style={{
              color: commonStyles.purple,
              fontSize: commonStyles.button_fontSize,
              fontWeight: commonStyles.button_fontWeight,
              textAlign: "center",
              marginBottom: "15px",
            }}>
              {selectedDate}
            </p>
            
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: "15px",
              marginBottom: "20px",
            }}>
              {(["speaking", "listening", "writing"] as AssignmentType[]).map(type => {
                const isActive = getAssignmentTypes(selectedDate).includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleAssignmentType(selectedDate, type)}
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      border: `2px solid ${commonStyles.faded_purple}`,
                      backgroundColor: isActive ? commonStyles.purple : commonStyles.white,
                      fontSize: "24px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {assignmentIcons[type]}
                  </button>
                );
              })}
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
            }}>
              <button
                onClick={() => setSelectedDate(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: `2px solid ${commonStyles.faded_purple}`,
                  backgroundColor: commonStyles.white,
                  color: commonStyles.purple,
                  cursor: "pointer",
                  fontSize: commonStyles.button_fontSize,
                  fontWeight: commonStyles.button_fontWeight,
                }}
              >
                ✓
              </button>
              <button
                onClick={() => setSelectedDate(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: `2px solid ${commonStyles.faded_purple}`,
                  backgroundColor: commonStyles.white,
                  color: commonStyles.purple,
                  cursor: "pointer",
                  fontSize: commonStyles.button_fontSize,
                  fontWeight: commonStyles.button_fontWeight,
                }}
              >
                ✕
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}