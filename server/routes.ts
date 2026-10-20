import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import QRCode from 'qrcode';
import { serverStore } from './store';
import { cryptoService } from './cryptoService';
import {
  DynamicQRPayload,
  RoleType,
  AccessDecision,
  OfflinePackage,
  Credential,
  Professional,
  SiffaUser,
  Authorization,
} from '../src/types';

export const apiRouter = Router();

// Middleware: Extracts or simulates SIFFA Identity Actor
function getActorFromReq(req: Request) {
  const actorEmail = (req.headers['x-actor-email'] as string || '').trim().toLowerCase();
  if (actorEmail && serverStore.users.has(actorEmail)) {
    return serverStore.users.get(actorEmail)!;
  }
  // Check if matches professional email
  if (actorEmail) {
    const prof = Array.from(serverStore.professionals.values()).find(
      (p) => p.email.toLowerCase() === actorEmail
    );
    if (prof) {
      return {
        uid: `user-${prof.id}`,
        email: prof.email,
        displayName: `${prof.firstName} ${prof.lastName}`,
        role: 'PROFESSIONAL' as RoleType,
        professionalId: prof.id,
        status: 'ACTIVE' as const,
      };
    }
  }
  return {
    uid: 'anon',
    email: actorEmail || 'invitado@siffa.org',
    displayName: 'Usuario Invitado',
    role: 'AUDITOR' as RoleType,
    status: 'ACTIVE' as const,
  };
}

// -------------------------------------------------------------
// 1. PUBLIC KEYS & HEALTH
// -------------------------------------------------------------
apiRouter.get('/keys/public', (req: Request, res: Response) => {
  res.json({
    algorithm: 'Ed25519',
    keyId: cryptoService.getKeyId(),
    publicKeyHex: cryptoService.getPublicKeyRawHex(),
    issuer: 'SIFFA - Sindicato Internacional de Fútbol Femenino y Afines',
  });
});

// -------------------------------------------------------------
// 2. AUTHENTICATION & IDENTITY (SIFFA Identity - Padrón Cerrado)
// -------------------------------------------------------------
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password, method } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email requerido para autenticación SIFFA' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = serverStore.users.get(normalizedEmail);

  // REGLA CRÍTICA: Padrón cerrado exclusivo. NO existe registro abierto.
  if (!user) {
    serverStore.recordAuditEvent({
      actorUserId: 'anonymous',
      actorEmail: normalizedEmail,
      actorRole: 'AUDITOR',
      action: 'LOGIN_DENIED_UNAUTHORIZED_USER',
      entityType: 'SESSION',
      entityId: normalizedEmail,
      result: 'DENIED',
      metadata: { reason: 'Email not present in authorized closed list', method: method || 'password' },
    });
    return res.status(403).json({
      error: 'No tienes permisos para registrarte en la web. Solo los integrantes de SIFFA necesitan registrarse. Si eres un integrante oficial, contacta a la administración para que tu correo sea dado de alta en la base de datos.',
    });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(403).json({
      error: 'Cuenta institucional suspendida temporalmente. Contacte a la Dirección de SIFFA.',
    });
  }

  // Verificación según método de autenticación
  if (method === 'google') {
    if (user.allowedGoogleAuth === false) {
      return res.status(403).json({
        error: 'Esta cuenta institucional no tiene habilitado el acceso mediante Google. Ingrese con correo y contraseña.',
      });
    }
  } else {
    // Verificación por Correo y Contraseña
    if (!password) {
      return res.status(400).json({ error: 'Debe ingresar la contraseña asignada por el administrador.' });
    }
    if (user.password && user.password !== password) {
      serverStore.recordAuditEvent({
        actorUserId: user.uid,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'LOGIN_FAILED_BAD_PASSWORD',
        entityType: 'SESSION',
        entityId: user.uid,
        result: 'DENIED',
      });
      return res.status(401).json({
        error: 'Usuario no autorizado o credenciales inválidas. Contacte al administrador.',
      });
    }
  }

  serverStore.recordAuditEvent({
    actorUserId: user.uid,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'USER_LOGIN',
    entityType: 'SESSION',
    entityId: user.uid,
    result: 'SUCCESS',
    metadata: { role: user.role, method: method || 'password', timestamp: new Date().toISOString() },
  });

  return res.json({
    user,
    token: `siffa-token-${user.uid}-${Date.now()}`,
    permissions: getPermissionsForRole(user.role),
  });
});

apiRouter.get('/auth/authorized-users', (req: Request, res: Response) => {
  const users = Array.from(serverStore.users.values()).map((u) => ({
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    professionalId: u.professionalId,
    status: u.status,
    allowedGoogleAuth: u.allowedGoogleAuth,
  }));
  return res.json(users);
});

// GET all test & institutional profiles for Admin Management
apiRouter.get('/users', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  const isAdmin = actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN_CREDENTIALS';

  const list = Array.from(serverStore.users.values()).map((u) => {
    // Linked professional
    const prof = u.professionalId ? serverStore.professionals.get(u.professionalId) :
      Array.from(serverStore.professionals.values()).find(p => p.email.toLowerCase() === u.email.toLowerCase());

    // Authorization & establishment
    const auth = prof ? Array.from(serverStore.authorizations.values()).find(a => a.professionalId === prof.id) : null;
    const est = auth ? serverStore.establishments.get(auth.establishmentId) : null;

    // Check credential
    const cred = prof ? Array.from(serverStore.credentials.values()).find(c => c.professionalId === prof.id && c.status === 'ACTIVE') : null;

    return {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      status: u.status,
      password: isAdmin ? (u.password || '') : '••••••••',
      allowedGoogleAuth: u.allowedGoogleAuth ?? true,
      professionalId: prof?.id || u.professionalId || '',
      firstName: prof?.firstName || u.displayName.split(' ')[0] || '',
      lastName: prof?.lastName || u.displayName.split(' ').slice(1).join(' ') || '',
      phone: prof?.phone || '',
      documentNumber: prof?.documentNumber || '',
      matricula: prof?.matricula || '',
      specialty: prof?.specialty || '',
      professionalRole: prof?.professionalRole || (u.role === 'SUPER_ADMIN' ? 'DIRECTIVO' : u.role === 'VALIDATOR' ? 'INSTRUCTOR' : 'DOCENTE'),
      profilePhotoUrl: prof?.profilePhotoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      establishmentId: auth?.establishmentId || '',
      establishmentName: est?.name || auth?.establishmentName || 'Sin asignar',
      hasActiveCredential: Boolean(cred),
      credentialId: cred?.id,
    };
  });

  return res.json(list);
});

// UPDATE test profile or user
apiRouter.put('/users/:email', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN_CREDENTIALS') {
    return res.status(403).json({ error: 'Solo el administrador de SIFFA puede modificar los perfiles y contraseñas' });
  }

  const currentEmail = decodeURIComponent(req.params.email).toLowerCase().trim();
  const user = serverStore.users.get(currentEmail);
  if (!user) {
    return res.status(404).json({ error: 'Perfil de usuario no encontrado' });
  }

  const {
    displayName,
    newEmail,
    role,
    status,
    password,
    allowedGoogleAuth,
    firstName,
    lastName,
    phone,
    documentNumber,
    matricula,
    specialty,
    professionalRole,
    profilePhotoUrl,
    establishmentId,
  } = req.body;

  let targetEmail = currentEmail;
  if (newEmail && newEmail.toLowerCase().trim() !== currentEmail) {
    targetEmail = newEmail.toLowerCase().trim();
    if (serverStore.users.has(targetEmail)) {
      return res.status(409).json({ error: `El correo ${newEmail} ya está en uso por otra cuenta` });
    }
    serverStore.users.delete(currentEmail);
    user.email = targetEmail;
  }

  if (displayName) user.displayName = displayName;
  if (role) user.role = role;
  if (status) user.status = status;
  if (password !== undefined) user.password = password;
  if (allowedGoogleAuth !== undefined) user.allowedGoogleAuth = allowedGoogleAuth;

  serverStore.users.set(targetEmail, user);

  // Sync or create professional
  let prof = user.professionalId ? serverStore.professionals.get(user.professionalId) :
    Array.from(serverStore.professionals.values()).find(p => p.email.toLowerCase() === currentEmail || p.email.toLowerCase() === targetEmail);

  if (prof) {
    prof.email = targetEmail;
    if (firstName) prof.firstName = firstName;
    if (lastName) prof.lastName = lastName;
    if (phone !== undefined) prof.phone = phone;
    if (documentNumber) prof.documentNumber = documentNumber;
    if (matricula) prof.matricula = matricula;
    if (specialty) prof.specialty = specialty;
    if (professionalRole) prof.professionalRole = professionalRole;
    if (profilePhotoUrl) prof.profilePhotoUrl = profilePhotoUrl;
    if (status) prof.status = status;
    prof.updatedAt = new Date().toISOString();
    serverStore.professionals.set(prof.id, prof);
  } else if (firstName || lastName) {
    const profId = `PROF-${Date.now().toString().slice(-4)}`;
    const newP: Professional = {
      id: profId,
      authUid: user.uid,
      firstName: firstName || user.displayName.split(' ')[0] || '',
      lastName: lastName || user.displayName.split(' ').slice(1).join(' ') || '',
      documentNumber: documentNumber || '00000000',
      email: targetEmail,
      phone: phone || '',
      professionalRole: professionalRole || 'DOCENTE',
      status: status || 'ACTIVE',
      matricula: matricula || 'SIFFA-PENDIENTE',
      specialty: specialty || 'Educación y Deporte',
      profilePhotoUrl: profilePhotoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    serverStore.professionals.set(profId, newP);
    user.professionalId = profId;
    prof = newP;
  }

  // Update authorization establishment if specified
  if (prof && establishmentId) {
    let auth = Array.from(serverStore.authorizations.values()).find(a => a.professionalId === prof!.id);
    const est = serverStore.establishments.get(establishmentId);
    if (auth && est) {
      auth.establishmentId = establishmentId;
      auth.establishmentName = est.name;
      auth.updatedAt = new Date().toISOString();
    } else if (est) {
      const authId = `AUTH-${Date.now().toString().slice(-4)}`;
      serverStore.authorizations.set(authId, {
        id: authId,
        professionalId: prof.id,
        establishmentId: est.id,
        purpose: 'Actividades Formativas y Deportivas SIFFA',
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
        allowedDays: [1, 2, 3, 4, 5],
        startTime: '08:00',
        endTime: '18:00',
        status: 'ACTIVE',
        approvedBy: 'Dra. Silvina Campos (Dir. General SIFFA - SPB)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        professionalName: `${prof.firstName} ${prof.lastName}`,
        establishmentName: est.name,
      });
    }
  }

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'UPDATE_PROFILE',
    entityType: 'USER',
    entityId: targetEmail,
    result: 'SUCCESS',
    metadata: { targetEmail, updatedBy: actor.email, role: user.role, status: user.status },
  });

  return res.json({ success: true, user });
});

