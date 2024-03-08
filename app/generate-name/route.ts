// generate-name/route.ts
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { init, initLogger, traced, wrapOpenAI } from "braintrust";

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
    const {
      description,
      minLength,
      maxLength,
      wordToInclude,
      wordPlacement,
      style,
    } = body;

    const output = await traced(
      async (span) => {
        let userMessageContent = `Please provide me with 3 name ideas for my startup, based on this description: ${description}. Please ensure the name has at least ${minLength} characters and at most ${maxLength} characters. `;

        if (style !== "any") {
          if (style === "one_word") {
            userMessageContent +=
              "Each name should be one word with one or two syllables. It should be a word that can be found in the English dictionary like 'Thrive', 'Default', or 'Surge'. It should not be a compound word like 'Facebook' or 'Guidewire'. ";
            if (wordToInclude) {
              userMessageContent += `The name should be a synonym for "${wordToInclude}". `;
            }
          }

          if (style === "portmanteau") {
            userMessageContent +=
              "Each name must be a portmanteau of two words. For example 'Microsoft' is a portmanteau of 'microcomputer' and 'software'. ";

            if (wordToInclude) {
              userMessageContent += `Each name must include the word or phrase "${wordToInclude}" as part of the portmanteau. `;
              if (wordPlacement === "start") {
                userMessageContent +=
                  "The word or phrase must be at the start of the portmanteau.";
              }

              if (wordPlacement === "end") {
                userMessageContent +=
                  "The word or phrase must be at the end of the portmanteau.";
              }

              if (wordPlacement === "any") {
                userMessageContent +=
                  "The word or phrase can be placed anywhere in the portmanteau.";
              }
            }
          }

          if (style === "alternative_spelling") {
            if (wordToInclude) {
              userMessageContent += `Each name should be an alternative spelling of the word "${wordToInclude}". For example 'Flickr' instead of 'Flicker' or 'Lyft' instead of 'Lift'. `;
            } else {
              userMessageContent +=
                "Each name must be an alternative spelling of a word. For example 'Flickr' instead of 'Flicker' or 'Lyft' instead of 'Lift'. ";
            }
          }
          if (style === "foreign_language") {
            if (wordToInclude) {
              userMessageContent += `Each name must be a word in a foreign language that means something based on the description and the word or phrase "${wordToInclude}". For example 'Samsara' is a Sanskrit word that means 'cycle of life'. `;
            } else {
              userMessageContent +=
                "Each name must be a word in a foreign language that means something based on the English description. For example 'Samsara' is a Sanskrit word that means 'cycle of life'. ";
            }
          }

          if (style === "historical") {
            if (wordToInclude) {
              userMessageContent += `Each name should be inspired by a historical reference related to the word or phrase "${wordToInclude}". For example 'Da Vinci' is related to 'art' or 'Kepler' is related to 'astronomy'. `;
            } else {
              userMessageContent +=
                "Each name should be inspired by a historical reference or figure. For example 'Da Vinci' or 'Tesla'. ";
            }
          }
        }

        userMessageContent +=
          "Please provide the names only with no explanation. ";

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

        const output = completion.choices[0].message.content;
        span.log({ output });
        return output;
      },
      {
        name: "generate-name",
        event: {
          input: {
            ...body,
            minLength: minLength[0],
            maxLength: maxLength[0],
          },
        },
      }
    );

    return new Response(JSON.stringify({ response: output }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json({ error });
  }
}
