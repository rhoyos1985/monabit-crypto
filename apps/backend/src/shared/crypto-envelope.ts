import { CompactEncrypt, compactDecrypt } from 'jose';

// El mensaje viaja como un unico string opaco (JWE Compact Serialization).
// Internamente contiene el header protegido, la clave de contenido (CEK) envuelta
// con RSA-OAEP, el IV, el ciphertext AES-GCM y el tag de autenticacion; el cliente
// no expone esos campos por separado en el cuerpo HTTP.
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
