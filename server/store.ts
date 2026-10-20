import crypto from 'crypto';
import {
  Professional,
  Establishment,
  Authorization,
  Credential,
  AccessEvent,
  AuditEvent,
  SiffaUser,
  RoleType,
  Activity,
  CheckInRecord,
  NominaSubmission,
  Prerequisite,
  AuthorizedDevice,
} from '../src/types';

// SIFFA Institutional In-Memory / Structured State Store
class SiffaServerStore {
  public users: Map<string, SiffaUser> = new Map();
  public professionals: Map<string, Professional> = new Map();
  public establishments: Map<string, Establishment> = new Map();
  public authorizations: Map<string, Authorization> = new Map();
  public credentials: Map<string, Credential> = new Map();
  public qrTokens: Map<string, string> = new Map(); // Índice único y seguro: qrToken -> credentialId
  public activities: Map<string, Activity> = new Map();
  public checkInRecords: CheckInRecord[] = [];
  public accessEvents: AccessEvent[] = [];
  public auditEvents: AuditEvent[] = [];
  public usedTokens: Set<string> = new Set(); // Replay protection
  public nominaSubmissions: Map<string, NominaSubmission> = new Map();
  public prerequisites: Map<string, Prerequisite> = new Map();
  public authorizedDevices: Map<string, AuthorizedDevice> = new Map();
  public siteImages: Map<string, string> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Establishments (Unidades Penitenciarias Bonaerenses)
    const establishmentsList: Establishment[] = [
      {
        id: 'EST-U33',
        name: 'Unidad Penitenciaria N° 33 Los Hornos',
        code: 'SPB-U33-LH',
        province: 'Buenos Aires',
        municipality: 'La Plata',
        address: 'Calle 149 y 70, Los Hornos',
        status: 'ACTIVE',
        requiresDniOnCard: false, // DNI no impreso en carnet físico por defecto
      },
      {
        id: 'EST-U47',
        name: 'Unidad Penitenciaria N° 47 San Martín',
        code: 'SPB-U47-SM',
        province: 'Buenos Aires',
        municipality: 'General San Martín',
        address: 'Camino del Buen Ayre y Debenedetti',
        status: 'ACTIVE',
        requiresDniOnCard: true, // Unidad que requiere DNI visible en tarjeta física
      },
      {
        id: 'EST-U50',
        name: 'Unidad Penitenciaria N° 50 Batán (Femenina)',
        code: 'SPB-U50-BAT',
        province: 'Buenos Aires',
        municipality: 'Mar del Plata',
        address: 'Ruta Provincial 88 Km 8.5',
        status: 'ACTIVE',
      },
      {
        id: 'EST-U40',
        name: 'Unidad Penitenciaria N° 40 Lomas de Zamora',
        code: 'SPB-U40-LZ',
        province: 'Buenos Aires',
        municipality: 'Lomas de Zamora',
        address: 'Av. Juan XXIII y Las Heras',
        status: 'ACTIVE',
      },
      {
        id: 'EST-U51',
        name: 'Unidad Penitenciaria N° 51 Magdalena',
        code: 'SPB-U51-MAG',
        province: 'Buenos Aires',
        municipality: 'Magdalena',
        address: 'Ruta 11 Km 55',
        status: 'ACTIVE',
      },
    ];
    establishmentsList.forEach((e) => this.establishments.set(e.id, e));

