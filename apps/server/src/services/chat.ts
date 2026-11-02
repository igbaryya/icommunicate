import { MESSAGES_PAGE_SIZE, type Conversation } from '@icommunicate/shared';
import { attachmentsRepository } from '../repositories/attachments';
import { conversationsRepository } from '../repositories/conversations';
import { devicesRepository } from '../repositories/devices';
import { messagesRepository } from '../repositories/messages';
import { AppError } from '../utils/AppError';
import { parseOpenDm, parseSendMessage } from './validation';

const canAccess = (conversation: Conversation, deviceId: string) =>
  conversation.type === 'channel' || conversation.memberIds.includes(deviceId);

export const chatService = {
  getConversation(conversationId: string, deviceId: string) {
    const conversation = conversationsRepository.findById(conversationId);
    if (!conversation || !canAccess(conversation, deviceId)) throw new AppError(404, 'Conversation not found');
    return conversation;
  },

  listMessages(conversationId: string, deviceId: string, beforeSeq?: number) {
    chatService.getConversation(conversationId, deviceId);
    return messagesRepository.listPage(conversationId, beforeSeq, MESSAGES_PAGE_SIZE);
  },

  sendMessage(senderId: string, payload: unknown) {
    const input = parseSendMessage(payload);
    const conversation = chatService.getConversation(input.conversationId, senderId);
    const message = messagesRepository.create({ ...input, senderId });
    return { conversation, message };
  },

  openDm(deviceId: string, payload: unknown) {
    const { deviceId: peerId } = parseOpenDm(payload);
    if (peerId === deviceId) throw new AppError(400, 'You cannot message yourself');
    if (!devicesRepository.findById(peerId)) throw new AppError(404, 'Machine not found');

    const members = [deviceId, peerId];
    const existing = conversationsRepository.findDm(members);
    if (existing) return { conversation: existing, created: false };
    return { conversation: conversationsRepository.createDm(members), created: true };
  },

  /** Unsent uploads are visible to their uploader only; sent ones to the conversation members. */
  getAttachmentFile(attachmentId: string, deviceId: string) {
    const record = attachmentsRepository.findFile(attachmentId);
    const allowed =
      record &&
      (record.conversationId
        ? canAccess(conversationsRepository.findById(record.conversationId)!, deviceId)
        : record.uploaderId === deviceId);
    if (!allowed) throw new AppError(404, 'Attachment not found');
    return record;
  },
};
