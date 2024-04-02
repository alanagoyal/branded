import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { init, initLogger, traced, wrapOpenAI } from "braintrust";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const logger = initLogger({ projectName: "namebase" });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request, res: NextResponse) {
  try {
    const body = await req.json();
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
    return NextResponse.json({ error });
  }
}
