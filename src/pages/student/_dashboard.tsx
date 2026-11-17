import { useMemo, useState } from "react";
import { commonStyles, defaultSetting } from "../../components/theme/default";
import {
  AssignmentType,
  type Assignment,
  type SpeakingAssignment,
  type ListeningAssignment,
  type WritingAssignment,
} from "../../session/UserSession";

// ---------------------------------------------------------------------------
// Mock data — replace with your real source (context, API, props, etc.)
// ---------------------------------------------------------------------------
const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: "sp_001",
    type: AssignmentType.speaking,
    grade: "8.5",
    units: [],
  } as SpeakingAssignment,
  {
    id: "sp_002",
    type: AssignmentType.speaking,
    grade: null,
    units: [],
  } as SpeakingAssignment,
  {
    id: "ls_001",
    type: AssignmentType.listening,
    grade: "7.0",
  } as ListeningAssignment,
  {
    id: "wr_001",
    type: AssignmentType.writing,
    grade: null,
  } as WritingAssignment,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type Status = "completed" | "pending" | "missing";

function getStatus(a: Assignment): Status {
  if (a.grade) return "completed";
  // You can refine this: "missing" = past due, "pending" = still open
  return "pending";
}

const STATUS_COLORS: Record<Status, string> = {
  completed: "#2ecc71",
  pending: commonStyles.purple,
  missing: "#e74c3c",
};

const TYPE_LABEL: Record<AssignmentType, string> = {
  [AssignmentType.speaking]: "Speaking",
  [AssignmentType.listening]: "Listening",
  [AssignmentType.writing]: "Writing",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function _Dashboard() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const assignments = MOCK_ASSIGNMENTS; // swap for real data

  const pending = useMemo(
    () => assignments.filter((a) => getStatus(a) === "pending"),
    [assignments]
  );
  const completed = useMemo(
    () => assignments.filter((a) => getStatus(a) === "completed"),
    [assignments]
  );
  const missing = useMemo(
    () => assignments.filter((a) => getStatus(a) === "missing"),
    [assignments]
  );

  const selected = assignments.find((a) => a.id === selectedId) ?? null;

  return (
    <div
      className="page-transition"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        gap: "20px",
        padding: "20px",
        boxSizing: "border-box",
        backgroundColor: commonStyles.white,
      }}
    >
      {/* ---------------------------------------------------------------- */}
      {/* LEFT: Assignments grid                                            */}
      {/* ---------------------------------------------------------------- */}
      <div
        style={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          overflowY: "auto",
          minWidth: 0,
        }}
      >
        <h1
          style={{
            color: commonStyles.purple,
            fontSize: "24px",
            fontWeight: "bold",
            margin: 0,
          }}
        >
          My Assignments
        </h1>

        {/* Pending */}
        <Section title="Pending" count={pending.length}>
          {pending.length === 0 ? (
            <Empty text="No pending assignments 🎉" />
          ) : (
            <Grid>
              {pending.map((a) => (
                <AssignmentCard
                  key={a.id}
                  assignment={a}
                  selected={a.id === selectedId}
                  onClick={() => setSelectedId(a.id)}
                />
              ))}
            </Grid>
          )}
        </Section>

        {/* Completed */}
        <Section title="Completed" count={completed.length}>
          {completed.length === 0 ? (
            <Empty text="Nothing completed yet." />
          ) : (
            <Grid>
              {completed.map((a) => (
                <AssignmentCard
                  key={a.id}
                  assignment={a}
                  selected={a.id === selectedId}
                  onClick={() => setSelectedId(a.id)}
                />
              ))}
            </Grid>
          )}
        </Section>

        {/* Missing */}
        {missing.length > 0 && (
          <Section title="Missing" count={missing.length}>
            <Grid>
              {missing.map((a) => (
                <AssignmentCard
                  key={a.id}
                  assignment={a}
                  selected={a.id === selectedId}
                  onClick={() => setSelectedId(a.id)}
                />
              ))}
            </Grid>
          </Section>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* RIGHT: History / grades side panel                                */}
      {/* ---------------------------------------------------------------- */}
      <div
        style={{
          flex: 1,
          minWidth: "260px",
          maxWidth: "360px",
          backgroundColor: commonStyles.purple,
          borderRadius: "25px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          boxSizing: "border-box",
          overflowY: "auto",
        }}
      >
        {/* Bot logo */}
        <div
          style={{
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            backgroundColor: commonStyles.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
          }}
        >
          <img
            src={`${defaultSetting.base_bot}bot.svg`}
            alt="bot"
            style={{ width: "60px", height: "60px", objectFit: "contain" }}
          />
        </div>

        <h2
          style={{
            color: commonStyles.white,
            fontSize: "18px",
            fontWeight: "bold",
            margin: 0,
            textAlign: "center",
          }}
        >
          {selected ? "Assignment Detail" : "Grade History"}
        </h2>

        {selected ? (
          <DetailCard assignment={selected} onClose={() => setSelectedId(null)} />
        ) : (
          <HistoryList
            completed={completed}
            missing={missing}
            onSelect={setSelectedId}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: commonStyles.purple,
        }}
      >
        <strong style={{ fontSize: "16px" }}>{title}</strong>
        <span
          style={{
            backgroundColor: commonStyles.faded_purple,
            borderRadius: "10px",
            padding: "2px 8px",
            fontSize: "12px",
            fontWeight: "bold",
            color: commonStyles.purple,
          }}
        >
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: "12px",
      }}
    >
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p
      style={{
        color: commonStyles.purple,
        fontSize: commonStyles.button_fontSize,
        opacity: 0.6,
        margin: 0,
      }}
    >
      {text}
    </p>
  );
}

