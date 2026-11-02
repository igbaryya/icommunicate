import { Router } from 'express';
import type { Conversation, Message } from '@icommunicate/shared';
import { conversationsRepository } from '../../repositories/conversations';
import { chatService } from '../../services/chat';

export const conversationsRouter = Router();

conversationsRouter.get('/', (req, res) => {
  res.json(conversationsRepository.listForDevice(req.device.id) satisfies Conversation[]);
});

conversationsRouter.get('/:id/messages', (req, res) => {
  const before = Number(req.query.before);
  const messages = chatService.listMessages(req.params.id, req.device.id, before > 0 ? before : undefined);
  res.json(messages satisfies Message[]);
});
