import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { init, initLogger, traced, wrapOpenAI } from "braintrust";

export const maxDuration = 20; 
export const dynamic = 'force-dynamic';

const logger = initLogger({ projectName: "namebase" });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request, res: NextResponse) {
  try {
    const body = await req.json();
    const { name, description } = body;

    const image = await openai.images.generate({ 
        model: "dall-e-3",
        prompt: `You are a brand designer tasked with designing a sleek, minimalistic logo for a company named ${name}. Please generate a simple vector logo on a white background. The simpler, the better. Remember, it should be modern, minimalist, and sleek. Consider, for example, the logos of OpenAI, Stripe, Airbnb, and Uber.`,
        n: 1,
        quality: "hd",
        size: "1024x1024",
        style: "vivid",
    });

    const imageUrl = image.data[0].url

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
