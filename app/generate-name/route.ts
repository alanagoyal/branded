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
    const { description, minLength, maxLength, wordToInclude, wordPlacement, style } = body;

    let userMessageContent = `Please provide me with 10 name ideas for my startup, based on this description: ${description}. Please ensure the name has at least ${minLength} characters and at most ${maxLength} characters. `;
    
    if (style !== "any") {
      if (style === "one_word") {
        userMessageContent += "Each name should be a single English word that is simple and easy to remember. Avoid using compound words or phrases. Aim for names that convey a sense of uniqueness and potential relevance to a startup. Think of words that evoke a feeling of innovation, efficiency, or effectiveness. Examples of suitable names include 'spark,' 'stride,' 'pivot,' etc. ";
      }
      if (style === "two_words") {
        userMessageContent += "Each name must be two words written together as one. For example 'Facebook' or 'Snapchat'. ";
      } 
      if (style === "portmanteau") {
        userMessageContent += "Each name must be a portmanteau of two words. For example 'Microsoft' is a portmanteau of 'microcomputer' and 'software'. ";
      }
      if (style === "alternative_spelling") {
        userMessageContent += "Each name must be an alternative spelling of a word. For example 'Flickr' instead of 'Flicker' or 'Lyft' instead of 'Lift'. ";
      }
      if (style === "foreign_language") {
        userMessageContent += "Each name must be a word in a foreign language that means something based on the English description. For example 'Samsara' is a Sanskrit word that means 'cycle of life'. ";
      }
    }
    if (wordToInclude) {
      userMessageContent += `Each name must include the word or phrase "${wordToInclude}". Do not leave this out. `;
      if (wordPlacement === "start") {
        userMessageContent += "The word or phrase must be at the start of the name.";
      }
  
      if (wordPlacement === "end") {
        userMessageContent += "The word or phrase must be at the end of the name.";
      }
  
      if (wordPlacement === "any") {
        userMessageContent += "The word or phrase can be placed anywhere in the name.";
      }
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
