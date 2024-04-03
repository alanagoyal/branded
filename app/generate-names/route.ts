import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { init, initLogger, traced, wrapOpenAI } from "braintrust";

export const maxDuration = 30;
export const dynamic = "force-dynamic";
const logger = initLogger({ projectName: "namebase" });
const openai = wrapOpenAI(
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://braintrustproxy.com/v1",
  })
);

function cleanNames(names: string[]): string[] {
  return names
    .map((name) =>
      name.includes(".") ? name.split(". ")[1].trim() : name.trim()
    )
    .map((name) => name.split("(")[0].trim());
}

async function checkDomainAvailability(domain: string) {
  const response = await fetch(
    `https://api.whoxy.com/?key=${process.env.WHOXY_API_KEY}&whois=${domain}`
  );
  const data = await response.json();
  return data.domain_registered?.toLowerCase() === "no";
}

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
      async () =>
        openai.chat.completions.create({
          model: "gpt-3.5-turbo",
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
        }),
      { name: "generate-name", event: body }
    );

    const names = cleanNames(
      (completion.choices[0].message.content || "")
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

      if (validNames.length === 0) {
        fallbackMessage = "No .com domains were available for the names given your criteria. We found you some names that are available in other TLDs."; 
      }

      selectedNames =
        validNames.length >= 3 ? validNames.slice(0, 3) : names.slice(0, 3);
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
    return NextResponse.json({ error });
  }
}
