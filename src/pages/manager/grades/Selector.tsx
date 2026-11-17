import { useEffect, useState } from "react";
import { commonStyles, defaultSetting, getToken } from "../../../components/theme/default";

const optionBase: React.CSSProperties = {
  padding: "0.5em 1em",
  color: commonStyles.purple,
  background: commonStyles.white,
  cursor: "pointer",
  transition: "background-color 0.15s ease, color 0.15s ease",
};

type ServerGroup = { name: string; size: number };

type Props = {
  onChange?: (group: string) => void;
};

export function GradesSelect({ onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ServerGroup[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${defaultSetting.api_url}/groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const text = await res.text();

        if (text.startsWith("OK:")) {
          const raw = JSON.parse(text.slice(3)) as ServerGroup[];
          setOptions(raw);
          if (raw.length > 0) {
            setSelected((prev) => prev || raw[0].name);
          }
        } else {
          setOptions([]);
        }
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // notify parent whenever the selection changes (including default)
  useEffect(() => {
    if (selected) onChange?.(selected);
  }, [selected]);

  const selectedLabel =
    options.find((o) => o.name === selected)?.name ?? "";

  return (
    <div
      className="grades-container"
      style={{
        position: "relative",
        display: "inline-block",
        width: "clamp(140px, 30vw, 220px)",
        fontFamily: "system-ui, sans-serif",
        fontSize: commonStyles.button_fontSize,
        fontWeight: commonStyles.button_fontWeight,
      }}
    >
      <div
        onClick={() => {
          if (!loading && options.length > 0) setOpen((o) => !o);
        }}
        style={{
          padding: "0.6em 1em",
          color: commonStyles.purple,
          background: commonStyles.white,
          border: `2px solid ${
            open ? commonStyles.clear_purple : commonStyles.faded_purple
          }`,
          boxShadow: open ? `0 0 0 3px ${commonStyles.faded_purple}` : "none",
          borderRadius: "8px",
          cursor: loading || options.length === 0 ? "not-allowed" : "pointer",
          userSelect: "none",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Loading…" : selectedLabel || "No groups"}
      </div>

      {open && options.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: commonStyles.white,
            border: `2px solid ${commonStyles.faded_purple}`,
            borderRadius: "8px",
            overflow: "hidden",
            zIndex: 10,
          }}
        >
          {options.map((opt, i) => (
            <div
              key={opt.name}
              style={{
                ...optionBase,
                borderTop:
                  i === 0 ? "none" : `1px solid ${commonStyles.faded_purple}`,
                ...(opt.name === selected
                  ? { background: commonStyles.purple, color: commonStyles.white }
                  : {}),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = commonStyles.purple;
                e.currentTarget.style.color = commonStyles.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  opt.name === selected ? commonStyles.purple : commonStyles.white;
                e.currentTarget.style.color =
                  opt.name === selected ? commonStyles.white : commonStyles.purple;
              }}
              onClick={() => {
                setSelected(opt.name);
                setOpen(false);
              }}
            >
              {opt.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}