// CREATE a new test profile or user
apiRouter.post('/users', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN_CREDENTIALS') {
    return res.status(403).json({ error: 'Solo el administrador puede crear perfiles' });
  }

  const {
    email,
    password,
    displayName,
    role,
    firstName,
    lastName,
    phone,
    documentNumber,
    matricula,
    specialty,
    professionalRole,
    profilePhotoUrl,
    establishmentId,
  } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }
  const normalizedEmail = email.toLowerCase().trim();
  if (serverStore.users.has(normalizedEmail)) {
    return res.status(409).json({ error: `El usuario con email ${email} ya existe` });
  }

  const uid = `user-${Date.now().toString().slice(-5)}`;
  const profId = `PROF-${Date.now().toString().slice(-4)}`;

  const resolvedFirstName = firstName || (displayName ? displayName.split(' ')[0] : 'Usuario');
  const resolvedLastName = lastName || (displayName ? displayName.split(' ').slice(1).join(' ') : 'SIFFA');

  const newProf: Professional = {
    id: profId,
    authUid: uid,
    firstName: resolvedFirstName,
    lastName: resolvedLastName,
    documentNumber: documentNumber || `30${Math.floor(Math.random() * 900000 + 100000)}`,
    email: normalizedEmail,
    phone: phone || '',
    professionalRole: professionalRole || (role === 'SUPER_ADMIN' ? 'DIRECTIVO' : role === 'VALIDATOR' ? 'INSTRUCTOR' : 'DOCENTE'),
    status: 'ACTIVE',
    matricula: matricula || `SIFFA-${Math.floor(Math.random() * 900 + 100)}`,
    specialty: specialty || 'Educación Deportiva y Valores',
    profilePhotoUrl: profilePhotoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const newUser: SiffaUser = {
    uid,
    email: normalizedEmail,
    displayName: displayName || `${resolvedFirstName} ${resolvedLastName}`,
    role: role || 'PROFESSIONAL',
    professionalId: profId,
    status: 'ACTIVE',
    password: password || 'siffa2026',
    allowedGoogleAuth: true,
  };

  serverStore.users.set(normalizedEmail, newUser);
  serverStore.professionals.set(profId, newProf);

  // If establishment specified, create authorization & initial digital credential
  if (establishmentId && serverStore.establishments.has(establishmentId)) {
    const est = serverStore.establishments.get(establishmentId)!;
    const authId = `AUTH-${Date.now().toString().slice(-4)}`;
    serverStore.authorizations.set(authId, {
      id: authId,
      professionalId: profId,
      establishmentId: est.id,
      purpose: 'Actividades Formativas SIFFA',
      validFrom: '2026-01-01',
      validUntil: '2026-12-31',
      allowedDays: [1, 2, 3, 4, 5],
      startTime: '08:00',
      endTime: '18:00',
      status: 'ACTIVE',
      approvedBy: 'Dra. Silvina Campos (Dir. General SIFFA - SPB)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      professionalName: `${resolvedFirstName} ${resolvedLastName}`,
      establishmentName: est.name,
    });
  }

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'CREATE_USER_PROFILE',
    entityType: 'USER',
    entityId: normalizedEmail,
    result: 'SUCCESS',
    metadata: { email: normalizedEmail, role: newUser.role, createdBy: actor.email },
  });

  return res.status(201).json({ success: true, user: newUser, professional: newProf });
});

// DELETE a test profile
apiRouter.delete('/users/:email', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  if (actor.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Solo un Super Administrador puede eliminar perfiles' });
  }
  const email = decodeURIComponent(req.params.email).toLowerCase().trim();
  const user = serverStore.users.get(email);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  serverStore.users.delete(email);
  if (user.professionalId) {
    serverStore.professionals.delete(user.professionalId);
  }
  return res.json({ success: true });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  return res.json({
    user: actor,
    permissions: getPermissionsForRole(actor.role),
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'USER_LOGOUT',
    entityType: 'SESSION',
    entityId: actor.uid,
    result: 'SUCCESS',
  });
  return res.json({ success: true });
});

function getPermissionsForRole(role: RoleType): string[] {
  switch (role) {
    case 'SUPER_ADMIN':
      return ['ALL_PERMISSIONS', 'MANAGE_USERS', 'MANAGE_PROFESSIONALS', 'MANAGE_AUTHORIZATIONS', 'ISSUE_CREDENTIALS', 'REVOKE_CREDENTIALS', 'VIEW_AUDIT', 'VALIDATE_ACCESS'];
    case 'ADMIN_CREDENTIALS':
      return ['MANAGE_PROFESSIONALS', 'MANAGE_AUTHORIZATIONS', 'ISSUE_CREDENTIALS', 'REVOKE_CREDENTIALS', 'VIEW_CREDENTIALS'];
    case 'INSTITUTIONAL_MANAGER':
      return ['VIEW_PROFESSIONALS', 'MANAGE_AUTHORIZATIONS', 'VIEW_CREDENTIALS', 'VIEW_ACCESS_LOGS'];
    case 'AUDITOR':
      return ['VIEW_AUDIT', 'VIEW_ACCESS_LOGS', 'VIEW_CREDENTIALS', 'VIEW_PROFESSIONALS'];
    case 'VALIDATOR':
      return ['VALIDATE_ACCESS', 'SYNC_OFFLINE'];
    case 'PROFESSIONAL':
      return ['VIEW_MY_CREDENTIAL', 'VIEW_MY_AUTHORIZATIONS'];
    default:
      return [];
  }
}

// -------------------------------------------------------------
// 3. PROFESSIONALS MANAGEMENT (Admin server-side only)
// -------------------------------------------------------------
apiRouter.get('/professionals', (req: Request, res: Response) => {
  const list = Array.from(serverStore.professionals.values());
  res.json(list);
});

apiRouter.post('/professionals', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN_CREDENTIALS') {
    return res.status(403).json({ error: 'Permisos insuficientes para crear profesionales' });
  }

  const { firstName, lastName, documentNumber, email, phone, professionalRole, matricula, specialty, profilePhotoUrl } = req.body;
  if (!firstName || !lastName || !documentNumber || !email) {
    return res.status(400).json({ error: 'Campos requeridos incompletos' });
  }

  // Check unique DNI
  const exists = Array.from(serverStore.professionals.values()).some((p) => p.documentNumber === documentNumber);
  if (exists) {
    return res.status(409).json({ error: `Ya existe un profesional registrado con DNI ${documentNumber}` });
  }

  const id = `PROF-${Date.now().toString().slice(-4)}`;
  const newProf = {
    id,
    authUid: `UID-${id}`,
    firstName,
    lastName,
    documentNumber,
    email,
    phone: phone || '',
    professionalRole: professionalRole || 'DOCENTE',
    status: 'ACTIVE' as const,
    matricula: matricula || 'SIFFA-PENDIENTE',
    specialty: specialty || 'Educación y Deporte',
    profilePhotoUrl: profilePhotoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  serverStore.professionals.set(id, newProf);

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'CREATE_PROFESSIONAL',
    entityType: 'PROFESSIONAL',
    entityId: id,
    result: 'SUCCESS',
    metadata: { firstName, lastName, documentNumber, hasCustomPhoto: Boolean(profilePhotoUrl) },
  });

  return res.status(201).json(newProf);
});

// Update Professional Attributes and Photo (Admin only)
apiRouter.put('/professionals/:id', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN_CREDENTIALS') {
    return res.status(403).json({ error: 'Solo el administrador de la plataforma puede modificar atributos y fotos de perfiles' });
  }

  const { id } = req.params;
  const prof = serverStore.professionals.get(id);
  if (!prof) {
    return res.status(404).json({ error: 'Profesional no encontrado' });
  }

  const {
    firstName,
    lastName,
    documentNumber,
    email,
    phone,
    professionalRole,
    matricula,
    specialty,
    status,
    profilePhotoUrl,
  } = req.body;

  if (documentNumber && documentNumber !== prof.documentNumber) {
    const duplicate = Array.from(serverStore.professionals.values()).some(
      (p) => p.id !== id && p.documentNumber === documentNumber
    );
    if (duplicate) {
      return res.status(409).json({ error: `Ya existe otro profesional con el DNI ${documentNumber}` });
    }
    prof.documentNumber = documentNumber;
  }

  if (firstName !== undefined) prof.firstName = firstName;
  if (lastName !== undefined) prof.lastName = lastName;
  if (email !== undefined) prof.email = email;
  if (phone !== undefined) prof.phone = phone;
  if (professionalRole !== undefined) prof.professionalRole = professionalRole;
  if (matricula !== undefined) prof.matricula = matricula;
  if (specialty !== undefined) prof.specialty = specialty;
  if (status !== undefined) prof.status = status;
  if (profilePhotoUrl !== undefined) prof.profilePhotoUrl = profilePhotoUrl;
  prof.updatedAt = new Date().toISOString();

  serverStore.professionals.set(id, prof);

  // Sync with active credentials
  for (const cred of serverStore.credentials.values()) {
    if (cred.professionalId === id) {
      if (prof.firstName || prof.lastName) {
        cred.professionalName = `${prof.firstName} ${prof.lastName}`;
      }
      if (prof.professionalRole) {
        cred.professionalRole = prof.professionalRole;
      }
    }
  }

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'UPDATE_PROFESSIONAL_ATTRIBUTES',
    entityType: 'PROFESSIONAL',
    entityId: id,
    result: 'SUCCESS',
    metadata: {
      updatedFields: Object.keys(req.body),
      photoModified: profilePhotoUrl !== undefined,
    },
  });

  return res.json(prof);
});

apiRouter.patch('/professionals/:id/status', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN_CREDENTIALS') {
    return res.status(403).json({ error: 'No autorizado' });
  }

  const { id } = req.params;
  const { status } = req.body;
  const prof = serverStore.professionals.get(id);
  if (!prof) return res.status(404).json({ error: 'Profesional no encontrado' });

  prof.status = status;
  prof.updatedAt = new Date().toISOString();
  serverStore.professionals.set(id, prof);

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'UPDATE_PROFESSIONAL_STATUS',
    entityType: 'PROFESSIONAL',
    entityId: id,
    result: 'SUCCESS',
    metadata: { newStatus: status },
  });

  return res.json(prof);
});

// -------------------------------------------------------------
// 4. ESTABLISHMENTS
// -------------------------------------------------------------
apiRouter.get('/establishments', (req: Request, res: Response) => {
  res.json(Array.from(serverStore.establishments.values()));
});

// -------------------------------------------------------------
// 5. AUTHORIZATIONS (Contextual Access Rules)
// -------------------------------------------------------------
apiRouter.get('/authorizations', (req: Request, res: Response) => {
  res.json(Array.from(serverStore.authorizations.values()));
});

apiRouter.post('/authorizations', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN_CREDENTIALS' && actor.role !== 'INSTITUTIONAL_MANAGER') {
    return res.status(403).json({ error: 'No autorizado para emitir autorizaciones' });
  }

  const { professionalId, establishmentId, purpose, validFrom, validUntil, allowedDays, startTime, endTime } = req.body;
  const prof = serverStore.professionals.get(professionalId);
  const est = serverStore.establishments.get(establishmentId);

  if (!prof || !est) {
    return res.status(400).json({ error: 'Profesional o Establecimiento no válido' });
  }

  const id = `AUTH-${Date.now().toString().slice(-4)}`;
  const auth = {
    id,
    professionalId,
    establishmentId,
    purpose: purpose || 'Taller de Formación Deportiva y Readaptación',
    validFrom: validFrom || '2026-01-01',
    validUntil: validUntil || '2026-12-31',
    allowedDays: allowedDays || [1, 2, 3, 4, 5],
    startTime: startTime || '08:00',
    endTime: endTime || '18:00',
    status: 'ACTIVE' as const,
    approvedBy: actor.displayName || 'Dirección General SIFFA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    professionalName: `${prof.firstName} ${prof.lastName}`,
    establishmentName: est.name,
  };

  serverStore.authorizations.set(id, auth);

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'CREATE_AUTHORIZATION',
    entityType: 'AUTHORIZATION',
    entityId: id,
    result: 'SUCCESS',
    metadata: { professionalId, establishmentId },
  });

  return res.status(201).json(auth);
});

apiRouter.patch('/authorizations/:id/status', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  const { id } = req.params;
  const { status } = req.body;
  const auth = serverStore.authorizations.get(id);
  if (!auth) return res.status(404).json({ error: 'Autorización no encontrada' });

  auth.status = status;
  auth.updatedAt = new Date().toISOString();
  serverStore.authorizations.set(id, auth);

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'UPDATE_AUTHORIZATION_STATUS',
    entityType: 'AUTHORIZATION',
    entityId: id,
    result: 'SUCCESS',
    metadata: { newStatus: status },
  });

  return res.json(auth);
});

// -------------------------------------------------------------
// 5b. FASE 2: NOMINAS SUBMISSIONS, PREREQUISITES & AUTHORIZED DEVICES
// -------------------------------------------------------------

// NOMINAS: List all submissions
apiRouter.get('/nominas', (req: Request, res: Response) => {
  res.json(Array.from(serverStore.nominaSubmissions.values()));
});

