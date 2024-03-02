// generate-name/route.ts
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { init, initLogger, wrapOpenAI } from "braintrust";

const logger = initLogger({ projectName: "namebase" });
// Initialize the OpenAI client with your API key
const openai = wrapOpenAI(
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://braintrustproxy.com/v1",
  })
);
export async function POST(req: Request, res: NextResponse) {
  try {
    const body = await req.json();
    const { description, minLength, maxLength, wordToInclude, wordPlacement } = body;

    let userMessageContent = `Please provide me with 10 name ideas for my startup, based on this description: ${description}. Please ensure the name has at least ${minLength} characters and at most ${maxLength} characters.`;
    
    if (wordToInclude) {
      userMessageContent += `Each name must include the word or phrase "${wordToInclude}". Do not leave this out.`;
    }

    if (wordPlacement === "start") {
      userMessageContent += "The word or phrase must be at the start of the name.";
    }

    if (wordPlacement === "end") {
      userMessageContent += "The word or phrase must be at the end of the name.";
    }

    if (wordPlacement === "any") {
      userMessageContent += "The word or phrase can be placed anywhere in the name.";
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      seed: 123,
      messages: [
        {
          role: "system",
          content:
            "You are a creative naming assistant tasked with helping a startup founder determine a name for the company.",
        },
        {
          role: "user",
          content: userMessageContent,
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
