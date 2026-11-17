import { useEffect, useMemo, useState } from "react";
import { commonStyles, defaultSetting, getToken } from "../../components/theme/default";

import {
  getStatus,
  Grid,
  Empty,
  type Attempt,
  type CurrentInfo,
  type DashItem,
} from "./common";
import DetailCard from "./DetailCard";
import Section from "./Section";
import AssignmentCard from "./AsigmentCard";
import Home from "../home/Home";
import HistoryList from "./HistoryList";

export default function StudentDashboard() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<DashItem[]>([]);
  const [inprogress, setInprogress] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let cancelled = false;

    (async () => {
      // 1) current active assignment
      let current: CurrentInfo | null = null;
      try {
        const res = await fetch(
          `${defaultSetting.api_url}/assigment/student/info`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          }
        );
        const text = await res.text();
        if (text.startsWith("OK:")) {
          current = JSON.parse(text.slice(3)) as CurrentInfo;
        }
      } catch {
        // no current assignment — fine
      }

      // 2) attempts history
      let attempts: Attempt[] = [];
      try {
        const res = await fetch(`${defaultSetting.api_url}/assigment/attempts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const text = await res.text();
        if (text.startsWith("OK:")) {
          attempts = JSON.parse(text.slice(3)) as Attempt[];
        }
      } catch {
        // no attempts — fine
      }

      if (cancelled) return;

      // 3) group attempts by assigment_id
      const byAssignment = new Map<string, Attempt[]>();
      for (const a of attempts) {
        const list = byAssignment.get(a.assigment_id) ?? [];
        list.push(a);
        byAssignment.set(a.assigment_id, list);
      }

      const merged: DashItem[] = [];

      // 4) current assignment card — only when it hasn't been attempted yet
      if (current) {
        const matching = attempts.filter(
          (a) =>
            a.assigment_label === current!.label &&
            a.assigment_type === current!.assigment_type
        );
        const made = matching.length;

        // Only push the pending card when the student hasn't taken it yet.
        // Once they take it, the attempt lives in the attempts group below.
        if (made === 0) {
          merged.push({
            id: current.label,     // display key (assignment id isn't exposed on info)
            label: current.label,
            type: current.assigment_type,
            grade: current.grade === "" ? null : current.grade,
            attemptsMade: 0,
            attemptsMax: matching[0]?.max_attempts ?? 1,
          });
        }
      }

      // 5) one completed card per distinct assigment_id from the attempts
      for (const [assigmentId, list] of byAssignment.entries()) {
        const first = list[0];
        const graded = list
          .map((a) => a.grade)
          .filter((g) => g !== "")
          .pop() ?? "";

        merged.push({
          id: assigmentId,
          label: first.assigment_label,
          type: first.assigment_type,
          grade: graded === "" ? null : graded,
          attemptsMade: list.length,
          attemptsMax: first.max_attempts,
        });
      }

      setItems(merged);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!inprogress && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [inprogress]);

  const pending = useMemo(
    () => items.filter((i) => getStatus(i) === "pending"),
    [items]
  );
  const completed = useMemo(
    () => items.filter((i) => getStatus(i) === "completed"),
    [items]
  );
  const missing = useMemo(
    () => items.filter((i) => getStatus(i) === "missing"),
    [items]
  );

  const selected = items.find((i) => i.id === selectedId) ?? null;

  if (inprogress) {
    return <Home state={inprogress} setter={setInprogress} />;
  }

  return (
    <div
      className="page-transition"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        gap: "20px",
        padding: "24px",
        boxSizing: "border-box",
        backgroundColor: commonStyles.white,
      }}
    >
      <div
        style={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          gap: "28px",
          overflowY: "auto",
          minWidth: 0,
          paddingRight: "8px",
        }}
      >
        <h1
          style={{
            color: commonStyles.purple,
            fontSize: commonStyles.button_fontSize,
            fontWeight: "bold",
            margin: 0,
          }}
        >
          My Assignments
        </h1>

        <Section title="Pending" count={pending.length} accent={commonStyles.clear_purple}>
          {pending.length === 0 ? (
            <Empty text="No pending assignments 🎉" />
          ) : (
            <Grid>
              {pending.map((a) => (
                <AssignmentCard
                  key={a.id}
                  item={a}
                  selected={a.id === selectedId}
                  onClick={() => setSelectedId(a.id)}
                />
              ))}
            </Grid>
          )}
        </Section>

        <Section title="Completed" count={completed.length} accent={commonStyles.purple}>
          {completed.length === 0 ? (
            <Empty text="Nothing completed yet." />
          ) : (
            <Grid>
              {completed.map((a) => (
                <AssignmentCard
                  key={a.id}
                  item={a}
                  selected={a.id === selectedId}
                  onClick={() => setSelectedId(a.id)}
                />
              ))}
            </Grid>
          )}
        </Section>

        {missing.length > 0 && (
          <Section title="Missing" count={missing.length} accent={commonStyles.faded_purple}>
            <Grid>
              {missing.map((a) => (
                <AssignmentCard
                  key={a.id}
                  item={a}
                  selected={a.id === selectedId}
                  onClick={() => setSelectedId(a.id)}
                />
              ))}
            </Grid>
          </Section>
        )}
      </div>

      <div
        id="right-side-panel"
        style={{
          flex: 1,
          minWidth: "280px",
          maxWidth: "380px",
          alignSelf: "flex-start",
          maxHeight: "100%",
          backgroundColor: commonStyles.purple,
          borderRadius: "25px",
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          boxSizing: "border-box",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: commonStyles.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={`${defaultSetting.base_bot}bot.svg`}
              alt="bot"
              style={{ width: "68px", height: "68px", objectFit: "contain" }}
            />
          </div>

          <h2
            style={{
              color: commonStyles.white,
              fontSize: commonStyles.button_fontSize,
              fontWeight: "bold",
              margin: 0,
              textAlign: "center",
            }}
          >
            {selected ? "Assignment Detail" : "Grade History"}
          </h2>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: "4px" }}>
          {selected ? (
            <DetailCard
              item={selected}
              onClose={() => setSelectedId(null)}
              onStart={() => setInprogress(true)}
            />
          ) : (
            <HistoryList
              completed={completed}
              missing={missing}
              onSelect={setSelectedId}
            />
          )}
        </div>
      </div>
    </div>
  );
}