// NOMINAS: Create / Submit a new Nomina from SIFFA to a Prison Unit
apiRouter.post('/nominas', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  const { establishmentId, professionals, observations } = req.body;

  const est = serverStore.establishments.get(establishmentId);
  if (!est) {
    return res.status(400).json({ error: 'Establecimiento penitenciario no válido' });
  }

  if (!Array.isArray(professionals) || professionals.length === 0) {
    return res.status(400).json({ error: 'La nómina debe incluir al menos un profesional con nombre, DNI y función.' });
  }

  const id = `NOM-${Date.now().toString().slice(-4)}`;
  const newNomina = {
    id,
    establishmentId,
    establishmentName: est.name,
    submittedByUserId: actor.uid,
    submittedByUserName: actor.displayName || actor.email,
    submittedAt: new Date().toISOString(),
    professionals: professionals.map((p: any) => ({
      professionalId: p.professionalId || `PROF-${p.documentNumber || Date.now()}`,
      firstName: p.firstName,
      lastName: p.lastName,
      documentNumber: p.documentNumber,
      role: p.role || 'DOCENTE',
    })),
    status: 'enviada' as const,
    observations: observations || '',
  };

  serverStore.nominaSubmissions.set(id, newNomina);

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'CREATE_NOMINA_SUBMISSION',
    entityType: 'NOMINA_SUBMISSION',
    entityId: id,
    result: 'SUCCESS',
    metadata: { establishmentId, count: newNomina.professionals.length },
  });

  return res.status(201).json(newNomina);
});

// NOMINAS: Review by Prison Authority (Aprobar / Rechazar / Parcial)
// Regla 2.1: Al aprobar -> se generan/actualizan authorizations correspondientes
apiRouter.patch('/nominas/:id/review', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  const { id } = req.params;
  const { status, observations } = req.body;

  const nomina = serverStore.nominaSubmissions.get(id);
  if (!nomina) return res.status(404).json({ error: 'Nómina no encontrada' });

  nomina.status = status;
  nomina.approvedByUserId = actor.uid;
  nomina.approvedByUserName = actor.displayName || 'Autoridad Penitenciaria SPB';
  nomina.approvedAt = new Date().toISOString();
  if (observations) nomina.observations = observations;

  serverStore.nominaSubmissions.set(id, nomina);

  // Generación / actualización automática de autorizaciones si fue aprobada o parcial
  if (status === 'aprobada' || status === 'parcial') {
    const todayStr = new Date().toISOString().split('T')[0];
    nomina.professionals.forEach((p) => {
      // Buscar si ya existe una autorización previa para este profesional y establecimiento
      const existingAuth = Array.from(serverStore.authorizations.values()).find(
        (a) => a.professionalId === p.professionalId && a.establishmentId === nomina.establishmentId
      );

      if (existingAuth) {
        existingAuth.status = 'autorizada';
        existingAuth.updatedAt = new Date().toISOString();
        existingAuth.approvedBy = nomina.approvedByUserName || 'Autoridad Penitenciaria';
        serverStore.authorizations.set(existingAuth.id, existingAuth);
      } else {
        const newAuthId = `AUTH-NOM-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`;
        const generatedAuth: Authorization = {
          id: newAuthId,
          personId: p.professionalId,
          professionalId: p.professionalId,
          establishmentId: nomina.establishmentId,
          actividad: `Actividad SIFFA según Nómina Aprobada ${nomina.id}`,
          purpose: `Actividad SIFFA según Nómina Aprobada ${nomina.id}`,
          fechas: {
            validFrom: todayStr,
            validUntil: '2026-12-31',
          },
          validFrom: todayStr,
          validUntil: '2026-12-31',
          diasYHorarios: 'Lunes a Viernes 08:00 - 18:00',
          allowedDays: [1, 2, 3, 4, 5],
          startTime: '08:00',
          endTime: '18:00',
          funcion: p.role || 'Docente Formador SIFFA',
          status: 'autorizada' as const,
          referenciaDeLaAutorizacion: `Nómina ${nomina.id}`,
          approvedBy: nomina.approvedByUserName || 'Autoridad Penitenciaria SPB',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          professionalName: `${p.firstName} ${p.lastName}`,
          establishmentName: nomina.establishmentName,
        };
        serverStore.authorizations.set(newAuthId, generatedAuth);
      }
    });
  }

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'REVIEW_NOMINA_SUBMISSION',
    entityType: 'NOMINA_SUBMISSION',
    entityId: id,
    result: 'SUCCESS',
    metadata: { status, observations },
  });

  return res.json(nomina);
});

// PREREQUISITES: List
apiRouter.get('/prerequisites', (req: Request, res: Response) => {
  const { professionalId, establishmentId } = req.query;
  let list = Array.from(serverStore.prerequisites.values());
  if (professionalId) {
    list = list.filter((p) => p.professionalId === professionalId);
  }
  if (establishmentId) {
    list = list.filter((p) => p.establishmentId === establishmentId);
  }
  res.json(list);
});

// PREREQUISITES: Create
apiRouter.post('/prerequisites', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  const { professionalId, establishmentId, type, status, validUntil, documentUrl } = req.body;

  const prof = serverStore.professionals.get(professionalId);
  const est = serverStore.establishments.get(establishmentId);

  const id = `PRQ-${Date.now().toString().slice(-4)}`;
  const newPrereq = {
    id,
    professionalId,
    professionalName: prof ? `${prof.firstName} ${prof.lastName}` : 'Profesional SIFFA',
    establishmentId,
    establishmentName: est?.name || 'Unidad Penitenciaria',
    type: type || 'acuerdo_confidencialidad',
    status: (status || 'cumplido') as any,
    validUntil: validUntil || '2026-12-31T23:59:59Z',
    documentUrl: documentUrl || '',
  };

  serverStore.prerequisites.set(id, newPrereq);

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'CREATE_PREREQUISITE',
    entityType: 'PREREQUISITE',
    entityId: id,
    result: 'SUCCESS',
    metadata: { professionalId, establishmentId, type },
  });

  return res.status(201).json(newPrereq);
});

// PREREQUISITES: Update Status
apiRouter.patch('/prerequisites/:id/status', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  const { id } = req.params;
  const { status, validUntil } = req.body;

  const prereq = serverStore.prerequisites.get(id);
  if (!prereq) return res.status(404).json({ error: 'Requisito no encontrado' });

  prereq.status = status;
  if (validUntil) prereq.validUntil = validUntil;
  serverStore.prerequisites.set(id, prereq);

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'UPDATE_PREREQUISITE_STATUS',
    entityType: 'PREREQUISITE',
    entityId: id,
    result: 'SUCCESS',
    metadata: { newStatus: status },
  });

  return res.json(prereq);
});

// AUTHORIZED DEVICES: List
apiRouter.get('/authorized-devices', (req: Request, res: Response) => {
  res.json(Array.from(serverStore.authorizedDevices.values()));
});

// AUTHORIZED DEVICES: Create
apiRouter.post('/authorized-devices', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  const { deviceId, establishmentId, validUntil, status } = req.body;

  const est = serverStore.establishments.get(establishmentId);
  const id = `DEV-${Date.now().toString().slice(-4)}`;
  const newDevice = {
    id,
    deviceId,
    establishmentId,
    establishmentName: est?.name || 'Unidad Penitenciaria',
    authorizedByUserId: actor.uid,
    validUntil: validUntil || '2027-12-31T23:59:59Z',
    status: (status || 'activo') as any,
  };

  serverStore.authorizedDevices.set(id, newDevice);

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'CREATE_AUTHORIZED_DEVICE',
    entityType: 'AUTHORIZED_DEVICE',
    entityId: id,
    result: 'SUCCESS',
    metadata: { deviceId, establishmentId },
  });

  return res.status(201).json(newDevice);
});

// AUTHORIZED DEVICES: Update Status
apiRouter.patch('/authorized-devices/:id/status', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  const { id } = req.params;
  const { status } = req.body;

  const dev = serverStore.authorizedDevices.get(id);
  if (!dev) return res.status(404).json({ error: 'Dispositivo no encontrado' });

  dev.status = status;
  serverStore.authorizedDevices.set(id, dev);

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'UPDATE_DEVICE_STATUS',
    entityType: 'AUTHORIZED_DEVICE',
    entityId: id,
    result: 'SUCCESS',
    metadata: { deviceId: dev.deviceId, newStatus: status },
  });

  return res.json(dev);
});

// In-memory rate limiting per IP for public QR verification
const verifyRateLimits = new Map<string, { count: number; resetAt: number }>();
function checkVerifyRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = verifyRateLimits.get(ip);
  if (!record || now > record.resetAt) {
    verifyRateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (record.count >= 60) {
    return false;
  }
  record.count += 1;
  return true;
}

// -------------------------------------------------------------
// VERIFICACIÓN PÚBLICA DE CREDENCIAL SIFFA (Ruta mínima sin login: /api/verify/:qrToken)
// -------------------------------------------------------------
apiRouter.get('/verify/:qrToken', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkVerifyRateLimit(ip)) {
    return res.status(429).json({
      valid: false,
      status: 'Límite de solicitudes superado',
      statusColor: 'rose',
      disclaimer: 'Credencial de identificación de SIFFA. Su tenencia no implica autorización para ingresar a un establecimiento penitenciario. El acceso está sujeto a la autorización y al control de la autoridad penitenciaria.',
      error: 'Demasiadas consultas de verificación desde esta dirección IP. Intente nuevamente en unos minutos.',
    });
  }

  // Encabezados estrictos de seguridad y no indexación
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  const { qrToken } = req.params;
  const genericDisclaimer =
    'Credencial de identificación de SIFFA. Su tenencia no implica autorización para ingresar a un establecimiento penitenciario. El acceso está sujeto a la autorización y al control de la autoridad penitenciaria.';

  const cred = serverStore.findCredentialByQrToken(qrToken);

  // REGLA CRÍTICA DE SEGURIDAD:
  // Si el token no existe, devolver siempre la misma respuesta genérica (sin distinguir "no existe" de otros errores) para evitar enumeración.
  if (!cred) {
    return res.status(404).json({
      valid: false,
      status: 'Credencial no válida',
      statusLabel: 'No registrada',
      statusColor: 'rose',
      disclaimer: genericDisclaimer,
      reason: 'Credencial no válida o no registrada en el padrón oficial de SIFFA.',
    });
  }

  // Profesional vinculado
  const personId = cred.personId || cred.professionalId;
  const prof = serverStore.professionals.get(personId);

  const statusNormalized = String(cred.status).toUpperCase();
  const isActive = statusNormalized === 'ACTIVA' || statusNormalized === 'ACTIVE';

  // REGLA CRÍTICA DE SEGURIDAD:
  // Si la credencial está REVOCADA, VENCIDA, SUSPENDIDA o DENUNCIADA_PERDIDA:
  // Mostrar estado claro ("Credencial no vigente", en rojo) SIN foto ni nombre.
  if (!isActive) {
    let motivoPublico = 'Credencial no vigente';
    if (statusNormalized === 'REVOCADA' || statusNormalized === 'REVOKED') {
      motivoPublico = 'Credencial revocada';
    } else if (statusNormalized === 'SUSPENDIDA' || statusNormalized === 'SUSPENDED') {
      motivoPublico = 'Credencial suspendida';
    } else if (statusNormalized === 'VENCIDA' || statusNormalized === 'EXPIRED') {
      motivoPublico = 'Credencial vencida';
    } else if (statusNormalized === 'DENUNCIADA_PERDIDA') {
      motivoPublico = 'Credencial denunciada como perdida / extraviada';
    }

    return res.json({
      valid: false,
      status: 'Credencial no vigente',
      statusLabel: motivoPublico,
      statusColor: 'rose',
      disclaimer: genericDisclaimer,
      reason: 'La credencial se encuentra suspendida, vencida, revocada o dada de baja. Comuníquese con la administración de SIFFA.',
    });
  }

  // Formato dd/mm/aaaa
  let expiresFormatted = '';
  try {
    const expDate = new Date(cred.expiresAt);
    const day = String(expDate.getUTCDate()).padStart(2, '0');
    const month = String(expDate.getUTCMonth() + 1).padStart(2, '0');
    const year = expDate.getUTCFullYear();
    expiresFormatted = `Vigente hasta ${day}/${month}/${year}`;
  } catch {
    expiresFormatted = `Vigente hasta ${cred.expiresAt}`;
  }

  // Payload público mínimo para identificar a la persona como personal de SIFFA
  // NO debe mostrar nunca: DNI, teléfono, correo, horarios, penitenciaria asignada, autorizaciones ni ningún dato de contacto.
  const publicData = {
    valid: true,
    status: 'ACTIVA',
    statusLabel: 'Vigente',
    statusColor: 'emerald' as const,
    credentialNumber: cred.credentialNumber || cred.id,
    personName: prof ? `${prof.firstName} ${prof.lastName}` : (cred.professionalName || 'Integrante SIFFA'),
    roleInSiffa: prof?.professionalRole || cred.professionalRole || 'Docente Formador SIFFA',
    photoUrl: prof?.profilePhotoUrl || '',
    expiresAt: cred.expiresAt,
    expiresAtFormatted: expiresFormatted,
    disclaimer: genericDisclaimer,
  };

  // REGLA: Si el usuario es VALIDATOR o SUPER_ADMIN autenticado, al abrir la ruta de un qrToken puede ver además
  // la autorización previa vigente para esa unidad, fecha y horario.
  const actor = getActorFromReq(req);
  const isValidator = actor && (actor.role === 'VALIDATOR' || actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN_CREDENTIALS');

  if (isValidator) {
    const auths = Array.from(serverStore.authorizations.values()).filter(
      (a) => (a.personId === personId || a.professionalId === personId)
    );
    const activeAuth = auths.find((a) => String(a.status).toUpperCase() === 'AUTORIZADA' || String(a.status).toUpperCase() === 'ACTIVE');

    return res.json({
      ...publicData,
      validatorContext: {
        isValidatorSession: true,
        authorizationStatus: activeAuth ? 'AUTORIZADA' : 'SIN_AUTORIZACION',
        authorizationStatusText: activeAuth
          ? 'AUTORIZACIÓN PREVIA VIGENTE'
          : 'SIN AUTORIZACIÓN PREVIA REGISTRADA',
        disclaimerPenitenciaria: 'El ingreso efectivo queda sujeto al control de la Unidad.',
        establishmentName: activeAuth?.establishmentName || 'No asignada',
        actividad: activeAuth?.actividad || activeAuth?.purpose || 'No especificada',
        diasYHorarios: activeAuth?.diasYHorarios || 'A coordinar con la guardia',
        funcion: activeAuth?.funcion || publicData.roleInSiffa,
        referenciaDeLaAutorizacion: activeAuth?.referenciaDeLaAutorizacion || 'S/D',
      },
    });
  }

  return res.json(publicData);
});

