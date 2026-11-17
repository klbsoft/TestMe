import { commonStyles } from "../../../components/theme/default";
import { type SpeakingUnit } from "../../../session/UserSession";
import ScorePicker from "./ScorePicker";

export default function UnitsList({
  units,
  scores,
  onScore,
}: {
  units: SpeakingUnit[];
  scores: Record<string, number>;
  onScore: (unitId: string, score: number) => void;
}) {
  const contentUnits = units.filter((u) => !u.id.startsWith("dialog_"));

  const describeUnits = contentUnits
    .filter((u) => u.phase === "describe_image")
    .slice(0, 4);

  const repeatUnits = contentUnits
    .filter((u) => u.phase === "repeat_audio")
    .slice(0, 4);

  const displayUnits =
    describeUnits.length + repeatUnits.length > 0
      ? [...describeUnits, ...repeatUnits]
      : contentUnits.slice(0, 8);

  return (
    <>
      {displayUnits.map((unit) => {
        const isDescribe = unit.phase === "describe_image";

        return (
          <div
            key={unit.id}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75em",
              padding: "0.75em 1em",
              border: `1px solid ${commonStyles.faded_purple}`,
              borderRadius: "6px",
              color: commonStyles.purple,
              fontSize: commonStyles.button_fontSize,
              fontWeight: commonStyles.button_fontWeight,
              marginBottom: "0.5em",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "1em",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.85em",
                    opacity: 0.8,
                    marginBottom: 4,
                  }}
                >
                  Student Answer
                </div>
                <audio
                  controls
                  src={unit.answer ?? undefined}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {isDescribe ? (
                  <img
                    src={unit.content}
                    alt={unit.id}
                    style={{
                      width: "70%",
                      height: "70%",
                      objectFit: "cover",
                      borderRadius: 6,
                      border: `1px solid ${commonStyles.faded_purple}`,
                      marginLeft: "30%",
                      display: "block",
                    }}
                  />
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: "0.85em",
                        opacity: 0.8,
                        marginBottom: 4,
                      }}
                    >
                      Prompt Audio
                    </div>
                    <audio
                      controls
                      src={unit.content ?? undefined}
                      style={{ width: "100%" }}
                    />
                  </>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75em",
                borderTop: `1px solid ${commonStyles.faded_purple}`,
                paddingTop: "0.75em",
              }}
            >
              <span style={{ fontSize: "0.85em", opacity: 0.8 }}>Score</span>
              <ScorePicker
                value={scores[unit.id]}
                onChange={(n) => onScore(unit.id, n)}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}