function AssignmentCard({
  assignment,
  selected,
  onClick,
}: {
  assignment: Assignment;
  selected: boolean;
  onClick: () => void;
}) {
  const status = getStatus(assignment);
  return (
    <div
      onClick={onClick}
      style={{
        border: `2px solid ${
          selected ? STATUS_COLORS[status] : commonStyles.faded_purple
        }`,
        borderRadius: "15px",
        padding: "12px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        backgroundColor: commonStyles.white,
        transition: "border-color 0.2s, transform 0.1s",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: commonStyles.purple,
            fontSize: "13px",
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          {TYPE_LABEL[assignment.type]}
        </span>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: STATUS_COLORS[status],
          }}
        />
      </div>

      <span
        style={{
          color: commonStyles.purple,
          fontSize: commonStyles.button_fontSize,
          fontWeight: commonStyles.button_fontWeight,
        }}
      >
        {assignment.id}
      </span>

      <span
        style={{
          color: commonStyles.purple,
          fontSize: "12px",
          opacity: 0.7,
        }}
      >
        {status === "completed" ? `Grade: ${assignment.grade}` : status === "missing" ? "Missing" : "Pending"}
      </span>
    </div>
  );
}

function DetailCard({
  assignment,
  onClose,
}: {
  assignment: Assignment;
  onClose: () => void;
}) {
  const status = getStatus(assignment);
  return (
    <div
      style={{
        backgroundColor: commonStyles.white,
        borderRadius: "15px",
        padding: "15px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong style={{ color: commonStyles.purple }}>
          {TYPE_LABEL[assignment.type]} — {assignment.id}
        </strong>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: commonStyles.purple,
            fontSize: "18px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <Row label="Status" value={status} color={STATUS_COLORS[status]} />
      <Row label="Grade" value={assignment.grade ?? "—"} />
      <Row label="Type" value={TYPE_LABEL[assignment.type]} />
    </div>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: commonStyles.purple, opacity: 0.7, fontSize: "13px" }}>
        {label}
      </span>
      <span
        style={{
          color: color ?? commonStyles.purple,
          fontWeight: "bold",
          fontSize: "13px",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function HistoryList({
  completed,
  missing,
  onSelect,
}: {
  completed: Assignment[];
  missing: Assignment[];
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <HistoryGroup
        title="Grades"
        items={completed}
        empty="No grades yet."
        onSelect={onSelect}
      />
      <HistoryGroup
        title="Missing"
        items={missing}
        empty="Nothing missing 👏"
        onSelect={onSelect}
      />
    </div>
  );
}

function HistoryGroup({
  title,
  items,
  empty,
  onSelect,
}: {
  title: string;
  items: Assignment[];
  empty: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <span
        style={{
          color: commonStyles.white,
          fontSize: "13px",
          fontWeight: "bold",
          opacity: 0.8,
          textTransform: "uppercase",
        }}
      >
        {title}
      </span>

      {items.length === 0 ? (
        <span
          style={{
            color: commonStyles.white,
            fontSize: "12px",
            opacity: 0.6,
          }}
        >
          {empty}
        </span>
      ) : (
        items.map((a) => (
          <div
            key={a.id}
            onClick={() => onSelect(a.id)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: commonStyles.white,
              borderRadius: "10px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                color: commonStyles.purple,
                fontSize: "13px",
                fontWeight: commonStyles.button_fontWeight,
              }}
            >
              {TYPE_LABEL[a.type]} · {a.id}
            </span>
            <span
              style={{
                color: commonStyles.purple,
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              {a.grade ?? "—"}
            </span>
          </div>
        ))
      )}
    </div>
  );
}