// -------------------------------------------------------------
// CONSULTA PRIVADA DEL INTEGRANTE AUTENTICADO: GET /api/me/credential
// -------------------------------------------------------------
apiRouter.get('/me/credential', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  if (!actor || actor.uid === 'anon') {
    return res.status(401).json({ error: 'Identificación requerida en padrón cerrado.' });
  }

  let profId = actor.professionalId;
  let prof = profId ? serverStore.professionals.get(profId) : null;
  if (!prof && actor.email) {
    prof = Array.from(serverStore.professionals.values()).find(
      (p) => p.email.toLowerCase() === actor.email.toLowerCase()
    ) || null;
    if (prof) profId = prof.id;
  }

  if (!prof || !profId) {
    return res.status(404).json({
      error: `No se encontró un legajo de integrante registrado para el usuario ${actor.email}.`,
    });
  }

  // REGLA CRÍTICA: Cada integrante SOLO puede ver SU propia credencial (validado en backend)
  const cred = Array.from(serverStore.credentials.values()).find(
    (c) => (c.personId === profId || c.professionalId === profId) &&
           (String(c.status).toUpperCase() === 'ACTIVA' || String(c.status).toUpperCase() === 'ACTIVE')
  ) || Array.from(serverStore.credentials.values()).find(
    (c) => c.personId === profId || c.professionalId === profId
  );

  const auths = Array.from(serverStore.authorizations.values()).filter(
    (a) => a.personId === profId || a.professionalId === profId
  );

  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const publicVerificationUrl = cred?.qrToken ? `${protocol}://${host}/v/${cred.qrToken}` : '';

  res.json({
    person: {
      id: prof.id,
      firstName: prof.firstName,
      lastName: prof.lastName,
      email: prof.email,
      phone: prof.phone,
      documentNumber: prof.documentNumber,
      matricula: prof.matricula,
      professionalRole: prof.professionalRole,
      profilePhotoUrl: prof.profilePhotoUrl,
      status: prof.status,
    },
    credential: cred ? {
      id: cred.id,
      credentialNumber: cred.credentialNumber || cred.id,
      personId: cred.personId || cred.professionalId,
      issuedAt: cred.issuedAt,
      expiresAt: cred.expiresAt,
      status: cred.status,
      qrToken: cred.qrToken,
      qrTokenVersion: cred.qrTokenVersion || 1,
      publicVerificationUrl,
    } : null,
    authorizations: auths.map((a) => ({
      id: a.id,
      establishmentId: a.establishmentId,
      establishmentName: a.establishmentName,
      actividad: a.actividad || a.purpose,
      diasYHorarios: a.diasYHorarios,
      validFrom: a.validFrom,
      validUntil: a.validUntil,
      funcion: a.funcion,
      status: a.status,
      referenciaDeLaAutorizacion: a.referenciaDeLaAutorizacion,
    })),
    disclaimer: 'Credencial de identificación de SIFFA. Su tenencia no implica autorización para ingresar a un establecimiento penitenciario. El acceso está sujeto a la autorización y al control de la autoridad penitenciaria.',
    notice: 'El ingreso efectivo queda sujeto al control de la Unidad.',
  });
});

// -------------------------------------------------------------
// ACCIONES DE ADMINISTRACIÓN DE CREDENCIALES
// -------------------------------------------------------------
apiRouter.post('/credentials/:id/suspend', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN_CREDENTIALS') {
    return res.status(403).json({ error: 'Permisos insuficientes. Solo administradores pueden suspender credenciales.' });
  }
  const { reason } = req.body;
  const updated = serverStore.suspendCredential(req.params.id, actor, reason);
  if (!updated) return res.status(404).json({ error: 'Credencial no encontrada' });
  res.json({ success: true, credential: updated });
});

apiRouter.post('/credentials/:id/revoke', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN_CREDENTIALS') {
    return res.status(403).json({ error: 'Permisos insuficientes. Solo administradores pueden revocar credenciales.' });
  }
  const { reason } = req.body;
  const updated = serverStore.revokeCredential(req.params.id, actor, reason);
  if (!updated) return res.status(404).json({ error: 'Credencial no encontrada' });
  res.json({ success: true, credential: updated });
});

apiRouter.post('/credentials/:id/mark-lost', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN_CREDENTIALS') {
    return res.status(403).json({ error: 'Permisos insuficientes para registrar extravío de credenciales.' });
  }
  const { reason } = req.body;
  const updated = serverStore.markCredentialLost(req.params.id, actor, reason);
  if (!updated) return res.status(404).json({ error: 'Credencial no encontrada' });
  res.json({ success: true, credential: updated });
});

apiRouter.post('/credentials/:id/reprint', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN_CREDENTIALS') {
    return res.status(403).json({ error: 'Permisos insuficientes para reimprimir credenciales.' });
  }
  const updated = serverStore.reprintCredential(req.params.id, actor);
  if (!updated) return res.status(404).json({ error: 'Credencial no encontrada' });
  res.json({ success: true, credential: updated });
});

// -------------------------------------------------------------
// 6. CREDENTIALS LIST & COMPATIBILITY
// -------------------------------------------------------------
apiRouter.get('/credentials', (req: Request, res: Response) => {
  res.json(Array.from(serverStore.credentials.values()));
});

// Professional's own credential (Strict personal retrieval)
apiRouter.get('/credentials/my', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  let profId = actor.professionalId;
  if (!profId && actor.email) {
    const matched = Array.from(serverStore.professionals.values()).find(
      (p) => p.email.toLowerCase() === actor.email.toLowerCase()
    );
    if (matched) profId = matched.id;
  }

  if (!profId) {
    return res.status(404).json({
      error: `No se encontró una credencial profesional emitida para ${actor.email}.`,
    });
  }

  const prof = serverStore.professionals.get(profId);
  const cred = Array.from(serverStore.credentials.values()).find(
    (c) => c.professionalId === profId && c.status === 'ACTIVE'
  ) || Array.from(serverStore.credentials.values()).find(
    (c) => c.professionalId === profId
  );

  const auths = Array.from(serverStore.authorizations.values()).filter(
    (a) => a.professionalId === profId
  );

  res.json({
    professional: prof || null,
    credential: cred || null,
    authorizations: auths,
  });
});

// Issue credential (server-side only)
apiRouter.post('/credentials/issue', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN_CREDENTIALS') {
    return res.status(403).json({ error: 'Permisos insuficientes para emitir credenciales' });
  }

  const { professionalId, authorizationId, credentialType = 'DIGITAL' } = req.body;
  const prof = serverStore.professionals.get(professionalId);
  const auth = serverStore.authorizations.get(authorizationId);

  if (!prof || !auth) {
    return res.status(400).json({ error: 'Profesional o Autorización no válida' });
  }

  const isPhysical = credentialType === 'PHYSICAL';
  const qrToken = serverStore.generateSecureQrToken();
  const staticTokenId = isPhysical
    ? `STK-${crypto.randomBytes(6).toString('hex').toUpperCase()}`
    : undefined;

  const id = `CRED-${isPhysical ? 'PHYS-' : ''}${Date.now().toString().slice(-4)}`;
  const credentialNumber = `SIFFA-CR-${Math.floor(100 + Math.random() * 900)}`;

  const newCred: Credential = {
    id,
    credentialNumber,
    personId: professionalId,
    professionalId,
    authorizationId,
    credentialVersion: 1,
    credentialType: isPhysical ? 'PHYSICAL' : 'DIGITAL',
    qrToken,
    qrTokenVersion: 1,
    staticTokenId,
    issuedAt: new Date().toISOString(),
    expiresAt: auth.validUntil + 'T23:59:59Z',
    status: 'ACTIVA' as const,
    keyId: cryptoService.getKeyId(),
    tokenId: `TOK-${Date.now().toString().slice(-5)}`,
    createdAt: new Date().toISOString(),
    professionalName: `${prof.firstName} ${prof.lastName}`,
    establishmentName: auth.establishmentName,
    professionalRole: prof.professionalRole,
  };

  serverStore.credentials.set(id, newCred);
  serverStore.qrTokens.set(qrToken, id);

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'ISSUE_CREDENTIAL',
    entityType: 'CREDENTIAL',
    entityId: id,
    result: 'SUCCESS',
    metadata: {
      professionalId,
      authorizationId,
      credentialType: newCred.credentialType,
      staticTokenId: newCred.staticTokenId,
    },
  });

  return res.status(201).json(newCred);
});

