import { z } from "zod";
import { requireUser, reserveUsage, readBody, nameSchema, descriptionSchema, accessError } from "@/lib/provider-access";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { initLogger, traced, wrapOpenAI } from "braintrust";

const logger = initLogger({ projectName: "namebase" });
const openai = wrapOpenAI(
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 20000,
    maxRetries: 0,
    baseURL: "https://braintrustproxy.com/v1",
  })
);
export async function POST(req: Request, res: NextResponse) {
  try {
    const { user } = await requireUser(req);
    const body = await readBody(req, z.object({ name: nameSchema, description: descriptionSchema }));
    await reserveUsage(user.id, "onePagerContent");
    const {
      name, description
    } = body;

    const output = await traced(
      async (span) => {
        let userMessageContent = `Please write one paragraph pitching a startup named ${name} that has the following description: ${description}`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 1000,
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
    return accessError(error);
  }
}
