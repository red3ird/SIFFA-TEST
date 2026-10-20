import crypto from 'crypto';

// SIFFA Institutional Cryptographic Service (Ed25519)
// The private key NEVER leaves the server-side environment.
class SiffaCryptoService {
  private keyId: string = 'siffa-ed25519-v1';
  private privateKey: crypto.KeyObject;
  private publicKey: crypto.KeyObject;
  private publicKeyRawHex: string;

  constructor() {
    // Generate an in-memory or persisted Ed25519 keypair for SIFFA institutional signing
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    this.privateKey = privateKey;
    this.publicKey = publicKey;

    // Export raw 32-byte public key as hex for client/offline verification
    const exportedPublicSpki = publicKey.export({ type: 'spki', format: 'der' });
    // In SPKI format for Ed25519, the last 32 bytes contain the raw public key
    const rawPublicKey = exportedPublicSpki.subarray(exportedPublicSpki.length - 32);
    this.publicKeyRawHex = rawPublicKey.toString('hex');

    console.log(`[SIFFA Security] Ed25519 Keypair initialized. KeyID: ${this.keyId}`);
    console.log(`[SIFFA Security] Public Key Hex (32-byte): ${this.publicKeyRawHex}`);
  }

  public getKeyId(): string {
    return this.keyId;
  }

  public getPublicKeyRawHex(): string {
    return this.publicKeyRawHex;
  }

  /**
   * Signs a Dynamic QR Payload.
   * Generates a short-lived token (default 90 seconds) with issuance and expiration timestamps.
   */
  public generateSignedDynamicQR(params: {
    cid: string; // Credential ID
    aid: string; // Authorization ID
    eid: string; // Establishment ID
    ttlSeconds?: number;
  }) {
    const now = Math.floor(Date.now() / 1000);
    const ttl = params.ttlSeconds || 90; // Short window of validity (90s)
    const exp = now + ttl;
    const jti = crypto.randomUUID();

    // Canonical payload string to guarantee deterministic signing
    const payloadToSign = JSON.stringify({
      ver: 1,
      cid: params.cid,
      aid: params.aid,
      eid: params.eid,
      iat: now,
      exp: exp,
      jti: jti,
      kid: this.keyId,
    });

    const signature = crypto.sign(null, Buffer.from(payloadToSign, 'utf-8'), this.privateKey);
    const sigHex = signature.toString('hex');

    return {
      ver: 1,
      cid: params.cid,
      aid: params.aid,
      eid: params.eid,
      iat: now,
      exp: exp,
      jti: jti,
      kid: this.keyId,
      sig: sigHex,
    };
  }

  /**
   * Verifies the cryptographic authenticity and integrity of a Dynamic QR payload.
   */
  public verifyDynamicQRSha(payload: {
    ver: number;
    cid: string;
    aid: string;
    eid: string;
    iat: number;
    exp: number;
    jti: string;
    kid: string;
    sig: string;
  }): { validSignature: boolean; isExpired: boolean; message?: string } {
    try {
      const now = Math.floor(Date.now() / 1000);
      const clockSkewTolerance = 15; // 15 seconds clock skew grace period

      // 1. Check expiration
      if (now > payload.exp + clockSkewTolerance) {
        return { validSignature: false, isExpired: true, message: 'QR_EXPIRADO' };
      }

      // 2. Canonical payload reconstruct
      const payloadString = JSON.stringify({
        ver: payload.ver,
        cid: payload.cid,
        aid: payload.aid,
        eid: payload.eid,
        iat: payload.iat,
        exp: payload.exp,
        jti: payload.jti,
        kid: payload.kid,
      });

      const signatureBuffer = Buffer.from(payload.sig, 'hex');
      const isVerified = crypto.verify(
        null,
        Buffer.from(payloadString, 'utf-8'),
        this.publicKey,
        signatureBuffer
      );

      return {
        validSignature: isVerified,
        isExpired: false,
        message: isVerified ? 'FIRMA_VALIDA' : 'FIRMA_INVALIDA',
      };
    } catch (err: any) {
      return { validSignature: false, isExpired: false, message: `ERROR_VERIFICACION: ${err.message}` };
    }
  }

  /**
   * Signs an entire Offline Authorization Package for a specific establishment.
   */
  public signOfflinePackage(packageData: object): string {
    const raw = JSON.stringify(packageData);
    const signature = crypto.sign(null, Buffer.from(raw, 'utf-8'), this.privateKey);
    return signature.toString('hex');
  }
}

export const cryptoService = new SiffaCryptoService();
