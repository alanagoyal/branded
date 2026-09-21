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
export async function POST(req: Request) {
  try {
    const { user } = await requireUser(req);
    const body = await readBody(req, z.object({ name: nameSchema }));
    await reserveUsage(user.id, "npm");
    const {
      name
    } = body;

    const output = await traced(
      async (span) => {
        let userMessageContent = `Please come up with 2 npm package names for a startup named ${name}. You cannot include ${name} as one of the npm package names. `;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 1000,
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
        name: "find-npm-names",
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
