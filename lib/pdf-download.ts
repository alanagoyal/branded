export const PDF_DATA_PREFIX = "data:application/pdf;base64,";
export const MAX_PDF_BYTES = 2_000_000;

// Saved rows are owner-editable. Do not navigate to arbitrary stored URLs or
// execute a different data-URL type when downloading a previously saved PDF.
export function pdfBytes(value: string): Uint8Array {
  if (!value.startsWith(PDF_DATA_PREFIX)) throw new Error("Invalid saved PDF. Please generate it again.");
  const encoded = value.slice(PDF_DATA_PREFIX.length);
  if (!encoded || encoded.length > 4 * Math.ceil(MAX_PDF_BYTES / 3) || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error("Invalid saved PDF.");
  const decoded = atob(encoded);
  if (decoded.length > MAX_PDF_BYTES || !decoded.startsWith("%PDF-") || btoa(decoded) !== encoded) throw new Error("Invalid saved PDF.");
  return Uint8Array.from(decoded, character => character.charCodeAt(0));
}

export function downloadPdf(value: string, name: string): void {
  const bytes = pdfBytes(value);
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name.replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 100) || "company"}-one-pager.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Keep the blob alive long enough for the browser to begin the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
