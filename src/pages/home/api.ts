import { defaultSetting, getToken, setToken } from "../../components/theme/default";

import type {
  AssignmentSession,
  SpeakingAssignment,
  SpeakingUnit,
} from "../../session/UserSession";
 

type AttemptResponse = {
  json: string;
  token: string;
};

type AttemptContext = {
  assignmentId: string;
  contentUrls: Map<string, string>;
  token: string;
};

let activeAttempt: AttemptContext | null = null;

export function getActiveAttempt(): AttemptContext | null {
  return activeAttempt;
}

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
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export async function startAttempt(): Promise<AssignmentSession | null> {
  const token = getToken();
  if (!token) return null;

  // 1) request attempt
  let payload: AttemptResponse;
  try {
    const res = await fetch(`${defaultSetting.api_url}/assigment/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const text = await res.text();
    if (!text.startsWith("OK:")) {
      console.warn("startAttempt:", text);
      return null;
    }
    payload = JSON.parse(text.slice(3)) as AttemptResponse;
  } catch (e) {
    console.warn("startAttempt network error:", (e as Error).message);
    return null;
  }

  // 2) parse assignment
  let assignment: SpeakingAssignment;
  try {
    const parsed = JSON.parse(payload.json) as {
      assignment?: SpeakingAssignment;

    };
    if (!parsed.assignment) return null;
    assignment = parsed.assignment as SpeakingAssignment; 
    // const units = assignment.units as SpeakingUnit[] ; 
    assignment = scrambleSpeakingAssignment(assignment); 

  } catch {
    return null;
  }

  // 3) hydrate media, record original URLs
  const contentUrls = new Map<string, string>();
  const units = assignment.units ?? [];
  const hydratedUnits: SpeakingUnit[] = await Promise.all(
    units.map(async (unit) => {
      let content = unit.content ?? "";
      let answer: any = unit.answer ?? "";

      if (typeof content === "string" && content.startsWith("http")) {
        contentUrls.set(unit.id, content);
        const blob = await fetchResourceBlob(content, payload.token);
        if (blob) content = blob;
      }

      if (typeof answer === "string" && answer.startsWith("http")) {
        const blob = await fetchResourceBlob(answer, payload.token);
        if (blob) answer = blob;
      }

      return { ...unit, content, answer };
    })
  );

  const hydratedAssignment: SpeakingAssignment = {
    ...assignment,
    units: hydratedUnits,
  };

  // 4) keep attempt context
  activeAttempt = {
    assignmentId: assignment.id,
    contentUrls,
    token: payload.token,
  };

  // 5) switch token to attempt token
  setToken(payload.token);

  return {
    id: assignment.id,
    user: "attempt",
    assignment: hydratedAssignment,
  };
}

export async function submitAttempt(
  session: AssignmentSession
): Promise<string> {
  if (!activeAttempt) {
    return "FAIL:No active attempt — call startAttempt first";
  }

  if (session.assignment.type !== "speaking") {
    return "FAIL:Only speaking assignments supported";
  }

  const assignment = session.assignment;
  const ctx = activeAttempt;

  // 1) upload answers — handle File, Blob, and "blob:" string uniformly
  const answerUploads = new Map<string, string>();

  for (const unit of assignment.units) {
    const rawAnswer: any = (unit as any).answer;
    const pending: File | undefined = (unit as any).answerFile;

    let file: File | null = null;

    if (pending instanceof File) {
      file = pending;
    } else if (typeof rawAnswer === "string" && rawAnswer.startsWith("blob:")) {
      try {
        const res = await fetch(rawAnswer);
        const blob = await res.blob();
        file = new File([blob], `answer-${unit.id}.webm`, {
          type: blob.type || "audio/webm",
        });
      } catch {
        return `FAIL:Could not read answer for ${unit.id}`;
      }
    } else if (rawAnswer instanceof Blob) {
      file = new File([rawAnswer], `answer-${unit.id}.webm`, {
        type: rawAnswer.type || "audio/webm",
      });
    }

    if (!file) continue;

    const resp = await uploadAnswerFile(file, ctx.token, ctx.assignmentId);
    if (!resp.startsWith("OK:")) {
      return `FAIL:Upload failed for ${unit.id}: ${resp}`;
    }
    answerUploads.set(unit.id, resp.slice(3).trim());
  }

  // 2) build payload
  const payload = {
    assignment: {
      id: ctx.assignmentId,
      type: assignment.type,
      grade: null,
      units: assignment.units.map((u) => {
        const originalContent = ctx.contentUrls.get(u.id) ?? u.content;
        const uploadedAnswer = answerUploads.get(u.id) ?? null;

        return {
          id: u.id,
          phase: u.phase,
          content: originalContent,
          ...(u.helpful_sentence !== undefined
            ? { helpful_sentence: u.helpful_sentence }
            : {}),
          answer: uploadedAnswer,
          grade: null,
          thinking_time: u.thinking_time,
          speaking_time: u.speaking_time,
        };
      }),
    },
  };

  // 3) POST to complete_attempt
  try {
    const res = await fetch(
      `${defaultSetting.api_url}/assigment/attempt/completed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: ctx.token,
          json: JSON.stringify(payload),
        }),
      }
    );
    return await res.text();
  } catch (e) {
    return `FAIL:Network error: ${(e as Error).message}`;
  }
}