    // 2. Professionals
    const pros: Professional[] = [
      {
        id: 'PROF-ADMIN',
        authUid: 'user-admin-01',
        firstName: 'Matías',
        lastName: 'Medina',
        documentNumber: '33891204',
        email: 'matiasmedina.n@gmail.com',
        phone: '+54 11 4402-9910',
        professionalRole: 'DIRECTIVO',
        status: 'ACTIVE',
        matricula: 'DIR-0001 / SIFFA-GOB-001',
        specialty: 'Dirección General y Supervisión Tecnológica SIFFA',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T08:00:00Z',
      },
      {
        id: 'PROF-01',
        authUid: 'UID-MG-01',
        firstName: 'Marcela',
        lastName: 'Giménez',
        documentNumber: '32849120',
        email: 'marcela.gimenez@siffa.org',
        phone: '+54 11 4829-1920',
        professionalRole: 'DOCENTE',
        status: 'ACTIVE',
        matricula: 'ATFA-4821 / SIFFA-0089',
        specialty: 'Táctica de Fútbol 11 y Gestión Grupal',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
        createdAt: '2026-01-10T10:00:00Z',
        updatedAt: '2026-02-14T12:00:00Z',
      },
      {
        id: 'PROF-02',
        authUid: 'UID-RA-02',
        firstName: 'Romina',
        lastName: 'Albornoz',
        documentNumber: '35412780',
        email: 'romina.albornoz@siffa.org',
        phone: '+54 11 3918-2940',
        professionalRole: 'INSTRUCTOR',
        status: 'ACTIVE',
        matricula: 'PE-1928 / SIFFA-0104',
        specialty: 'Acondicionamiento Físico y Prevención de Lesiones',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
        createdAt: '2026-01-15T11:00:00Z',
        updatedAt: '2026-01-20T14:00:00Z',
      },
      {
        id: 'PROF-03',
        authUid: 'UID-FN-03',
        firstName: 'Florencia',
        lastName: 'Navarro',
        documentNumber: '36901442',
        email: 'florencia.navarro@siffa.org',
        phone: '+54 223 581-9201',
        professionalRole: 'DOCENTE',
        status: 'ACTIVE',
        matricula: 'MP-8920 / SIFFA-0122',
        specialty: 'Psicología Social y Manejo de Convivencia',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80',
        createdAt: '2026-02-01T09:00:00Z',
        updatedAt: '2026-02-10T16:00:00Z',
      },
      {
        id: 'PROF-04',
        authUid: 'UID-EV-04',
        firstName: 'Esteban',
        lastName: 'Valenzuela',
        documentNumber: '31229401',
        email: 'esteban.valenzuela@siffa.org',
        phone: '+54 11 6721-0091',
        professionalRole: 'DIRECTIVO',
        status: 'ACTIVE',
        matricula: 'CPACF-9201 / SIFFA-0041',
        specialty: 'Coordinación Legal y Mediación Institucional',
        createdAt: '2026-01-05T08:00:00Z',
        updatedAt: '2026-01-05T08:00:00Z',
      },
      {
        id: 'PROF-05',
        authUid: 'UID-VS-05',
        firstName: 'Valeria',
        lastName: 'Sosa',
        documentNumber: '34119820',
        email: 'valeria.sosa@siffa.org',
        phone: '+54 11 5019-3321',
        professionalRole: 'INSTRUCTOR',
        status: 'SUSPENDED', // Suspendido como caso de prueba
        matricula: 'AFA-REF-912 / SIFFA-0130',
        specialty: 'Árbitra Oficial AFA y Capacitadora de Reglamento',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80',
        createdAt: '2026-01-20T08:00:00Z',
        updatedAt: '2026-02-01T08:00:00Z',
      },
      {
        id: 'PROF-06',
        authUid: 'UID-CB-06',
        firstName: 'Camila',
        lastName: 'Benítez',
        documentNumber: '38221094',
        email: 'camila.benitez@siffa.org',
        phone: '+54 11 6312-7744',
        professionalRole: 'DOCENTE',
        status: 'ACTIVE',
        matricula: 'CFP-704 / SIFFA-0215',
        specialty: 'Tallerista de Formación Laboral y Textil Deportivo',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
        createdAt: '2026-01-25T09:00:00Z',
        updatedAt: '2026-02-03T11:00:00Z',
      },
      {
        id: 'PROF-07',
        authUid: 'user-dir-01',
        firstName: 'Silvina',
        lastName: 'Campos',
        documentNumber: '27182903',
        email: 'silvina.campos@siffa.org',
        phone: '+54 11 4110-5500',
        professionalRole: 'DIRECTIVO',
        status: 'ACTIVE',
        matricula: 'DIR-0002 / SIFFA-GOB-002',
        specialty: 'Dirección General SIFFA - Convenio PBA / SPB',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80',
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T08:00:00Z',
      },
      {
        id: 'PROF-08',
        authUid: 'user-val-01',
        firstName: 'Guardia',
        lastName: 'Garita UP33',
        documentNumber: '30419822',
        email: 'guardia.u33@spb.gba.gob.ar',
        phone: '+54 221 479-1120',
        professionalRole: 'INSTRUCTOR',
        status: 'ACTIVE',
        matricula: 'SPB-GUARD-33',
        specialty: 'Control de Garita y Validador de Acceso Penal',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=400&auto=format&fit=crop&q=80',
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T08:00:00Z',
      },
      {
        id: 'PROF-09',
        authUid: 'user-aud-01',
        firstName: 'Auditoría',
        lastName: 'Institucional',
        documentNumber: '28918472',
        email: 'auditoria@siffa.org',
        phone: '+54 11 5200-9900',
        professionalRole: 'DIRECTIVO',
        status: 'ACTIVE',
        matricula: 'AUD-SIFFA-01',
        specialty: 'Auditoría Forense y Trazabilidad de Accesos',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T08:00:00Z',
      },
    ];
    pros.forEach((p) => this.professionals.set(p.id, p));

