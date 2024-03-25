import { type ChatCompletionMessageToolCall } from '@markprompt/core';
import type { ChatViewTool, ToolCall } from '@markprompt/react';
import { AccessibleIcon } from '@radix-ui/react-accessible-icon';
import { useCallback, useMemo } from 'react';

import { Icons } from './icons';
import { Button } from './ui/button';

interface ToolCallsConfirmationProps {
  infoMessage?: string;
  confirmationMessage?: string;
  toolCalls: ChatCompletionMessageToolCall[];
  toolCallsStatus: { [key: string]: ToolCall };
  tools?: ChatViewTool[];
  confirmToolCalls: () => void;
}

export function ToolCallsConfirmation(
  props: ToolCallsConfirmationProps,
): JSX.Element {
  const {
    infoMessage = 'The bot is calling the following tools on your behalf:',
    toolCalls,
    tools,
    toolCallsStatus,
    confirmToolCalls,
  } = props;

  const toolCallsRequiringConfirmation = useMemo(() => {
    return toolCalls.filter((toolCall) => {
      const tool = tools?.find(
        (tool) => tool.tool.function.name === toolCall.function?.name,
      );

      return tool?.requireConfirmation ?? true;
    });
  }, [toolCalls, tools]);

  const toolCallsWithoutConfirmationAndWithMessage = useMemo(() => {
    return toolCalls.filter((toolCall) => {
      const tool = tools?.find((tool) => {
        const show =
          typeof tool.showDefaultAutoTriggerMessage === 'undefined'
            ? true
            : tool.showDefaultAutoTriggerMessage;
        return tool.tool.function.name === toolCall.function?.name && show;
      });

      return tool?.requireConfirmation === false;
    });
  }, [toolCalls, tools]);

  const getStatusIcon = useCallback((status?: ToolCall['status']) => {
    switch (status) {
      case 'loading':
        return Icons.loader;
      case 'done':
        return Icons.checkCircle;
      case 'error':
        return Icons.crossCircle;
      default:
        return Icons.circleDashed;
    }
  }, []);

  const showConfirmButton = useMemo(() => {
    const validEntries = Object.entries(toolCallsStatus).filter(([key]) => {
      return toolCallsRequiringConfirmation.some(
        (toolCall) => toolCall.id === key,
      );
    });
    if (validEntries.length === 0) return true;
    return validEntries.some(([, value]) => value.status !== 'done');
  }, [toolCallsRequiringConfirmation, toolCallsStatus]);

  const hasToolsCallsWithMessages =
    toolCallsWithoutConfirmationAndWithMessage.length > 0 ||
    toolCallsRequiringConfirmation.length > 0;

  if (!hasToolsCallsWithMessages) {
    return <></>;
  }

  return (
    <>
      {toolCallsWithoutConfirmationAndWithMessage.length > 0 && (
        <div>
          {infoMessage && infoMessage?.length > 0 && <p>{infoMessage}</p>}
          {toolCallsWithoutConfirmationAndWithMessage.map((toolCall) => {
            const tool = tools?.find(
              (tool) => tool.tool.function.name === toolCall.function?.name,
            );

            if (!tool) throw Error('tool not found');

            const status = toolCallsStatus[toolCall.id]?.status;
            const StatusIcon = getStatusIcon(status);

            return (
              <p key={toolCall.function.name}>
                <AccessibleIcon
                  label={`Tool status: ${status ?? 'not started'}`}
                >
                  <StatusIcon className="w-4 h-4" />
                </AccessibleIcon>
                <strong>
                  {tool.tool.function.description ?? tool.tool.function.name}{' '}
                </strong>
              </p>
            );
          })}
        </div>
      )}

      {toolCallsRequiringConfirmation.length > 0 && (
        <>
          <div>
            <p className="text-sm">
              The bot wants to perform the following{' '}
              {toolCalls.length === 1 ? 'action' : 'actions'}:
            </p>
            {toolCallsRequiringConfirmation.map((toolCall) => {
              const tool = tools?.find(
                (tool) => tool.tool.function.name === toolCall.function?.name,
              );

              if (!tool) throw Error('tool not found');

              const status = toolCallsStatus[toolCall.id]?.status;
              const StatusIcon = getStatusIcon(status);

              return (
                <div
                  className="flex flex-row items-start space-x-2 p-3 border border-dashed border-border rounded-md my-4"
                  key={toolCall.function.name}
                >
                  <AccessibleIcon
                    label={`Tool status: ${status ?? 'not started'}`}
                  >
                    <StatusIcon className="w-4 h-4 mt-[1px]" />
                  </AccessibleIcon>
                  <p className="text-sm">
                    {tool.tool.function.description ?? tool.tool.function.name}{' '}
                  </p>
                </div>
              );
            })}
          </div>

          {showConfirmButton && (
            <Button size="sm" onClick={confirmToolCalls}>
              Confirm
            </Button>
          )}
        </>
      )}
    </>
  );
}
