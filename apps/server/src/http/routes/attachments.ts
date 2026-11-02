import { Router } from 'express';
import multer from 'multer';
import contentDisposition from 'content-disposition';
import { UPLOAD_FIELD_NAME, isPreviewable, type Attachment } from '@icommunicate/shared';
import { config } from '../../config';
import { attachmentsRepository } from '../../repositories/attachments';
import { chatService } from '../../services/chat';
import { sanitizeFilename, storageService } from '../../services/storage';
import { AppError } from '../../utils/AppError';

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, storageService.currentDirectory()),
    filename: (_req, file, cb) => cb(null, storageService.createFilename(sanitizeFilename(file.originalname))),
  }),
  limits: { fileSize: config.maxFileSizeBytes, files: 1 },
});

export const attachmentsRouter = Router();

attachmentsRouter.post('/', upload.single(UPLOAD_FIELD_NAME), (req, res) => {
  if (!req.file) throw new AppError(400, `Expected a "${UPLOAD_FIELD_NAME}" field`);

  const attachment = attachmentsRepository.create({
    uploaderId: req.device.id,
    name: sanitizeFilename(req.file.originalname),
    mimeType: req.file.mimetype || 'application/octet-stream',
    size: req.file.size,
    storagePath: storageService.toRelative(req.file.path),
  });
  res.status(201).json(attachment satisfies Attachment);
});

attachmentsRouter.get('/:id/file', (req, res) => {
  const { attachment, storagePath } = chatService.getAttachmentFile(req.params.id, req.device.id);
  // Only known-safe types are rendered inline; everything else is forced to download as opaque bytes.
  const inline = req.query.download !== '1' && isPreviewable(attachment.mimeType);

  res.sendFile(storagePath, {
    root: storageService.root,
    dotfiles: 'deny',
    headers: {
      'Content-Type': inline ? attachment.mimeType : 'application/octet-stream',
      'Content-Disposition': contentDisposition(attachment.name, { type: inline ? 'inline' : 'attachment' }),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  });
});