    // 3. Contextual Authorizations (Colección independiente: personId, establishmentId, fechas, horarios, etc.)
    const auths: Authorization[] = [
      {
        id: 'AUTH-ADMIN',
        personId: 'PROF-ADMIN',
        professionalId: 'PROF-ADMIN',
        establishmentId: 'EST-U33',
        actividad: 'Dirección General, Auditoría y Supervisión Institucional SIFFA',
        purpose: 'Dirección General, Auditoría y Supervisión Institucional SIFFA',
        fechas: {
          validFrom: '2026-01-01',
          validUntil: '2026-12-31',
        },
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
        diasYHorarios: 'Lunes a Viernes 08:00 - 18:00',
        allowedDays: [1, 2, 3, 4, 5, 6, 7],
        startTime: '00:00',
        endTime: '23:59',
        funcion: 'Director General SIFFA',
        status: 'AUTORIZADA',
        referenciaDeLaAutorizacion: 'Resolución Ministerial SPB N° 102/2026',
        approvedBy: 'Dra. Silvina Campos (Dir. General SIFFA - SPB)',
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T08:00:00Z',
        professionalName: 'Matías Medina',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
      },
      {
        id: 'AUTH-01',
        personId: 'PROF-01',
        professionalId: 'PROF-01',
        establishmentId: 'EST-U33',
        actividad: 'Dictado de Taller de Fútbol Femenino y Táctica (Módulo Deportivo)',
        purpose: 'Dictado de Taller de Fútbol Femenino y Táctica (Módulo Deportivo)',
        fechas: {
          validFrom: '2026-01-01',
          validUntil: '2026-12-31',
        },
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
        diasYHorarios: 'Lunes y Miércoles 09:00 - 12:00',
        allowedDays: [1, 3],
        startTime: '09:00',
        endTime: '12:00',
        funcion: 'Docente Formadora Deportiva',
        status: 'AUTORIZADA',
        referenciaDeLaAutorizacion: 'Disposición SPB-U33 N° 418/2026',
        approvedBy: 'Dra. Silvina Campos (Dir. General SIFFA)',
        createdAt: '2026-01-02T10:00:00Z',
        updatedAt: '2026-01-02T10:00:00Z',
        professionalName: 'Lic. Marcela Giménez',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
      },
      {
        id: 'AUTH-02',
        personId: 'PROF-02',
        professionalId: 'PROF-02',
        establishmentId: 'EST-U47',
        actividad: 'Entrenamiento Físico y Prevención de Lesiones en Patio Central',
        purpose: 'Entrenamiento Físico y Prevención de Lesiones en Patio Central',
        fechas: {
          validFrom: '2026-01-01',
          validUntil: '2026-12-31',
        },
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
        diasYHorarios: 'Martes y Jueves 10:00 - 13:00',
        allowedDays: [2, 4],
        startTime: '10:00',
        endTime: '13:00',
        funcion: 'Instructora de Preparación Física',
        status: 'AUTORIZADA',
        referenciaDeLaAutorizacion: 'Disposición SPB-U47 N° 209/2026',
        approvedBy: 'Dra. Silvina Campos (Dir. General SIFFA)',
        createdAt: '2026-01-03T11:00:00Z',
        updatedAt: '2026-01-03T11:00:00Z',
        professionalName: 'Prof. Romina Albornoz',
        establishmentName: 'Unidad Penitenciaria N° 47 San Martín',
      },
      {
        id: 'AUTH-03',
        personId: 'PROF-03',
        professionalId: 'PROF-03',
        establishmentId: 'EST-U50',
        actividad: 'Taller de Arbitraje Oficial y Formación en Reglas AFA/SIFFA',
        purpose: 'Taller de Arbitraje Oficial y Formación en Reglas AFA/SIFFA',
        fechas: {
          validFrom: '2026-01-01',
          validUntil: '2026-12-31',
        },
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
        diasYHorarios: 'Viernes 14:00 - 17:00',
        allowedDays: [5],
        startTime: '14:00',
        endTime: '17:00',
        funcion: 'Docente Formadora de Arbitraje',
        status: 'AUTORIZADA',
        referenciaDeLaAutorizacion: 'Disposición SPB-U50 N° 311/2026',
        approvedBy: 'Dra. Silvina Campos (Dir. General SIFFA)',
        createdAt: '2026-01-04T12:00:00Z',
        updatedAt: '2026-01-04T12:00:00Z',
        professionalName: 'Lic. Florencia Navarro',
        establishmentName: 'Unidad Penitenciaria N° 50 Batán (Femenina)',
      },
      {
        id: 'AUTH-04',
        personId: 'PROF-05',
        professionalId: 'PROF-05',
        establishmentId: 'EST-U40',
        actividad: 'Taller Textil y Confección de Indumentaria Deportiva',
        purpose: 'Taller Textil y Confección de Indumentaria Deportiva',
        fechas: {
          validFrom: '2026-01-01',
          validUntil: '2026-06-30',
        },
        validFrom: '2026-01-01',
        validUntil: '2026-06-30',
        diasYHorarios: 'Lunes a Jueves 08:30 - 12:30',
        allowedDays: [1, 2, 3, 4],
        startTime: '08:30',
        endTime: '12:30',
        funcion: 'Instructora de Oficios',
        status: 'SUSPENDIDA',
        referenciaDeLaAutorizacion: 'Nota SPB-U40 N° 088/2026 (En Revisión)',
        approvedBy: 'Dra. Silvina Campos',
        createdAt: '2026-01-10T10:00:00Z',
        updatedAt: '2026-02-01T10:00:00Z',
        professionalName: 'Valeria Sosa',
        establishmentName: 'Unidad Penitenciaria N° 40 Lomas de Zamora',
      },
    ];
    auths.forEach((a) => this.authorizations.set(a.id, a));

