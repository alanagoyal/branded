import { z } from "zod";
import { requireUser, reserveUsage, readBody, nameSchema, accessError, AccessError } from "@/lib/provider-access";
import { jpegDataUrl } from "@/lib/logo-image";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

export const maxDuration = 180;
export const dynamic = "force-dynamic";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 120000, maxRetries: 0 });

export async function POST(req: Request) {
  try {
    const { user, client } = await requireUser(req);
    const { nameId } = await readBody(req, z.object({ nameId: z.string().uuid() }));
    const { data: name, error: nameError } = await client.from("names").select("name")
      .eq("id", nameId).eq("created_by", user.id).maybeSingle();
    if (nameError) throw nameError;
    if (!name) throw new AccessError(404, "Name not found.");
    const nameText = nameSchema.parse(name.name);
    const { data: saved, error: savedError } = await client.from("logos").select("id")
      .eq("name_id", nameId).eq("created_by", user.id).limit(1).maybeSingle();
    if (savedError) throw savedError;
    await reserveUsage(user.id, "logos");
    const image = await openai.images.generate({
      model: "gpt-image-2.5-flare",
      prompt: `Create a sleek, minimalist logo for a startup named ${nameText}. Present the vector-style design directly on a clean white background. The logo should stand alone, not appear on merchandise or in a mockup.`,
      n: 1,
      quality: "medium",
      size: "1024x1024",
      output_format: "jpeg",
      output_compression: 80,
    });
    const imageUrl = jpegDataUrl(image.data?.[0]?.b64_json || "");
    // Persist before responding: images survive provider URL expiry and are
    // deleted by the existing name/profile/account foreign-key cascades.
    const record = { logo_url: imageUrl, name_id: nameId, created_by: user.id };
    const { error } = saved
      ? await client.from("logos").update(record).eq("id", saved.id).eq("created_by", user.id)
      : await client.from("logos").insert(record);
    if (error) throw error;
    return NextResponse.json({ imageUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return accessError(error); }
}
