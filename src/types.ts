// ==============================================================
// SIFFA Institutional Types & Architectural Models
// ==============================================================

export type RoleType = 
  | 'SUPER_ADMIN' 
  | 'ADMIN_CREDENTIALS' 
  | 'INSTITUTIONAL_MANAGER' 
  | 'AUDITOR' 
  | 'VALIDATOR' 
  | 'PROFESSIONAL';

export type FunctionalRole = 
  | 'DOCENTE' 
  | 'INSTRUCTOR' 
  | 'DIRECTIVO' 
  | 'ORGANIZADOR';

export type ProfessionalStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export type CredentialStatus =
  | 'ACTIVA'
  | 'SUSPENDIDA'
  | 'REVOCADA'
  | 'VENCIDA'
  | 'DENUNCIADA_PERDIDA'
  // Compatibilidad hacia atrás:
  | 'activa'
  | 'suspendida'
  | 'revocada'
  | 'vencida'
  | 'denunciada_por_perdida'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'EXPIRED';

export type AuthorizationStatus =
  | 'PENDIENTE'
  | 'AUTORIZADA'
  | 'SUSPENDIDA'
  | 'REVOCADA'
  | 'VENCIDA'
  // Compatibilidad hacia atrás:
  | 'pendiente'
  | 'autorizada'
  | 'suspendida'
  | 'revocada'
  | 'vencida'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'EXPIRED';

export type CredentialType = 'PHYSICAL' | 'DIGITAL';
export type AccessEventType = 'CHECK_IN' | 'CHECK_OUT';
export type ValidationMode = 'ONLINE' | 'OFFLINE';
export type AccessDecision = 'ALLOWED' | 'DENIED'; // solo uso interno

export type TabType = 
  | 'home' 
  | 'siffa'
  | 'proyectos'
  | 'profesionales'
  | 'credencial'
  | 'ingresos'
  | 'informacion'
  | 'mi-credencial'
  | 'mi-perfil'
  | 'actividades'
  | 'validar'
  | 'historial-ingresos'
  | 'gestion-admin'
  | 'establecimientos'
  | 'roles-permisos'
  | 'auditoria'
  | 'configuracion'
  | 'campus' 
  | 'programa'
  | 'acreditaciones'
  | 'dashboard' 
  | 'seguimiento' 
  | 'monitoreo';

export interface Activity {
  id: string;
  title: string;
  category: 'FUTBOL_11' | 'ARBITRAJE' | 'PREPARACION_FISICA' | 'PSICOLOGIA_DEPORTIVA' | 'OFICIOS';
  establishmentId: string;
  establishmentName: string;
  professionalId: string;
  professionalName: string;
  schedule: string; // e.g. "Martes y Jueves 09:00 - 11:30"
  pabellon: string;
  capacity: number;
  enrolledCount: number;
  status: 'ACTIVE' | 'PLANNED' | 'SUSPENDED';
}

export interface CheckInRecord {
  validationId: string;
  professionalId: string;
  professionalName: string;
  documentNumber: string;
  credentialId: string;
  guardName: string;
  guardUserId: string;
  timestamp: string;
  establishmentId: string;
  establishmentName: string;
  activity: string;
  result: 'ALLOWED' | 'DENIED';
  reasonCode: string;
  method: 'QR' | 'MANUAL' | 'QR_ESTATICO';
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role: string;
  googleId?: string;
  fechaRegistro?: string;
  clasesCompletadas?: number;
}

export interface SiffaUser {
  uid: string;
  email: string;
  displayName: string;
  role: RoleType;
  professionalId?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  token?: string;
  password?: string;
  allowedGoogleAuth?: boolean;
}

export interface TestUserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: RoleType;
  status: 'ACTIVE' | 'SUSPENDED';
  password?: string;
  allowedGoogleAuth?: boolean;
  professionalId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  documentNumber?: string;
  matricula?: string;
  specialty?: string;
  professionalRole?: FunctionalRole;
  profilePhotoUrl?: string;
  establishmentId?: string;
  establishmentName?: string;
  hasActiveCredential?: boolean;
  credentialId?: string;
}

