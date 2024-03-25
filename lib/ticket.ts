import { ChatViewMessage } from '@markprompt/react';

import { TicketGeneratedData } from '@/components/case-form';
import { submitChat } from '@/lib/common';
import { CATEGORIES, SEVERITY } from '@/lib/constants';

const generate = async (message: string, instructions: string) => {
  let content = '';
  await submitChat(
    [
      { role: 'user', content: instructions },
      { role: 'user', content: message },
    ],
    'You are an expert technical support engineer.',
    'gpt-3.5-turbo',
    true,
    true,
    false,
    (c) => (content = c),
  );
  return content;
};

export const summarize = async (message: string) => {
  const instructions =
    'Below is message describing the issue I am having. Please summarize it in a single sentence to use for a subject matter.';
  return generate(message, instructions);
};

export const getCategory = async (message: string) => {
  const instructions = `Below is message describing an issue I am having. Based on this message, your task is to assign the message to one of the following categories. You should reply only with the category, and should not add any extra text to the response:\n\n${CATEGORIES.map(
    (c) => `- ${c}`,
  ).join('\n')}`;
  return generate(message, instructions);
};

export const getSeverity = async (message: string) => {
  const instructions = `Below is message describing an issue I am having. Based on this message, your task is to assign the message to one of the following severity levels. Severity 1 is highest. You should reply only with the severity level, and should not add any extra text to the response:\n\n${SEVERITY.map(
    (c) => `- ${c}`,
  ).join('\n')}`;
  return generate(message, instructions);
};

export const improve = async (message: string) => {
  const instructions = `Below is message describing an issue I am having. Please rewrite it into a concise message with all available information and no typos. Also follow these instructions:

- Rewrite it so that a support agent can immediately see what is going wrong.
- Make sure to not omit any parts of the question.
- Rewrite it in English if my message is another language.
- Just rewrite it with no additional tags. For instance, don't include a "Subject:" line.`;
  return generate(message, instructions);
};

export const generateTicketData = async (
  messages: ChatViewMessage[],
): Promise<TicketGeneratedData | undefined> => {
  const firstMessage = messages?.[0]?.content;
  if (!firstMessage) {
    return;
  }

  const getCategoryPromise = getCategory(firstMessage);
  const getSeverityPromise = getSeverity(firstMessage);
  const summarizePromise = summarize(firstMessage);
  const improvePromise = improve(firstMessage);

  // Run the 4 tasks concurrently for faster ticket generation
  const [category, severity, subject, description] = await Promise.all([
    getCategoryPromise,
    getSeverityPromise,
    summarizePromise,
    improvePromise,
  ]);

  const transcript = messages
    .filter((m) => !m.tool_calls)
    .map((m) => `Sender: ${m.role}\n\n${m.content || 'No answer'}`)
    .join('\n\n===\n\n');

  return {
    category,
    severity,
    subject,
    description: `${description}\n\n${'-'.repeat(80)}\n\nFull transcript:\n\n${transcript}`,
  };
};
