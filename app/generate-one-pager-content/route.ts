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
    console.log("in generate content")
  try {
    const body = await req.json();
    const {
      name, description
    } = body;

    const output = await traced(
      async (span) => {
        let userMessageContent = `Please write one paragraph pitching a startup named ${name} that has the following description: ${description}`;

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          seed: 123,
          messages: [
            {
              role: "system",
              content:
                "You are a startup founder tasked with creating a one-page document to describe your company to potential customers and investors.",
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
        name: "generate-one-pager-content",
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
