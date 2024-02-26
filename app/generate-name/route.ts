// generate-name/route.ts
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

// Initialize the OpenAI client with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
export async function POST(req: Request, res: NextResponse) {
  console.log("Request received");
  try {
    const body = await req.json();
    const description = body.description;
    console.log("Description:", description);
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Ensure you're using an available model
      messages: [
        { role: "system", content: "You are a creative naming assistant." },
        {
          role: "user",
          content: `I need a name for my startup. It's ${description}`,
        },
      ],
    });

    console.log("Completion:", completion.choices[0].message.content);
    return new Response(
      JSON.stringify({ nameIdea: completion.choices[0].message.content }),
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
