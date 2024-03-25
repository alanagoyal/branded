import { useChatStore } from "@markprompt/react";
import * as React from "react";

import { Message } from "./message";

export function Messages({user}: { user: any }) {
  const messages = useChatStore((state) => state.messages);

  const chatOptions = useChatStore((state) => state.options);
  const messageState = useChatStore(
    (state) => state.messages[state.messages.length - 1]?.state
  );
  const isLoading =
    messageState === "preload" || messageState === "streaming-answer";

  return (
    <div className="flex flex-col space-y-4 w-full min-w-0">
      {messages.map((message, i) => {
        return (
          <Message
            user={user}
            isLoading={
              isLoading && i === messages.length - 1 && message.role !== "user"
            }
            key={message.id}
            message={message}
            chatOptions={chatOptions}
          />
        );
      })}
    </div>
  );
}
