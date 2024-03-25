'use client';

import { ChatViewMessage } from '@markprompt/react';
import { uniqBy } from 'lodash';
import Link from 'next/link';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';
import { cn } from '@/lib/utils';

import { Icons } from './icons';

interface MessageActionsProps extends React.ComponentProps<'div'> {
  message: ChatViewMessage;
}

export function MessageActions({
  message,
  className,
  ...props
}: MessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const onCopy = () => {
    if (isCopied) return;
    copyToClipboard(message.content || '');
  };

  const uniqueReferences = useMemo(() => {
    return uniqBy(message.references || [], (r) => r.file.path);
  }, [message.references]);

  return (
    <div className={cn('flex flex-row', className)} {...props}>
      <div className="flex-grow pt-1">
        {uniqueReferences.length > 0 && (
          <>
            <h4 className="text-sm font-semibold">References</h4>
            <ul className="mt-3 flex flex-col gap-y-1 w-full justify-start items-start">
              {uniqueReferences.map((reference) => {
                return (
                  <Link
                    className="text-sm border-b border-dashed border-border"
                    key={reference.file.path}
                    href={reference.file.path}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {reference.file.title}
                  </Link>
                );
              })}
            </ul>
          </>
        )}
      </div>
      <div className="flex-none">
        <Button
          variant="ghost"
          className="text-muted-foreground"
          size="icon"
          onClick={onCopy}
        >
          {isCopied ? <Icons.check /> : <Icons.copy />}
          <span className="sr-only">Copy message</span>
        </Button>
      </div>
    </div>
  );
}
