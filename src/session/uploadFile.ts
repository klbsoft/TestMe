import { defaultSetting, getToken } from "../components/theme/default";


/**
 * Upload a file to the server.
 * The token is sent as the FIRST multipart field so the server can
 * authenticate before it starts streaming the file to disk.
 *
 * Returns the server's plain-text response:
 *   "OK:<stored-name>,<bytes>"  → success
 *   "FAIL:<reason>"             → failure
 */
export async function uploadFile(file: File | Blob, filename?: string): Promise<string> {
  const token = getToken();
  if (!token) return "FAIL:Not logged in";

  const fd = new FormData();
  fd.append("token", token);                              // must come first
  fd.append("file", file, filename ?? (file as File).name ?? "upload.bin");

  try {
    const res = await fetch(`${defaultSetting.api_url}/upload`, {
      method: "POST",
      body: fd, // do NOT set Content-Type — the browser adds the boundary
    });
    return await res.text();
  } catch (e) {
    return `FAIL:Network error: ${(e as Error).message}`;
  }
}