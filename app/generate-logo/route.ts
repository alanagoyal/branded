// generate-name/route.ts
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { init, initLogger, traced, wrapOpenAI } from "braintrust";

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
        prompt: `Generate a minimalistic vector logo for a company called ${name} whose description is ${description}. The logo should be simple and abstract with a clean, modern look and feel. The background should be white.`,
        n: 1,
        quality: "hd",
        size: "1024x1024",
        style: "natural",
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
