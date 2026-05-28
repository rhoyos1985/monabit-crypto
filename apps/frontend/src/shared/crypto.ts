import { FlattenedEncrypt, flattenedDecrypt, generateKeyPair, importSPKI, exportSPKI } from 'jose';
import { API_BASE_URL } from './config.js';

export interface EncryptedMessage {
  payload: string;
  signed: string;
}

const ALG = 'RSA-OAEP-256';
const ENC = 'A256GCM';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64Url = (value: string): string =>
  btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64Url = (value: string): string => atob(value.replace(/-/g, '+').replace(/_/g, '/'));

export const encryptEnvelope = async (
  data: unknown,
  publicKey: CryptoKey
): Promise<EncryptedMessage> => {
  const plaintext = encoder.encode(JSON.stringify(data));
  const jwe = await new FlattenedEncrypt(plaintext)
    .setProtectedHeader({ alg: ALG, enc: ENC })
    .encrypt(publicKey);

  const payloadParts = {
    protected: jwe.protected,
    iv: jwe.iv,
    ciphertext: jwe.ciphertext,
    tag: jwe.tag,
  };

  return {
    payload: toBase64Url(JSON.stringify(payloadParts)),
    signed: jwe.encrypted_key ?? '',
  };
};

export const decryptEnvelope = async (
  message: EncryptedMessage,
  privateKey: CryptoKey
): Promise<unknown> => {
  const parts = JSON.parse(fromBase64Url(message.payload)) as {
    protected: string;
    iv: string;
    ciphertext: string;
    tag: string;
  };

  const { plaintext } = await flattenedDecrypt(
    { ...parts, encrypted_key: message.signed },
    privateKey
  );

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
      const response = await fetch(`${API_BASE_URL}/crypto/public-key`);
      const json = (await response.json()) as { publicKey: string };
      return importSPKI(json.publicKey, ALG);
    })();
  }
  return backendKeyPromise;
};

export const isEncryptionEnabled = (): boolean =>
  import.meta.env.VITE_ENCRYPTION_ENABLED !== 'false';
