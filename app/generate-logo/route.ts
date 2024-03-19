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
        prompt: `Generate a minimalistic vector logo design for a company called ${name}. The logo should be simple and abstract, with no words or characters. It should have a clean, modern look and feel. Please ensure that the background is white. Thank you.`
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
