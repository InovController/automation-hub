import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

export type InsecureHttpResponse = {
  statusCode: number;
  contentType: string | null;
  body: Buffer;
};

// Sites internos costumam usar certificado autoassinado — ainda assim precisamos
// saber se o servidor respondeu, então a validação de cadeia de certificado é ignorada aqui de propósito.
export function insecureGet(url: string, timeoutMs: number): Promise<InsecureHttpResponse | null> {
  return new Promise((resolve) => {
    let target: URL;
    try {
      target = new URL(url);
    } catch {
      resolve(null);
      return;
    }

    const requestFn = target.protocol === 'https:' ? httpsRequest : httpRequest;
    const req = requestFn(target, { method: 'GET', timeout: timeoutMs, rejectUnauthorized: false }, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const contentTypeHeader = response.headers['content-type'];
        resolve({
          statusCode: response.statusCode ?? 0,
          contentType: Array.isArray(contentTypeHeader) ? (contentTypeHeader[0] ?? null) : (contentTypeHeader ?? null),
          body: Buffer.concat(chunks),
        });
      });
      response.on('error', () => resolve(null));
    });

    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(null));
    req.end();
  });
}
