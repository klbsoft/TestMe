import { useEffect, useMemo, useState } from "react";
import { commonStyles, defaultSetting, getToken } from "../../../components/theme/default";
import { GradesSelect } from "./Selector";
import Students from "./Students";
import StudentAssigment from "./StudentAssigment";
import { getAttempts, type AttemptRow } from "./api";

/** Does this attempt's json contain at least one unit? */
function attemptHasUnits(row: AttemptRow): boolean {
  if (!row.json) return false;
  try {
    const parsed = JSON.parse(row.json) as {
      assignment?: { units?: unknown[] };
      units?: unknown[];
    };
    const units = parsed?.assignment?.units ?? parsed?.units;
    return Array.isArray(units) && units.length > 0;
  } catch {
    return false;
  }
}

export default function Grades() {
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [groupSize, setGroupSize] = useState<number>(0);

  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");

  const handleGroupChange = (group: string) => {
    setSelectedGroup(group);
    setSelectedStudent("");
  };

  const [sizes, setSizes] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const res = await fetch(`${defaultSetting.api_url}/groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const text = await res.text();

        if (text.startsWith("OK:")) {
          const raw = JSON.parse(text.slice(3)) as { name: string; size: number }[];
          const map: Record<string, number> = {};
          for (const g of raw) map[g.name] = g.size;
          setSizes(map);
        }
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const load = async () => {
      const result = await getAttempts(token);
      if (Array.isArray(result)) {
        setAttempts(result);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setGroupSize(sizes[selectedGroup] ?? 0);
  }, [selectedGroup, sizes]);

  const students =
    selectedGroup && groupSize > 0
      ? Array.from({ length: groupSize }, (_, i) => `${selectedGroup}${i + 1}`)
      : [];

  // Codes of students who have at least one attempt with units.
  const completed = useMemo(() => {
    const set = new Set<string>();
    for (const row of attempts) {
      if (attemptHasUnits(row)) set.add(row.code);
    }
    return set;
  }, [attempts]);

  return (
    <div>
      <h2
        style={{
          color: commonStyles.purple,
          fontSize: commonStyles.button_fontSize,
          fontWeight: commonStyles.button_fontWeight,
        }}
      >
        <strong>Grade Groups</strong>
      </h2>

      <div
        className="grades-container"
        style={{
          display: "flex",
          gap: "1em",
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
          <GradesSelect onChange={handleGroupChange} />
          <Students
            students={students}
            selected={selectedStudent}
            onSelect={setSelectedStudent}
            completed={completed}
          />
        </div>

        <StudentAssigment
          studentCode={selectedStudent}
          attempts={attempts}
        />
      </div>
    </div>
  );
}