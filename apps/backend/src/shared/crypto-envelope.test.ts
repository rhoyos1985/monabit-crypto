import { describe, it, expect } from '@jest/globals';
import { generateKeyPair } from 'jose';
import { encryptEnvelope, decryptEnvelope } from './crypto-envelope.js';

describe('crypto-envelope', () => {
  it('cifra y descifra (round-trip) preservando el objeto', async () => {
    const { publicKey, privateKey } = await generateKeyPair('RSA-OAEP-256', { extractable: true });
    const data = { email: 'a@b.com', nested: { n: 1 }, list: [1, 2, 3] };

    const message = await encryptEnvelope(data, publicKey);

    expect(typeof message.payload).toBe('string');
    expect(typeof message.signed).toBe('string');
    expect(JSON.stringify(message)).not.toContain('a@b.com');

    const decrypted = await decryptEnvelope(message, privateKey);
    expect(decrypted).toEqual(data);
  });

  it('falla al descifrar con una llave privada distinta', async () => {
    const a = await generateKeyPair('RSA-OAEP-256', { extractable: true });
    const b = await generateKeyPair('RSA-OAEP-256', { extractable: true });

    const message = await encryptEnvelope({ secret: 'x' }, a.publicKey);

    await expect(decryptEnvelope(message, b.privateKey)).rejects.toThrow();
  });
});
