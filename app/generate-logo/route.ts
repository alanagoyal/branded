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

    const image = await openai.images.generate({ prompt: `A minimalist logo for a company named ${name} whose description is ${description}` });

    console.log(image.data);

    return new Response(JSON.stringify({ response: image }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json({ error });
  }
}