// FASE 3: Endpoint de Credencial Física Oficial (PDF / Renderizable imprimible)
// GET /api/credentials/:id/physical
apiRouter.get('/credentials/:id/physical', async (req: Request, res: Response) => {
  const { id } = req.params;
  const cred = serverStore.credentials.get(id);

  if (!cred) {
    return res.status(404).json({ error: 'Credencial no encontrada' });
  }

  const prof = serverStore.professionals.get(cred.professionalId);
  const auth = serverStore.authorizations.get(cred.authorizationId);
  const est = auth ? serverStore.establishments.get(auth.establishmentId) : null;

  const LEGAL_DISCLAIMER =
    'Credencial de identificación SIFFA. Su tenencia no implica autorización automática de ingreso. El acceso queda sujeto a la autoridad penitenciaria.';

  // QR Fijo: Usa staticTokenId opaco (sin datos personales embebidos)
  const tokenForQr = cred.staticTokenId || cred.tokenId || cred.id;
  const qrDataUrl = await QRCode.toDataURL(tokenForQr, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 250,
  });

  // REQUISITO LEGAL PROHIBITIVO:
  // DNI completo prohibido por defecto. Solo si requiresDniOnCard === true en el establecimiento.
  const requiresDniOnCard = est?.requiresDniOnCard === true;
  const printedDni = requiresDniOnCard ? (prof?.documentNumber || 'N/A') : undefined;

  const physicalData = {
    id: cred.id,
    credentialType: cred.credentialType || 'PHYSICAL',
    credentialVersion: cred.credentialVersion,
    status: cred.status,
    staticTokenId: cred.staticTokenId || tokenForQr,
    qrDataUrl,
    tokenForQr,
    issuedAt: cred.issuedAt,
    expiresAt: cred.expiresAt,
    legalDisclaimer: LEGAL_DISCLAIMER,
    requiresDniOnCard,
    printedDni,
    professional: {
      id: prof?.id || cred.professionalId,
      fullName: prof ? `${prof.firstName} ${prof.lastName}` : (cred.professionalName || 'Profesional SIFFA'),
      role: prof?.professionalRole || cred.professionalRole || 'DOCENTE',
      matricula: prof?.matricula || 'Homologada SIFFA',
      specialty: prof?.specialty || 'Área Pedagógica y Deportiva',
      profilePhotoUrl: prof?.profilePhotoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    },
    establishment: {
      id: est?.id || 'EST-U33',
      name: est?.name || cred.establishmentName || 'Establecimiento Penitenciario SPB',
      code: est?.code || 'SPB-SIFFA',
      requiresDniOnCard,
    },
  };

  // Si se solicita formato HTML directo para imprimir como PDF en navegador (?format=html):
  if (req.query.format === 'html') {
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Credencial Física SIFFA - ${physicalData.professional.fullName}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f1f5f9; margin: 0; padding: 20px; color: #0f172a; }
    .print-bar { max-width: 650px; margin: 0 auto 20px auto; text-align: center; }
    .print-btn { background: #002244; color: white; border: none; padding: 10px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; cursor: pointer; }
    .card-container { display: flex; flex-direction: column; align-items: center; gap: 24px; max-width: 650px; margin: 0 auto; }
    .card { width: 340px; height: 216px; border-radius: 14px; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.12); position: relative; overflow: hidden; border: 1px solid #cbd5e1; box-sizing: border-box; }
    .card-front { background: linear-gradient(135deg, #001738 0%, #002b66 100%); color: white; display: flex; flex-direction: column; justify-content: space-between; padding: 12px; }
    .card-back { background: #ffffff; color: #1e293b; display: flex; flex-direction: column; justify-content: space-between; padding: 12px; border: 2px solid #002b66; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 6px; }
    .logo-txt { font-size: 15px; font-weight: 900; letter-spacing: 1px; color: #38bdf8; }
    .badge-sub { font-size: 8px; font-weight: bold; background: rgba(56,189,248,0.2); color: #7dd3fc; padding: 2px 6px; border-radius: 4px; }
    .body-front { display: flex; gap: 10px; align-items: center; margin-top: 4px; }
    .photo { width: 70px; height: 78px; border-radius: 8px; object-fit: cover; border: 2px solid #38bdf8; }
    .info { flex: 1; }
    .name { font-size: 13px; font-weight: 900; line-height: 1.1; margin-bottom: 2px; }
    .role { font-size: 9px; font-weight: bold; color: #38bdf8; text-transform: uppercase; }
    .meta { font-size: 8px; color: #94a3b8; margin-top: 2px; }
    .qr-box { text-align: center; }
    .qr-img { width: 64px; height: 64px; background: white; padding: 2px; border-radius: 6px; }
    .token-id { font-size: 7px; font-family: monospace; color: #94a3b8; margin-top: 2px; }
    .disclaimer-front { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 4px 6px; text-align: center; }
    .disclaimer-text { font-size: 7px; font-weight: bold; color: #78350f; line-height: 1.15; margin: 0; }
    .back-header { text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .back-title { font-size: 10px; font-weight: 900; color: #002244; }
    .back-content { font-size: 8px; color: #475569; line-height: 1.3; }
    .dni-warning { font-size: 7.5px; font-weight: bold; color: ${requiresDniOnCard ? '#047857' : '#64748b'}; margin-top: 3px; }
    @media print {
      body { background: white; padding: 0; }
      .print-bar { display: none; }
      .card { box-shadow: none; page-break-inside: avoid; margin-bottom: 20px; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <button class="print-btn" onclick="window.print()">🖨️ IMPRIMIR / GUARDAR PDF</button>
  </div>
  <div class="card-container">
    <div class="card card-front">
      <div class="header">
        <div>
          <span class="logo-txt">SIFFA</span>
          <span style="font-size: 8px; color: #94a3b8; margin-left: 4px;">CREDENCIAL INSTITUCIONAL</span>
        </div>
        <span class="badge-sub">CARNET FÍSICO</span>
      </div>
      <div class="body-front">
        <img class="photo" src="${physicalData.professional.profilePhotoUrl}" alt="Foto">
        <div class="info">
          <div class="name">${physicalData.professional.fullName}</div>
          <div class="role">${physicalData.professional.role}</div>
          <div class="meta">Matrícula: ${physicalData.professional.matricula}</div>
          ${requiresDniOnCard ? `<div class="meta" style="color: #fde047; font-weight: bold;">DNI: ${printedDni}</div>` : `<div class="meta" style="color: #94a3b8;">DNI: [Protegido según norma]</div>`}
          <div class="meta">Vencimiento: ${physicalData.expiresAt.slice(0, 10)}</div>
          <div class="meta" style="font-family: monospace;">N°: ${physicalData.id}</div>
        </div>
        <div class="qr-box">
          <img class="qr-img" src="${physicalData.qrDataUrl}" alt="QR Fijo">
          <div class="token-id">${physicalData.staticTokenId}</div>
        </div>
      </div>
      <div class="disclaimer-front">
        <p class="disclaimer-text">⚖️ ${physicalData.legalDisclaimer}</p>
      </div>
    </div>

    <div class="card card-back">
      <div class="back-header">
        <div class="back-title">SISTEMA INTEGRAL DE FORMACIÓN Y FÚTBOL EN ÁMBITOS PENITENCIARIOS</div>
        <div style="font-size: 7.5px; color: #64748b;">Homologación y Control Penitenciario</div>
      </div>
      <div class="back-content">
        <p style="margin: 2px 0;"><strong>Destino Autorizado:</strong> ${physicalData.establishment.name}</p>
        <p style="margin: 2px 0;"><strong>Token Criptográfico Fijo:</strong> <code>${physicalData.staticTokenId}</code></p>
        <p class="dni-warning">${requiresDniOnCard ? '✓ Impresión de DNI requerida y autorizada por la Unidad' : 'ℹ DNI resguardado por defecto. Impresión sujeta a requerimiento formal de la Unidad.'}</p>
        <p style="margin: 4px 0 0 0; font-size: 7px; color: #64748b; line-height: 1.2;">
          Este carnet es personal e intransferible. La verificación en garita se realiza escaneando el código QR fijo en tiempo real contra la base central SIFFA.
        </p>
      </div>
      <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 4px;">
        <span style="font-size: 7px; font-weight: bold; color: #002244;">REPÚBLICA ARGENTINA · PROVINCIA DE BUENOS AIRES</span>
      </div>
    </div>
  </div>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }

  return res.json(physicalData);
});

// Update Credential Status with strict audit trail
apiRouter.patch('/credentials/:id/status', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN_CREDENTIALS') {
    return res.status(403).json({ error: 'Permisos insuficientes para modificar estado de credencial' });
  }

  const { id } = req.params;
  const { status, reason } = req.body;
  const cred = serverStore.credentials.get(id);
  if (!cred) return res.status(404).json({ error: 'Credencial no encontrada' });

  const prevStatus = cred.status;
  cred.status = status;
  if (status === 'revocada' || status === 'REVOKED' || status === 'denunciada_por_perdida') {
    cred.revokedAt = new Date().toISOString();
    cred.revokedReason = reason || 'Modificación administrativa de estado';
  }
  serverStore.credentials.set(id, cred);

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'UPDATE_CREDENTIAL_STATUS',
    entityType: 'CREDENTIAL',
    entityId: id,
    result: 'SUCCESS',
    metadata: { prevStatus, newStatus: status, reason },
  });

  return res.json(cred);
});

// Revoke credential
apiRouter.post('/credentials/revoke', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN_CREDENTIALS') {
    return res.status(403).json({ error: 'No autorizado para revocar credenciales' });
  }

  const { credentialId, reason } = req.body;
  const cred = serverStore.credentials.get(credentialId);
  if (!cred) return res.status(404).json({ error: 'Credencial no encontrada' });

  cred.status = 'revocada';
  cred.revokedAt = new Date().toISOString();
  cred.revokedReason = reason || 'Revocación administrativa SIFFA';
  serverStore.credentials.set(credentialId, cred);

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'REVOKE_CREDENTIAL',
    entityType: 'CREDENTIAL',
    entityId: credentialId,
    result: 'SUCCESS',
    metadata: { reason: cred.revokedReason },
  });

  return res.json(cred);
});

// Generate Cryptographically Signed Dynamic QR
// Short window validity (90 seconds)
apiRouter.get('/credentials/dynamic-qr', (req: Request, res: Response) => {
  const credentialId = (req.query.credentialId as string) || 'CRED-001';
  const cred = serverStore.credentials.get(credentialId);

  if (!cred) {
    return res.status(404).json({ error: 'Credencial inexistente' });
  }

  const auth = serverStore.authorizations.get(cred.authorizationId);
  const eid = auth ? auth.establishmentId : 'EST-U33';

  // Generate signed QR
  const signedPayload = cryptoService.generateSignedDynamicQR({
    cid: cred.id,
    aid: cred.authorizationId,
    eid: eid,
    ttlSeconds: 90, // Valid for 90 seconds
  });

  return res.json({
    dynamicQR: signedPayload,
    credentialStatus: cred.status,
    expiresInSeconds: 90,
  });
});

// -------------------------------------------------------------
// 7. ACCESS DECISION & CONTEXTUAL VALIDATION ENGINE
// -------------------------------------------------------------
apiRouter.post('/validation/validate', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  const { qrPayload, establishmentId, validatorDeviceId } = req.body;

  if (!qrPayload || !qrPayload.sig || !qrPayload.cid) {
    return res.status(400).json({
      decision: 'DENIED',
      reasonCode: 'PAYLOAD_QR_MALFORMADO',
      message: 'Código QR no reconocido o sin firma institucional SIFFA',
    });
  }

  const targetEstablishmentId = establishmentId || 'EST-U33';
  const deviceId = validatorDeviceId || 'GARITA-PRINCIPAL-01';

  // 0. FASE 2.4: VERIFICACIÓN DE DISPOSITIVO AUTORIZADO
  const matchedDevice = Array.from(serverStore.authorizedDevices.values()).find(
    (d) => d.deviceId.toUpperCase() === deviceId.toUpperCase()
  );
  const nowIso = new Date().toISOString();

  if (!matchedDevice || matchedDevice.status !== 'activo' || (matchedDevice.validUntil && matchedDevice.validUntil < nowIso)) {
    const event = serverStore.recordAccessEvent({
      professionalId: 'DESCONOCIDO',
      credentialId: qrPayload.cid,
      authorizationId: qrPayload.aid || 'N/A',
      establishmentId: targetEstablishmentId,
      validatorDeviceId: deviceId,
      validationMode: 'ONLINE',
      decision: 'DENIED',
      eventType: 'CHECK_IN',
      reasonCode: 'DISPOSITIVO_NO_AUTORIZADO',
      credentialVersion: qrPayload.ver || 1,
      synchronizationStatus: 'SYNCED',
    });

    return res.json({
      decision: 'DENIED',
      reasonCode: 'DISPOSITIVO_NO_AUTORIZADO',
      message: `Dispositivo validador '${deviceId}' no autorizado o licencia vencida para esta Unidad Penitenciaria.`,
      accessEventId: event.id,
      timestamp: event.timestamp,
    });
  }

  // 1. Verify Asymmetric Ed25519 Cryptographic Signature & Expiration
  const verification = cryptoService.verifyDynamicQRSha(qrPayload);
  if (!verification.validSignature) {
    const reasonCode = verification.isExpired ? 'CREDENCIAL_VENCIDA' : 'FIRMA_INVALIDA';
    const event = serverStore.recordAccessEvent({
      professionalId: 'DESCONOCIDO',
      credentialId: qrPayload.cid,
      authorizationId: qrPayload.aid || 'N/A',
      establishmentId: targetEstablishmentId,
      validatorDeviceId: deviceId,
      validationMode: 'ONLINE',
      decision: 'DENIED',
      reasonCode: reasonCode,
      credentialVersion: qrPayload.ver || 1,
      synchronizationStatus: 'SYNCED',
    });

    return res.json({
      decision: 'DENIED',
      reasonCode: reasonCode,
      message: verification.isExpired
        ? 'El código QR dinámico ha expirado. El profesional debe renovar la pantalla.'
        : 'La firma criptográfica Ed25519 no corresponde a la autoridad emisora SIFFA.',
      accessEventId: event.id,
      timestamp: event.timestamp,
    });
  }

  // 2. Fetch Credential
  const cred = serverStore.credentials.get(qrPayload.cid);
  if (!cred) {
    const event = serverStore.recordAccessEvent({
      professionalId: 'DESCONOCIDO',
      credentialId: qrPayload.cid,
      authorizationId: qrPayload.aid,
      establishmentId: targetEstablishmentId,
      validatorDeviceId: deviceId,
      validationMode: 'ONLINE',
      decision: 'DENIED',
      reasonCode: 'CREDENCIAL_INEXISTENTE',
      credentialVersion: qrPayload.ver,
      synchronizationStatus: 'SYNCED',
    });
    return res.json({
      decision: 'DENIED',
      reasonCode: 'CREDENCIAL_INEXISTENTE',
      message: 'Credencial no registrada en la base de datos SIFFA',
      accessEventId: event.id,
    });
  }

  // 3. Check Credential Status
  if (cred.status === 'REVOKED') {
    const event = serverStore.recordAccessEvent({
      professionalId: cred.professionalId,
      credentialId: cred.id,
      authorizationId: cred.authorizationId,
      establishmentId: targetEstablishmentId,
      validatorDeviceId: deviceId,
      validationMode: 'ONLINE',
      decision: 'DENIED',
      reasonCode: 'CREDENCIAL_REVOCADA',
      credentialVersion: cred.credentialVersion,
      synchronizationStatus: 'SYNCED',
      professionalName: cred.professionalName,
    });
    return res.json({
      decision: 'DENIED',
      reasonCode: 'CREDENCIAL_REVOCADA',
      message: `Credencial revocada por SIFFA. Motivo: ${cred.revokedReason || 'Resolución interna'}`,
      accessEventId: event.id,
    });
  }

  // 4. Fetch Professional
  const prof = serverStore.professionals.get(cred.professionalId);
  if (!prof) {
    return res.json({ decision: 'DENIED', reasonCode: 'PROFESIONAL_INEXISTENTE' });
  }

  if (prof.status === 'SUSPENDED') {
    const event = serverStore.recordAccessEvent({
      professionalId: prof.id,
      credentialId: cred.id,
      authorizationId: cred.authorizationId,
      establishmentId: targetEstablishmentId,
      validatorDeviceId: deviceId,
      validationMode: 'ONLINE',
      decision: 'DENIED',
      reasonCode: 'PROFESIONAL_SUSPENDIDO',
      credentialVersion: cred.credentialVersion,
      synchronizationStatus: 'SYNCED',
      professionalName: `${prof.firstName} ${prof.lastName}`,
    });
    return res.json({
      decision: 'DENIED',
      reasonCode: 'PROFESIONAL_SUSPENDIDO',
      message: 'El profesional tiene el legajo preventivamente suspendido.',
      accessEventId: event.id,
    });
  }

  // 4b. FASE 2.3: VALIDACIÓN BLOQUEANTE DE REQUISITOS PREVIOS (prerequisites)
  const profPrereqs = Array.from(serverStore.prerequisites.values()).filter(
    (p) => p.professionalId === prof.id && (p.establishmentId === targetEstablishmentId || !p.establishmentId)
  );
  const blockedPrereq = profPrereqs.find(
    (p) => p.status !== 'cumplido' || (p.validUntil && p.validUntil < nowIso)
  );

  if (blockedPrereq) {
    const typeLabel = blockedPrereq.type.replace('_', ' ').toUpperCase();
    const event = serverStore.recordAccessEvent({
      professionalId: prof.id,
      credentialId: cred.id,
      authorizationId: qrPayload.aid || cred.authorizationId,
      establishmentId: targetEstablishmentId,
      validatorDeviceId: deviceId,
      validationMode: 'ONLINE',
      decision: 'DENIED',
      eventType: 'CHECK_IN',
      reasonCode: 'REQUISITO_PREVIO_PENDIENTE',
      credentialVersion: cred.credentialVersion,
      synchronizationStatus: 'SYNCED',
      professionalName: `${prof.firstName} ${prof.lastName}`,
    });

    return res.json({
      decision: 'DENIED',
      reasonCode: 'REQUISITO_PREVIO_PENDIENTE',
      message: `Ingreso bloqueado: El profesional posee el requisito obligatorio '${typeLabel}' en estado ${blockedPrereq.status.toUpperCase()} para esta Unidad Penitenciaria.`,
      accessEventId: event.id,
      timestamp: event.timestamp,
    });
  }

  // 5. Fetch Authorization & Contextual Access Verification
  const auth = serverStore.authorizations.get(qrPayload.aid || cred.authorizationId);
  if (!auth) {
    const event = serverStore.recordAccessEvent({
      professionalId: prof.id,
      credentialId: cred.id,
      authorizationId: 'N/A',
      establishmentId: targetEstablishmentId,
      validatorDeviceId: deviceId,
      validationMode: 'ONLINE',
      decision: 'DENIED',
      reasonCode: 'AUTORIZACION_INEXISTENTE',
      credentialVersion: cred.credentialVersion,
      synchronizationStatus: 'SYNCED',
      professionalName: `${prof.firstName} ${prof.lastName}`,
    });
    return res.json({
      decision: 'DENIED',
      reasonCode: 'AUTORIZACION_INEXISTENTE',
      message: 'No existe autorización activa vinculada a esta credencial.',
      accessEventId: event.id,
    });
  }

  // 6. Check Establishment Match
  if (auth.establishmentId !== targetEstablishmentId) {
    const targetEst = serverStore.establishments.get(targetEstablishmentId);
    const event = serverStore.recordAccessEvent({
      professionalId: prof.id,
      credentialId: cred.id,
      authorizationId: auth.id,
      establishmentId: targetEstablishmentId,
      validatorDeviceId: deviceId,
      validationMode: 'ONLINE',
      decision: 'DENIED',
      reasonCode: 'ESTABLECIMIENTO_NO_AUTORIZADO',
      credentialVersion: cred.credentialVersion,
      synchronizationStatus: 'SYNCED',
      professionalName: `${prof.firstName} ${prof.lastName}`,
      establishmentName: targetEst?.name,
    });
    return res.json({
      decision: 'DENIED',
      reasonCode: 'ESTABLECIMIENTO_NO_AUTORIZADO',
      message: `El profesional no está autorizado para el establecimiento ${targetEstablishmentId}. Su autorización es para ${auth.establishmentName}.`,
      accessEventId: event.id,
    });
  }

  // 7. Check Date Window
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  if (todayStr < auth.validFrom || todayStr > auth.validUntil) {
    const event = serverStore.recordAccessEvent({
      professionalId: prof.id,
      credentialId: cred.id,
      authorizationId: auth.id,
      establishmentId: targetEstablishmentId,
      validatorDeviceId: deviceId,
      validationMode: 'ONLINE',
      decision: 'DENIED',
      reasonCode: 'FECHA_FUERA_DE_VIGENCIA',
      credentialVersion: cred.credentialVersion,
      synchronizationStatus: 'SYNCED',
      professionalName: `${prof.firstName} ${prof.lastName}`,
    });
    return res.json({
      decision: 'DENIED',
      reasonCode: 'FECHA_FUERA_DE_VIGENCIA',
      message: `Autorización fuera del período de vigencia (${auth.validFrom} al ${auth.validUntil}).`,
      accessEventId: event.id,
    });
  }

  // 8. Check Day of Week
  const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday...
  if (auth.allowedDays && auth.allowedDays.length > 0 && !auth.allowedDays.includes(dayOfWeek)) {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const event = serverStore.recordAccessEvent({
      professionalId: prof.id,
      credentialId: cred.id,
      authorizationId: auth.id,
      establishmentId: targetEstablishmentId,
      validatorDeviceId: deviceId,
      validationMode: 'ONLINE',
      decision: 'DENIED',
      reasonCode: 'DIA_NO_AUTORIZADO',
      credentialVersion: cred.credentialVersion,
      synchronizationStatus: 'SYNCED',
      professionalName: `${prof.firstName} ${prof.lastName}`,
    });
    return res.json({
      decision: 'DENIED',
      reasonCode: 'DIA_NO_AUTORIZADO',
      message: `El día ${dayNames[dayOfWeek]} no está habilitado en la autorización de ingreso.`,
      accessEventId: event.id,
    });
  }

  // 9. Check Time Window (HH:mm)
  const currentHours = now.getHours().toString().padStart(2, '0');
  const currentMinutes = now.getMinutes().toString().padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  if (currentTimeStr < auth.startTime || currentTimeStr > auth.endTime) {
    const event = serverStore.recordAccessEvent({
      professionalId: prof.id,
      credentialId: cred.id,
      authorizationId: auth.id,
      establishmentId: targetEstablishmentId,
      validatorDeviceId: deviceId,
      validationMode: 'ONLINE',
      decision: 'DENIED',
      reasonCode: 'HORARIO_NO_AUTORIZADO',
      credentialVersion: cred.credentialVersion,
      synchronizationStatus: 'SYNCED',
      professionalName: `${prof.firstName} ${prof.lastName}`,
    });
    return res.json({
      decision: 'DENIED',
      reasonCode: 'HORARIO_NO_AUTORIZADO',
      message: `Horario no habilitado (${currentTimeStr}). Rango autorizado: ${auth.startTime} a ${auth.endTime}.`,
      accessEventId: event.id,
    });
  }

  // 10. ACCESS GRANTED
  const est = serverStore.establishments.get(targetEstablishmentId);
  const event = serverStore.recordAccessEvent({
    professionalId: prof.id,
    credentialId: cred.id,
    authorizationId: auth.id,
    establishmentId: targetEstablishmentId,
    validatorDeviceId: deviceId,
    validationMode: 'ONLINE',
    decision: 'ALLOWED',
    eventType: 'CHECK_IN',
    reasonCode: 'CREDENCIAL_VALIDA',
    credentialVersion: cred.credentialVersion,
    synchronizationStatus: 'SYNCED',
    professionalName: `${prof.firstName} ${prof.lastName}`,
    documentNumber: prof.documentNumber,
    establishmentName: est?.name,
  });

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: 'VALIDATOR',
    action: 'VALIDATE_ACCESS_ALLOWED',
    entityType: 'ACCESS_EVENT',
    entityId: event.id,
    result: 'SUCCESS',
    metadata: {
      professionalId: prof.id,
      professionalName: `${prof.firstName} ${prof.lastName}`,
      establishmentId: targetEstablishmentId,
    },
  });

  return res.json({
    decision: 'ALLOWED',
    reasonCode: 'CREDENCIAL_VALIDA',
    message: 'AUTORIZACIÓN PREVIA VIGENTE · Sujeto a control de la Unidad Penitenciaria',
    accessEventId: event.id,
    timestamp: event.timestamp,
    professional: {
      id: prof.id,
      fullName: `${prof.firstName} ${prof.lastName}`,
      documentNumber: prof.documentNumber,
      professionalRole: prof.professionalRole,
      matricula: prof.matricula,
      profilePhotoUrl: prof.profilePhotoUrl,
    },
    authorization: {
      id: auth.id,
      purpose: auth.purpose,
      establishmentName: est?.name,
      validUntil: auth.validUntil,
      timeWindow: `${auth.startTime} - ${auth.endTime}`,
    },
  });
});

// 7b. VALIDATE ACCESS VIA MANUAL CODE (DNI, Credential ID, or Token)
apiRouter.post('/validation/validate-code', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  const { code, establishmentId, validatorDeviceId } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      decision: 'DENIED',
      reasonCode: 'CODIGO_VACIO',
      message: 'Debe ingresar un código de credencial o número de documento.',
    });
  }

  const cleanCode = code.trim().toUpperCase();
  const targetEstablishmentId = establishmentId || 'EST-U33';
  const deviceId = validatorDeviceId || 'GARITA-MANUAL-01';

  // 0. FASE 2.4: VERIFICACIÓN DE DISPOSITIVO AUTORIZADO
  const matchedDevice = Array.from(serverStore.authorizedDevices.values()).find(
    (d) => d.deviceId.toUpperCase() === deviceId.toUpperCase()
  );
  const nowIso = new Date().toISOString();

  if (!matchedDevice || matchedDevice.status !== 'activo' || (matchedDevice.validUntil && matchedDevice.validUntil < nowIso)) {
    const event = serverStore.recordAccessEvent({
      professionalId: 'DESCONOCIDO',
      credentialId: cleanCode,
      authorizationId: 'N/A',
      establishmentId: targetEstablishmentId,
      validatorDeviceId: deviceId,
      validationMode: 'ONLINE',
      decision: 'DENIED',
      eventType: 'CHECK_IN',
      reasonCode: 'DISPOSITIVO_NO_AUTORIZADO',
      credentialVersion: 1,
      synchronizationStatus: 'SYNCED',
    });

    return res.json({
      decision: 'DENIED',
      reasonCode: 'DISPOSITIVO_NO_AUTORIZADO',
      message: `Dispositivo validador '${deviceId}' no autorizado o licencia vencida para esta Unidad Penitenciaria.`,
      accessEventId: event.id,
      timestamp: event.timestamp,
    });
  }

  // Find Credential by ID, Token, staticTokenId, or Professional's Document Number
  let cred = serverStore.credentials.get(cleanCode);
  let prof = null;

  if (!cred) {
    // Search by Token, qrToken or staticTokenId
    cred = Array.from(serverStore.credentials.values()).find(
      (c) =>
        (c.tokenId && c.tokenId.toUpperCase() === cleanCode) ||
        c.id.toUpperCase() === cleanCode ||
        (c.qrToken && c.qrToken === cleanCode) ||
        (c.staticTokenId && c.staticTokenId.toUpperCase() === cleanCode)
    );
  }

  if (!cred) {
    // Search by Professional Document Number (DNI)
    prof = Array.from(serverStore.professionals.values()).find(
      (p) => p.documentNumber.trim() === cleanCode.replace(/[^0-9]/g, '')
    );
    if (prof) {
      cred = Array.from(serverStore.credentials.values()).find(
        (c) => c.professionalId === prof!.id && c.status === 'ACTIVE'
      ) || Array.from(serverStore.credentials.values()).find((c) => c.professionalId === prof!.id);
    }
  }

  if (!cred) {
    const event = serverStore.recordAccessEvent({
      professionalId: 'DESCONOCIDO',
      credentialId: cleanCode,
      authorizationId: 'N/A',
      establishmentId: targetEstablishmentId,
      validatorDeviceId: deviceId,
      validationMode: 'ONLINE',
      decision: 'DENIED',
      reasonCode: 'CREDENCIAL_INEXISTENTE',
      credentialVersion: 1,
      synchronizationStatus: 'SYNCED',
    });

    return res.json({
      decision: 'DENIED',
      reasonCode: 'CREDENCIAL_INEXISTENTE',
      message: `Credencial o documento '${cleanCode}' inexistente en la base de datos de SIFFA.`,
      accessEventId: event.id,
      timestamp: event.timestamp,
    });
  }

  if (!prof) {
    prof = serverStore.professionals.get(cred.professionalId);
  }

  // Check Credential Revocation
  if (cred.status === 'REVOKED') {
    const event = serverStore.recordAccessEvent({
      professionalId: cred.professionalId,
      credentialId: cred.id,
      authorizationId: cred.authorizationId,
      establishmentId: targetEstablishmentId,
      validatorDeviceId: deviceId,
      validationMode: 'ONLINE',
      decision: 'DENIED',
      reasonCode: 'CREDENCIAL_REVOCADA',
      credentialVersion: cred.credentialVersion,
      synchronizationStatus: 'SYNCED',
      professionalName: cred.professionalName,
    });

    return res.json({
      decision: 'DENIED',
      reasonCode: 'CREDENCIAL_REVOCADA',
      message: `Credencial revocada por SIFFA. Motivo: ${cred.revokedReason || 'Resolución interna de seguridad'}`,
      accessEventId: event.id,
      timestamp: event.timestamp,
      professional: prof ? {
        id: prof.id,
        fullName: `${prof.firstName} ${prof.lastName}`,
        documentNumber: prof.documentNumber,
        professionalRole: prof.professionalRole,
      } : undefined,
    });
  }

  // Check Expiration
  if (cred.status === 'EXPIRED' || (cred.expiresAt && new Date(cred.expiresAt) < new Date())) {
    const event = serverStore.recordAccessEvent({
      professionalId: cred.professionalId,
      credentialId: cred.id,
      authorizationId: cred.authorizationId,
      establishmentId: targetEstablishmentId,
      validatorDeviceId: deviceId,
      validationMode: 'ONLINE',
      decision: 'DENIED',
      reasonCode: 'CREDENCIAL_VENCIDA',
      credentialVersion: cred.credentialVersion,
      synchronizationStatus: 'SYNCED',
      professionalName: cred.professionalName,
    });

    return res.json({
      decision: 'DENIED',
      reasonCode: 'CREDENCIAL_VENCIDA',
      message: `La credencial ha vencido (${cred.expiresAt.slice(0, 10)}). Requiere renovación administrativa.`,
      accessEventId: event.id,
      timestamp: event.timestamp,
    });
  }

  // Check Suspended Professional
  if (prof && prof.status === 'SUSPENDED') {
    const event = serverStore.recordAccessEvent({
      professionalId: prof.id,
      credentialId: cred.id,
      authorizationId: cred.authorizationId,
      establishmentId: targetEstablishmentId,
      validatorDeviceId: deviceId,
      validationMode: 'ONLINE',
      decision: 'DENIED',
      reasonCode: 'PROFESIONAL_SUSPENDIDO',
      credentialVersion: cred.credentialVersion,
      synchronizationStatus: 'SYNCED',
      professionalName: `${prof.firstName} ${prof.lastName}`,
    });

    return res.json({
      decision: 'DENIED',
      reasonCode: 'PROFESIONAL_SUSPENDIDO',
      message: 'El profesional tiene el legajo preventivamente suspendido en el sistema SIFFA.',
      accessEventId: event.id,
      timestamp: event.timestamp,
    });
  }

  // 4b. FASE 2.3: VALIDACIÓN BLOQUEANTE DE REQUISITOS PREVIOS (prerequisites)
  if (prof) {
    const profPrereqs = Array.from(serverStore.prerequisites.values()).filter(
      (p) => p.professionalId === prof.id && (p.establishmentId === targetEstablishmentId || !p.establishmentId)
    );
    const blockedPrereq = profPrereqs.find(
      (p) => p.status !== 'cumplido' || (p.validUntil && p.validUntil < nowIso)
    );

    if (blockedPrereq) {
      const typeLabel = blockedPrereq.type.replace('_', ' ').toUpperCase();
      const event = serverStore.recordAccessEvent({
        professionalId: prof.id,
        credentialId: cred.id,
        authorizationId: cred.authorizationId,
        establishmentId: targetEstablishmentId,
        validatorDeviceId: deviceId,
        validationMode: 'ONLINE',
        decision: 'DENIED',
        eventType: 'CHECK_IN',
        reasonCode: 'REQUISITO_PREVIO_PENDIENTE',
        credentialVersion: cred.credentialVersion,
        synchronizationStatus: 'SYNCED',
        professionalName: `${prof.firstName} ${prof.lastName}`,
      });

      return res.json({
        decision: 'DENIED',
        reasonCode: 'REQUISITO_PREVIO_PENDIENTE',
        message: `Ingreso bloqueado por requisitos previos: '${typeLabel}' en estado ${blockedPrereq.status.toUpperCase()} para esta Unidad Penitenciaria.`,
        accessEventId: event.id,
        timestamp: event.timestamp,
      });
    }
  }

  // Check Authorization
  const auth = serverStore.authorizations.get(cred.authorizationId);
  const est = serverStore.establishments.get(targetEstablishmentId);

  if (auth && auth.establishmentId !== targetEstablishmentId) {
    const targetEst = serverStore.establishments.get(targetEstablishmentId);
    const event = serverStore.recordAccessEvent({
      professionalId: prof?.id || 'DESCONOCIDO',
      credentialId: cred.id,
      authorizationId: auth.id,
      establishmentId: targetEstablishmentId,
      validatorDeviceId: deviceId,
      validationMode: 'ONLINE',
      decision: 'DENIED',
      reasonCode: 'ESTABLECIMIENTO_NO_AUTORIZADO',
      credentialVersion: cred.credentialVersion,
      synchronizationStatus: 'SYNCED',
      professionalName: prof ? `${prof.firstName} ${prof.lastName}` : cred.professionalName,
      establishmentName: targetEst?.name,
    });

    return res.json({
      decision: 'DENIED',
      reasonCode: 'ESTABLECIMIENTO_NO_AUTORIZADO',
      message: `El profesional no está autorizado para ${targetEst?.name || targetEstablishmentId}. Su destino homologado es ${auth.establishmentName}.`,
      accessEventId: event.id,
      timestamp: event.timestamp,
    });
  }

  // VALIDATION SUCCESS
  const event = serverStore.recordAccessEvent({
    professionalId: prof?.id || cred.professionalId,
    credentialId: cred.id,
    authorizationId: auth?.id || 'N/A',
    establishmentId: targetEstablishmentId,
    validatorDeviceId: deviceId,
    validationMode: 'ONLINE',
    decision: 'ALLOWED',
    eventType: 'CHECK_IN',
    reasonCode: 'CREDENCIAL_VALIDA',
    credentialVersion: cred.credentialVersion,
    synchronizationStatus: 'SYNCED',
    professionalName: prof ? `${prof.firstName} ${prof.lastName}` : cred.professionalName,
    documentNumber: prof?.documentNumber,
    establishmentName: est?.name,
  });

  const isPhysical = cred.credentialType === 'PHYSICAL';
  const methodDescription = isPhysical
    ? 'Credencial Física · Token Fijo Validado en Tiempo Real'
    : 'Validación Manual por Padrón';

  return res.json({
    decision: 'ALLOWED',
    reasonCode: 'CREDENCIAL_VALIDA',
    message: `AUTORIZACIÓN PREVIA VIGENTE · Sujeto a control de la Unidad Penitenciaria (${methodDescription})`,
    accessEventId: event.id,
    timestamp: event.timestamp,
    credentialType: cred.credentialType || 'DIGITAL',
    staticTokenId: cred.staticTokenId,
    method: isPhysical ? 'QR_ESTATICO' : 'MANUAL',
    professional: prof ? {
      id: prof.id,
      fullName: `${prof.firstName} ${prof.lastName}`,
      documentNumber: prof.documentNumber,
      professionalRole: prof.professionalRole,
      matricula: prof.matricula,
      profilePhotoUrl: prof.profilePhotoUrl,
    } : {
      id: cred.professionalId,
      fullName: cred.professionalName || 'Profesional SIFFA',
      documentNumber: 'Verificado',
      professionalRole: cred.professionalRole || 'DOCENTE',
    },
    authorization: {
      id: auth?.id || 'AUTH-STD',
      purpose: auth?.purpose || 'Actividad Deportiva Institucional SIFFA',
      establishmentName: est?.name,
      validUntil: cred.expiresAt,
      timeWindow: auth ? `${auth.startTime} - ${auth.endTime}` : '08:00 - 18:00',
    },
  });
});

