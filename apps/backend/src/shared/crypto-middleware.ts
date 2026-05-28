import { Request, Response, NextFunction } from 'express';
import { importSPKI } from 'jose';
import { getCryptoKeys } from './crypto-keys.js';
import { encryptEnvelope, decryptEnvelope, EncryptedMessage } from './crypto-envelope.js';
import { HTTPBadRequest } from './http-error.js';
import logger from './logger.js';

const ALG = 'RSA-OAEP-256';
const CLIENT_KEY_HEADER = 'x-client-public-key';

interface EnvelopeBody {
  message?: EncryptedMessage;
}

const importClientKey = async (header: string | string[] | undefined): Promise<CryptoKey | null> => {
  if (typeof header !== 'string' || header.length === 0) {
    return null;
  }
  try {
    const pem = Buffer.from(header, 'base64').toString('utf8');
    return await importSPKI(pem, ALG);
  } catch {
    return null;
  }
};

export const cryptoMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const body = req.body as EnvelopeBody | undefined;
  const hasEncryptedBody = Boolean(body && body.message);
  const headerValue = req.headers[CLIENT_KEY_HEADER];
  const hasClientKeyHeader = typeof headerValue === 'string' && headerValue.length > 0;

  if (!hasEncryptedBody && !hasClientKeyHeader) {
    next();
    return;
  }

  const { privateKey } = await getCryptoKeys();
  const clientPublicKey = await importClientKey(headerValue);

  if (clientPublicKey) {
    const originalJson = res.json.bind(res);
    res.json = ((data: unknown): Response => {
      void encryptEnvelope(data, clientPublicKey)
        .then((message) => originalJson({ message }))
        .catch((err) => {
          logger.error('Failed to encrypt response', {
            error: err instanceof Error ? err.message : String(err),
          });
          res.status(500);
          return originalJson({ error: 'encryption_failed' });
        });
      return res;
    }) as Response['json'];
  }

  if (hasEncryptedBody && body?.message) {
    try {
      req.body = await decryptEnvelope(body.message, privateKey);
    } catch {
      throw new HTTPBadRequest('No se pudo descifrar la petición.');
    }
  }

  next();
};
