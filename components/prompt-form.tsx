import { useChatStore } from '@markprompt/react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit';
import { cn } from '@/lib/utils';

import { Icons } from './icons';
import { Textarea } from './ui/textarea';

export interface PromptProps {
  cta?: string;
  stopCta?: string;
  expanded?: boolean;
  placeholder: string;
  className?: string;
}

export function PromptForm({
  cta = 'Ask AI',
  stopCta = 'Stop generating',
  expanded = false,
  placeholder,
  className,
}: PromptProps) {
  const submitChat = useChatStore((state) => state.submitChat);
  const abort = useChatStore((state) => state.abort);

  const [input, setInput] = React.useState('');
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const messageState = useChatStore(
    (state) => state.messages[state.messages.length - 1]?.state,
  );

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const isLoading =
    messageState === 'preload' || messageState === 'streaming-answer';

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (isLoading) {
          abort?.();
          return;
        }
        if (!input?.trim()) {
          return;
        }
        submitChat([{ role: 'user', content: input.trim() }]);
        setInput('');
      }}
      ref={formRef}
    >
      <div className={cn('relative', className)}>
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          className={cn('w-full resize-none pr-24', {
            'min-h-[120px]': expanded,
            'min-h-[60px]': !expanded,
          })}
        />
        <div className="absolute right-3 bottom-3">
          <Button type="submit" size="sm" disabled={input === '' && !isLoading}>
            {isLoading && (
              <Icons.spinner className="w-4 h-4 animate-spin mr-2" />
            )}
            {isLoading ? stopCta : cta}
          </Button>
        </div>
      </div>
    </form>
  );
}
