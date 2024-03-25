import {
  type ChatMessage,
  type SubmitChatOptions,
  type FileSectionReference,
  submitChat as submitChatCore,
} from '@markprompt/core';

export const submitChat = async (
  messages: ChatMessage[],
  systemPrompt: string,
  model: SubmitChatOptions['model'],
  excludeFromInsights: SubmitChatOptions['excludeFromInsights'],
  doNotInjectContext: SubmitChatOptions['doNotInjectContext'],
  allowFollowUpQuestions: SubmitChatOptions['allowFollowUpQuestions'],
  onContent: (content: string) => void,
  onReferences?: (references: FileSectionReference[]) => void,
) => {
  for await (const value of submitChatCore(
    messages,
    process.env.NEXT_PUBLIC_PROJECT_KEY!,
    {
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      systemPrompt,
      model,
      excludeFromInsights,
      doNotInjectContext,
      allowFollowUpQuestions,
    },
  )) {
    if (value.content) {
      onContent(value.content);
    }

    if (value.references && onReferences) {
      onReferences(value.references);
    }
  }
};
