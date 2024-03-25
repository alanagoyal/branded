import { SubmitChatOptions } from '@markprompt/core';

export const DEFAULT_SUBMIT_CHAT_OPTIONS: SubmitChatOptions = {
  model: 'gpt-4',
  systemPrompt:
    'You are an expert AI technical support assistant from Markprompt who excels at helping people solving their issues. You never ask follow up questions.',
};

export const CATEGORIES = [
  'Accounts',
  'Frameworks',
  'Insights',
  'Integrations',
  'Payments',
  'Projects',
  'Security',
  'Teams',
];

export const SEVERITY = [
  'Severity 1',
  'Severity 2',
  'Severity 3',
  'Severity 4',
];
