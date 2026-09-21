import { z } from "zod";
import { requireUser, reserveUsage, readBody, nameSchema, descriptionSchema, accessError } from "@/lib/provider-access";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { initLogger, traced, wrapOpenAI } from "braintrust";

export const maxDuration = 30;
export const dynamic = "force-dynamic";
const logger = initLogger({ projectName: "namebase" });
const openai = wrapOpenAI(
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 20000,
    maxRetries: 0,
    baseURL: "https://braintrustproxy.com/v1",
  })
);

const nameRequestSchema = z.object({
  description: descriptionSchema,
  minLength: z.number().int().min(1).max(50), maxLength: z.number().int().min(1).max(50),
  wordToInclude: z.string().max(100).optional().default(""),
  wordPlacement: z.enum(["beginning", "end", "anywhere", "any", "start", ""]).optional(),
  style: z.enum(["one_word", "portmanteau", "alternative_spelling", "foreign_language", "historical", "literary", "any", ""]).optional(),
  tld: z.boolean().optional().default(false),
}).refine(v => v.minLength <= v.maxLength);

function cleanNames(names: string[]): string[] {
  return names.map(name => name.replace(/^\d+[.)]\s*/, "").split("(")[0].trim())
    .filter(name => /^[a-zA-Z0-9][a-zA-Z0-9 -]{0,62}$/.test(name)).slice(0, 10);
}

async function checkDomainAvailability(domain: string) {
  const response = await fetch(
    `https://api.whoxy.com/?key=${process.env.WHOXY_API_KEY}&whois=${encodeURIComponent(domain)}`, { cache: "no-store", signal: AbortSignal.timeout(10000) }
  );
  if (!response.ok) throw new Error("WHOIS lookup failed");
  const data = await response.json();
  return data.domain_registered?.toLowerCase() === "no";
}

export async function POST(req: Request) {
  try {
    const { user } = await requireUser(req);
    const body = await readBody(req, nameRequestSchema);
    await reserveUsage(user.id, "names");
    const {
      description,
      minLength,
      maxLength,
      wordToInclude,
      wordPlacement,
      style,
      tld,
    } = body;

    let userMessageContent = `Please provide me with 10 name ideas for my startup, based on this description: ${description}. Please ensure the name has at least ${minLength} characters and at most ${maxLength} characters. `;

    const styleMessages: { [key: string]: string } = {
      one_word:
        "Each name should be a single, commonly used English noun. Examples include 'Thrive', 'Default', or 'Surge'. Avoid compound words like 'Facebook' or 'Guidewire'.",
      portmanteau: `Each name must be a portmanteau including the word "${wordToInclude}", placed ${
        wordPlacement || "anywhere"
      } in the combination. For example, 'Microsoft' combines 'microcomputer' and 'software'.`,
      alternative_spelling: `Each name should be an alternative spelling, particularly of "${
        wordToInclude || "a common word"
      }", like 'Flickr' for 'Flicker' or 'Lyft' for 'Lift'.`,
      foreign_language: `Each name should be a foreign word that resonates with the startup's description, potentially related to "${wordToInclude}". For instance, 'Samsara' is a Sanskrit term for 'cycle of life'.`,
      historical: `Names should draw from historical figures or concepts, especially those linked to "${wordToInclude}". 'Da Vinci' and 'Kepler' are prime examples, connected to art and astronomy, respectively.`,
      literary: `Opt for literary references, ideally associated with "${wordToInclude}". 'Palantir', a seeing-stone from Lord of the Rings, serves as a fitting illustration.`,
    };

    // Add the style-specific message if a valid style is provided
    if (style && styleMessages[style]) {
      userMessageContent += styleMessages[style];
    }

    // Final instruction
    userMessageContent += " Please provide 10 names without explanations.";

    const completion = await traced(
      async (span) => {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 1000,
          messages: [
            {
              role: "system",
              content:
                "You are a creative naming assistant tasked with generating unique startup names based on specific criteria.",
            },
            {
              role: "user",
              content: userMessageContent,
            },
          ],
        });
        const output = response.choices[0].message.content;
        span.log({input: userMessageContent, output});
        return output;
      },
      { name: "generate-name", event: { input: body } }
    );

    const names = cleanNames(
      (completion || "")
        .split("\n")
        .filter((name) => name.trim() !== "")
    );

    let selectedNames = [];
    let fallbackMessage = null;

    if (tld) {
      const domainChecks = names.map((name) =>
        checkDomainAvailability(`${name}.com`)
      );
      const results = await Promise.allSettled(domainChecks);

      const availableDomains = results.map((result, index) => ({
        name: names[index],
        available: result.status === "fulfilled" && result.value,
      }));

      const validNames = availableDomains
        .filter((domain) => domain.available)
        .map((domain) => domain.name);

      if (validNames.length < 3) {
        fallbackMessage = `Only ${validNames.length} names had verified available .com domains. Try different criteria for more results.`;
      }

      selectedNames =
        validNames.slice(0, 3);
    } else {
      selectedNames = names.slice(0, 3);
    }

    const responsePayload = {
      response: selectedNames,
      ...(fallbackMessage ? { fallbackMessage } : {})
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return accessError(error);
  }
}
