import { isToolCalls } from "@markprompt/core";
import {
  ChatViewMessage,
  MarkpromptOptions,
  useChatStore,
} from "@markprompt/react";
import Image from "next/image";
import { useMemo } from "react";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { CodeBlock } from "@/components/codeblock";
import { MessageActions } from "@/components/message-actions";
import { cn } from "@/lib/utils";

import { Icons } from "./icons";
import { ToolCallsConfirmation } from "./tool-calls-confirmation";
import { MemoizedReactMarkdown } from "./markdown";
import { Avatar, AvatarFallback } from "./ui/avatar";

export interface MessageProps {
  user: any;
  message: ChatViewMessage;
  isLoading: boolean;
  chatOptions: MarkpromptOptions["chat"];
}

export function Message({
  user, 
  message,
  isLoading,
  chatOptions,
  ...props
}: MessageProps) {
  const submitToolCalls = useChatStore((state) => state.submitToolCalls);
  

  const toolCalls = useMemo(
    () => (isToolCalls(message.tool_calls) ? message.tool_calls : undefined),
    [message.tool_calls]
  );

  const ToolCallConfirmation = useMemo(
    () => chatOptions?.ToolCallsConfirmation ?? ToolCallsConfirmation,
    [chatOptions?.ToolCallsConfirmation]
  );

  const confirmToolCalls = (): void => {
    submitToolCalls(message);
  };

  const toolCallsByToolCallId = useChatStore((state) =>
    Object.fromEntries(
      Object.entries(state.toolCallsByToolCallId).filter(([id]) =>
        toolCalls?.some((x) => x.id === id)
      )
    )
  );

  return (
    <div className="flex flex-col space-y-4">
      <div
        className={cn("group relative space-x-4 flex flex-row items-start")}
        {...props}
      >
        <div
          className={cn(
            "flex size-7 shrink-0 select-none items-center justify-center rounded-full overflow-hidden",
            { "animate-pulse": isLoading }
          )}
        >
          {message.role === "user" ? (
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Icons.logo className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="flex-1 space-y-2 overflow-hidden mt-0.5">
            {message.role === "assistant" && message.state === "cancelled" && (
              <p className="text-muted-foreground text-xs mt-1">
                This message was cancelled.
              </p>
            )}
            {message.content && (
              <MemoizedReactMarkdown
                className="w-full overflow-hidden prose prose-sm break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-pre:rounded-md max-w-full prose-pre:text-sm prose-code:text-[0.825rem]"
                remarkPlugins={[remarkGfm, remarkMath]}
                components={{
                  p({ children }) {
                    return <p className="mb-2 last:mb-0">{children}</p>;
                  },
                  code(props) {
                    const { children, className, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    return match ? (
                      <CodeBlock
                        key={Math.random()}
                        {...rest}
                        value={String(children).replace(/\n$/, "")}
                        language={match[1]}
                      />
                    ) : (
                      <code {...rest} className={className}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </MemoizedReactMarkdown>
            )}
            {toolCalls && (
              <ToolCallConfirmation
                toolCalls={toolCalls}
                tools={chatOptions?.tools}
                toolCallsStatus={toolCallsByToolCallId}
                confirmToolCalls={confirmToolCalls}
              />
            )}
          </div>
        </div>
      </div>
      {message.state === "done" &&
        message.role === "assistant" &&
        !toolCalls && (
          <div className="ml-11 pb-8">
            <MessageActions message={message} />
          </div>
        )}
    </div>
  );
}
