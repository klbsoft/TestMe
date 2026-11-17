import { commonStyles } from "../../components/theme/default";

// raw server shapes — no TypeScript fiction
export type CurrentInfo = {
  label: string;
  assigment_type: string;
  grade: string;
};

export type Attempt = {
  id: string;
  user: string;
  code: string;
  group: string;
  attempt: number;
  assigment_label: string;
  assigment_type: string;
  assigment_id: string;
  max_attempts: number;
  grade: string;
  window: number;
  json: string;
};

// merged view used by the dashboard
export type DashItem = {
  id: string;           // display key (assigment_id or label)
  label: string;
  type: string;         // raw string from the server
  grade: string | null;
  attemptsMade: number;
  attemptsMax: number;
};

export type Status = "completed" | "pending" | "missing";

export function getStatus(a: DashItem): Status {
  if (a.attemptsMade > 0) return "completed";
  return "pending";
}

export const STATUS_STYLE: Record<Status, { bg: string; label: string }> = {
  completed: { bg: commonStyles.purple, label: "Completed" },
  pending: { bg: commonStyles.clear_purple, label: "Pending" },
  missing: { bg: commonStyles.faded_purple, label: "Missing" },
};

// raw server string → human label
export function typeLabel(raw: string): string {
  switch (raw.toLowerCase()) {
    case "speaking":
      return "Speaking";
    case "listening":
      return "Listening";
    case "writing":
      return "Writing";
    default:
      return raw;
  }
}

export function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
        gap: "14px",
      }}
    >
      {children}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <p
      style={{
        color: commonStyles.purple,
        fontSize: commonStyles.button_fontSize,
        fontWeight: commonStyles.button_fontWeight,
        opacity: 0.6,
        margin: 0,
      }}
    >
      {text}
    </p>
  );
}