import { defaultSetting, getToken } from "../../../components/theme/default";
import { randomString } from "../../../tools/random";
import type { AssignmentKind, DraftUnit } from "./types";

export async function uploadFile(file: File,bond:string): Promise<string> {
  const token = getToken();
  if (!token) return "FAIL:Not logged in";

  const fd = new FormData();
  fd.append("token", token);
  fd.append("bond",bond);
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

export type SubmitMeta = {
  label: string;
  kind: AssignmentKind;
  maxAttempts: number;
};

// /**
//  * Upload all pending files and POST the resulting assignment JSON.
//  * Returns the server's raw response (`OK:...` or `FAIL:...`).
//  */
// export async function submitAssignment(
//   units: DraftUnit[],
//   meta: SubmitMeta
// ): Promise<string> {
//   const token = getToken();
//   if (!token) return "FAIL:Not logged in";

//   // 1) upload every pending file
//   const uploadResults = new Map<string, string>();
//   const bond = randomString(32);
//   for (const unit of units) {
//     if (!unit.contentFile) continue;
//     const resp = await uploadFile(unit.contentFile,bond);
//     if (!resp.startsWith("OK:")) {
//       return `FAIL:Upload failed for ${unit.id}: ${resp}`;
//     }
//     uploadResults.set(unit.id, resp.slice(3).trim());
//   }

//   // 2) build payload with resolved URLs
//   const payload = {
//     assignment: {
//       id: `assigment_${Date.now()}`,
//       type: meta.kind,
//       grade: null,
//       units: units.map((u) => ({
//         id: u.id,
//         phase: u.phase,
//         content: uploadResults.get(u.id) ?? u.content,
//         ...(u.helpful_sentence !== undefined ? { helpful_sentence: u.helpful_sentence } : {}),
//         answer: u.answer || null,
//         grade: null,
//         thinking_time: u.thinking_time,
//         speaking_time: u.speaking_time,
//       })),
//     }
//   };

//   // 3) POST stringified payload + meta
//   try {
//     const res = await fetch(`${defaultSetting.api_url}/assigment/update`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         token,
//         json: JSON.stringify(payload),
//         max_attempts: meta.maxAttempts,
//         label: meta.label,
//         assigment_type: meta.kind,
//         bond: bond,
//       }),
//     });
//     return await res.text();
//   } catch (e) {
//     return `FAIL:Network error: ${(e as Error).message}`;
//   }
// }


export type AssignmentRecord = {
  json: string;
  max_attempts: number;
  label: string;
  assigment_type: string;
  bond: string;
};

export async function fetchCurrentAssignment(): Promise<AssignmentRecord | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${defaultSetting.api_url}/assigment/teacher/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const text = await res.text();
    if (!text.startsWith("OK:")) return null;
    return JSON.parse(text.slice(3)) as AssignmentRecord;
  } catch {
    return null;
  }
}

export async function fetchResourceBlob(resourceUrl: string): Promise<string | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(resourceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      console.warn("fetchResourceBlob: HTTP", res.status, "for", resourceUrl);
      return null;
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.startsWith("text/")) {
      const text = await res.text();
      console.warn("fetchResourceBlob: server said", text);
      return null;
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn("fetchResourceBlob: network error", (e as Error).message);
    return null;
  }
}




// ... existing uploadFile, fetchCurrentAssignment, fetchResourceBlob ...

/**
 * Fetch an existing server resource as a File so it can be re-uploaded
 * under a new bond. Returns null on any failure.
 */
export async function fetchResourceAsFile(resourceUrl: string): Promise<File | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(resourceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    if (contentType.startsWith("text/")) return null;

    const blob = await res.blob();
    const name = resourceUrl.split("/").pop() ?? `file-${Date.now()}`;
    return new File([blob], name, { type: contentType });
  } catch {
    return null;
  }
}

export async function submitAssignment(
  units: DraftUnit[],
  meta: SubmitMeta
): Promise<string> {
  const token = getToken();
  if (!token) return "FAIL:Not logged in";

  // generate ONE bond for this save
  const bond = randomString(32);

  const uploadResults = new Map<string, string>();
  for (const unit of units) {
    // ── PICK WHAT TO UPLOAD ───────────────────────────────────────
    let fileToUpload: File | null = null;

    if (unit.contentFile) {
      // pending file (fresh pick or recording)
      fileToUpload = unit.contentFile;
    } else if (unit.content && unit.content.startsWith("http")) {
      // unchanged unit loaded from server → re-upload under new bond
      fileToUpload = await fetchResourceAsFile(unit.content);
      if (!fileToUpload) {
        return `FAIL:Could not reload existing file for ${unit.id}`;
      }
    } else {
      // no file for this unit at all → skip
      continue;
    }

    const resp = await uploadFile(fileToUpload, bond);
    if (!resp.startsWith("OK:")) {
      return `FAIL:Upload failed for ${unit.id}: ${resp}`;
    }
    uploadResults.set(unit.id, resp.slice(3).trim());
  }

  // build payload
  const payload = {
    assignment: {
      id: `assigment_${Date.now()}`,
      type: meta.kind,
      grade: null,
      units: units.map((u) => ({
        id: u.id,
        phase: u.phase,
        content: uploadResults.get(u.id) ?? u.content,
        ...(u.helpful_sentence !== undefined ? { helpful_sentence: u.helpful_sentence } : {}),
        answer: u.answer || null,
        grade: null,
        thinking_time: u.thinking_time,
        speaking_time: u.speaking_time,
      })),
    },
  };

  try {
    const res = await fetch(`${defaultSetting.api_url}/assigment/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        json: JSON.stringify(payload),
        max_attempts: meta.maxAttempts,
        label: meta.label,
        assigment_type: meta.kind,
        bond,
      }),
    });
    return await res.text();
  } catch (e) {
    return `FAIL:Network error: ${(e as Error).message}`;
  }
}