    // 4. Credenciales con modelo adaptado (qrToken criptográfico independiente, status formal, sin DNI visible)
    const creds: Credential[] = [
      {
        id: 'CRED-ADMIN',
        credentialNumber: 'SIFFA-CR-001',
        personId: 'PROF-ADMIN',
        professionalId: 'PROF-ADMIN',
        authorizationId: 'AUTH-ADMIN',
        issuedAt: '2026-01-01T08:00:00Z',
        expiresAt: '2026-12-31T23:59:59Z',
        status: 'ACTIVA',
        qrToken: 'siffa_token_admin_k8F29w01bZpL49aQ',
        qrTokenVersion: 1,
        credentialVersion: 1,
        createdAt: '2026-01-01T08:00:00Z',
        professionalName: 'Matías Medina',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
        professionalRole: 'DIRECTIVO',
      },
      {
        id: 'CRED-001',
        credentialNumber: 'SIFFA-CR-002',
        personId: 'PROF-01',
        professionalId: 'PROF-01',
        authorizationId: 'AUTH-01',
        issuedAt: '2026-01-02T10:00:00Z',
        expiresAt: '2026-12-31T23:59:59Z',
        status: 'ACTIVA',
        qrToken: 'siffa_token_marcela_7xN92qL01vYt48cE',
        qrTokenVersion: 1,
        credentialVersion: 1,
        createdAt: '2026-01-02T10:00:00Z',
        professionalName: 'Lic. Marcela Giménez',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
        professionalRole: 'DOCENTE',
      },
      {
        id: 'CRED-002',
        credentialNumber: 'SIFFA-CR-003',
        personId: 'PROF-02',
        professionalId: 'PROF-02',
        authorizationId: 'AUTH-02',
        issuedAt: '2026-01-03T11:00:00Z',
        expiresAt: '2026-12-31T23:59:59Z',
        status: 'ACTIVA',
        qrToken: 'siffa_token_romina_3pB71mK92uXz84vD',
        qrTokenVersion: 1,
        credentialVersion: 1,
        createdAt: '2026-01-03T11:00:00Z',
        professionalName: 'Prof. Romina Albornoz',
        establishmentName: 'Unidad Penitenciaria N° 47 San Martín',
        professionalRole: 'INSTRUCTOR',
      },
      {
        id: 'CRED-003',
        credentialNumber: 'SIFFA-CR-004',
        personId: 'PROF-03',
        professionalId: 'PROF-03',
        authorizationId: 'AUTH-03',
        issuedAt: '2026-01-04T12:00:00Z',
        expiresAt: '2026-12-31T23:59:59Z',
        status: 'ACTIVA',
        qrToken: 'siffa_token_florencia_6rT83nO19yWa27fB',
        qrTokenVersion: 1,
        credentialVersion: 1,
        createdAt: '2026-01-04T12:00:00Z',
        professionalName: 'Lic. Florencia Navarro',
        establishmentName: 'Unidad Penitenciaria N° 50 Batán (Femenina)',
        professionalRole: 'DOCENTE',
      },
      {
        id: 'CRED-REVOKED-004',
        credentialNumber: 'SIFFA-CR-005',
        personId: 'PROF-04',
        professionalId: 'PROF-04',
        authorizationId: 'AUTH-01',
        issuedAt: '2026-01-01T10:00:00Z',
        expiresAt: '2026-12-31T23:59:59Z',
        status: 'REVOCADA', // Caso de prueba credencial revocada
        qrToken: 'siffa_token_revoked_9kM34vP81wQs62tX',
        qrTokenVersion: 1,
        credentialVersion: 1,
        createdAt: '2026-01-01T10:00:00Z',
        revokedAt: '2026-02-15T10:00:00Z',
        revokedReason: 'Baja preventiva por reasignación judicial',
        professionalName: 'Esteban Valenzuela',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
        professionalRole: 'DIRECTIVO',
      },
      {
        id: 'CRED-PENDING-005',
        credentialNumber: 'SIFFA-CR-006',
        personId: 'PROF-01',
        professionalId: 'PROF-01',
        authorizationId: 'AUTH-01',
        issuedAt: '2026-02-01T10:00:00Z',
        expiresAt: '2026-12-31T23:59:59Z',
        status: 'SUSPENDIDA', // PENDIENTE DE HOMOLOGACIÓN / SUSPENDIDA
        qrToken: 'siffa_token_suspended_2jK89vL14wPz73rM',
        qrTokenVersion: 2,
        credentialVersion: 2,
        createdAt: '2026-02-01T10:00:00Z',
        professionalName: 'Lic. Marcela Giménez (Renovación)',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
        professionalRole: 'DOCENTE',
      },
      {
        id: 'CRED-EXPIRED-006',
        credentialNumber: 'SIFFA-CR-007',
        personId: 'PROF-02',
        professionalId: 'PROF-02',
        authorizationId: 'AUTH-02',
        issuedAt: '2024-01-01T10:00:00Z',
        expiresAt: '2025-01-01T00:00:00Z', // VENCIDA
        status: 'VENCIDA',
        qrToken: 'siffa_token_expired_1aB99cL22xPy88qZ',
        qrTokenVersion: 1,
        credentialVersion: 1,
        createdAt: '2024-01-01T10:00:00Z',
        professionalName: 'Prof. Romina Albornoz (Ciclo Anterior)',
        establishmentName: 'Unidad Penitenciaria N° 47 San Martín',
        professionalRole: 'INSTRUCTOR',
      },
      {
        id: 'CRED-LOST-007',
        credentialNumber: 'SIFFA-CR-008',
        personId: 'PROF-03',
        professionalId: 'PROF-03',
        authorizationId: 'AUTH-03',
        issuedAt: '2026-01-01T10:00:00Z',
        expiresAt: '2026-12-31T23:59:59Z',
        status: 'DENUNCIADA_PERDIDA',
        qrToken: 'siffa_token_lost_5hN22mK77uXq99vT',
        qrTokenVersion: 1,
        credentialVersion: 1,
        createdAt: '2026-01-01T10:00:00Z',
        revokedAt: '2026-02-20T14:30:00Z',
        revokedReason: 'Denuncia por extravío de plástico físico presentada ante Secretaría',
        professionalName: 'Lic. Florencia Navarro (Extraviada)',
        establishmentName: 'Unidad Penitenciaria N° 50 Batán (Femenina)',
        professionalRole: 'DOCENTE',
      },
    ];
    creds.forEach((c) => {
      this.credentials.set(c.id, c);
      if (c.qrToken) {
        this.qrTokens.set(c.qrToken, c.id);
      }
    });

