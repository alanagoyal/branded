import type { ChatMessage, FileSectionReference } from '@markprompt/core';

import { submitChat } from '@/lib/common';

export const generateChat = async (
  messages: ChatMessage[],
  onContent: (content: string) => void,
  onReferences: (references: FileSectionReference[]) => void,
) => {
  return submitChat(
    messages,
    'You are an expert AI technical support assistant from Markprompt who excels at helping people solving their issues. If the question is unclear, or if you were not able to find a solution, ask for further details.',
    'gpt-4',
    false,
    false,
    true,
    onContent,
    onReferences,
  );
};
