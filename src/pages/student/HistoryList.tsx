import HistoryGroup from "./HistoryGroup";
import type { DashItem } from "./common";

export default function HistoryList({
  completed,
  missing,
  onSelect,
}: {
  completed: DashItem[];
  missing: DashItem[];
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <HistoryGroup title="Grades" items={completed} empty="No grades yet." onSelect={onSelect} />
      <HistoryGroup title="Missing" items={missing} empty="Nothing missing" onSelect={onSelect} />
    </div>
  );
}