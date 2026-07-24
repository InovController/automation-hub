import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { diskStorage } from 'multer';

// Uploads pequenos (favicons, scripts): memory storage com limite conservador.
export const uploadLimits: MulterOptions = {
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 15,
  },
};

// Uploads de execução: disk storage para não travar a RAM com arquivos grandes.
// Multer salva em tmpdir; o service move para o dir de input da execução.
export const diskUploadLimits: MulterOptions = {
  storage: diskStorage({
    destination: tmpdir(),
    filename: (_req, _file, cb) => cb(null, `ah-upload-${randomUUID()}`),
  }),
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2 GB por arquivo
    files: 200,
  },
};
