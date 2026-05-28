import { generateKeyPair, importPKCS8, importSPKI, exportSPKI } from 'jose';
import logger from './logger.js';

const ALG = 'RSA-OAEP-256';

interface CryptoKeys {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyPem: string;
}

let keysPromise: Promise<CryptoKeys> | null = null;

const normalizePem = (pem: string): string => pem.replace(/\\n/g, '\n');

const loadKeys = async (): Promise<CryptoKeys> => {
  const privatePem = process.env.CRYPTO_PRIVATE_KEY;
  const publicPem = process.env.CRYPTO_PUBLIC_KEY;

  if (privatePem && publicPem) {
    const normalizedPublic = normalizePem(publicPem);
    const privateKey = await importPKCS8(normalizePem(privatePem), ALG);
    const publicKey = await importSPKI(normalizedPublic, ALG);
    return { publicKey, privateKey, publicKeyPem: normalizedPublic };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRYPTO_PRIVATE_KEY and CRYPTO_PUBLIC_KEY are required in production');
  }

  logger.warn('CRYPTO keys not set; generating an ephemeral keypair (development only)');
  const { publicKey, privateKey } = await generateKeyPair(ALG, { extractable: true });
  const publicKeyPem = await exportSPKI(publicKey);
  return { publicKey, privateKey, publicKeyPem };
};

export const getCryptoKeys = (): Promise<CryptoKeys> => {
  if (!keysPromise) {
    keysPromise = loadKeys();
  }
  return keysPromise;
};
