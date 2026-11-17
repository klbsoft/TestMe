import { useEffect, useMemo, useRef, useState } from "react";
import { commonStyles, defaultSetting, getToken } from "../../components/theme/default";
import { generateGroupPasswordsPdf } from "../../tools/pdf";

type Group = {
  id: string;        // "A", "B", ..., "Z"
  students: number;  // 0–30
};

const MAX_STUDENTS = 30;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// ── password helpers ───────────────────────────────────────────────────
type StudentPassword = { code: string; password: string };

function downloadPasswordFile(group: string, rows: StudentPassword[]) {
  const lines = rows.map((r) => `${r.code}  ${r.password}`).join("\n");
  const blob = new Blob([lines], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${group}-passwords.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function fetchPasswords(
  group: string,
  path: "passwords" | "rotate/passwords"
): Promise<string> {
  const token = getToken();
  if (!token) return "FAIL:Not logged in";

  const res = await fetch(`${defaultSetting.api_url}/groups/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ group, token }),
  });
  return res.text();
}

 
// ── injected stylesheet (hover via CSS, not JS) ────────────────────────
const ACTION_STYLES_ID = "groups-action-styles";
function ensureActionStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ACTION_STYLES_ID)) return;

  const style = document.createElement("style");
  style.id = ACTION_STYLES_ID;
  style.textContent = `
    .gs-action-btn { transition: background-color 0.15s ease, color 0.15s ease; }
    .gs-action-btn:disabled { pointer-events: none; }

    .gs-action-btn--outline:hover:not(:disabled) {
      background-color: ${commonStyles.purple} !important;
      color: ${commonStyles.white} !important;
    }

    .gs-action-btn--filled:hover:not(:disabled) {
      background-color: ${commonStyles.faded_purple} !important;
      color: ${commonStyles.white} !important;
    }

    .gs-menu-item:not(:disabled):hover {
      background-color: ${commonStyles.faded_purple} !important;
    }
  `;
  document.head.appendChild(style);
}

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [committing, setCommitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // ── per-group access codes (UI only, in-memory) ─────────────────────
  const [accessCodes, setAccessCodes] = useState<Record<string, string>>({});

  // ── session toggle (UI only for now) ───────────────────────────────
  const [inSession, setInSession] = useState(false);

  // ── confirm-turn-off dialog ────────────────────────────────────────
  const [confirmTurnOff, setConfirmTurnOff] = useState(false);


  

const readyRef = useRef(false);

// 1) startup load — the ONLY thing that sets inSession on mount
useEffect(() => {
  let cancelled = false;
  const load = async () => {
    try {
      const res = await fetch(`${defaultSetting.api_url}/site/check`, { method: "GET" });
      const text = await res.text();
      if (cancelled) return;
      setInSession(text.trim() === "TRUE");
      console.log("[Groups] initial site state:", text.trim());
    } catch (e) {
      if (cancelled) return;
      setStatus(`Network error: ${(e as Error).message}`);
    } finally {
      if (!cancelled) readyRef.current = true;
    }
  };
  load();
  return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// 2) turn ON — fires only on a subsequent false→true flip
useEffect(() => {
  if (!readyRef.current) return;  // skip the mount-time flip
  if (!inSession) return;
  if (confirmTurnOff) return;

  let cancelled = false;
  const start = async () => {
    const token = getToken();
    if (!token) { setStatus("Not logged in"); return; }
    try {
      const res = await fetch(`${defaultSetting.api_url}/site/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const text = await res.text();
      if (cancelled) return;
      setStatus(text.startsWith("OK:") ? "Site is ON" : `Turn on failed: ${text}`);
      // NO setInSession here — never roll back.
    } catch (e) {
      if (cancelled) return;
      setStatus(`Network error: ${(e as Error).message}`);
    }
  };
  start();
  return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [inSession]);

// 3) turn OFF — fires only after the user confirms
useEffect(() => {
  if (!readyRef.current) return;  // skip the mount-time state
  if (inSession) return;
  if (confirmTurnOff) return;

  let cancelled = false;
  const stop = async () => {
    const token = getToken();
    if (!token) { setStatus("Not logged in"); return; }
    try {
      const res = await fetch(`${defaultSetting.api_url}/site/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const text = await res.text();
      if (cancelled) return;
      setStatus(text.startsWith("OK:") ? "Site is OFF" : `Turn off failed: ${text}`);
      // NO setInSession here — never roll back.
    } catch (e) {
      if (cancelled) return;
      setStatus(`Network error: ${(e as Error).message}`);
    }
  };
  stop();
  return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [inSession, confirmTurnOff]);











  
  // Inject the hover stylesheet once on mount
  useEffect(() => {
    ensureActionStyles();
  }, []);

  // ── download current passwords ─────────────────────────────────────
  const downloadPasswords = async (group: string) => {
    setStatus(null);
    const text = await fetchPasswords(group, "passwords");
    if (!text.startsWith("OK:")) {
      setStatus(`Download failed for ${group}: ${text}`);
      return;
    }
    try {
      const rows = JSON.parse(text.slice(3)) as StudentPassword[];
      generateGroupPasswordsPdf(group, rows);
      setStatus(`Downloaded ${rows.length} passwords for group ${group}`);
    } catch {
      setStatus(`Unexpected response for ${group}`);
    }
  };

  // ── rotate then download ───────────────────────────────────────────
  const rotatePasswords = async (group: string) => {
    setStatus(null);
    const text = await fetchPasswords(group, "rotate/passwords");
    if (!text.startsWith("OK:")) {
      setStatus(`Rotate failed for ${group}: ${text}`);
      return;
    }
    try {
      const rows = JSON.parse(text.slice(3)) as StudentPassword[];
      generateGroupPasswordsPdf(group, rows);
      setStatus(`Rotated & downloaded ${rows.length} passwords for group ${group}`);
    } catch {
      setStatus(`Unexpected response for ${group}`);
    }
  };

  // ── access code (UI only) ──────────────────────────────────────────
const makeAccessCode = async (group: string) => {
  const token = getToken();
  if (!token) return;

  const res = await fetch(`${defaultSetting.api_url}/groups/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ group, token }),
  });

  const text = await res.text();
  if (!text.startsWith("OK:")) {
    setStatus(`Access code failed for ${group}: ${text}`);
    return;
  }

  const { token: code } = JSON.parse(text.slice(3)) as { token: string };
  setAccessCodes((prev) => ({ ...prev, [group]: code }));
};
  // ── session change: gate "turn off" behind a confirmation ──────────
  const handleSessionChange = (next: boolean) => {
    if (next === false && inSession === true) {
      // User dragged the knob off while the site was on: don't commit
      // yet. Ask first.
      setConfirmTurnOff(true);
      return;
    }
    setInSession(next);
  };

  // ── load groups on mount ───────────────────────────────────────────────
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
          setGroups(raw.map((g) => ({ id: g.name, students: g.size })));
        } else if (text.startsWith("FAIL:")) {
          setStatus(`Load failed: ${text.slice(5)}`);
        } else {
          setStatus(`Unexpected response: ${text}`);
        }
      } catch (e) {
        setStatus(`Network error: ${(e as Error).message}`);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── local edits ────────────────────────────────────────────────────────
  const addGroup = () => {
    const usedLetters = new Set(groups.map((g) => g.id));
    const nextLetter = ALPHABET.find((l) => !usedLetters.has(l));
    if (!nextLetter) return;

    setGroups((prev) => [...prev, { id: nextLetter, students: 0 }]);
    setStatus(null);
  };

  const startEdit = (group: Group) => {
    setEditingId(group.id);
    setEditValue(String(group.students));
  };

  const commitEdit = (id: string) => {
    const parsed = parseInt(editValue, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(0, Math.min(MAX_STUDENTS, parsed));
      setGroups((prev) =>
        prev.map((g) => (g.id === id ? { ...g, students: clamped } : g))
      );
      setStatus(null);
    }
    setEditingId(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const deleteGroup = (id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
    setAccessCodes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setStatus(null);
  };

  const canAdd = groups.length < ALPHABET.length;

  // ── commit to server ───────────────────────────────────────────────────
  const canCommit = useMemo(() => groups.length > 0 && !committing, [groups, committing]);

  const commitChanges = async () => {
    if (!canCommit) return;

    setCommitting(true);
    setStatus(null);

    const token = getToken();
    if (!token) {
      setStatus("Not logged in");
      setCommitting(false);
      return;
    }

    const requests = groups.map((g) => ({
      name: g.id,
      size: String(g.students),
      token,
    }));

    try {
      const res = await fetch(`${defaultSetting.api_url}/groups/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requests),
      });

      const text = await res.text();

      if (text.startsWith("OK:")) {
        setStatus(`Committed: ${text.slice(3)}`);
      } else if (text.startsWith("FAIL:")) {
        setStatus(`Commit failed: ${text.slice(5)}`);
      } else {
        setStatus(`Unexpected response: ${text}`);
      }
    } catch (e) {
      setStatus(`Network error: ${(e as Error).message}`);
    } finally {
      setCommitting(false);
    }
  };

  // ── clear all groups ───────────────────────────────────────────────────
  const clearAll = async () => {
    const token = getToken();
    if (!token) {
      setStatus("Not logged in");
      return;
    }

    setCommitting(true);
    setStatus(null);

    const requests = [{ name: "", size: "0", token }];

    try {
      const res = await fetch(`${defaultSetting.api_url}/groups/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requests),
      });

      const text = await res.text();

      if (text.startsWith("OK:")) {
        setStatus(`Cleared: ${text.slice(3)}`);
        setGroups([]);
        setAccessCodes({});
      } else if (text.startsWith("FAIL:")) {
        setStatus(`Clear failed: ${text.slice(5)}`);
      } else {
        setStatus(`Unexpected response: ${text}`);
      }
    } catch (e) {
      setStatus(`Network error: ${(e as Error).message}`);
    } finally {
      setCommitting(false);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "24px",
        boxSizing: "border-box",
        backgroundColor: commonStyles.white,
      }}
    >
      {/* Session row: labels + full-width drag slider, left-aligned with "Groups" */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          width: "100%",
        }}
      >
        <span
          style={{
            color: commonStyles.purple,
            fontSize: commonStyles.button_fontSize,
            fontWeight: commonStyles.button_fontWeight,
            whiteSpace: "nowrap",
            minWidth: "92px",
          }}
        >
          {inSession ? "Turn off Website" : "Turn on Website"}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <SessionDragSwitch
            value={inSession}
            onChange={handleSessionChange}
          />
        </div>
      </div>

      {/* Title + actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <h2
          style={{
            color: commonStyles.purple,
            fontSize: commonStyles.button_fontSize,
            fontWeight: "bold",
            margin: 0,
          }}
        >
          Groups
        </h2>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={addGroup}
            disabled={!canAdd}
            style={{
              backgroundColor: canAdd ? commonStyles.purple : commonStyles.faded_purple,
              color: commonStyles.white,
              border: "none",
              borderRadius: "12px",
              padding: "10px 20px",
              fontSize: commonStyles.button_fontSize,
              fontWeight: commonStyles.button_fontWeight,
              cursor: canAdd ? "pointer" : "not-allowed",
              transition: "background-color 0.2s ease",
            }}
          >
            + Add Group
          </button>

          <button
            onClick={commitChanges}
            disabled={!canCommit}
            style={{
              backgroundColor: canCommit ? commonStyles.purple : commonStyles.faded_purple,
              color: commonStyles.white,
              border: "none",
              borderRadius: "12px",
              padding: "10px 20px",
              fontSize: commonStyles.button_fontSize,
              fontWeight: commonStyles.button_fontWeight,
              cursor: canCommit ? "pointer" : "not-allowed",
              transition: "background-color 0.2s ease",
            }}
          >
            {committing ? "Saving..." : "Save Changes"}
          </button>

          <button
            onClick={clearAll}
            disabled={groups.length === 0 || committing}
            style={{
              backgroundColor:
                groups.length === 0 || committing
                  ? commonStyles.faded_purple
                  : commonStyles.purple,
              color: commonStyles.white,
              border: "none",
              borderRadius: "12px",
              padding: "10px 20px",
              fontSize: commonStyles.button_fontSize,
              fontWeight: commonStyles.button_fontWeight,
              cursor:
                groups.length === 0 || committing
                  ? "not-allowed"
                  : "pointer",
              transition: "background-color 0.2s ease",
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <div
          style={{
            padding: "24px",
            borderRadius: "14px",
            border: `2px dashed ${commonStyles.faded_purple}`,
            textAlign: "center",
            color: commonStyles.purple,
            fontSize: commonStyles.button_fontSize,
            fontWeight: commonStyles.button_fontWeight,
            opacity: 0.7,
          }}
        >
          No groups yet. Click "Add Group" to create one.
        </div>
      )}

      {/* Group rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {groups.map((group) => {
          const isEditing = editingId === group.id;
          const accessCode = accessCodes[group.id];

          return (
            <div
              key={group.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                padding: "14px 18px",
                borderRadius: "14px",
                border: `2px solid ${commonStyles.faded_purple}`,
                backgroundColor: commonStyles.white,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  color: commonStyles.purple,
                  fontSize: commonStyles.button_fontSize,
                  fontWeight: "bold",
                  minWidth: "120px",
                }}
              >
                Group {group.id}
              </span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flex: 1,
                }}
              >
                {isEditing ? (
                  <input
                    type="text"
                    min={0}
                    max={MAX_STUDENTS}
                    value={editValue}
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit(group.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    onBlur={() => commitEdit(group.id)}
                    style={{
                      width: "100px",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: `2px solid ${commonStyles.purple}`,
                      fontSize: commonStyles.button_fontSize,
                      fontWeight: commonStyles.button_fontWeight,
                      color: commonStyles.purple,
                      backgroundColor: commonStyles.white,
                      outline: "none",
                      textAlign: "center",
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      color: commonStyles.purple,
                      fontSize: commonStyles.button_fontSize,
                      fontWeight: commonStyles.button_fontWeight,
                    }}
                  >
                    {group.students} / {MAX_STUDENTS} students
                  </span>
                )}
              </div>

              {/* Action cluster */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexShrink: 0,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <ActionMenu
                  label="Manage"
                  items={[
                    {
                      label: "Edit",
                      onClick: () => startEdit(group),
                      disabled: isEditing,
                    },
                    {
                      label: "Delete",
                      onClick: () => deleteGroup(group.id),
                      disabled: isEditing,
                    },
                  ]}
                />

                <ActionMenu
                  label="Passwords"
                  items={[
                    {
                      label: "Download",
                      onClick: () => downloadPasswords(group.id),
                    },
                    {
                      label: "Change",
                      onClick: () => rotatePasswords(group.id),
                    },
                  ]}
                />

                <ActionButton
                  label="AC"
                  onClick={() => makeAccessCode(group.id)}
                  filled={Boolean(accessCode)}
                />

                {accessCode && (
                  <span
                    style={{
                      padding: "6px 12px",
                      borderRadius: "10px",
                      border: `2px solid ${commonStyles.purple}`,
                      color: commonStyles.purple,
                      backgroundColor: commonStyles.white,
                      fontSize: commonStyles.button_fontSize,
                      fontWeight: commonStyles.button_fontWeight,
                      letterSpacing: "2px",
                    }}
                    title={`Access code for group ${group.id}`}
                  >
                    {accessCode}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Turn-off confirmation dialog */}
      {confirmTurnOff && (
        <ConfirmDialog
          title="Turn off the website?"
          message="Are you sure you want to turn off the site? Students will not be able to access it until you turn it back on."
          confirmLabel="Yes, turn off"
          cancelLabel="Cancel"
          onConfirm={() => {
            setConfirmTurnOff(false);
            setInSession(false);
          }}
          onCancel={() => setConfirmTurnOff(false)}
        />
      )}
    </div>
  );
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────
function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onConfirm, onCancel]);

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: commonStyles.white,
          border: `2px solid ${commonStyles.purple}`,
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.18)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h3
          id="confirm-dialog-title"
          style={{
            margin: 0,
            color: commonStyles.purple,
            fontSize: commonStyles.button_fontSize,
            fontWeight: "bold",
          }}
        >
          {title}
        </h3>

        <p
          style={{
            margin: 0,
            color: commonStyles.purple,
            fontSize: commonStyles.text_font_size,
            fontWeight: commonStyles.text_font_weight,
            lineHeight: 1.4,
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={onCancel}
            className="gs-action-btn gs-action-btn--outline"
            style={{
              backgroundColor: commonStyles.white,
              color: commonStyles.purple,
              border: `2px solid ${commonStyles.purple}`,
              borderRadius: "10px",
              padding: "10px 20px",
              fontSize: commonStyles.button_fontSize,
              fontWeight: commonStyles.button_fontWeight,
              cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            className="gs-action-btn gs-action-btn--filled"
            style={{
              backgroundColor: commonStyles.purple,
              color: commonStyles.white,
              border: `2px solid ${commonStyles.purple}`,
              borderRadius: "10px",
              padding: "10px 20px",
              fontSize: commonStyles.button_fontSize,
              fontWeight: commonStyles.button_fontWeight,
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SessionDragSwitch ─────────────────────────────────────────────────────
// A horizontal track with a round knob you have to DRAG from one end to the
// other. Releasing before the knob passes the midpoint snaps it back; passing
// the midpoint snaps it fully across. Clicking without dragging does nothing.
//
// The track STRETCHES to fill its parent's width (width: "100%") so it can
// span from the far left to the far right. Its internal knob positions are
// measured in pixels against the rendered track width, so everything keeps
// working regardless of how wide the container is.





function SessionDragSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const TRACK_H = 40;
  const KNOB = 32;
  const PAD = 4;

  // Max distance the knob is allowed to travel in 500ms. Slows the feel
  // down compared to the raw 1:1 pointer mapping.
  const MAX_SPEED_PX_PER_MS = 0.6; // ≈ 300px per 500ms

  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const grabOffsetRef = useRef(0);

  // Speed limiter state
  const lastMoveTsRef = useRef<number>(0);
  const lastTargetXRef = useRef<number>(0);

  const [trackW, setTrackW] = useState(0);

  const minX = PAD;
  const maxX = Math.max(PAD, trackW - KNOB - PAD);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const measure = () => {
      setTrackW(el.clientWidth);
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (dragging) return;
    if (trackW === 0) return;
    setX(value ? maxX : minX);
  }, [value, trackW, dragging, minX, maxX]);

  const clientXToTrackX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return clientX - rect.left - 2;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (trackW === 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const px = clientXToTrackX(e.clientX);
    grabOffsetRef.current = Math.max(0, Math.min(KNOB, px - x));
    setDragging(true);

    // Seed the speed limiter with the current position so the first move
    // isn't treated as a huge jump.
    lastTargetXRef.current = x;
    lastMoveTsRef.current = performance.now();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;

    const px = clientXToTrackX(e.clientX);
    const rawTarget = px - grabOffsetRef.current;
    const target = Math.max(minX, Math.min(maxX, rawTarget));

    // ── speed limiter ────────────────────────────────────────────────
    // How far can we move toward `target` in the elapsed time?
    const now = performance.now();
    const dt = now - lastMoveTsRef.current;
    lastMoveTsRef.current = now;

    const current = lastTargetXRef.current;
    const delta = target - current;
    const maxStep = MAX_SPEED_PX_PER_MS * Math.max(dt, 0);

    let next: number;
    if (Math.abs(delta) <= maxStep) {
      // Within budget: jump straight to target (this is the normal
      // case for slow drags).
      next = target;
    } else {
      // Too far, too fast: move toward target by maxStep only.
      next = current + Math.sign(delta) * maxStep;
    }

    // Clamp again in case of rounding.
    next = Math.max(minX, Math.min(maxX, next));

    lastTargetXRef.current = next;
    setX(next);
    // ─────────────────────────────────────────────────────────────────
  };

  const settle = () => {
    if (!dragging) return;
    setDragging(false);
    const mid = (minX + maxX) / 2;
    // Decide the final state based on where the knob actually is, then
    // let the [value] effect snap it home. Don't call setX here — that
    // would fight the transition and look like a jump.
    if (x >= mid && !value) {
      onChange(true);
    } else if (x < mid && value) {
      onChange(false);
    }
    // If the knob is already on the correct side, the effect is a no-op
    // and it stays where it is.
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch { /* ignore */ }
    settle();
  };

  const onPointerCancel = () => settle();

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" && !value) {
      onChange(true);
    } else if (e.key === "ArrowLeft" && value) {
      onChange(false);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(!value);
    }
  };

  const fillWidth: number | string = dragging
    ? x + KNOB
    : value
    ? "100%"
    : 0;

  return (
    <div
      ref={trackRef}
      role="switch"
      aria-checked={value}
      aria-label="Toggle session"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
      style={{
        position: "relative",
        width: "100%",
        height: TRACK_H,
        borderRadius: TRACK_H / 2,
        border: `2px solid ${commonStyles.purple}`,
        backgroundColor: commonStyles.white,
        cursor: dragging ? "grabbing" : "grab",
        outline: "none",
        userSelect: "none",
        touchAction: "none",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: fillWidth,
          borderRadius: TRACK_H / 2,
          backgroundColor: commonStyles.faded_purple,
          opacity: value || dragging ? 1 : 0,
          transition: dragging
            ? "none"
            : "width 0.2s ease, opacity 0.15s ease",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: (TRACK_H - KNOB) / 2 - 2,
          left: x,
          width: KNOB,
          height: KNOB,
          borderRadius: "50%",
          backgroundColor: value ? commonStyles.purple : commonStyles.white,
          border: `2px solid ${commonStyles.purple}`,
          boxSizing: "border-box",
          boxShadow: "none",
          transition: dragging
            ? "none"
            : "left 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}













// ── ActionButton ──────────────────────────────────────────────────────────
function ActionButton({
  label,
  onClick,
  filled = false,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  filled?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "gs-action-btn " +
        (filled ? "gs-action-btn--filled" : "gs-action-btn--outline")
      }
      style={{
        backgroundColor: disabled
          ? commonStyles.faded_purple
          : filled
          ? commonStyles.purple
          : commonStyles.white,
        color: filled && !disabled ? commonStyles.white : commonStyles.purple,
        border: `2px solid ${commonStyles.purple}`,
        borderRadius: "10px",
        padding: "8px 16px",
        fontSize: commonStyles.button_fontSize,
        fontWeight: commonStyles.button_fontWeight,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );
}

// ── ActionMenu ────────────────────────────────────────────────────────────
type ActionMenuItem = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

function ActionMenu({
  label,
  items,
}: {
  label: string;
  items: ActionMenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <ActionButton label={`${label} ▾`} onClick={() => setOpen((o) => !o)} />

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            paddingTop: "6px",
            zIndex: 10,
          }}
        >
          <div
            style={{
              minWidth: "160px",
              display: "flex",
              flexDirection: "column",
              padding: "6px",
              borderRadius: "12px",
              border: `2px solid ${commonStyles.purple}`,
              backgroundColor: commonStyles.white,
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.12)",
            }}
          >
            {items.map((item, i) => (
              <button
                key={item.label + i}
                onClick={() => {
                  if (item.disabled) return;
                  item.onClick();
                  setOpen(false);
                }}
                disabled={item.disabled}
                className="gs-menu-item"
                style={{
                  textAlign: "left",
                  backgroundColor: "transparent",
                  border: "none",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  color: item.disabled
                    ? commonStyles.faded_purple
                    : commonStyles.purple,
                  fontSize: commonStyles.button_fontSize,
                  fontWeight: commonStyles.button_fontWeight,
                  cursor: item.disabled ? "not-allowed" : "pointer",
                  transition: "background-color 0.15s ease",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}