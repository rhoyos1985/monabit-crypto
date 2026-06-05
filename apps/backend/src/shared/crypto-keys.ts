import { generateKeyPair, importPKCS8 } from 'jose';
import logger from './logger.js';

const ALG = 'RSA-OAEP-256';

interface CryptoKeys {
  privateKey: CryptoKey;
}

let keysPromise: Promise<CryptoKeys> | null = null;

const normalizePem = (pem: string): string => pem.replace(/\\n/g, '\n');

const loadKeys = async (): Promise<CryptoKeys> => {
  const privatePem = process.env.CRYPTO_PRIVATE_KEY;

  if (privatePem) {
    const privateKey = await importPKCS8(normalizePem(privatePem), ALG);
    return { privateKey };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRYPTO_PRIVATE_KEY is required in production');
  }

  logger.warn('CRYPTO_PRIVATE_KEY not set; generating an ephemeral keypair (development only)');
  const { privateKey } = await generateKeyPair(ALG, { extractable: true });
  return { privateKey };
};

export const getCryptoKeys = (): Promise<CryptoKeys> => {
  if (!keysPromise) {
    keysPromise = loadKeys();
  }
  return keysPromise;
};
