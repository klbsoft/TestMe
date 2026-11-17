import { useEffect, useRef, useState } from "react";
import { commonStyles } from "../../../components/theme/default";
import {
  fetchCurrentAssignment,
  fetchResourceBlob,
  fetchResourceAsFile,
  submitAssignment,
  type SubmitMeta,
} from "./api";
import { initialState, type AssignmentKind, type DraftUnit } from "./types";
import UnitEditor from "./UnitEditor";
import { showToast } from "../../../components/toast/Toast";
import { inputStyle, labelStyle } from "./styles";

const KIND_OPTIONS: { value: AssignmentKind; label: string }[] = [
  { value: "speaking", label: "Speaking" },
  { value: "listening", label: "Listening" },
  { value: "writing", label: "Writing" },
];

export default function Create() {
  const [units, setUnits] = useState<DraftUnit[]>(initialState);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState(true);

  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<AssignmentKind>("speaking");
  const [maxAttempts, setMaxAttempts] = useState(1);

  const loadedOnce = useRef(false);
  // keep the latest units available to the unmount cleanup
  const unitsRef = useRef(units);
  unitsRef.current = units;

  // ── 1) LOAD + HYDRATE FROM SERVER (once) ────────────────────────────
  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;

    (async () => {
      try {
        const current = await fetchCurrentAssignment();
        if (!current) {
          setHydrating(false);
          return;
        }

        setLabel(current.label);
        setKind(current.assigment_type as AssignmentKind);
        setMaxAttempts(current.max_attempts);

        let loadedUnits: DraftUnit[] | null = null;
        try {
          const parsed = JSON.parse(current.json) as {
            assignment?: { units?: DraftUnit[] };
          };
          const parsedUnits = parsed.assignment?.units;
          if (Array.isArray(parsedUnits) && parsedUnits.length > 0) {
            loadedUnits = parsedUnits;
            setUnits(parsedUnits);
          }
        } catch {
          setHydrating(false);
          return;
        }

        if (!loadedUnits) {
          setHydrating(false);
          return;
        }

        // hydrate previews: fetch each stored URL as a blob URL
        const hydrated = await Promise.all(
          loadedUnits.map(async (u) => {
            if (!u.content || !u.content.startsWith("http")) return u;
            const blobUrl = await fetchResourceBlob(u.content);
            if (!blobUrl) return u;
            return { ...u, contentPreview: blobUrl };
          })
        );

        setUnits(hydrated);
      } finally {
        setHydrating(false);
      }
    })();
  }, []);

  // ── 2) TOAST ON STATUS ──────────────────────────────────────────────
  useEffect(() => {
    if (status !== null) showToast(status);
  }, [status]);

  // ── 3) UNMOUNT CLEANUP — revoke ALL object URLs ─────────────────────
  useEffect(() => {
    return () => {
      unitsRef.current.forEach((u) => {
        if (u.contentPreview) URL.revokeObjectURL(u.contentPreview);
      });
    };
  }, []);

  // ── 4) EDIT HANDLER (pass down) ─────────────────────────────────────
  const update = (id: string, patch: Partial<DraftUnit>) =>
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        // if we're replacing the preview, revoke the old one
        if (
          patch.contentPreview !== undefined &&
          u.contentPreview &&
          u.contentPreview !== patch.contentPreview
        ) {
          URL.revokeObjectURL(u.contentPreview);
        }
        return { ...u, ...patch };
      })
    );

  // ── 5) BUILD / SAVE ─────────────────────────────────────────────────
  const buildAssignment = async () => {
    if (!label.trim()) {
      setStatus("FAIL:Label is required");
      return;
    }
    if (maxAttempts < 1) {
      setStatus("FAIL:Max attempts must be at least 1");
      return;
    }

    setSaving(true);
    setStatus(null);

    const meta: SubmitMeta = {
      label: label.trim(),
      kind,
      maxAttempts,
    };

    try {
      const text = await submitAssignment(units, meta);

      if (text.startsWith("OK:")) {
        setStatus(`OK:${text.slice(3)}`);

        // after success: revoke local previews, clear pending file,
        // re-fetch the saved assignment so every unit.content is the
        // real server URL and every contentPreview is a fresh blob.
        unitsRef.current.forEach((u) => {
          if (u.contentPreview) URL.revokeObjectURL(u.contentPreview);
        });

        const refreshed = await fetchCurrentAssignment();
        if (refreshed) {
          try {
            const parsed = JSON.parse(refreshed.json) as {
              assignment?: { units?: DraftUnit[] };
            };
            const freshUnits = parsed.assignment?.units;
            if (Array.isArray(freshUnits) && freshUnits.length > 0) {
              setUnits(freshUnits);

              const hydrated = await Promise.all(
                freshUnits.map(async (u) => {
                  if (!u.content || !u.content.startsWith("http")) return u;
                  const blobUrl = await fetchResourceBlob(u.content);
                  if (!blobUrl) return u;
                  return { ...u, contentPreview: blobUrl };
                })
              );
              setUnits(hydrated);
            }
          } catch {
            // leave UI as-is on refresh failure
          }
        }
      } else if (text.startsWith("FAIL:")) {
        setStatus(`FAIL:${text.slice(5)}`);
      } else {
        setStatus(`FAIL:Unexpected: ${text}`);
      }
    } catch (e) {
      setStatus(`FAIL:Network error: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  if (hydrating) {
    return (
      <div
        style={{
          padding: "2em",
          color: commonStyles.purple,
          fontSize: commonStyles.button_fontSize,
          fontWeight: commonStyles.button_fontWeight,
        }}
      >
        Loading assignment…
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: commonStyles.button_fontSize,
        fontWeight: commonStyles.button_fontWeight,
      }}
    >
      <h2
        style={{
          color: commonStyles.purple,
          fontSize: commonStyles.button_fontSize,
          fontWeight: commonStyles.button_fontWeight,
          marginBottom: "20px",
        }}
      >
        <strong>Create</strong>
      </h2>

      <div
        style={{
          border: `2px solid ${commonStyles.faded_purple}`,
          borderRadius: "8px",
          padding: "1em",
          background: commonStyles.white,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.75em",
            flexWrap: "wrap",
            marginBottom: "1.25em",
          }}
        >
          <div style={{ flex: "1 1 260px" }}>
            <label style={labelStyle}>Label</label>
            <input
              type="text"
              style={inputStyle}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Talking about nature."
            />
          </div>

          <div style={{ flex: "0 0 180px" }}>
            <label style={labelStyle}>Assignment type</label>
            <select
              style={inputStyle}
              value={kind}
              onChange={(e) => setKind(e.target.value as AssignmentKind)}
            >
              {KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: "0 0 140px" }}>
            <label style={labelStyle}>Max attempts</label>
            <input
              type="text"
              min={1}
              style={inputStyle}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
            />
          </div>
        </div>

        <h3 style={{ margin: "0 0 0.5em", color: commonStyles.purple }}>Describe image</h3>
        {units.filter((u) => u.phase === "describe_image").map((unit) => (
          <UnitEditor key={unit.id} unit={unit} onUpdate={update} />
        ))}

        <h3 style={{ margin: "1em 0 0.5em", color: commonStyles.purple }}>Repeat audio</h3>
        {units.filter((u) => u.phase === "repeat_audio").map((unit) => (
          <UnitEditor key={unit.id} unit={unit} onUpdate={update} />
        ))}

        <div
          style={{
            marginTop: "1.25em",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75em",
          }}
        >
          <button
            type="button"
            onClick={buildAssignment}
            disabled={saving}
            style={{
              padding: "0.6em 1.4em",
              border: `1px solid ${commonStyles.purple}`,
              borderRadius: 6,
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: commonStyles.button_fontSize,
              fontWeight: commonStyles.button_fontWeight,
              color: commonStyles.white,
              background: saving ? commonStyles.faded_purple : commonStyles.purple,
            }}
          >
            {saving ? "Saving…" : "Build assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}