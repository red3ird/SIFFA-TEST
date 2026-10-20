import {
  Professional,
  Establishment,
  Authorization,
  Credential,
  AccessEvent,
  AuditEvent,
  DynamicQRPayload,
  OfflinePackage,
  SiffaUser,
  RoleType,
  Activity,
  CheckInRecord,
  NominaSubmission,
  Prerequisite,
  AuthorizedDevice,
  TestUserProfile,
  PublicVerificationResult,
} from '../types';
import nacl from 'tweetnacl';

// Helper to convert hex string to Uint8Array
function hexToUint8Array(hexString: string): Uint8Array {
  const cleanHex = hexString.replace(/^0x/, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

class SiffaApiService {
  private actorEmail: string = 'matiasmedina.n@gmail.com';
  private cachedPublicKeyHex: string | null = null;
  private cachedKeyId: string | null = null;

  public setActorEmail(email: string) {
    this.actorEmail = email;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-actor-email': this.actorEmail,
    };
  }

  // 1. PUBLIC KEYS
  async getPublicKey(): Promise<{ algorithm: string; keyId: string; publicKeyHex: string; issuer: string }> {
    const res = await fetch('/api/keys/public');
    const data = await res.json();
    this.cachedPublicKeyHex = data.publicKeyHex;
    this.cachedKeyId = data.keyId;
    return data;
  }

  // 2. AUTHENTICATION & IDENTITY
  async loginWithSiffa(credentials: {
    email: string;
    password?: string;
    method?: 'google' | 'password';
  }): Promise<{ user: SiffaUser; token: string; permissions: string[] }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error de conexión con el servidor SIFFA' }));
      throw new Error(err.error || 'Usuario no autorizado o credenciales inválidas. Contacte al administrador.');
    }
    const data = await res.json();
    this.actorEmail = data.user.email;
    return data;
  }

  async getAuthorizedUsers(): Promise<SiffaUser[]> {
    const res = await fetch('/api/auth/authorized-users');
    if (!res.ok) return [];
    return res.json();
  }

  // 2.5 USER PROFILES (ADMIN GESTIÓN DE PERFILES & PRUEBAS)
  async getUsers(): Promise<TestUserProfile[]> {
    const res = await fetch('/api/users', { headers: this.getHeaders() });
    if (!res.ok) return [];
    return res.json();
  }

  async updateUser(email: string, data: Partial<TestUserProfile> & { newEmail?: string }): Promise<any> {
    const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar perfil de usuario');
    }
    return res.json();
  }

  async createUser(data: Partial<TestUserProfile>): Promise<any> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear perfil');
    }
    return res.json();
  }

  async deleteUser(email: string): Promise<any> {
    const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al eliminar perfil');
    }
    return res.json();
  }

  async getMe(): Promise<{ user: SiffaUser; permissions: string[] }> {
    const res = await fetch('/api/auth/me', { headers: this.getHeaders() });
    return res.json();
  }

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: this.getHeaders(),
    });
  }

  // 3. PROFESSIONALS
  async getProfessionals(): Promise<Professional[]> {
    const res = await fetch('/api/professionals', { headers: this.getHeaders() });
    return res.json();
  }

  async createProfessional(data: Partial<Professional>): Promise<Professional> {
    const res = await fetch('/api/professionals', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al crear profesional');
    }
    return res.json();
  }

  async updateProfessional(id: string, data: Partial<Professional>): Promise<Professional> {
    const res = await fetch(`/api/professionals/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al actualizar profesional' }));
      throw new Error(err.error || 'Error al actualizar atributos del profesional');
    }
    return res.json();
  }

  async updateProfessionalStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'): Promise<Professional> {
    const res = await fetch(`/api/professionals/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al actualizar estado');
    }
    return res.json();
  }

  // 4. ESTABLISHMENTS
  async getEstablishments(): Promise<Establishment[]> {
    const res = await fetch('/api/establishments', { headers: this.getHeaders() });
    return res.json();
  }

  // 5. AUTHORIZATIONS
  async getAuthorizations(): Promise<Authorization[]> {
    const res = await fetch('/api/authorizations', { headers: this.getHeaders() });
    return res.json();
  }

  async createAuthorization(data: Partial<Authorization>): Promise<Authorization> {
    const res = await fetch('/api/authorizations', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al crear autorización');
    }
    return res.json();
  }

  // 6. CREDENTIALS
  async getCredentials(): Promise<Credential[]> {
    const res = await fetch('/api/credentials', { headers: this.getHeaders() });
    return res.json();
  }

  // Consulta de compatibilidad
  async getLegacyMyCredential(): Promise<{
    professional: Professional | null;
    credential: Credential | null;
    authorizations: Authorization[];
  }> {
    const res = await fetch('/api/credentials/my', { headers: this.getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al obtener credencial personal' }));
      throw new Error(err.error || 'No se encontró tu credencial institucional');
    }
    return res.json();
  }

  async issueCredential(
    professionalId: string,
    authorizationId: string,
    credentialType: 'DIGITAL' | 'PHYSICAL' = 'DIGITAL'
  ): Promise<Credential> {
    const res = await fetch('/api/credentials/issue', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ professionalId, authorizationId, credentialType }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al emitir credencial');
    }
    return res.json();
  }

  async getPhysicalCredential(id: string): Promise<any> {
    const res = await fetch(`/api/credentials/${encodeURIComponent(id)}/physical`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al obtener credencial física');
    }
    return res.json();
  }

  // Verificación pública mínima por QR token (sin login)
  async getPublicVerification(qrToken: string): Promise<PublicVerificationResult> {
    const res = await fetch(`/api/verify/${encodeURIComponent(qrToken)}`, {
      headers: {
        'x-actor-email': this.actorEmail,
      },
    });
    const data = await res.json();
    return data;
  }

  // Consulta privada de Mi Credencial (requiere autenticación)
  async getMyCredential(): Promise<{
    person: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      documentNumber: string;
      matricula: string;
      professionalRole: string;
      profilePhotoUrl?: string;
      status: string;
    };
    credential: {
      id: string;
      credentialNumber: string;
      personId: string;
      issuedAt: string;
      expiresAt: string;
      status: string;
      qrToken: string;
      qrTokenVersion: number;
      publicVerificationUrl: string;
    } | null;
    authorizations: Array<{
      id: string;
      establishmentId: string;
      establishmentName?: string;
      actividad: string;
      diasYHorarios: string;
      validFrom: string;
      validUntil: string;
      funcion: string;
      status: string;
      referenciaDeLaAutorizacion: string;
    }>;
    disclaimer: string;
    notice: string;
  }> {
    const res = await fetch('/api/me/credential', { headers: this.getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al obtener tu credencial' }));
      throw new Error(err.error || 'No se pudo cargar tu credencial institucional');
    }
    return res.json();
  }

  async suspendCredential(credentialId: string, reason?: string): Promise<{ success: boolean; credential: Credential }> {
    const res = await fetch(`/api/credentials/${encodeURIComponent(credentialId)}/suspend`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al suspender credencial');
    }
    return res.json();
  }

  async revokeCredential(credentialId: string, reason?: string): Promise<{ success: boolean; credential: Credential }> {
    const res = await fetch(`/api/credentials/${encodeURIComponent(credentialId)}/revoke`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al revocar credencial');
    }
    return res.json();
  }

  async markCredentialLost(credentialId: string, reason?: string): Promise<{ success: boolean; credential: Credential }> {
    const res = await fetch(`/api/credentials/${encodeURIComponent(credentialId)}/mark-lost`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al registrar extravío');
    }
    return res.json();
  }

  async reprintCredential(credentialId: string): Promise<{ success: boolean; credential: Credential }> {
    const res = await fetch(`/api/credentials/${encodeURIComponent(credentialId)}/reprint`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al reimprimir credencial');
    }
    return res.json();
  }

  // Dynamic QR retrieval
  async getDynamicQR(credentialId: string): Promise<{
    dynamicQR: DynamicQRPayload;
    credentialStatus: string;
    expiresInSeconds: number;
  }> {
    const res = await fetch(`/api/credentials/dynamic-qr?credentialId=${encodeURIComponent(credentialId)}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al obtener código QR dinámico');
    }
    return res.json();
  }

  // 7. ACCESS DECISION VALIDATION (Online Mode)
  async validateAccessOnline(params: {
    qrPayload: DynamicQRPayload;
    establishmentId: string;
    validatorDeviceId?: string;
  }): Promise<{
    decision: 'ALLOWED' | 'DENIED';
    reasonCode: string;
    message: string;
    accessEventId?: string;
    timestamp?: string;
    credential?: Credential;
    professional?: Professional;
    authorization?: Authorization;
  }> {
    const res = await fetch('/api/validation/validate', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });
    return res.json();
  }

  async validateAccessByCode(params: {
    code: string;
    establishmentId: string;
    validatorDeviceId?: string;
  }): Promise<{
    decision: 'ALLOWED' | 'DENIED';
    reasonCode: string;
    message: string;
    accessEventId?: string;
    timestamp?: string;
    credential?: Credential;
    professional?: Professional;
    authorization?: Authorization;
  }> {
    const res = await fetch('/api/validation/validate-code', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });
    return res.json();
  }

  async confirmCheckIn(params: {
    accessEventId?: string;
    method?: 'QR' | 'MANUAL' | 'QR_ESTATICO';
    notes?: string;
    establishmentId?: string;
    professionalId?: string;
    credentialId?: string;
  }): Promise<{
    success: boolean;
    checkInRecord: CheckInRecord;
    message: string;
  }> {
    const res = await fetch('/api/validation/confirm-checkin', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al registrar ingreso' }));
      throw new Error(err.error || 'No se pudo registrar el ingreso en guardia');
    }
    return res.json();
  }

  async getCheckIns(): Promise<CheckInRecord[]> {
    const res = await fetch('/api/validation/checkins', { headers: this.getHeaders() });
    if (!res.ok) return [];
    return res.json();
  }

  async getActivities(): Promise<Activity[]> {
    const res = await fetch('/api/activities', { headers: this.getHeaders() });
    if (!res.ok) return [];
    return res.json();
  }

  async createActivity(data: Partial<Activity>): Promise<Activity> {
    const res = await fetch('/api/activities', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al programar actividad');
    }
    return res.json();
  }

  async renewCredential(id: string): Promise<Credential> {
    const res = await fetch(`/api/credentials/${id}/renew`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al renovar credencial');
    }
    return res.json();
  }

  // 8. OFFLINE PACKAGE & OFFLINE VALIDATOR
  async getOfflinePackage(establishmentId: string): Promise<OfflinePackage> {
    const res = await fetch(`/api/offline/package?establishmentId=${encodeURIComponent(establishmentId)}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al descargar paquete offline');
    }
    return res.json();
  }

  // Client-side offline validation using TweetNaCl (Ed25519) + Offline Package
  validateAccessOffline(params: {
    qrPayload: DynamicQRPayload;
    offlinePackage: OfflinePackage;
    targetEstablishmentId: string;
  }): {
    decision: 'ALLOWED' | 'DENIED';
    reasonCode: string;
    message: string;
    credential?: any;
    authorization?: any;
  } {
    const { qrPayload, offlinePackage, targetEstablishmentId } = params;

    // A. Check Ed25519 Signature
    try {
      const payloadToVerify = JSON.stringify({
        ver: qrPayload.ver,
        cid: qrPayload.cid,
        aid: qrPayload.aid,
        eid: qrPayload.eid,
        iat: qrPayload.iat,
        exp: qrPayload.exp,
        jti: qrPayload.jti,
        kid: qrPayload.kid,
      });

      const messageBytes = new TextEncoder().encode(payloadToVerify);
      const signatureBytes = hexToUint8Array(qrPayload.sig);
      const publicKeyBytes = hexToUint8Array(offlinePackage.publicKeyHex);

      const isValidSignature = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
      if (!isValidSignature) {
        return {
          decision: 'DENIED',
          reasonCode: 'FIRMA_INVALIDA_OFFLINE',
          message: 'Firma Ed25519 no válida según la clave pública institucional SIFFA.',
        };
      }
    } catch {
      return {
        decision: 'DENIED',
        reasonCode: 'ERROR_CRIPTO_OFFLINE',
        message: 'Fallo al procesar verificación asimétrica Ed25519.',
      };
    }

    // B. Check Expiration of dynamic QR (with 15s clock skew)
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds > qrPayload.exp + 15) {
      return {
        decision: 'DENIED',
        reasonCode: 'QR_EXPIRADO_OFFLINE',
        message: 'El QR dinámico ha expirado. Debe ser regenerado.',
      };
    }

    // C. Check Establishment Match
    if (qrPayload.eid !== targetEstablishmentId) {
      return {
        decision: 'DENIED',
        reasonCode: 'ESTABLECIMIENTO_INCORRECTO',
        message: `El pase no corresponde a este establecimiento penitenciario.`,
      };
    }

    // D. Check Local Revocation List
    if (offlinePackage.revocations.includes(qrPayload.cid)) {
      return {
        decision: 'DENIED',
        reasonCode: 'CREDENCIAL_REVOCADA',
        message: 'La credencial se encuentra en la lista local de revocaciones.',
      };
    }

    // E. Check Credential in Offline Package
    const cred = offlinePackage.credentials.find((c) => c.id === qrPayload.cid);
    if (!cred) {
      return {
        decision: 'DENIED',
        reasonCode: 'CREDENCIAL_NO_EMPADRONADA',
        message: 'La credencial no figura empadronada en el paquete offline de esta unidad.',
      };
    }

    if (cred.status !== 'ACTIVE') {
      return {
        decision: 'DENIED',
        reasonCode: `CREDENCIAL_ESTADO_${cred.status}`,
        message: `La credencial se encuentra con estado: ${cred.status}`,
      };
    }

    // F. Check Authorization
    const auth = offlinePackage.authorizations.find((a) => a.id === qrPayload.aid);
    if (!auth || auth.status !== 'ACTIVE') {
      return {
        decision: 'DENIED',
        reasonCode: 'AUTORIZACION_NO_VIGENTE',
        message: 'La autorización institucional no está activa para esta unidad.',
      };
    }

    // G. Contextual Date & Time Verification
    const todayStr = new Date().toISOString().split('T')[0];
    if (todayStr < auth.validFrom || todayStr > auth.validUntil) {
      return {
        decision: 'DENIED',
        reasonCode: 'FECHA_FUERA_DE_VIGENCIA',
        message: `Fecha fuera del rango de autorización (${auth.validFrom} a ${auth.validUntil}).`,
      };
    }

    const currentDay = new Date().getDay();
    if (!auth.allowedDays.includes(currentDay)) {
      return {
        decision: 'DENIED',
        reasonCode: 'DIA_NO_AUTORIZADO',
        message: 'El profesional no posee autorización de ingreso en el día de la fecha.',
      };
    }

    // Validated OK!
    return {
      decision: 'ALLOWED',
      reasonCode: 'ACCESO_CONCEDIDO_OFFLINE',
      message: `Acceso Autorizado Modo Offline (Firma Ed25519 Válida). Profesional: ${cred.professionalName} (${cred.professionalRole})`,
      credential: cred,
      authorization: auth,
    };
  }

  // 9. AUDIT & ACCESS LOGS
  async getAccessEvents(): Promise<AccessEvent[]> {
    const res = await fetch('/api/access-events', { headers: this.getHeaders() });
    return res.json();
  }

  async getAuditEvents(): Promise<AuditEvent[]> {
    const res = await fetch('/api/audit-events', { headers: this.getHeaders() });
    return res.json();
  }

  // 10. FASE 2: NOMINAS SUBMISSIONS, PREREQUISITES & AUTHORIZED DEVICES
  async getNominas(): Promise<NominaSubmission[]> {
    const res = await fetch('/api/nominas', { headers: this.getHeaders() });
    return res.json();
  }

  async createNomina(data: {
    establishmentId: string;
    professionals: Array<{
      professionalId: string;
      firstName: string;
      lastName: string;
      documentNumber: string;
      role: string;
    }>;
    observations?: string;
  }): Promise<NominaSubmission> {
    const res = await fetch('/api/nominas', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al enviar nómina');
    }
    return res.json();
  }

  async reviewNomina(id: string, review: { status: string; observations?: string }): Promise<NominaSubmission> {
    const res = await fetch(`/api/nominas/${id}/review`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(review),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al evaluar nómina');
    }
    return res.json();
  }

  async getPrerequisites(params?: { professionalId?: string; establishmentId?: string }): Promise<Prerequisite[]> {
    let url = '/api/prerequisites';
    const query = new URLSearchParams();
    if (params?.professionalId) query.set('professionalId', params.professionalId);
    if (params?.establishmentId) query.set('establishmentId', params.establishmentId);
    const qs = query.toString();
    if (qs) url += `?${qs}`;

    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  async createPrerequisite(data: Partial<Prerequisite>): Promise<Prerequisite> {
    const res = await fetch('/api/prerequisites', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al registrar requisito previo');
    }
    return res.json();
  }

  async updatePrerequisiteStatus(id: string, status: string, validUntil?: string): Promise<Prerequisite> {
    const res = await fetch(`/api/prerequisites/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, validUntil }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar estado del requisito');
    }
    return res.json();
  }

  async getAuthorizedDevices(): Promise<AuthorizedDevice[]> {
    const res = await fetch('/api/authorized-devices', { headers: this.getHeaders() });
    return res.json();
  }

  async createAuthorizedDevice(data: Partial<AuthorizedDevice>): Promise<AuthorizedDevice> {
    const res = await fetch('/api/authorized-devices', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al autorizar dispositivo');
    }
    return res.json();
  }

  async updateAuthorizedDeviceStatus(id: string, status: string): Promise<AuthorizedDevice> {
    const res = await fetch(`/api/authorized-devices/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar dispositivo');
    }
    return res.json();
  }

  // 12. SITE IMAGES (ADMIN VISUAL CUSTOMIZATION)
  async getSiteImages(): Promise<Record<string, string>> {
    try {
      const res = await fetch('/api/site-images');
      if (!res.ok) return {};
      return await res.json();
    } catch {
      return {};
    }
  }

  async updateSiteImage(key: string, dataUrl: string, title?: string): Promise<{ success: boolean; key: string }> {
    const res = await fetch('/api/site-images', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ key, dataUrl, title }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar imagen del sitio');
    }
    return res.json();
  }

  async resetSiteImage(key: string): Promise<{ success: boolean; key: string }> {
    const res = await fetch(`/api/site-images/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al restablecer imagen');
    }
    return res.json();
  }
}

export const api = new SiffaApiService();