// 7c. CONFIRM & REGISTER OFFICIAL PENITENTIARY CHECK-IN
apiRouter.post('/validation/confirm-checkin', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  const { accessEventId, notes, method, establishmentId, professionalId, credentialId } = req.body;

  let profName = 'Profesional SIFFA';
  let docNumber = '';
  let estName = 'Unidad Penitenciaria SPB';
  let credId = credentialId || 'CRED-001';
  let pId = professionalId || 'PROF-01';
  let estId = establishmentId || 'EST-U33';
  let activityName = 'Taller Deportivo y Readaptación';

  if (accessEventId) {
    const matchedEvent = serverStore.accessEvents.find((e) => e.id === accessEventId);
    if (matchedEvent) {
      profName = matchedEvent.professionalName || profName;
      docNumber = matchedEvent.documentNumber || docNumber;
      credId = matchedEvent.credentialId;
      pId = matchedEvent.professionalId;
      estId = matchedEvent.establishmentId;
    }
  }

  const est = serverStore.establishments.get(estId);
  if (est) estName = est.name;

  const prof = serverStore.professionals.get(pId);
  if (prof) {
    profName = `${prof.firstName} ${prof.lastName}`;
    docNumber = prof.documentNumber;
  }

  const record = serverStore.recordCheckIn({
    professionalId: pId,
    professionalName: profName,
    documentNumber: docNumber,
    credentialId: credId,
    guardName: actor.displayName || 'Guardia de Acceso SPB',
    guardUserId: actor.uid,
    establishmentId: estId,
    establishmentName: estName,
    activity: activityName,
    result: 'ALLOWED',
    reasonCode: 'CREDENCIAL_VALIDA',
    method: (method === 'QR_ESTATICO' ? 'QR_ESTATICO' : method === 'MANUAL' ? 'MANUAL' : 'QR') as 'QR' | 'MANUAL' | 'QR_ESTATICO',
    notes: notes || 'Ingreso registrado formalmente en el puesto de guardia penitenciario.',
  });

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'RECORD_CHECKIN_ENTRY',
    entityType: 'CHECKIN_RECORD',
    entityId: record.validationId,
    result: 'SUCCESS',
    metadata: {
      professionalId: pId,
      professionalName: profName,
      establishmentId: estId,
      method: record.method,
    },
  });

  return res.status(201).json({
    success: true,
    checkInRecord: record,
    message: `Ingreso formal registrado para ${profName} en ${estName}. Registro de guardia: ${record.validationId}`,
  });
});

