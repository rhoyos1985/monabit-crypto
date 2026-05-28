import { FlattenedEncrypt, flattenedDecrypt } from 'jose';

export interface EncryptedMessage {
  payload: string;
  signed: string;
}

const ALG = 'RSA-OAEP-256';
const ENC = 'A256GCM';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64Url = (value: string): string => Buffer.from(value, 'utf8').toString('base64url');
const fromBase64Url = (value: string): string => Buffer.from(value, 'base64url').toString('utf8');

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
