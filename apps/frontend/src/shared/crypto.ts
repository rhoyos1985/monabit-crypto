import { CompactEncrypt, compactDecrypt, generateKeyPair, importSPKI, exportSPKI } from 'jose';
import { CRYPTO_PUBLIC_KEY } from './config.js';

// El mensaje viaja como un unico string opaco (JWE Compact Serialization).
// Internamente lleva el header protegido, la CEK envuelta con RSA-OAEP, el IV,
// el ciphertext AES-GCM y el tag de autenticacion, sin exponer esos campos
// como propiedades separadas del cuerpo HTTP.
export type EncryptedMessage = string;

const ALG = 'RSA-OAEP-256';
const ENC = 'A256GCM';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const encryptEnvelope = async (
  data: unknown,
  publicKey: CryptoKey
): Promise<EncryptedMessage> => {
  const plaintext = encoder.encode(JSON.stringify(data));
  return new CompactEncrypt(plaintext)
    .setProtectedHeader({ alg: ALG, enc: ENC })
    .encrypt(publicKey);
};

export const decryptEnvelope = async (
  message: EncryptedMessage,
  privateKey: CryptoKey
): Promise<unknown> => {
  const { plaintext } = await compactDecrypt(message, privateKey);
  return JSON.parse(decoder.decode(plaintext)) as unknown;
};

interface ClientKeys {
  privateKey: CryptoKey;
  publicKeyHeader: string;
}

let clientKeysPromise: Promise<ClientKeys> | null = null;
let backendKeyPromise: Promise<CryptoKey> | null = null;

export const getClientKeys = (): Promise<ClientKeys> => {
  if (!clientKeysPromise) {
    clientKeysPromise = (async (): Promise<ClientKeys> => {
      const { publicKey, privateKey } = await generateKeyPair(ALG, { extractable: true });
      const pem = await exportSPKI(publicKey);
      return { privateKey, publicKeyHeader: btoa(pem) };
    })();
  }
  return clientKeysPromise;
};

export const getBackendPublicKey = (): Promise<CryptoKey> => {
  if (!backendKeyPromise) {
    backendKeyPromise = (async (): Promise<CryptoKey> => {
      if (!CRYPTO_PUBLIC_KEY) {
        throw new Error(
          'VITE_CRYPTO_PUBLIC_KEY no esta definida. La llave publica debe inyectarse en build time.'
        );
      }
      return importSPKI(CRYPTO_PUBLIC_KEY, ALG);
    })();
  }
  return backendKeyPromise;
};

export const isEncryptionEnabled = (): boolean =>
  import.meta.env.VITE_ENCRYPTION_ENABLED !== 'false';
