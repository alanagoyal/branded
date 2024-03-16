// generate-name/route.ts
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { init, initLogger, traced, wrapOpenAI } from "braintrust";

const logger = initLogger({ projectName: "namebase" });
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
      name
    } = body;

    console.log(name)
    const output = await traced(
      async (span) => {
        let userMessageContent = `Please come up with 3 npm package names for a startup named ${name}. The first option should be simply the ${name}. `;

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          seed: 123,
          messages: [
            {
              role: "system",
              content:
                "You are a naming assistant tasked with suggesting npm package names for a startup, given the startup's name.",
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