    // 5. Initial Activities (Talleres y Cursos en Unidades Penitenciarias)
    const initialActivities: Activity[] = [
      {
        id: 'ACT-01',
        title: 'Taller de Fútbol 11 y Fundamentos Tácticos',
        category: 'FUTBOL_11',
        establishmentId: 'EST-U33',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
        professionalId: 'PROF-01',
        professionalName: 'Lic. Marcela Giménez',
        schedule: 'Lunes y Miércoles 09:00 - 11:30',
        pabellon: 'Pabellón 2 Femenino',
        capacity: 25,
        enrolledCount: 22,
        status: 'ACTIVE',
      },
      {
        id: 'ACT-02',
        title: 'Preparación Física, Movilidad y Salud Integral',
        category: 'PREPARACION_FISICA',
        establishmentId: 'EST-U47',
        establishmentName: 'Unidad Penitenciaria N° 47 San Martín',
        professionalId: 'PROF-02',
        professionalName: 'Prof. Romina Albornoz',
        schedule: 'Martes y Jueves 10:00 - 12:00',
        pabellon: 'Playón Central SPB',
        capacity: 30,
        enrolledCount: 28,
        status: 'ACTIVE',
      },
      {
        id: 'ACT-03',
        title: 'Curso de Arbitraje Oficial y Reglamentos AFA/SIFFA',
        category: 'ARBITRAJE',
        establishmentId: 'EST-U50',
        establishmentName: 'Unidad Penitenciaria N° 50 Batán (Femenina)',
        professionalId: 'PROF-03',
        professionalName: 'Lic. Florencia Navarro',
        schedule: 'Viernes 14:00 - 16:30',
        pabellon: 'Aula Magna de Capacitación',
        capacity: 20,
        enrolledCount: 19,
        status: 'ACTIVE',
      },
      {
        id: 'ACT-04',
        title: 'Taller de Convivencia y Psicología Deportiva',
        category: 'PSICOLOGIA_DEPORTIVA',
        establishmentId: 'EST-U33',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
        professionalId: 'PROF-03',
        professionalName: 'Lic. Florencia Navarro',
        schedule: 'Lunes 14:00 - 16:00',
        pabellon: 'Espacio de Mediación',
        capacity: 15,
        enrolledCount: 14,
        status: 'ACTIVE',
      },
    ];
    initialActivities.forEach((a) => this.activities.set(a.id, a));

    // 6. Initial Check-In Records (Historial oficial de guardia)
    this.checkInRecords = [
      {
        validationId: 'CHK-20261005-001',
        professionalId: 'PROF-01',
        professionalName: 'Lic. Marcela Giménez',
        documentNumber: '32849120',
        credentialId: 'CRED-001',
        guardName: 'Oficial Sgto. 1ro. Gómez (Guardia U33)',
        guardUserId: 'user-val-01',
        timestamp: '2026-10-05T08:45:12Z',
        establishmentId: 'EST-U33',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
        activity: 'Taller de Fútbol 11 y Fundamentos Tácticos',
        result: 'ALLOWED',
        reasonCode: 'CREDENCIAL_VALIDA',
        method: 'QR',
        notes: 'Ingreso formal con materiales deportivos inspeccionados.',
      },
      {
        validationId: 'CHK-20261005-002',
        professionalId: 'PROF-02',
        professionalName: 'Prof. Romina Albornoz',
        documentNumber: '35412780',
        credentialId: 'CRED-002',
        guardName: 'Alcaide Mayor Pérez (Garita U47)',
        guardUserId: 'user-val-01',
        timestamp: '2026-10-05T09:12:30Z',
        establishmentId: 'EST-U47',
        establishmentName: 'Unidad Penitenciaria N° 47 San Martín',
        activity: 'Preparación Física, Movilidad y Salud Integral',
        result: 'ALLOWED',
        reasonCode: 'CREDENCIAL_VALIDA',
        method: 'QR',
        notes: 'Control biométrico y credencial digital verificado.',
      },
      {
        validationId: 'CHK-20261004-003',
        professionalId: 'PROF-03',
        professionalName: 'Lic. Florencia Navarro',
        documentNumber: '36901442',
        credentialId: 'CRED-003',
        guardName: 'Suboficial Rivas (U50 Batán)',
        guardUserId: 'user-val-01',
        timestamp: '2026-10-04T13:50:00Z',
        establishmentId: 'EST-U50',
        establishmentName: 'Unidad Penitenciaria N° 50 Batán (Femenina)',
        activity: 'Curso de Arbitraje Oficial y Reglamentos AFA/SIFFA',
        result: 'ALLOWED',
        reasonCode: 'CREDENCIAL_VALIDA',
        method: 'MANUAL',
        notes: 'Validación manual por contingencia técnica en garita.',
      },
    ];

