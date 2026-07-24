import { createHash, randomBytes } from 'node:crypto';

export function hashToken(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function generateToken(prefix: string) {
  return `${prefix}_${randomBytes(24).toString('hex')}`;
}
