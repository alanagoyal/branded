import { AccessError } from "./provider-access";

// PDF rendering must never fetch an arbitrary caller URL. Fetch known image
// storage ourselves with redirects disabled, then embed a size-limited image.
export async function onePagerLogo(value: string | null): Promise<string | null> {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "oaidalleapiprodscus.blob.core.windows.net" || url.port || url.username || url.password) {
    throw new AccessError(400, "Unsupported logo URL.");
  }
  const response = await fetch(url, { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (!response.ok) return null; // Expired generated images do not prevent export.
  const contentType = response.headers.get("content-type")?.split(";")[0];
  if (!contentType || !["image/png", "image/jpeg", "image/webp"].includes(contentType)) throw new AccessError(400, "Invalid logo image.");
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value: chunk } = await reader.read(); if (done) break;
    size += chunk.byteLength;
    if (size > 5000000) { await reader.cancel(); throw new AccessError(400, "Logo image is too large."); }
    chunks.push(chunk);
  }
  return `data:${contentType};base64,${Buffer.concat(chunks).toString("base64")}`;
}
