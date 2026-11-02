import type { Message } from '@icommunicate/shared';
import { isSameDay } from '@/lib/format';

const GROUP_WINDOW_MS = 5 * 60 * 1000;

export type MessageListItem =
  | { type: 'day'; key: string; timestamp: number }
  | { type: 'group'; key: string; senderId: string; messages: Message[] };

/** Splits chronological messages into day dividers and consecutive same-sender groups. */
export function buildMessageItems(messages: Message[]) {
  const items: MessageListItem[] = [];
  let previous: Message | undefined;

  for (const message of messages) {
    const newDay = !previous || !isSameDay(previous.createdAt, message.createdAt);
    if (newDay) items.push({ type: 'day', key: `day-${message.id}`, timestamp: message.createdAt });

    const last = items.at(-1);
    const continuesGroup =
      !newDay &&
      last?.type === 'group' &&
      last.senderId === message.senderId &&
      message.createdAt - previous!.createdAt < GROUP_WINDOW_MS;

    if (continuesGroup) last.messages.push(message);
    else items.push({ type: 'group', key: message.id, senderId: message.senderId, messages: [message] });

    previous = message;
  }

  return items;
}
