import { useEffect, useState } from "react";
import { defaultSetting, commonStyles } from "../../components/theme/default";
import { useAssignmentState } from "../../context/AssignmentStateContext";
import { revokeAttemptBlobs, submitAttempt } from "../home/api";

// Module-level promise — survives React StrictMode's mount → unmount → remount.
// Both mounts share the same in-flight submit; only one network call happens.
let sharedSubmit: Promise<string> | null = null;

export default function Completed({
  setter,
}: {
  setter: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { session } = useAssignmentState();
  const [done, setDone] = useState(false);
  const [submitted,setSubmit] = useState(false); 

    useEffect(()=>{
      if(submitted === true){
        setTimeout(()=>{
          window.location.replace("/testme/student");
        },3_000);
      }
    },[submitted]);

  useEffect(() => {
    if (!session) return;

    if (!sharedSubmit) {
      sharedSubmit = submitAttempt(session).then((text) => {
        console.log("submit:", text);
        revokeAttemptBlobs(session);
        setSubmit(true);
        return text;
      });
    }

    let cancelled = false;
    sharedSubmit.then(() => {
      if (!cancelled) setDone(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => {
      sharedSubmit = null;   // reset for the next attempt
      setter(false);
    }, 10000);
    return () => clearTimeout(id);
  }, [done, setter]);

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
        {!done ? (
          <>
            <Spinner />
            <h1
              style={{
                color: commonStyles.white,
                fontSize: "24px",
                fontWeight: "bold",
                margin: 0,
                textAlign: "center",
              }}
            >
              Saving your answers…
            </h1>
            <p
              style={{
                color: commonStyles.white,
                fontSize: commonStyles.button_fontSize,
                fontWeight: commonStyles.text_font_weight,
                margin: 0,
                textAlign: "center",
                lineHeight: "1.4",
              }}
            >
              Please wait while we finish submitting your assignment.
            </p>
          </>
        ) : (
          <>
            <img
              src={`${defaultSetting.base_bot}bot-exited-static.svg`}
              width={"140px"}
              height={"140px"}
              alt="bot"
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
              Congratulations!
            </h1>
            <p
              style={{
                color: commonStyles.white,
                fontSize: commonStyles.button_fontSize,
                fontWeight: commonStyles.text_font_weight,
                margin: 0,
                textAlign: "center",
                lineHeight: "1.4",
              }}
            >
              You have completed this assignment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────
function Spinner() {
  return (
    <>
      <style>{`
        @keyframes testme-spinner {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          border: `6px solid ${commonStyles.faded_purple}`,
          borderTopColor: commonStyles.white,
          animation: "testme-spinner 0.9s linear infinite",
        }}
      />
    </>
  );
}