// 7d. GET CHECK-IN LOGS
apiRouter.get('/validation/checkins', (req: Request, res: Response) => {
  res.json(serverStore.checkInRecords);
});

// 7e. ACTIVITIES ENDPOINTS
apiRouter.get('/activities', (req: Request, res: Response) => {
  res.json(Array.from(serverStore.activities.values()));
});

apiRouter.post('/activities', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN_CREDENTIALS') {
    return res.status(403).json({ error: 'Permisos insuficientes para programar actividades' });
  }

  const { title, category, establishmentId, professionalId, schedule, pabellon, capacity } = req.body;
  if (!title || !establishmentId || !professionalId) {
    return res.status(400).json({ error: 'Título, establecimiento y profesional son obligatorios' });
  }

  const est = serverStore.establishments.get(establishmentId);
  const prof = serverStore.professionals.get(professionalId);

  const id = `ACT-${Date.now().toString().slice(-4)}`;
  const activity = {
    id,
    title,
    category: category || 'FUTBOL_11',
    establishmentId,
    establishmentName: est?.name || establishmentId,
    professionalId,
    professionalName: prof ? `${prof.firstName} ${prof.lastName}` : professionalId,
    schedule: schedule || 'Horario por coordinar',
    pabellon: pabellon || 'Sector Cancha / Pabellón Central',
    capacity: Number(capacity) || 20,
    enrolledCount: 0,
    status: 'ACTIVE' as const,
  };

  serverStore.activities.set(id, activity);

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'CREATE_ACTIVITY',
    entityType: 'ACTIVITY',
    entityId: id,
    result: 'SUCCESS',
    metadata: { title, establishmentId, professionalId },
  });

  return res.status(201).json(activity);
});