async function uploadAnswerFile(
  file: File,
  token: string,
  bond: string
): Promise<string> {
  const fd = new FormData();
  fd.append("token", token);
  fd.append("bond", bond);
  fd.append("file", file, file.name);

  try {
    const res = await fetch(`${defaultSetting.api_url}/upload`, {
      method: "POST",
      body: fd,
    });
    return await res.text();
  } catch (e) {
    return `FAIL:Network error: ${(e as Error).message}`;
  }
}








export function revokeAttemptBlobs(session: AssignmentSession | null) {
  if (!session || session.assignment.type !== "speaking") return;
  session.assignment.units.forEach((u) => {
    if (typeof u.content === "string" && u.content.startsWith("blob:")) {
      URL.revokeObjectURL(u.content);
    }
    if (typeof u.answer === "string" && u.answer.startsWith("blob:")) {
      URL.revokeObjectURL(u.answer);
    }
  });
  activeAttempt = null;
}












/**
 * Draw-without-replacement shuffle.
 *
 * Given [a, b, c, d, e], we repeatedly:
 *   - pick a random index i from the remaining list
 *   - remove and push that element onto the output
 * So each output slot is a random element that hasn't been used yet.
 *
 * Example for [0,1,2,3,4]:
 *   remaining=[0,1,2,3,4]  pick 2  → out=[2], remaining=[0,1,3,4]
 *   remaining=[0,1,3,4]    pick 3  → out=[2,3], remaining=[0,1,4]
 *   remaining=[0,1,4]      pick 0  → out=[2,3,0], remaining=[1,4]
 *   remaining=[1,4]        pick 4  → out=[2,3,0,4], remaining=[1]
 *   remaining=[1]          pick 1  → out=[2,3,0,4,1]
 */
export function drawShuffle<T>(input: T[]): T[] {
  const remaining = [...input];
  const out: T[] = [];
  while (remaining.length > 0) {
    const i = Math.floor(Math.random() * remaining.length);
    out.push(remaining[i]);
    remaining.splice(i, 1);
  }
  return out;
}

/**
 * Scramble the 12-unit speaking assignment with draw-without-replacement,
 * keeping the dialogs at index 0 and 6 fixed.
 *
 *   0      = dialog  (fixed)
 *   1..5   = block A (5 questions, drawn without replacement)
 *   6      = dialog  (fixed)
 *   7..11  = block B (5 questions, drawn without replacement)
 */
export function scrambleSpeakingAssignment(
  assignment: SpeakingAssignment
): SpeakingAssignment {
  const units = assignment.units;

  if (units.length !== 12) {
    console.error(
      `[scramble] expected 12 units, got ${units.length} — returning unchanged`
    );
    return { ...assignment, units: [...units] };
  }

  const blockA = drawShuffle(units.slice(1, 6));
  const blockB = drawShuffle(units.slice(7, 12));

  const out: SpeakingUnit[] = [
    units[0],   // 0: dialog
    blockA[0],  // 1
    blockA[1],  // 2
    blockA[2],  // 3
    blockA[3],  // 4
    blockA[4],  // 5
    units[6],   // 6: dialog
    blockB[0],  // 7
    blockB[1],  // 8
    blockB[2],  // 9
    blockB[3],  // 10
    blockB[4],  // 11
  ];

  console.log(
    "[scramble] ids before:",
    units.map((u) => u.id).join(","),
  );
  console.log(
    "[scramble] ids after :",
    out.map((u) => u.id).join(","),
  );

  return { ...assignment, units: out };
}