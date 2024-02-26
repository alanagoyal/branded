// generate-name/route.ts
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

// Initialize the OpenAI client with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
export async function POST(req: Request, res: NextResponse) {
  console.log("request received");
  try {
    const body = await req.json();
    const description = body.description;
    console.log("description:", description);
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a creative naming assistant tasked with helping a startup founder determine a name for the company.",
        },
        {
          role: "user",
          content: `Please provide me with 10 name ideas for my startup, based on this description: ${description}`,
        },
      ],
    });

    console.log("Completion:", completion.choices[0].message.content);
    return new Response(
      JSON.stringify({ response: completion.choices[0].message.content }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error });
  }
}