export interface Professional {
  id: string;
  authUid?: string;
  firstName: string;
  lastName: string;
  documentNumber: string; // DNI
  email: string;
  phone: string;
  professionalRole: FunctionalRole;
  status: ProfessionalStatus;
  matricula: string;
  specialty: string;
  profilePhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Establishment {
  id: string;
  name: string;
  code: string;
  province: string;
  municipality: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE';
  requiresDniOnCard?: boolean; // FASE 3: Solo se imprime DNI en tarjeta si la Unidad lo requiere
}

export interface Authorization {
  id: string;
  personId?: string; // ID del integrante SIFFA
  professionalId: string; // alias
  establishmentId: string;
  actividad?: string; // e.g. "Fútbol Femenino y Formación en Arbitraje"
  purpose: string; // alias compatibilidad
  fechas?: {
    validFrom: string; // YYYY-MM-DD
    validUntil: string; // YYYY-MM-DD
  };
  validFrom: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  diasYHorarios?: string; // e.g. "Martes y Jueves 09:00 - 12:00"
  allowedDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  funcion?: string; // Función con la que ingresa (e.g. "Docente Formadora")
  status: AuthorizationStatus;
  referenciaDeLaAutorizacion?: string; // Disposición / Nota formal emitida por la Unidad Penitenciaria
  approvedBy: string;
  createdAt: string;
  updatedAt: string;
  professionalName?: string;
  establishmentName?: string;
}

export interface Credential {
  id: string;
  credentialNumber?: string; // Número de credencial oficial SIFFA (ej: SIFFA-CR-001)
  personId?: string; // ID del integrante SIFFA (no DNI)
  professionalId: string; // alias para compatibilidad
  authorizationId: string;
  issuedAt: string;
  expiresAt: string;
  status: CredentialStatus;
  qrToken?: string; // Token aleatorio seguro (mínimo 128 bits, base64url, crypto.randomBytes)
  qrTokenVersion?: number;
  credentialVersion: number;
  credentialType?: CredentialType;
  staticTokenId?: string;
  keyId?: string;
  tokenId?: string;
  publicVerificationUrl?: string;
  createdAt: string;
  revokedAt?: string;
  revokedReason?: string;
  professionalName?: string;
  establishmentName?: string;
  professionalRole?: FunctionalRole;
}

export interface PublicVerificationResult {
  valid: boolean;
  status: string; // 'ACTIVA' | 'Credencial no vigente' | 'VENCIDA' | etc.
  statusLabel?: string;
  statusColor: 'emerald' | 'rose' | 'amber' | 'slate';
  credentialNumber?: string;
  personName?: string;
  roleInSiffa?: string;
  photoUrl?: string;
  expiresAt?: string;
  expiresAtFormatted?: string;
  disclaimer: string;
  reason?: string;
  validatorContext?: {
    isValidatorSession: boolean;
    authorizationStatus: string;
    authorizationStatusText: string;
    disclaimerPenitenciaria: string;
    establishmentName?: string;
    actividad?: string;
    diasYHorarios?: string;
    funcion?: string;
    referenciaDeLaAutorizacion?: string;
  };
}

export interface DynamicQRPayload {
  ver: number; // 1
  cid: string; // credentialId
  aid: string; // authorizationId
  eid: string; // establishmentId
  iat: number; // issuedAt timestamp seconds
  exp: number; // expiresAt timestamp seconds
  jti: string; // unique token ID
  kid: string; // signing key ID
  sig: string; // Ed25519 signature in hex
}

export interface AccessEvent {
  id: string;
  professionalId: string;
  credentialId: string;
  authorizationId: string;
  establishmentId: string;
  validatorDeviceId: string;
  validationMode: ValidationMode;
  decision: AccessDecision;
  eventType?: AccessEventType; // CHECK_IN | CHECK_OUT
  reasonCode: string;
  timestamp: string;
  credentialVersion: number;
  synchronizationStatus: 'SYNCED' | 'PENDING_SYNC';
  professionalName?: string;
  documentNumber?: string;
  establishmentName?: string;
}

export interface AuditEvent {
  id: string;
  actorUserId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata?: Record<string, any>;
}

export interface OfflinePackage {
  establishmentId: string;
  establishmentName: string;
  packageVersion: number;
  generatedAt: number;
  expiresAt: number;
  credentials: Array<{
    id: string;
    professionalId: string;
    authorizationId: string;
    status: CredentialStatus;
    credentialVersion: number;
    expiresAt: string;
    professionalName: string;
    documentNumber: string;
    professionalRole: FunctionalRole;
  }>;
  authorizations: Array<{
    id: string;
    professionalId: string;
    establishmentId: string;
    validFrom: string;
    validUntil: string;
    allowedDays: number[];
    startTime: string;
    endTime: string;
    status: AuthorizationStatus;
    purpose: string;
  }>;
  revocations: string[];
  keyId: string;
  publicKeyHex: string;
  signature: string;
}

// Legacy initial data types for compatibility with educational/campus views
export interface DocenteAcreditado {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  matricula: string;
  rol: string;
  especialidad: string;
  unidadAsignada: string;
  autoproteccionEstado: string;
  autoproteccionFecha: string;
  autoproteccionNota: string;
  supervisadoPor: string;
  fotoUrl: string;
  vigencia: string;
  nivelSeguridad: string;
  qrCodeData: string;
}

export interface ParticipanteJudicial {
  id: string;
  legajo: string;
  nombreCompleto: string;
  unidad: string;
  pabellon: string;
  asistenciaPorcentaje: number;
  indiceConducta: number;
  calificacionSPB: string;
  avanceFisicoPsicologico: string;
  horasComputadas: number;
  beneficioSolicitado: string;
  fechaIngresoPrograma: string;
  dictamenPsicosocial: string;
}

export interface VideoRecurso {
  nombre: string;
  tipo: string;
  peso: string;
}

export interface VideoLeccion {
  id: string;
  titulo: string;
  modulo: string;
  duracion: string;
  profesora: string;
  descripcion: string;
  thumbnail: string;
  recursos: VideoRecurso[];
}

export interface MovilGPS {
  id: string;
  codigo: string;
  vehiculo: string;
  patente: string;
  conductor: string;
  docentesABordo: string[];
  destino: string;
  latitud: number;
  longitud: number;
  velocidadKmh: number;
  frecuenciaReporteSeg: number;
  estado: string;
  geocercaEstado: string;
  bateriaTelemetria: number;
  senalGsm: string;
  ultimoPing: string;
}

export interface EventoSeguridad {
  id: string;
  timestamp: string;
  tipo: string;
  mensaje: string;
  origen: string;
}

// ==============================================================
// FASE 2: Flujo Institucional SIFFA → Unidad Penitenciaria
// ==============================================================

export type NominaStatus = 'enviada' | 'aprobada' | 'rechazada' | 'parcial';

export interface NominaProfessional {
  professionalId: string;
  firstName: string;
  lastName: string;
  documentNumber: string; // DNI
  role: string; // función institucional
}

export interface NominaSubmission {
  id: string;
  establishmentId: string;
  establishmentName?: string;
  submittedByUserId: string;
  submittedByUserName?: string;
  submittedAt: string; // ISO timestamp
  professionals: NominaProfessional[];
  status: NominaStatus;
  approvedByUserId?: string;
  approvedByUserName?: string;
  approvedAt?: string; // ISO timestamp
  observations?: string;
}

export type PrerequisiteType = 
  | 'acuerdo_confidencialidad' 
  | 'seguro' 
  | 'documentacion' 
  | 'capacitacion' 
  | 'dispositivo';

export type PrerequisiteStatus = 'pendiente' | 'cumplido' | 'vencido' | 'rechazado';

export interface Prerequisite {
  id: string;
  professionalId: string;
  professionalName?: string;
  establishmentId: string;
  establishmentName?: string;
  type: PrerequisiteType;
  status: PrerequisiteStatus;
  validUntil?: string; // ISO timestamp
  documentUrl?: string;
}

export type DeviceStatus = 'activo' | 'revocado' | 'vencido';

export interface AuthorizedDevice {
  id: string;
  deviceId: string;
  establishmentId: string;
  establishmentName?: string;
  authorizedByUserId: string;
  validUntil?: string; // ISO timestamp
  status: DeviceStatus;
}