// 7f. RENEW CREDENTIAL
apiRouter.patch('/credentials/:id/renew', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN_CREDENTIALS') {
    return res.status(403).json({ error: 'No autorizado para renovar credenciales' });
  }

  const { id } = req.params;
  const cred = serverStore.credentials.get(id);
  if (!cred) return res.status(404).json({ error: 'Credencial no encontrada' });

  // Extend 1 year
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  cred.expiresAt = nextYear.toISOString();
  cred.status = 'ACTIVE';
  cred.credentialVersion += 1;
  cred.tokenId = `TOK-REN-${Date.now().toString().slice(-5)}`;
  serverStore.credentials.set(id, cred);

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'RENEW_CREDENTIAL',
    entityType: 'CREDENTIAL',
    entityId: id,
    result: 'SUCCESS',
    metadata: { newExpiresAt: cred.expiresAt, version: cred.credentialVersion },
  });

  return res.json(cred);
});

// -------------------------------------------------------------
// 8. OFFLINE PACKAGE GENERATION & BATCH SYNC
// -------------------------------------------------------------
apiRouter.get('/offline/package/:establishmentId', (req: Request, res: Response) => {
  const { establishmentId } = req.params;
  const est = serverStore.establishments.get(establishmentId);

  if (!est) {
    return res.status(404).json({ error: 'Establecimiento no encontrado' });
  }

  // Filter authorizations for this establishment
  const relevantAuths = Array.from(serverStore.authorizations.values()).filter(
    (a) => a.establishmentId === establishmentId && a.status === 'ACTIVE'
  );

  const relevantProfIds = new Set(relevantAuths.map((a) => a.professionalId));

  const relevantCreds = Array.from(serverStore.credentials.values())
    .filter((c) => relevantProfIds.has(c.professionalId))
    .map((c) => {
      const p = serverStore.professionals.get(c.professionalId);
      return {
        id: c.id,
        professionalId: c.professionalId,
        authorizationId: c.authorizationId,
        status: c.status,
        credentialVersion: c.credentialVersion,
        expiresAt: c.expiresAt,
        professionalName: p ? `${p.firstName} ${p.lastName}` : 'N/A',
        documentNumber: p ? p.documentNumber : '',
        professionalRole: p ? p.professionalRole : ('DOCENTE' as const),
      };
    });

  const revocationsList = Array.from(serverStore.credentials.values())
    .filter((c) => c.status === 'REVOKED')
    .map((c) => c.id);

  const now = Math.floor(Date.now() / 1000);
  const pkgData: Omit<OfflinePackage, 'signature'> = {
    establishmentId: est.id,
    establishmentName: est.name,
    packageVersion: Date.now(),
    generatedAt: now,
    expiresAt: now + 86400 * 2, // Valid offline for 48 hours
    credentials: relevantCreds,
    authorizations: relevantAuths.map((a) => ({
      id: a.id,
      professionalId: a.professionalId,
      establishmentId: a.establishmentId,
      validFrom: a.validFrom,
      validUntil: a.validUntil,
      allowedDays: a.allowedDays,
      startTime: a.startTime,
      endTime: a.endTime,
      status: a.status,
      purpose: a.purpose,
    })),
    revocations: revocationsList,
    keyId: cryptoService.getKeyId(),
    publicKeyHex: cryptoService.getPublicKeyRawHex(),
  };

  const signature = cryptoService.signOfflinePackage(pkgData);
  const signedPackage: OfflinePackage = {
    ...pkgData,
    signature,
  };

  return res.json(signedPackage);
});

apiRouter.post('/offline/sync', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  const { events } = req.body;

  if (!Array.isArray(events)) {
    return res.status(400).json({ error: 'Array de eventos requerido' });
  }

  const syncedEvents = events.map((evt) => {
    return serverStore.recordAccessEvent({
      professionalId: evt.professionalId || 'DESCONOCIDO',
      credentialId: evt.credentialId || 'N/A',
      authorizationId: evt.authorizationId || 'N/A',
      establishmentId: evt.establishmentId || 'EST-U33',
      validatorDeviceId: evt.validatorDeviceId || 'DEVICE-OFFLINE',
      validationMode: 'OFFLINE',
      decision: evt.decision || 'DENIED',
      reasonCode: evt.reasonCode || 'VALIDACION_OFFLINE',
      credentialVersion: evt.credentialVersion || 1,
      synchronizationStatus: 'SYNCED',
      professionalName: evt.professionalName,
      documentNumber: evt.documentNumber,
      establishmentName: evt.establishmentName,
    });
  });

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'SYNC_OFFLINE_EVENTS',
    entityType: 'ACCESS_EVENTS',
    entityId: `BATCH-${Date.now()}`,
    result: 'SUCCESS',
    metadata: { count: syncedEvents.length },
  });

  return res.json({
    syncedCount: syncedEvents.length,
    message: `${syncedEvents.length} eventos de acceso offline sincronizados con éxito`,
  });
});

// -------------------------------------------------------------
// 9. AUDIT & ACCESS LOGS
// -------------------------------------------------------------
apiRouter.get('/audit', (req: Request, res: Response) => {
  res.json({
    auditEvents: serverStore.auditEvents,
    accessEvents: serverStore.accessEvents,
  });
});

apiRouter.get('/access-events', (req: Request, res: Response) => {
  res.json(serverStore.accessEvents);
});

// -------------------------------------------------------------
// 10. GESTOR DE IMÁGENES DEL SITIO (ADMIN)
// -------------------------------------------------------------
apiRouter.get('/site-images', (req: Request, res: Response) => {
  const images: Record<string, string> = {};
  for (const [key, val] of serverStore.siteImages.entries()) {
    images[key] = val;
  }
  res.json(images);
});

apiRouter.post('/site-images', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  const { key, dataUrl, title } = req.body;

  if (!key || !dataUrl) {
    return res.status(400).json({ error: 'Parámetros key y dataUrl son requeridos' });
  }

  serverStore.siteImages.set(key, dataUrl);

  serverStore.recordAuditEvent({
    actorUserId: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'UPDATE_SITE_IMAGE',
    entityType: 'SITE_CONTENT',
    entityId: key,
    result: 'SUCCESS',
    metadata: { title: title || key, length: dataUrl.length },
  });

  res.json({ success: true, key, message: 'Imagen actualizada exitosamente' });
});

apiRouter.delete('/site-images/:key', (req: Request, res: Response) => {
  const actor = getActorFromReq(req);
  const key = decodeURIComponent(req.params.key);

  const existed = serverStore.siteImages.delete(key);

  if (existed) {
    serverStore.recordAuditEvent({
      actorUserId: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'RESET_SITE_IMAGE',
      entityType: 'SITE_CONTENT',
      entityId: key,
      result: 'SUCCESS',
    });
  }

  res.json({ success: true, key, message: 'Imagen restablecida a la original' });
});

// -------------------------------------------------------------
// 11. DESCARGA DEL CÓDIGO FUENTE (ZIP DEL PROYECTO)
// -------------------------------------------------------------
apiRouter.get('/download-zip', (req: Request, res: Response) => {
  try {
    const projectRoot = process.cwd();
    const zipPath = path.resolve(projectRoot, 'public', 'siffa-proyecto.zip');
    const scriptPath = path.resolve(projectRoot, 'scripts', 'build_zip.py');

    // Regenerate on demand to guarantee fresh content
    try {
      execSync(`python3 "${scriptPath}"`, { stdio: 'ignore' });
    } catch {
      // Continue if zip already exists
    }

    if (!fs.existsSync(zipPath)) {
      return res.status(500).json({ error: 'No se pudo generar el archivo ZIP del proyecto' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="siffa-proyecto.zip"');
    return res.sendFile(zipPath);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error al generar o descargar el archivo ZIP' });
  }
});


