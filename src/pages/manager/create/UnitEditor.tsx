import { commonStyles, defaultSetting } from "../../../components/theme/default";
import MediaField from "./MediaField";
import { inputStyle, labelStyle } from "./styles";
import type { DraftUnit } from "./types";

type Props = {
  unit: DraftUnit;
  onUpdate: (id: string, patch: Partial<DraftUnit>) => void;
};

/** Convert "dialog_1" → "Dialog 1", "unit_3" → "Unit 3". Falls back to the raw id. */
function displayLabel(id: string): string {
  const m = id.match(/^([a-z]+)_(\d+)$/i);
  if (!m) return id;
  const [, word, num] = m;
  return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()} ${num}`;
}

export default function UnitEditor({ unit, onUpdate }: Props) {
  const isDescribe = unit.phase === "describe_image";
  const isDialog = unit.id.startsWith("dialog_");
  const contentIsImage = isDescribe && !isDialog;
  const contentAccept = contentIsImage ? "image/*" : "audio/*";
  const contentLabel = contentIsImage
    ? "Image to describe"
    : isDescribe
    ? "Intro audio"
    : "Audio to hear";

  return (
    <div
      style={{
        border: `1px solid ${commonStyles.faded_purple}`,
        borderRadius: "8px",
        padding: "0.75em 1em",
        marginBottom: "0.75em",
        background: isDialog ? commonStyles.faded_purple : commonStyles.white,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5em",
        }}
      >
        <strong style={{ color: commonStyles.purple }}>
          {displayLabel(unit.id)}
          {isDialog && " (intro)"}
        </strong>
        <span style={{ fontSize: "0.8em", color: commonStyles.purple, opacity: 0.7 }}>
          {unit.phase}
        </span>
      </div>

      <div style={{ display: "flex", gap: "0.75em", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px" }}>
          <MediaField
            label={contentLabel}
            accept={contentAccept}
            file={unit.contentFile}
            path={unit.content}
            previewUrl={unit.contentPreview}
            isImage={contentIsImage}
            onChange={(f, name, url) =>
              onUpdate(unit.id, {
                contentFile: f,
                contentPreview: url,
                content: name
                  ? `${contentIsImage ? defaultSetting.base_bank + "test/" : defaultSetting.base_audio}${name}`
                  : "",
              })
            }
          />
        </div>

        <div style={{ flex: "0 0 100px" }}>
          <label style={labelStyle}>Think (s)</label>
          <input
            type="text"
            style={inputStyle}
            value={unit.thinking_time}
            onChange={(e) => onUpdate(unit.id, { thinking_time: Number(e.target.value) })}
          />
        </div>

        <div style={{ flex: "0 0 100px" }}>
          <label style={labelStyle}>Speak (s)</label>
          <input
            type="text"
            style={inputStyle}
            value={unit.speaking_time}
            onChange={(e) => onUpdate(unit.id, { speaking_time: Number(e.target.value) })}
          />
        </div>
      </div>

      {isDescribe && (
        <div style={{ marginTop: "0.5em" }}>
          <label style={labelStyle}>Helpful sentence</label>
          <textarea
            style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
            value={unit.helpful_sentence ?? ""}
            onChange={(e) => onUpdate(unit.id, { helpful_sentence: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}