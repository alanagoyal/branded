import path from "node:path";
import { Document, Font, Image, Link, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { MAX_PDF_BYTES, PDF_DATA_PREFIX } from "./pdf-download";

Font.register({ family: "Noto Sans", fonts: [
  { src: path.join(process.cwd(), "assets/fonts/NotoSans-Regular.ttf"), fontWeight: 400 },
  { src: path.join(process.cwd(), "assets/fonts/NotoSans-Bold.ttf"), fontWeight: 700 },
] });

const styles = StyleSheet.create({
  page: { fontFamily: "Noto Sans", fontSize: 11, color: "#242424", paddingTop: 48, paddingHorizontal: 52, paddingBottom: 58 },
  heading: { marginBottom: 28, alignItems: "center" },
  logo: { width: 150, height: 150, objectFit: "contain", marginBottom: 22 },
  title: { fontSize: 28, fontWeight: 700, lineHeight: 1.2, textAlign: "center" },
  founder: { fontSize: 11, color: "#636363", marginTop: 12, textAlign: "center" },
  content: { fontSize: 11, lineHeight: 1.65 },
  contact: { marginTop: 28, fontSize: 10, lineHeight: 1.6, color: "#636363" },
  email: { color: "#242424", textDecoration: "underline" },
  pageNumber: { position: "absolute", bottom: 25, left: 52, right: 52, textAlign: "center", fontSize: 8, color: "#999999" },
});

export type OnePagerInput = {
  name: string;
  founder: string;
  email: string;
  content: string;
  logoUrl: string | null;
};

// All inputs come from bounded route validation and owner-scoped database reads.
// Fonts are bundled; the renderer never requests a third-party document service.
export async function createOnePagerPdf(input: OnePagerInput): Promise<string> {
  // Bypass Next's React alias: the external renderer must receive elements from
  // its installed React version. Keep Node's loader outside webpack rewriting.
  const { createRequire } = await import(/* webpackIgnore: true */ "node:module");
  const { createElement }: typeof import("react") = createRequire(path.join(process.cwd(), "package.json"))("react");
  const document = createElement(Document, { title: input.name, author: input.founder || undefined },
    createElement(Page, { size: "A4", style: styles.page, wrap: true },
      createElement(View, { style: styles.heading, wrap: false },
        input.logoUrl ? createElement(Image, { src: input.logoUrl, style: styles.logo }) : null,
        createElement(Text, { style: styles.title }, input.name),
        input.founder ? createElement(Text, { style: styles.founder }, input.founder + " · Founder & CEO") : null,
      ),
      createElement(Text, { style: styles.content, orphans: 3, widows: 3, minPresenceAhead: 65 }, input.content),
      createElement(View, { style: styles.contact, wrap: false },
        createElement(Text, {}, "To learn more, please contact"),
        createElement(Link, { src: "mailto:" + input.email, style: styles.email }, input.email),
      ),
      createElement(Text, { style: styles.pageNumber, fixed: true,
        render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => totalPages > 1 ? pageNumber + " / " + totalPages : "",
      }),
    ),
  );
  const bytes = await renderToBuffer(document);
  if (bytes.length > MAX_PDF_BYTES || bytes.subarray(0, 5).toString() !== "%PDF-") throw new Error("Unable to create a bounded PDF.");
  return PDF_DATA_PREFIX + bytes.toString("base64");
}
