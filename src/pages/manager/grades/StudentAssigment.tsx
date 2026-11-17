// src/pages/manager/grades/StudentAssigment.tsx
import { useEffect, useMemo, useState } from "react";
import { commonStyles, getToken } from "../../../components/theme/default";
import { type SpeakingUnit } from "../../../session/UserSession";
import { showToast } from "../../../components/toast/Toast";
import AttemptStrip, { type AttemptCell, type AttemptState } from "./AttemptStrip";
import GradeStrip from "./GradeStrip";
import UnitsList from "./UnitsList";
import { gradeAttempt, type AttemptRow } from "./api";


// ---------------------------------------------------------------------------
// Resource hydration
// ---------------------------------------------------------------------------

async function fetchResourceBlob(
  resourceUrl: string,
  token: string
): Promise<string | null> {
  try {
    const res = await fetch(resourceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (ct.startsWith("text/")) return null;
    const blob = await res.blob();
    if (blob.size === 0) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

async function hydrateUnits(
  units: SpeakingUnit[],
  token: string
): Promise<{ hydrated: SpeakingUnit[]; blobUrls: string[] }> {
  const blobUrls: string[] = [];

  const hydrated = await Promise.all(
    units.map(async (unit) => {
      const next: SpeakingUnit = { ...unit };

      if (next.content) {
        const blob = await fetchResourceBlob(next.content, token);
        if (blob) {
          blobUrls.push(blob);
          next.content = blob;
        }
      }
      if (next.answer) {
        const blob = await fetchResourceBlob(next.answer, token);
        if (blob) {
          blobUrls.push(blob);
          next.answer = blob;
        }
      }

      return next;
    })
  );

  return { hydrated, blobUrls };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The subset of units that UnitsList renders (and therefore grades). */
function gradedUnitsOf(units: SpeakingUnit[]): SpeakingUnit[] {
  const contentUnits = units.filter((u) => !u.id.startsWith("dialog_"));
  const describeUnits = contentUnits
    .filter((u) => u.phase === "describe_image")
    .slice(0, 4);
  const repeatUnits = contentUnits
    .filter((u) => u.phase === "repeat_audio")
    .slice(0, 4);
  return describeUnits.length + repeatUnits.length > 0
    ? [...describeUnits, ...repeatUnits]
    : contentUnits.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function StudentAssigment({
  studentCode,
  attempts,
}: {
  studentCode: string;
  attempts: AttemptRow[];
}) {
  const studentAttempts = useMemo(
    () => attempts.filter((a) => a.code === studentCode),
    [attempts, studentCode]
  );

  const activeAttempts = useMemo(
    () => studentAttempts.slice().sort((a, b) => a.attempt - b.attempt),
    [studentAttempts]
  );

const cells: AttemptCell[] = useMemo(
  () =>
    activeAttempts.map((a, i) => ({
      id: a.id,
      attempt: i + 1,
      state: (a.grade !== "" ? "graded" : "ungraded") as AttemptState,
      currentAttempt: a.assigment_label ?? "",
    })),
  [activeAttempts]
);

  const [selectedAttempt, setSelectedAttempt] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [generalScore, setGeneralScore] = useState<number | null>(null);

  useEffect(() => {
    setScores({});
    setGeneralScore(null);
    if (activeAttempts.length === 0) {
      setSelectedAttempt(null);
    } else {
      setSelectedAttempt(activeAttempts.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentCode, activeAttempts.length]);

  const currentRow = useMemo(() => {
    if (selectedAttempt === null) return null;
    return activeAttempts[selectedAttempt - 1] ?? null;
  }, [activeAttempts, selectedAttempt]);

  // seed generalScore from the stored grade on the current attempt
  useEffect(() => {
    if (!currentRow) {
      setGeneralScore(null);
      return;
    }
    const trimmed = currentRow.grade.trim();
    setGeneralScore(trimmed === "" ? null : Number(trimmed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRow?.id]);

  const rawUnits: SpeakingUnit[] = useMemo(() => {
    if (!currentRow || !currentRow.json) return [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(currentRow.json);
    } catch (e) {
      showToast(`FAIL:Invalid attempt json: ${String(e)}`);
      return [];
    }

    if (parsed && typeof parsed === "object") {
      const obj = parsed as {
        assignment?: { units?: SpeakingUnit[] };
        units?: SpeakingUnit[];
      };
      if (Array.isArray(obj.assignment?.units)) return obj.assignment.units;
      if (Array.isArray(obj.units)) return obj.units;
    }

    showToast("FAIL:Attempt json has no units");
    return [];
  }, [currentRow]);

  const [units, setUnits] = useState<SpeakingUnit[]>([]);
  const [hydrating, setHydrating] = useState(false);

  useEffect(() => {
    if (rawUnits.length === 0) {
      setUnits([]);
      return;
    }

    const token = getToken();
    if (!token) {
      showToast("FAIL:No session token");
      return;
    }

    let cancelled = false;
    let createdBlobs: string[] = [];

    setHydrating(true);

    (async () => {
      const { hydrated, blobUrls } = await hydrateUnits(rawUnits, token);
      if (cancelled) {
        blobUrls.forEach((u) => URL.revokeObjectURL(u));
        return;
      }
      createdBlobs = blobUrls;
      setUnits(hydrated);
      setHydrating(false);
    })();

    return () => {
      cancelled = true;
      setHydrating(false);
      createdBlobs.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [rawUnits]);

// at the top of StudentAssigment.tsx

// inside the component, next to the other handlers
const handleSaveGrade = async () => {
  if (!currentRow) return;
  if (generalScore === null) {
    showToast("FAIL:Pick a score first");
    return;
  }

  const text = await gradeAttempt(currentRow.id, String(generalScore));
  // text is "OK:..." or "FAIL:..." — gradeAttempt already toasted

  if (text.startsWith("OK:")) {
    // Reflect the change locally so the attempt strip turns "graded"
    // and the currentRow's stored grade stays in sync if the teacher
    // switches attempts and comes back.
    // (The parent's `attempts` array is the source — see the note below.)
  }
};







  // ── GENERAL → INDIVIDUAL: bulk fill every graded unit ─────────────
  const handleGeneralScore = (grade: number) => {
    setGeneralScore(grade);

    const graded = gradedUnitsOf(units);
    setScores((prev) => {
      const next = { ...prev };
      for (const u of graded) next[u.id] = grade;
      return next;
    });
  };

  // ── INDIVIDUAL → GENERAL: recompute the average ───────────────────
 const setUnitScore = (unitId: string, score: number) => {
  const next = { ...scores, [unitId]: score };
  setScores(next);

  const graded = gradedUnitsOf(units);
  const values: number[] = [];
  for (const u of graded) {
    const v = next[u.id];
    if (typeof v === "number") values.push(v);
  }

  if (values.length > 0) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    setGeneralScore(gradeFromAverage(avg));
  }
};

function gradeFromAverage(avg: number): number {
  if (avg >= 3.875) return 4;
  if (avg >= 3.375) return 3;
  if (avg >= 3.000) return 2;
  return 1;
}

  return (
    <div
      style={{
        width: "1200px",
        background: commonStyles.white,
        border: `2px solid ${commonStyles.faded_purple}`,
        borderRadius: "8px",
        padding: "1em",
        fontFamily: "system-ui, sans-serif",
        fontSize: commonStyles.button_fontSize,
        fontWeight: commonStyles.button_fontWeight,
        boxSizing: "border-box",
        alignSelf: "flex-start",
      }}
    >
      <h2 style={{ margin: 0, color: commonStyles.purple }}>
        {studentCode || "No student selected"}
      </h2>

      {cells.length > 1 && (
        <div style={{ margin: "0.75em 0" }}>
          <AttemptStrip
            attempts={cells}
            value={selectedAttempt}
            onChange={setSelectedAttempt}
            currentAttempt={currentRow?.assigment_label}

          />
        </div>
      )}

      {currentRow && (
        <div style={{
            margin: "0.75em 0",
            display: "flex",
            alignItems: "flex-end",
            gap: "0.75em",
            flexWrap: "wrap", 
            }}>
          <GradeStrip value={generalScore} onChange={handleGeneralScore} />
         <button
            onClick={handleSaveGrade}
            disabled={generalScore === null}
            style={{
                  marginLeft: "auto",
              padding: "0.6em 1.4em",
              border: `2px solid ${commonStyles.purple}`,
              borderRadius: "10px",
              backgroundColor:
                generalScore === null
                  ? commonStyles.faded_purple
                  : commonStyles.purple,
              color: commonStyles.white,
              fontSize: commonStyles.button_fontSize,
              fontWeight: commonStyles.button_fontWeight,
              cursor: generalScore === null ? "not-allowed" : "pointer",
              transition: "background-color 0.15s ease",
              boxSizing: "border-box",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            Save grade
          </button>
        </div>
      )}

      {!studentCode ? (
        <p
          style={{
            color: commonStyles.purple,
            opacity: 0.6,
            fontSize: commonStyles.button_fontSize,
          }}
        >
          Select a student to grade.
        </p>
      ) : activeAttempts.length === 0 ? (
        <p
          style={{
            color: commonStyles.purple,
            opacity: 0.6,
            fontSize: commonStyles.button_fontSize,
          }}
        >
          This student has no attempts yet.
        </p>
      ) : rawUnits.length === 0 ? (
        <p
          style={{
            color: commonStyles.purple,
            opacity: 0.6,
            fontSize: commonStyles.button_fontSize,
          }}
        >
          This attempt has no recorded units.
        </p>
      ) : hydrating ? (
        <p
          style={{
            color: commonStyles.purple,
            opacity: 0.6,
            fontSize: commonStyles.button_fontSize,
          }}
        >
          Loading media…
        </p>
      ) : (
        <UnitsList units={units} scores={scores} onScore={setUnitScore} />
      )}
    </div>
  );
}