"use client";

import { ChatProvider, ChatViewMessage } from "@markprompt/react";
import { useCallback, useState } from "react";

import { CaseForm } from "@/components/case-form";
import { Chat } from "@/components/chat";
import { createSupportDraft, type SupportDraft } from "@/lib/support";

import { useChatForm } from "./chat-form-context";
import { Button } from "./ui/button";

export function CaseChat({ user }: { user: any }) {
  const { setIsCreatingCase } = useChatForm();
  const [messages, setMessages] = useState<ChatViewMessage[]>([]);
  const [ticketData, setTicketData] = useState<SupportDraft | undefined>(
    undefined
  );
  const [draftError, setDraftError] = useState<string | null>(null);

  const submitCase = useCallback(async () => {
    setIsCreatingCase(true);
    setDraftError(null);
    try {
      setTicketData(createSupportDraft(messages));
      return "Your email draft is ready. Review it, open it in your email app, and send it there.";
    } catch {
      setDraftError("Could not prepare the transcript. You can still email hi@basecase.vc directly.");
      return "Could not prepare an email draft. Please email hi@basecase.vc directly.";
    } finally {
      setIsCreatingCase(false);
    }
  }, [messages, setIsCreatingCase]);

  return (
    <div className="flex flex-col w-full">
      {process.env.NEXT_PUBLIC_PROJECT_KEY ? <ChatProvider
        chatOptions={{
          apiUrl: process.env.NEXT_PUBLIC_API_URL,
          model: "gpt-4-turbo-preview",
          systemPrompt:
            'You are the Branded AI support assistant. The createCase tool prepares an email draft, but does not send or submit a support request. Tell the user to review the draft and send it from their email app. Human support is available to everyone at hi@basecase.vc.',
          tool_choice: "auto",
          tools: [
            {
              tool: {
                type: "function",
                function: {
                  name: "createCase",
                  description:
                    "Prepares an email draft when the user asks for a ticket or to speak to someone. The user must send the email themselves.",
                  parameters: {
                    type: "object",
                    properties: {},
                  },
                },
              },
              call: async () => {
                return await submitCase();
              },
              requireConfirmation: true,
            },
          ],
          ToolCallsConfirmation: ({
            toolCalls,
            toolCallsStatus,
            confirmToolCalls,
          }) => {
            const toolCall = toolCalls[0];
            if (!toolCall) {
              return <></>;
            }
            const status = toolCallsStatus[toolCall.id]?.status;
            return (
              <div className="p-3 border border-dashed border-border rounded-md flex flex-col space-y-4 items-start">
                <p className="text-sm">
                  Prepare an email draft with this conversation?
                </p>
                <Button
                  size="sm"
                  onClick={confirmToolCalls}
                  disabled={status === "done"}
                >
                  Confirm
                </Button>
              </div>
            );
          },
        }}
        projectKey={process.env.NEXT_PUBLIC_PROJECT_KEY!}
      >
        <div className="flex flex-col space-y-4">
          <Chat
            user={user}
            onNewMessages={setMessages}
            onSubmitCase={submitCase}
            onNewChat={() => setTicketData(undefined)}
          />

        </div>
      </ChatProvider> : <p className="mb-4 text-sm">Chat is unavailable. You can email support below.</p>}
      {draftError && <p role="alert" className="py-2 text-sm">{draftError}</p>}
      <div className="mt-4">
        <CaseForm key={JSON.stringify(ticketData)} {...(ticketData ?? createSupportDraft([]))} />
      </div>
    </div>
  );
}
