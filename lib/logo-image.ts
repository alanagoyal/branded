// Keep images small enough for database rows and function responses. Only JPEG
// raster data is accepted; never pass caller-controlled SVG/HTML to a renderer.
export const MAX_LOGO_BYTES = 1_000_000;
export const JPEG_DATA_PREFIX = "data:image/jpeg;base64,";

export function jpegDataUrl(base64: string): string {
  if (!base64 || base64.length > 4 * Math.ceil(MAX_LOGO_BYTES / 3) || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new Error("Invalid logo image");
  }
  const image = Buffer.from(base64, "base64");
  if (image.length > MAX_LOGO_BYTES || image.toString("base64") !== base64 || image[0] !== 0xff || image[1] !== 0xd8 || image.at(-2) !== 0xff || image.at(-1) !== 0xd9) {
    throw new Error("Invalid logo image");
  }
  // Inspect the JPEG frame before handing bytes to a decoder. The database is
  // client-writable, so its MIME prefix alone cannot establish format or size.
  let offset = 2;
  while (offset + 4 <= image.length) {
    if (image[offset++] !== 0xff) break;
    while (image[offset] === 0xff) offset++;
    const marker = image[offset++];
    if (marker === 0xda || marker === 0xd9) break;
    const length = image.readUInt16BE(offset);
    if (length < 2 || offset + length > image.length) break;
    if ([0xc0, 0xc1, 0xc2].includes(marker) && length >= 8) {
      const height = image.readUInt16BE(offset + 3);
      const width = image.readUInt16BE(offset + 5);
      if (width < 1 || height < 1 || width > 2048 || height > 2048) break;
      return JPEG_DATA_PREFIX + base64;
    }
    offset += length;
  }
  throw new Error("Invalid logo dimensions");
}
