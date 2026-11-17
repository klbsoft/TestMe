// import { commonStyles, defaultSetting } from "./components/theme/default";

import { commonStyles, defaultSetting } from "../../components/theme/default";

 

type Props = {
  reason?: string;
};

export default function CheatDetected({ reason }: Props) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          backgroundColor: commonStyles.clear_purple,
          borderRadius: "22px",
          padding: "40px 60px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          border: `solid 2px ${commonStyles.white}`,
          maxWidth: "500px",
          width: "100%",
        }}
      >
        <img
          src={`${defaultSetting.base_bot}bot-sad.svg`}
          width={"140px"}
          height={"140px"}
          alt="sad bot"
        />
        <h1
          style={{
            color: commonStyles.white,
            fontSize: "24px",
            fontWeight: "bold",
            margin: 0,
            textAlign: "center",
          }}
        >
          Cheating detected
        </h1>
        <p
          style={{
            color: commonStyles.white,
            fontSize: commonStyles.button_fontSize,
            fontWeight: commonStyles.button_fontWeight,
            margin: 0,
            textAlign: "center",
            lineHeight: "1.4",
          }}
        >
          A cheating condition was met... the bot is sad because you're trying
          to cheat.
        </p>
        {reason && (
          <p
            style={{
              color: commonStyles.white,
              fontSize: commonStyles.button_fontSize,
              opacity: 0.7,
              margin: 0,
              textAlign: "center",
            }}
          >
            Reason: {reason}
          </p>
        )}
      </div>
    </div>
  );
}