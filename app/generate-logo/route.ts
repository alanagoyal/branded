import { z } from "zod";
import { requireUser, reserveUsage, readBody, nameSchema, descriptionSchema, accessError } from "@/lib/provider-access";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
    timeout: 20000,
    maxRetries: 0,
});

export async function POST(req: Request, res: NextResponse) {
  try {
    const { user } = await requireUser(req);
    const body = await readBody(req, z.object({ name: nameSchema }));
    await reserveUsage(user.id, "logos");
    const { name } = body;

    const image = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Your task is to create a sleek, minimalist logo for a startup named ${name}. The design should be a vector-style image, presented directly on a clean, white background without any additional elements or context. Aim for simplicity and modernity, drawing inspiration from the minimalist aesthetics of companies like OpenAI, Stripe, Airbnb, and Uber. The logo should not be integrated into merchandise or mockups, but should stand alone as a pure, simple design. `,
      n: 1,
      quality: "hd",
      size: "1024x1024",
      style: "vivid",
    });

    const imageUrl = image.data[0].url;

    return new Response(JSON.stringify({ imageUrl }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return accessError(error);
  }
}