    // 7. Initial Users with SIFFA Identity (Padrón Cerrado Exclusivo)
    const initialUsers: SiffaUser[] = [
      {
        uid: 'user-admin-01',
        email: 'matiasmedina.n@gmail.com',
        displayName: 'Matías Medina',
        role: 'SUPER_ADMIN',
        professionalId: 'PROF-ADMIN',
        status: 'ACTIVE',
        password: 'admin2026',
        allowedGoogleAuth: true,
      },
      {
        uid: 'user-prof-01',
        email: 'marcela.gimenez@siffa.org',
        displayName: 'Lic. Marcela Giménez',
        role: 'PROFESSIONAL',
        professionalId: 'PROF-01',
        status: 'ACTIVE',
        password: 'marcela2026',
        allowedGoogleAuth: true,
      },
      {
        uid: 'user-prof-02',
        email: 'romina.albornoz@siffa.org',
        displayName: 'Prof. Romina Albornoz',
        role: 'PROFESSIONAL',
        professionalId: 'PROF-02',
        status: 'ACTIVE',
        password: 'romina2026',
        allowedGoogleAuth: true,
      },
      {
        uid: 'user-prof-03',
        email: 'florencia.navarro@siffa.org',
        displayName: 'Lic. Florencia Navarro',
        role: 'PROFESSIONAL',
        professionalId: 'PROF-03',
        status: 'ACTIVE',
        password: 'florencia2026',
        allowedGoogleAuth: true,
      },
      {
        uid: 'user-prof-04',
        email: 'camila.benitez@siffa.org',
        displayName: 'Camila Benítez',
        role: 'PROFESSIONAL',
        professionalId: 'PROF-06',
        status: 'ACTIVE',
        password: 'camila2026',
        allowedGoogleAuth: true,
      },
      {
        uid: 'user-prof-05',
        email: 'esteban.valenzuela@siffa.org',
        displayName: 'Dr. Esteban Valenzuela',
        role: 'PROFESSIONAL',
        professionalId: 'PROF-04',
        status: 'ACTIVE',
        password: 'esteban2026',
        allowedGoogleAuth: true,
      },
      {
        uid: 'user-prof-06',
        email: 'valeria.sosa@siffa.org',
        displayName: 'Valeria Sosa',
        role: 'PROFESSIONAL',
        professionalId: 'PROF-05',
        status: 'SUSPENDED',
        password: 'valeria2026',
        allowedGoogleAuth: true,
      },
      {
        uid: 'user-dir-01',
        email: 'silvina.campos@siffa.org',
        displayName: 'Dra. Silvina Campos',
        role: 'INSTITUTIONAL_MANAGER',
        professionalId: 'PROF-07',
        status: 'ACTIVE',
        password: 'campos2026',
        allowedGoogleAuth: true,
      },
      {
        uid: 'user-val-01',
        email: 'guardia.u33@spb.gba.gob.ar',
        displayName: 'Garita de Acceso UP33 Los Hornos',
        role: 'VALIDATOR',
        professionalId: 'PROF-08',
        status: 'ACTIVE',
        password: 'garita33',
        allowedGoogleAuth: false,
      },
      {
        uid: 'user-aud-01',
        email: 'auditoria@siffa.org',
        displayName: 'Auditoría Institucional SIFFA',
        role: 'AUDITOR',
        professionalId: 'PROF-09',
        status: 'ACTIVE',
        password: 'auditor2026',
        allowedGoogleAuth: false,
      },
    ];
    initialUsers.forEach((u) => this.users.set(u.email.toLowerCase(), u));

    // 8. FASE 2: Authorized Devices (Dispositivos autorizados para garita SPB)
    const devicesList: AuthorizedDevice[] = [
      {
        id: 'DEV-U33-01',
        deviceId: 'GARITA-EST-U33-01',
        establishmentId: 'EST-U33',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
        authorizedByUserId: 'user-admin-01',
        validUntil: '2027-12-31T23:59:59Z',
        status: 'activo',
      },
      {
        id: 'DEV-U33-MAIN',
        deviceId: 'GARITA-PRINCIPAL-01',
        establishmentId: 'EST-U33',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
        authorizedByUserId: 'user-admin-01',
        validUntil: '2027-12-31T23:59:59Z',
        status: 'activo',
      },
      {
        id: 'DEV-U33-MANUAL',
        deviceId: 'GARITA-MANUAL-01',
        establishmentId: 'EST-U33',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
        authorizedByUserId: 'user-admin-01',
        validUntil: '2027-12-31T23:59:59Z',
        status: 'activo',
      },
      {
        id: 'DEV-U47-01',
        deviceId: 'GARITA-EST-U47-01',
        establishmentId: 'EST-U47',
        establishmentName: 'Unidad Penitenciaria N° 47 San Martín',
        authorizedByUserId: 'user-admin-01',
        validUntil: '2027-12-31T23:59:59Z',
        status: 'activo',
      },
      {
        id: 'DEV-U50-01',
        deviceId: 'GARITA-EST-U50-01',
        establishmentId: 'EST-U50',
        establishmentName: 'Unidad Penitenciaria N° 50 Batán (Femenina)',
        authorizedByUserId: 'user-admin-01',
        validUntil: '2027-12-31T23:59:59Z',
        status: 'activo',
      },
      {
        id: 'DEV-REVOKED-01',
        deviceId: 'TABLET-OBSOLETA-U33',
        establishmentId: 'EST-U33',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
        authorizedByUserId: 'user-admin-01',
        validUntil: '2025-12-31T23:59:59Z',
        status: 'revocado',
      },
    ];
    devicesList.forEach((d) => this.authorizedDevices.set(d.id, d));

