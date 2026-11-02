import { useMemo } from 'react';
import type { Conversation, Device } from '@icommunicate/shared';
import { useGetDevicesQuery, useGetSessionQuery } from '@/services/api';

export const useMe = () => useGetSessionQuery().data?.device;

export function useDevicesById() {
  const { data: devices } = useGetDevicesQuery();
  return useMemo(() => new Map((devices ?? []).map((device) => [device.id, device])), [devices]);
}

export function usePeers() {
  const me = useMe();
  const { data: devices = [] } = useGetDevicesQuery();
  return useMemo(
    () =>
      devices
        .filter((device) => device.id !== me?.id)
        .sort((a, b) => Number(b.online) - Number(a.online) || a.hostname.localeCompare(b.hostname)),
    [devices, me?.id],
  );
}

export interface ConversationMeta {
  title: string;
  peer?: Device;
}

export function getConversationMeta(conversation: Conversation, meId: string | undefined, devicesById: Map<string, Device>): ConversationMeta {
  if (conversation.type === 'channel') return { title: conversation.name ?? 'channel' };
  const peerId = conversation.memberIds.find((id) => id !== meId);
  const peer = peerId ? devicesById.get(peerId) : undefined;
  return { title: peer?.hostname ?? 'Unknown machine', peer };
}

export function useConversationMeta(conversation: Conversation) {
  const me = useMe();
  const devicesById = useDevicesById();
  return useMemo(() => getConversationMeta(conversation, me?.id, devicesById), [conversation, me?.id, devicesById]);
}
