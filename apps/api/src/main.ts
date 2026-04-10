import 'dotenv/config';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const rootDir = process.cwd();
  const webDistDir = join(rootDir, '..', 'web', 'dist');
  const legacyPublicDir = join(rootDir, 'public');
  const frontendDir = existsSync(join(webDistDir, 'index.html')) ? webDistDir : legacyPublicDir;

  app.enableCors({
    origin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173',
  });
  app.setGlobalPrefix('api', { exclude: ['/'] });
  app.useStaticAssets(frontendDir);

  // Protect storage files: require a valid session before serving
  const prisma = app.get(PrismaService);
  app.use('/storage', async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'] ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (!token) {
      res.status(401).json({ message: 'Não autorizado.' });
      return;
    }
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const session = await prisma.session.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
      include: { user: { select: { isActive: true } } },
    });
    if (!session || !session.user.isActive) {
      res.status(401).json({ message: 'Sessão inválida ou expirada.' });
      return;
    }
    next();
  });

  app.useStaticAssets(join(rootDir, 'storage'), { prefix: '/storage/' });

  if (frontendDir === webDistDir) {
    const express = app.getHttpAdapter().getInstance();

    express.get(/^(?!\/api|\/storage).*/, (_req, res) => {
      res.sendFile(join(webDistDir, 'index.html'));
    });
  }

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

void bootstrap();