    // 9. FASE 2: Prerequisites (Requisitos previos bloqueantes: seguro, confidencialidad, etc.)
    const prereqsList: Prerequisite[] = [
      {
        id: 'PRQ-01-01',
        professionalId: 'PROF-01',
        professionalName: 'Marcela Giménez',
        establishmentId: 'EST-U33',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
        type: 'acuerdo_confidencialidad',
        status: 'cumplido',
        validUntil: '2026-12-31T23:59:59Z',
        documentUrl: 'https://siffa.org/docs/confidencialidad-mg-2026.pdf',
      },
      {
        id: 'PRQ-01-02',
        professionalId: 'PROF-01',
        professionalName: 'Marcela Giménez',
        establishmentId: 'EST-U33',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
        type: 'seguro',
        status: 'cumplido',
        validUntil: '2026-12-31T23:59:59Z',
        documentUrl: 'https://siffa.org/docs/poliza-art-mg-2026.pdf',
      },
      {
        id: 'PRQ-01-03',
        professionalId: 'PROF-01',
        professionalName: 'Marcela Giménez',
        establishmentId: 'EST-U33',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
        type: 'documentacion',
        status: 'cumplido',
        validUntil: '2026-12-31T23:59:59Z',
      },
      {
        id: 'PRQ-01-04',
        professionalId: 'PROF-01',
        professionalName: 'Marcela Giménez',
        establishmentId: 'EST-U33',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
        type: 'capacitacion',
        status: 'cumplido',
        validUntil: '2026-12-31T23:59:59Z',
      },
      {
        id: 'PRQ-02-01',
        professionalId: 'PROF-02',
        professionalName: 'Romina Albornoz',
        establishmentId: 'EST-U47',
        establishmentName: 'Unidad Penitenciaria N° 47 San Martín',
        type: 'seguro',
        status: 'cumplido',
        validUntil: '2026-12-31T23:59:59Z',
      },
      {
        id: 'PRQ-02-02',
        professionalId: 'PROF-02',
        professionalName: 'Romina Albornoz',
        establishmentId: 'EST-U47',
        establishmentName: 'Unidad Penitenciaria N° 47 San Martín',
        type: 'acuerdo_confidencialidad',
        status: 'cumplido',
        validUntil: '2026-12-31T23:59:59Z',
      },
      {
        id: 'PRQ-05-01',
        professionalId: 'PROF-05',
        professionalName: 'Valeria Sosa',
        establishmentId: 'EST-U40',
        establishmentName: 'Unidad Penitenciaria N° 40 Lomas de Zamora',
        type: 'seguro',
        status: 'vencido', // Simulación requisito vencido para testing
        validUntil: '2025-12-31T23:59:59Z',
      },
    ];
    prereqsList.forEach((p) => this.prerequisites.set(p.id, p));

    // 10. FASE 2: Nomina Submissions (Flujo de Nómina Previa SIFFA → Unidad Penitenciaria)
    const nominasList: NominaSubmission[] = [
      {
        id: 'NOM-2026-001',
        establishmentId: 'EST-U33',
        establishmentName: 'Unidad Penitenciaria N° 33 Los Hornos',
        submittedByUserId: 'user-admin-01',
        submittedByUserName: 'Matías Medina (Dirección SIFFA)',
        submittedAt: '2026-01-05T09:00:00Z',
        professionals: [
          {
            professionalId: 'PROF-01',
            firstName: 'Marcela',
            lastName: 'Giménez',
            documentNumber: '32849120',
            role: 'DOCENTE',
          },
          {
            professionalId: 'PROF-03',
            firstName: 'Florencia',
            lastName: 'Navarro',
            documentNumber: '36901442',
            role: 'DOCENTE',
          },
        ],
        status: 'aprobada',
        approvedByUserId: 'spb-alcaide-u33',
        approvedByUserName: 'Alcaide Mayor SPB · Jefe de Seguridad UP33',
        approvedAt: '2026-01-06T11:00:00Z',
        observations: 'Nómina homologada mediante Orden del Día SPB N° 044/26 para talleres de Fútbol 11 y Apoyo Psicosocial.',
      },
      {
        id: 'NOM-2026-002',
        establishmentId: 'EST-U47',
        establishmentName: 'Unidad Penitenciaria N° 47 San Martín',
        submittedByUserId: 'user-admin-01',
        submittedByUserName: 'Matías Medina (Dirección SIFFA)',
        submittedAt: '2026-02-01T10:00:00Z',
        professionals: [
          {
            professionalId: 'PROF-02',
            firstName: 'Romina',
            lastName: 'Albornoz',
            documentNumber: '35412780',
            role: 'INSTRUCTOR',
          },
        ],
        status: 'enviada',
        observations: 'Presentación formal de instructora de preparación física para patio central. En revisión por la Dirección de Unidad.',
      },
    ];
    nominasList.forEach((n) => this.nominaSubmissions.set(n.id, n));

