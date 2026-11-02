import { useLayoutEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { Paperclip, SendHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { MAX_MESSAGE_LENGTH } from '@icommunicate/shared';
import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { PendingAttachmentList } from '@/features/attachments/components/PendingAttachmentList';
import type { PendingAttachments } from '@/features/attachments/hooks/usePendingAttachments';
import { selectIsConnected } from '@/features/session/sessionSlice';
import { cn } from '@/lib/cn';
import { getErrorMessage } from '@/lib/errors';
import { useSendMessageMutation } from '@/services/api';

const MAX_TEXTAREA_HEIGHT = 200;
const LENGTH_WARNING_THRESHOLD = MAX_MESSAGE_LENGTH - 200;

interface ComposerProps {
  conversationId: string;
  placeholder: string;
  uploads: PendingAttachments;
}

export function Composer({ conversationId, placeholder, uploads }: ComposerProps) {
  const [body, setBody] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const connected = useAppSelector(selectIsConnected);
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  const hasContent = body.trim().length > 0 || uploads.readyIds.length > 0;
  const canSend = connected && hasContent && !uploads.isUploading && !isSending && body.length <= MAX_MESSAGE_LENGTH;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [body]);

  const submit = async () => {
    if (!canSend) return;
    try {
      await sendMessage({ conversationId, body: body.trim(), attachmentIds: uploads.readyIds }).unwrap();
      setBody('');
      uploads.clear();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Message was not sent'));
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = [...event.clipboardData.files];
    if (!files.length) return;
    event.preventDefault();
    uploads.add(files);
  };

  return (
    <div className="shrink-0 px-4 pb-4 md:px-6">
      <div
        className={cn(
          'rounded-2xl border border-border bg-surface-2 shadow-lg shadow-black/20 transition-colors focus-within:border-accent/50',
          !connected && 'opacity-60',
        )}
      >
        <PendingAttachmentList uploads={uploads} />
        <div className="flex items-end gap-1 p-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={(event) => {
              uploads.add([...(event.target.files ?? [])]);
              event.target.value = '';
            }}
          />
          <Tooltip content="Attach files">
            <Button variant="ghost" size="icon" aria-label="Attach files" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="size-4.5" />
            </Button>
          </Tooltip>
          <textarea
            ref={textareaRef}
            rows={1}
            autoFocus
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            placeholder={connected ? placeholder : 'Waiting for the LAN server…'}
            className="max-h-[200px] min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted/70"
          />
          {body.length > LENGTH_WARNING_THRESHOLD && (
            <span className={cn('self-center text-[11px] tabular-nums', body.length > MAX_MESSAGE_LENGTH ? 'text-danger' : 'text-muted')}>
              {MAX_MESSAGE_LENGTH - body.length}
            </span>
          )}
          <Button variant="primary" size="icon" aria-label="Send message" disabled={!canSend} onClick={submit}>
            <SendHorizontal className="size-4" />
          </Button>
        </div>
      </div>
      <p className="mt-1.5 hidden px-2 text-[11px] text-muted/60 md:block">
        <kbd className="font-sans font-semibold">Enter</kbd> to send · <kbd className="font-sans font-semibold">Shift + Enter</kbd> for a new
        line · drop or paste files to attach
      </p>
    </div>
  );
}
