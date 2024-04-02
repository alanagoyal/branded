import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { init, initLogger, traced, wrapOpenAI } from "braintrust";
export const maxDuration = 25;
export const dynamic = "force-dynamic";
const logger = initLogger({ projectName: "namebase" });
const openai = wrapOpenAI(
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://braintrustproxy.com/v1",
  })
);

function cleanNames(names: string[]): string[] {
  return names.map((name) => {
    const nameNoNumber = name.includes(".")
      ? name.split(". ")[1].trim()
      : name.trim();
    const nameCleaned = nameNoNumber.split("(")[0].trim();
    return nameCleaned;
  });
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

    let namesFound = 0;
    let attempts = 0;
    const validNames: string[] = [];
    const previousNames: string[] = [];

    while (namesFound < 3 && attempts < 3) {
      attempts++;
      const output = await traced(
        async (span) => {
          let userMessageContent = `Please provide me with 5 name ideas for my startup, based on this description: ${description}. Please ensure the name has at least ${minLength} characters and at most ${maxLength} characters. `;

          if (style !== "any") {
            if (style === "one_word") {
              userMessageContent +=
                "Each name should be a noun that is used in the everyday English Language. For example 'Thrive', 'Default', or 'Surge'. It should definitely not be a compound word like 'Facebook' or 'Guidewire'. ";
            }

            if (style === "portmanteau") {
              userMessageContent +=
                "Each name must be a portmanteau of two words. For example 'Microsoft' is a portmanteau of 'microcomputer' and 'software'. ";

              if (wordToInclude) {
                userMessageContent += `Each portmanteau must include the word "${wordToInclude}", `;
                if (wordPlacement === "start") {
                  userMessageContent +=
                    "which must be placed at the start of the portmanteau.";
                }

                if (wordPlacement === "end") {
                  userMessageContent +=
                    "which must be placed at the end of the portmanteau.";
                }

                if (wordPlacement === "any") {
                  userMessageContent +=
                    "which can be placed anywhere in the portmanteau.";
                }
              }
            }

            if (style === "alternative_spelling") {
              if (wordToInclude) {
                userMessageContent += `Each name should be an alternative spelling of "${wordToInclude}". For example 'Flickr' instead of 'Flicker' or 'Lyft' instead of 'Lift'. `;
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
                userMessageContent += `Each name should reference a historical figure or concept related to "${wordToInclude}". For example 'Da Vinci' is related to 'art' or 'Kepler' is related to 'astronomy'. `;
              } else {
                userMessageContent +=
                  "Each name should be inspired by a historical reference or figure. For example 'Da Vinci' or 'Tesla'. ";
              }
            }

            if (style === "literary") {
              if (wordToInclude) {
                userMessageContent += `Each name should be a literary reference related to "${wordToInclude}". For example 'Palantir' is a 'seeing-stone' from Lord of the Rings. `;
              } else {
                userMessageContent +=
                  "Each name should be inspired by a literary reference or figure. For example 'Palantir' or 'Anduril' are references from Lord of the Rings. ";
              }
            }
          }

          if (tld) {
            userMessageContent += "Please try to generate unique names that may have a .com domain available. ";

            if (previousNames) {
              userMessageContent += `Please exclude the following names: ${previousNames.join(
                ", "
              )}. `;
            }
          }

          userMessageContent += "Please provide 5 names with no explanation.";

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
          const names = output!
            .split("\n")
            .filter((name) => name.trim() !== "");

          for (const name of cleanNames(names)) {
            previousNames.push(name);
            if (namesFound >= 3) break;
            try {
              if (tld) {
                const isAvailable = await checkDomainAvailability(
                  `${name}.com`
                );
                console.log(`checking ${name}.com`);
                if (isAvailable) {
                  console.log(`${name} is available`);
                  validNames.push(name);
                  namesFound++;
                  break;
                }
              } else {
                validNames.push(name);
                namesFound++;
                break;
              }
            } catch (error) {
              console.error(error);
            }
          }

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
    }

    if (validNames.length < 3) {
      return new Response(JSON.stringify({ response: previousNames.slice(0, 3) }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify({ response: validNames }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json({ error });
  }
}