    // 11. Initial Audit Logs
    this.recordAuditEvent({
      actorUserId: 'system',
      actorEmail: 'system@siffa.org',
      actorRole: 'SUPER_ADMIN',
      action: 'SYSTEM_BOOTSTRAP',
      entityType: 'PLATFORM',
      entityId: 'ROOT',
      result: 'SUCCESS',
      metadata: { version: '1.0.0-mvp', crypto: 'Ed25519' },
    });
  }

  public recordAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const fullEvent: AuditEvent = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.auditEvents.unshift(fullEvent);
    // Keep max 500 in memory
    if (this.auditEvents.length > 500) {
      this.auditEvents.pop();
    }
    return fullEvent;
  }

  public recordAccessEvent(event: Omit<AccessEvent, 'id' | 'timestamp'>): AccessEvent {
    const fullEvent: AccessEvent = {
      id: `ACC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.accessEvents.unshift(fullEvent);
    if (this.accessEvents.length > 500) {
      this.accessEvents.pop();
    }
    return fullEvent;
  }

  public recordCheckIn(record: Omit<CheckInRecord, 'validationId' | 'timestamp'>): CheckInRecord {
    const fullRecord: CheckInRecord = {
      validationId: `CHK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...record,
    };
    this.checkInRecords.unshift(fullRecord);
    if (this.checkInRecords.length > 500) {
      this.checkInRecords.pop();
    }
    return fullRecord;
  }

  public generateSecureQrToken(): string {
    // Genera identificador aleatorio criptográficamente seguro (mínimo 128 bits, base64url, crypto.randomBytes)
    return crypto.randomBytes(24).toString('base64url');
  }

  public findCredentialByQrToken(qrToken: string): Credential | null {
    if (!qrToken) return null;
    const credId = this.qrTokens.get(qrToken);
    if (credId && this.credentials.has(credId)) {
      return this.credentials.get(credId)!;
    }
    // Búsqueda directa por si acaso
    for (const c of this.credentials.values()) {
      if (c.qrToken === qrToken) return c;
    }
    return null;
  }

  public suspendCredential(id: string, actor: any, reason?: string): Credential | null {
    const cred = this.credentials.get(id);
    if (!cred) return null;
    cred.status = 'SUSPENDIDA';
    this.credentials.set(id, cred);

    this.recordAuditEvent({
      actorUserId: actor.uid || 'admin',
      actorEmail: actor.email || 'admin@siffa.org',
      actorRole: actor.role || 'SUPER_ADMIN',
      action: 'CREDENTIAL_SUSPEND',
      entityType: 'CREDENTIAL',
      entityId: id,
      result: 'SUCCESS',
      metadata: { reason: reason || 'Suspensión preventiva administrativa' },
    });
    return cred;
  }

  public revokeCredential(id: string, actor: any, reason?: string): Credential | null {
    const cred = this.credentials.get(id);
    if (!cred) return null;
    cred.status = 'REVOCADA';
    cred.revokedAt = new Date().toISOString();
    cred.revokedReason = reason || 'Revocación por decisión directiva SIFFA';
    this.credentials.set(id, cred);

    this.recordAuditEvent({
      actorUserId: actor.uid || 'admin',
      actorEmail: actor.email || 'admin@siffa.org',
      actorRole: actor.role || 'SUPER_ADMIN',
      action: 'CREDENTIAL_REVOKE',
      entityType: 'CREDENTIAL',
      entityId: id,
      result: 'SUCCESS',
      metadata: { reason: cred.revokedReason, revokedAt: cred.revokedAt },
    });
    return cred;
  }

  public markCredentialLost(id: string, actor: any, reason?: string): Credential | null {
    const cred = this.credentials.get(id);
    if (!cred) return null;
    // Revocar el qrToken anterior de inmediato para que nadie lo pueda usar
    if (cred.qrToken) {
      this.qrTokens.delete(cred.qrToken);
    }
    cred.status = 'DENUNCIADA_PERDIDA';
    cred.revokedAt = new Date().toISOString();
    cred.revokedReason = reason || 'Denuncia de extravío/robo de credencial física';
    this.credentials.set(id, cred);

    this.recordAuditEvent({
      actorUserId: actor.uid || 'admin',
      actorEmail: actor.email || 'admin@siffa.org',
      actorRole: actor.role || 'SUPER_ADMIN',
      action: 'CREDENTIAL_REPORT_LOST',
      entityType: 'CREDENTIAL',
      entityId: id,
      result: 'SUCCESS',
      metadata: { reason: cred.revokedReason },
    });
    return cred;
  }

  public reprintCredential(id: string, actor: any): Credential | null {
    const cred = this.credentials.get(id);
    if (!cred) return null;

    // REGLA CRÍTICA: Generar un qrToken nuevo y revocar el anterior de inmediato
    if (cred.qrToken) {
      this.qrTokens.delete(cred.qrToken);
    }

    const newQrToken = this.generateSecureQrToken();
    cred.qrToken = newQrToken;
    cred.qrTokenVersion = (cred.qrTokenVersion || 1) + 1;
    cred.status = 'ACTIVA';
    cred.issuedAt = new Date().toISOString();
    delete cred.revokedAt;
    delete cred.revokedReason;

    this.credentials.set(id, cred);
    this.qrTokens.set(newQrToken, id);

    this.recordAuditEvent({
      actorUserId: actor.uid || 'admin',
      actorEmail: actor.email || 'admin@siffa.org',
      actorRole: actor.role || 'SUPER_ADMIN',
      action: 'CREDENTIAL_REPRINT_AND_REKEY',
      entityType: 'CREDENTIAL',
      entityId: id,
      result: 'SUCCESS',
      metadata: {
        newQrTokenVersion: cred.qrTokenVersion,
        issuedAt: cred.issuedAt,
        note: 'qrToken previo revocado; nuevo token criptográfico 128+ bits emitido.',
      },
    });

    return cred;
  }
}

export const serverStore = new SiffaServerStore();
