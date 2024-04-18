"use client";

import { ChatProvider, ChatViewMessage } from "@markprompt/react";
import { useCallback, useEffect, useState } from "react";

import { type TicketGeneratedData, CaseForm } from "@/components/case-form";
import { Chat } from "@/components/chat";
import { generateTicketData } from "@/lib/ticket";

import { useChatForm } from "./chat-form-context";
import { Button } from "./ui/button";
import {
  BusinessPlanEntitlements,
  FreePlanEntitlements,
  ProPlanEntitlements,
} from "@/lib/plans";
import { createClient } from "@/utils/supabase/client";

export function CaseChat({ user, userData }: { user: any; userData: any }) {
  const supabase = createClient();
  const { setIsCreatingCase } = useChatForm();
  const [messages, setMessages] = useState<ChatViewMessage[]>([]);
  const [ticketData, setTicketData] = useState<TicketGeneratedData | undefined>(
    undefined
  );
  const [planName, setPlanName] = useState("");

  useEffect(() => {
    async function fetchUserPlan() {
      if (!user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("plan_id")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return;
      }

      if (profile && profile.plan_id) {
        try {
          const response = await fetch(
            `/fetch-plan?plan_id=${profile.plan_id}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch user plan");
          }
          const data = await response.json();
          setPlanName(data.planName);
        } catch (error) {
          console.error("Error fetching user plan:", error);
          setPlanName("Free");
        }
      }
    }

    fetchUserPlan();
  }, [user]);

  const submitCase = useCallback(async () => {
    setIsCreatingCase(true);
    const ticketData = await generateTicketData(messages);
    setTicketData(ticketData);
    setIsCreatingCase(false);

    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight - 1150,
        behavior: "smooth",
      });
    }, 500);
  }, [messages, setIsCreatingCase]);

  return (
    <div className="flex flex-col w-full">
      <ChatProvider
        chatOptions={{
          apiUrl: process.env.NEXT_PUBLIC_API_URL,
          model: "gpt-4-turbo-preview",
          systemPrompt:
            'You are an expert AI technical support assistant from Markprompt who excels at helping people solving their issues. When generating a case, do not mention anything about assistance, next step, or whether an agent will reach out. Just say "Please complete the form submission below."',
          tool_choice: "auto",
          tools: [
            {
              tool: {
                type: "function",
                function: {
                  name: "createCase",
                  description:
                    "Creates a case automatically when the user asks to create a ticket/case or when they ask to speak to someone.",
                  parameters: {
                    type: "object",
                    properties: {},
                  },
                },
              },
              call: async () => {
                submitCase();
                return "Generating case details for you.";
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
                  Please confirm that you want to submit a case:
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
          {ticketData && <CaseForm {...ticketData} />}
        </div>
      </ChatProvider>
      {(planName === "Pro" || planName === "Business") && (
          <div className="pt-2 text-sm text-gray-500">
            For more assistance, please reach out to{" "}
            <a href="mailto:hi@basecase.vc" className="underline">
              support
            </a>
            .
          </div>
        )}
    </div>
  );
}
