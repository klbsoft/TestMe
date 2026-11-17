import { defaultSetting, getToken } from "../../../components/theme/default";
import { showToast } from "../../../components/toast/Toast";

export interface AttemptRow {
  id: string;
  user: string;
  code: string;
  group: string;
  attempt: number;
  max_attempts: number; 
  assigment_id: string;
  assigment_label: string; 
  assigment_type: string; 
  grade: string; // "" = ungraded
  window: number;
  json: string; // the full assignment/answer blob for this attempt
}

/**
 * POST /assigment/attempts
 *
 * - `token` empty            → toast the error, return the failure string.
 * - network / parse failure  → toast the error, return the failure string.
 * - `FAIL:...` from server   → toast the error, return the failure string.
 * - `OK:[...]` from server   → return the parsed `AttemptRow[]`.
 */
export async function getAttempts(token: string): Promise<AttemptRow[] | string> {
  if (!token) {
    const msg = "FAIL:No session token";
    showToast(msg);
    return msg;
  }

  let text: string;
  try {
    const res = await fetch(`${defaultSetting.api_url}/assigment/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    text = await res.text();
  } catch (e) {
    const msg = `FAIL:Network error: ${String(e)}`;
    showToast(msg);
    return msg;
  }

  if (!text.startsWith("OK:")) {
    showToast(text);
    return text.startsWith("FAIL:") ? text : `FAIL:${text}`;
  }

  try {
    const rows = JSON.parse(text.slice(3)) as AttemptRow[];
    console.log(rows);
    return rows;
  } catch (e) {
    const msg = `FAIL:Invalid attempts payload: ${String(e)}`;
    showToast(msg);
    return msg;
  }
}



// src/pages/manager/grades/api.ts — add this next to getAttempts

/**
 * POST /assigment/attempt/grade
 *
 * Body: { token, attempt, grade }
 *   - `attempt` is the attempt id (the `id` field on AttemptRow)
 *   - `grade` is "0".."4" or "" for ungraded
 *
 * Returns the server's raw response: `OK:...` or `FAIL:...`.
 * Toasts any failure and returns it as a string so the caller can react.
 */
export async function gradeAttempt(
  attemptId: string,
  grade: string
): Promise<string> {
  const token = getToken();
  if (!token) {
    const msg = "FAIL:No session token";
    showToast(msg);
    return msg;
  }

  let text: string;
  try {
    const res = await fetch(
      `${defaultSetting.api_url}/assigment/attempt/grade`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          attempt: attemptId,
          grade,
        }),
      }
    );
    text = await res.text();
  } catch (e) {
    const msg = `FAIL:Network error: ${String(e)}`;
    showToast(msg);
    return msg;
  }

  if (!text.startsWith("OK:")) {
    showToast(text);
    return text.startsWith("FAIL:") ? text : `FAIL:${text}`;
  }

  showToast("OK:Grade saved");
  return text;
}