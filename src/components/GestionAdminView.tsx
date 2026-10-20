import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SiffaLogo } from './SiffaLogo';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { PrintCredentialModal } from './PrintCredentialModal';
import {
  Professional,
  Establishment,
  Authorization,
  Credential,
  AuditEvent,
  FunctionalRole,
  Activity,
  NominaSubmission,
  Prerequisite,
  AuthorizedDevice,
  RoleType,
  TestUserProfile,
} from '../types';

export interface GestionAdminViewProps {
  initialSubTab?: 'perfiles' | 'profesionales' | 'nominas' | 'credenciales' | 'autorizaciones' | 'roles' | 'establecimientos' | 'actividades' | 'auditoria';
  onQuickLogin?: (email: string, role: RoleType) => void;
}

export const GestionAdminView: React.FC<GestionAdminViewProps> = ({
  initialSubTab = 'perfiles',
  onQuickLogin,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'perfiles' | 'profesionales' | 'nominas' | 'credenciales' | 'autorizaciones' | 'roles' | 'establecimientos' | 'actividades' | 'auditoria'
  >(initialSubTab || 'perfiles');

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [testUsers, setTestUsers] = useState<TestUserProfile[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [nominas, setNominas] = useState<NominaSubmission[]>([]);
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([]);
  const [devices, setDevices] = useState<AuthorizedDevice[]>([]);

  // Estado para impresión oficial de tarjeta física
  const [printCred, setPrintCred] = useState<Credential | null>(null);
  const [printProf, setPrintProf] = useState<Professional | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Search, filter, and passwords visibility states for test users
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('ALL');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Photo presets for SIFFA professionals
  const PHOTO_PRESETS = [
    { name: 'Lic. Marcela Giménez (Docente)', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80' },
    { name: 'Prof. Romina Albornoz (Técnica)', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80' },
    { name: 'Dra. Florencia Navarro (Psicología)', url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&auto=format&fit=crop&q=80' },
    { name: 'Sabrina Gómez (Árbitra)', url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80' },
    { name: 'Lic. Carla Benítez (Trabajo Social)', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80' },
    { name: 'Prof. Lucas Peralta (Prep. Físico)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
  ];

  // Forms states
  const [showCreateProfModal, setShowCreateProfModal] = useState(false);
  const [newProf, setNewProf] = useState({
    firstName: '',
    lastName: '',
    documentNumber: '',
    email: '',
    phone: '',
    professionalRole: 'DOCENTE' as FunctionalRole,
    matricula: '',
    specialty: '',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  });

  // State for Editing existing Professional (Admin only)
  const [showEditProfModal, setShowEditProfModal] = useState(false);
  const [editingProf, setEditingProf] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
    email: string;
    phone: string;
    professionalRole: FunctionalRole;
    matricula: string;
    specialty: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
    profilePhotoUrl: string;
  } | null>(null);

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showNotification('error', 'La imagen no debe superar los 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (isEditing && editingProf) {
        setEditingProf({ ...editingProf, profilePhotoUrl: dataUrl });
      } else {
        setNewProf({ ...newProf, profilePhotoUrl: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEditProf = (prof: Professional) => {
    setEditingProf({
      id: prof.id,
      firstName: prof.firstName,
      lastName: prof.lastName,
      documentNumber: prof.documentNumber,
      email: prof.email,
      phone: prof.phone || '',
      professionalRole: prof.professionalRole,
      matricula: prof.matricula || '',
      specialty: prof.specialty || '',
      status: prof.status,
      profilePhotoUrl: prof.profilePhotoUrl || PHOTO_PRESETS[0].url,
    });
    setShowEditProfModal(true);
  };

  const handleUpdateProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProf) return;
    try {
      await api.updateProfessional(editingProf.id, editingProf);
      
      // Sincronización directa en Firebase Firestore
      try {
        await setDoc(doc(db, 'professionals', editingProf.id), {
          ...editingProf,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (fErr) {
        console.warn('Firestore sync warning:', fErr);
      }

      showNotification('success', `Atributos y fotografía de ${editingProf.firstName} ${editingProf.lastName} actualizados exitosamente en la base de datos.`);
      setShowEditProfModal(false);
      setEditingProf(null);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al actualizar profesional');
    }
  };

  // ----------------- GESTIÓN DE PERFILES & USUARIOS DE PRUEBA -----------------
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<{
    originalEmail: string;
    email: string;
    displayName: string;
    firstName: string;
    lastName: string;
    role: RoleType;
    professionalRole: FunctionalRole;
    status: 'ACTIVE' | 'SUSPENDED';
    password: string;
    phone: string;
    documentNumber: string;
    matricula: string;
    specialty: string;
    establishmentId: string;
    profilePhotoUrl: string;
  } | null>(null);

  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: 'siffa2026',
    displayName: '',
    firstName: '',
    lastName: '',
    role: 'PROFESSIONAL' as RoleType,
    professionalRole: 'DOCENTE' as FunctionalRole,
    phone: '',
    documentNumber: '',
    matricula: '',
    specialty: '',
    establishmentId: '',
    profilePhotoUrl: PHOTO_PRESETS[0].url,
  });

  const handleOpenEditUser = (usr: TestUserProfile) => {
    setEditingUser({
      originalEmail: usr.email,
      email: usr.email,
      displayName: usr.displayName || `${usr.firstName} ${usr.lastName}`,
      firstName: usr.firstName,
      lastName: usr.lastName,
      role: usr.role,
      professionalRole: usr.professionalRole || (usr.role === 'SUPER_ADMIN' ? 'DIRECTIVO' : usr.role === 'VALIDATOR' ? 'INSTRUCTOR' : 'DOCENTE'),
      status: usr.status,
      password: usr.password || 'siffa2026',
      phone: usr.phone || '',
      documentNumber: usr.documentNumber || '',
      matricula: usr.matricula || '',
      specialty: usr.specialty || '',
      establishmentId: usr.establishmentId || '',
      profilePhotoUrl: usr.profilePhotoUrl || PHOTO_PRESETS[0].url,
    });
    setShowEditUserModal(true);
  };

  const handleUserImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showNotification('error', 'La imagen no debe superar los 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (isEditing && editingUser) {
        setEditingUser({ ...editingUser, profilePhotoUrl: dataUrl });
      } else {
        setNewUser({ ...newUser, profilePhotoUrl: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.updateUser(editingUser.originalEmail, {
        displayName: `${editingUser.firstName} ${editingUser.lastName}`.trim(),
        newEmail: editingUser.email,
        role: editingUser.role,
        status: editingUser.status,
        password: editingUser.password,
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        phone: editingUser.phone,
        documentNumber: editingUser.documentNumber,
        matricula: editingUser.matricula,
        specialty: editingUser.specialty,
        professionalRole: editingUser.professionalRole,
        profilePhotoUrl: editingUser.profilePhotoUrl,
        establishmentId: editingUser.establishmentId,
      });

      // Sincronización en Firebase Firestore (usuario y foto de carnet)
      try {
        const docId = encodeURIComponent(editingUser.email.toLowerCase()).replace(/%/g, '_');
        await setDoc(doc(db, 'users', docId), {
          displayName: `${editingUser.firstName} ${editingUser.lastName}`.trim(),
          email: editingUser.email,
          role: editingUser.role,
          status: editingUser.status,
          profilePhotoUrl: editingUser.profilePhotoUrl,
          professionalRole: editingUser.professionalRole,
          phone: editingUser.phone,
          documentNumber: editingUser.documentNumber,
          matricula: editingUser.matricula,
          specialty: editingUser.specialty,
          establishmentId: editingUser.establishmentId,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (fErr) {
        console.warn('Firestore user sync warning:', fErr);
      }

      showNotification('success', `Perfil de ${editingUser.firstName} ${editingUser.lastName} actualizado exitosamente.`);
      setShowEditUserModal(false);
      setEditingUser(null);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al actualizar perfil');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({
        displayName: `${newUser.firstName} ${newUser.lastName}`.trim(),
        email: newUser.email,
        role: newUser.role,
        password: newUser.password,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        documentNumber: newUser.documentNumber,
        matricula: newUser.matricula,
        specialty: newUser.specialty,
        professionalRole: newUser.professionalRole,
        profilePhotoUrl: newUser.profilePhotoUrl,
        establishmentId: newUser.establishmentId,
      });

      // Sincronización en Firebase Firestore
      try {
        const docId = encodeURIComponent(newUser.email.toLowerCase()).replace(/%/g, '_');
        await setDoc(doc(db, 'users', docId), {
          displayName: `${newUser.firstName} ${newUser.lastName}`.trim(),
          email: newUser.email,
          role: newUser.role,
          status: 'ACTIVE',
          profilePhotoUrl: newUser.profilePhotoUrl,
          professionalRole: newUser.professionalRole,
          phone: newUser.phone,
          documentNumber: newUser.documentNumber,
          matricula: newUser.matricula,
          specialty: newUser.specialty,
          establishmentId: newUser.establishmentId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (fErr) {
        console.warn('Firestore user create sync warning:', fErr);
      }

      showNotification('success', `Perfil de ${newUser.firstName} ${newUser.lastName} creado exitosamente.`);
      setShowCreateUserModal(false);
      setNewUser({
        email: '',
        password: 'siffa2026',
        displayName: '',
        firstName: '',
        lastName: '',
        role: 'PROFESSIONAL',
        professionalRole: 'DOCENTE',
        phone: '',
        documentNumber: '',
        matricula: '',
        specialty: '',
        establishmentId: '',
        profilePhotoUrl: PHOTO_PRESETS[0].url,
      });
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al crear perfil');
    }
  };

  const handleToggleUserStatus = async (user: TestUserProfile) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.updateUser(user.email, { status: nextStatus });
      showNotification('success', `Estado de ${user.displayName} actualizado a ${nextStatus}.`);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al cambiar estado');
    }
  };

  const [showCreateAuthModal, setShowCreateAuthModal] = useState(false);
  const [newAuth, setNewAuth] = useState({
    professionalId: '',
    establishmentId: '',
    purpose: 'Taller de Formación Deportiva y Readaptación',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '2026-12-31',
    startTime: '08:00',
    endTime: '18:00',
    allowedDays: [1, 2, 3, 4, 5],
  });

  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedCredForRevoke, setSelectedCredForRevoke] = useState<string>('');
  const [revokeReason, setRevokeReason] = useState<string>('');

  // FASE 2: Nóminas, Prerrequisitos y Dispositivos states
  const [showCreateNominaModal, setShowCreateNominaModal] = useState(false);
  const [newNominaEstId, setNewNominaEstId] = useState('');
  const [selectedProfIdsForNomina, setSelectedProfIdsForNomina] = useState<string[]>([]);
  const [newNominaObs, setNewNominaObs] = useState('');

  const [showReviewNominaModal, setShowReviewNominaModal] = useState(false);
  const [selectedNominaForReview, setSelectedNominaForReview] = useState<NominaSubmission | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'aprobada' | 'rechazada' | 'parcial'>('aprobada');
  const [reviewObs, setReviewObs] = useState('');

  const [showCreatePrereqModal, setShowCreatePrereqModal] = useState(false);
  const [newPrereq, setNewPrereq] = useState({
    professionalId: '',
    establishmentId: '',
    type: 'seguro' as any,
    status: 'cumplido' as any,
    validUntil: '2026-12-31',
    documentUrl: '',
  });

  const [showCreateDeviceModal, setShowCreateDeviceModal] = useState(false);
  const [newDevice, setNewDevice] = useState({
    deviceId: '',
    establishmentId: '',
    validUntil: '2027-12-31',
    status: 'activo' as any,
  });

  // FASE 3: Credencial Física Impresa (Modal y PDF preview)
  const [selectedPhysicalCred, setSelectedPhysicalCred] = useState<any | null>(null);
  const [loadingPhysicalCred, setLoadingPhysicalCred] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [pros, ests, auths, creds, audits, acts, noms, prereqs, devs, usrList] = await Promise.all([
        api.getProfessionals(),
        api.getEstablishments(),
        api.getAuthorizations(),
        api.getCredentials(),
        api.getAuditEvents(),
        api.getActivities(),
        api.getNominas(),
        api.getPrerequisites(),
        api.getAuthorizedDevices(),
        api.getUsers(),
      ]);
      setProfessionals(pros);
      setEstablishments(ests);
      setAuthorizations(auths);
      setCredentials(creds);
      setAuditEvents(audits);
      setActivities(acts);
      setNominas(noms);
      setPrerequisites(prereqs);
      setDevices(devs);
      setTestUsers(usrList);
      if (pros.length > 0 && !newAuth.professionalId) {
        setNewAuth((prev) => ({ ...prev, professionalId: pros[0].id }));
      }
      if (ests.length > 0 && !newAuth.establishmentId) {
        setNewAuth((prev) => ({ ...prev, establishmentId: ests[0].id }));
        setNewNominaEstId(ests[0].id);
        setNewPrereq((prev) => ({ ...prev, establishmentId: ests[0].id }));
        setNewDevice((prev) => ({ ...prev, establishmentId: ests[0].id }));
      }
      if (pros.length > 0 && !newPrereq.professionalId) {
        setNewPrereq((prev) => ({ ...prev, professionalId: pros[0].id }));
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Error al conectar con la base de datos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // 1. Create Professional
  const handleCreateProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProfessional(newProf);
      showNotification('success', `Profesional ${newProf.firstName} ${newProf.lastName} registrado exitosamente.`);
      setShowCreateProfModal(false);
      setNewProf({
        firstName: '',
        lastName: '',
        documentNumber: '',
        email: '',
        phone: '',
        professionalRole: 'DOCENTE',
        matricula: '',
        specialty: '',
        profilePhotoUrl: PHOTO_PRESETS[0].url,
      });
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al crear profesional');
    }
  };

  // Toggle Professional Status
  const handleToggleProfStatus = async (prof: Professional) => {
    const nextStatus = prof.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.updateProfessionalStatus(prof.id, nextStatus);
      showNotification('success', `Estado de ${prof.firstName} ${prof.lastName} actualizado a ${nextStatus}.`);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al cambiar estado');
    }
  };

  // 2. Create Contextual Authorization
  const handleCreateAuthorization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAuthorization(newAuth);
      showNotification('success', 'Autorización contextual emitida y firmada.');
      setShowCreateAuthModal(false);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al crear autorización');
    }
  };

  // 3. Issue Credential (FASE 3: Digital o Física)
  const handleIssueCredential = async (auth: Authorization, type: 'DIGITAL' | 'PHYSICAL' = 'DIGITAL') => {
    try {
      await api.issueCredential(auth.professionalId, auth.id, type);
      showNotification(
        'success',
        `Credencial ${type === 'PHYSICAL' ? 'física (carnet PVC con QR fijo)' : 'digital (móvil)'} emitida para ${auth.professionalName}.`
      );
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al emitir credencial');
    }
  };

  const handleOpenPhysicalCred = async (credId: string) => {
    setLoadingPhysicalCred(true);
    try {
      const data = await api.getPhysicalCredential(credId);
      setSelectedPhysicalCred(data);
    } catch (err: any) {
      showNotification('error', err.message || 'Error al obtener datos de la credencial física');
    } finally {
      setLoadingPhysicalCred(false);
    }
  };

  // Revoke Credential
  const handleConfirmRevoke = async () => {
    if (!selectedCredForRevoke || !revokeReason.trim()) {
      alert('Por favor especifique el motivo institucional de revocación');
      return;
    }
    try {
      await api.revokeCredential(selectedCredForRevoke, revokeReason.trim());
      showNotification('success', `Credencial ${selectedCredForRevoke} revocada formalmente.`);
      setShowRevokeModal(false);
      setRevokeReason('');
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al revocar credencial');
    }
  };

  // Renew Credential
  const handleRenewCredential = async (credId: string) => {
    try {
      await api.renewCredential(credId);
      showNotification('success', `Credencial ${credId} renovada exitosamente por 1 período adicional.`);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al renovar credencial');
    }
  };

  // Abrir vista de impresión de credencial física ISO/IEC 7810 ID-1
  const handlePrintCard = (cred: Credential) => {
    const personId = cred.personId || cred.professionalId;
    const prof = professionals.find((p) => p.id === personId) || null;
    setPrintCred(cred);
    setPrintProf(prof);
    setIsPrintModalOpen(true);
  };

  // Suspender credencial
  const handleSuspendCredential = async (credId: string) => {
    const reason = window.prompt('Motivo de la suspensión preventiva:') || 'Suspensión preventiva administrativa';
    try {
      await api.suspendCredential(credId, reason);
      showNotification('success', `Credencial ${credId} suspendida preventivamente.`);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al suspender credencial');
    }
  };

  // Marcar como perdida (DENUNCIADA_PERDIDA)
  const handleMarkLostCredential = async (credId: string) => {
    const confirmed = window.confirm(
      `¿Confirmar denuncia de pérdida o extravío para la credencial ${credId}? El código QR se revocará de inmediato y no podrá ser utilizado.`
    );
    if (!confirmed) return;

    try {
      await api.markCredentialLost(credId, 'Denuncia de extravío / pérdida de tarjeta física');
      showNotification('success', `Credencial ${credId} marcada como perdida. Token QR revocado.`);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al registrar extravío');
    }
  };

  // Reimprimir credencial (Genera un nuevo qrToken y revoca el anterior de inmediato)
  const handleReprintCredential = async (credId: string) => {
    const confirmed = window.confirm(
      `¿Reimprimir credencial ${credId}? Se generará un nuevo QR token criptográfico seguro y se revocará inmediatamente el anterior.`
    );
    if (!confirmed) return;

    try {
      const res = await api.reprintCredential(credId);
      showNotification(
        'success',
        `Credencial reimpresa exitosamente. Nuevo QR token emitido (versión ${res.credential?.qrTokenVersion || 2}).`
      );
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al reimprimir credencial');
    }
  };

  // 4. FASE 2: Nóminas Handlers
  const handleCreateNomina = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProfIdsForNomina.length === 0) {
      showNotification('error', 'Debe seleccionar al menos un profesional para incluir en la nómina.');
      return;
    }
    const selectedPros = professionals
      .filter((p) => selectedProfIdsForNomina.includes(p.id))
      .map((p) => ({
        professionalId: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        documentNumber: p.documentNumber,
        role: p.professionalRole,
      }));

    try {
      await api.createNomina({
        establishmentId: newNominaEstId || establishments[0]?.id,
        professionals: selectedPros,
        observations: newNominaObs.trim(),
      });
      showNotification('success', 'Nómina previa enviada formalmente a la Unidad Penitenciaria.');
      setShowCreateNominaModal(false);
      setSelectedProfIdsForNomina([]);
      setNewNominaObs('');
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al enviar nómina');
    }
  };

  const handleReviewNominaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNominaForReview) return;
    try {
      await api.reviewNomina(selectedNominaForReview.id, {
        status: reviewDecision,
        observations: reviewObs.trim(),
      });
      showNotification('success', `Nómina ${selectedNominaForReview.id} evaluada como '${reviewDecision.toUpperCase()}'. Autorizaciones actualizadas.`);
      setShowReviewNominaModal(false);
      setSelectedNominaForReview(null);
      setReviewObs('');
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al evaluar nómina');
    }
  };

  // 5. Prerequisites Handlers
  const handleCreatePrereq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPrerequisite(newPrereq);
      showNotification('success', 'Requisito previo registrado exitosamente.');
      setShowCreatePrereqModal(false);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al crear requisito');
    }
  };

  const handleTogglePrereqStatus = async (prereq: Prerequisite) => {
    const nextStatus = prereq.status === 'cumplido' ? 'vencido' : 'cumplido';
    try {
      await api.updatePrerequisiteStatus(prereq.id, nextStatus);
      showNotification('success', `Requisito ${prereq.type} actualizado a '${nextStatus}'.`);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al actualizar requisito');
    }
  };

  // 6. Devices Handlers
  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAuthorizedDevice(newDevice);
      showNotification('success', `Dispositivo ${newDevice.deviceId} autorizado exitosamente.`);
      setShowCreateDeviceModal(false);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al registrar dispositivo');
    }
  };

  const handleToggleDeviceStatus = async (dev: AuthorizedDevice) => {
    const nextStatus = dev.status === 'activo' ? 'revocado' : 'activo';
    try {
      await api.updateAuthorizedDeviceStatus(dev.id, nextStatus);
      showNotification('success', `Dispositivo ${dev.deviceId} actualizado a '${nextStatus}'.`);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al actualizar dispositivo');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Institucional de Administración */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <SiffaLogo size="md" />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <i className="fa-solid fa-lock text-emerald-400"></i>
              <span>Administración de Identidad Institucional · SIFFA Central</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Gestión de Profesionales, Pases y Seguridad
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Control de acceso basado en roles (RBAC) y autorizaciones contextuales para establecimientos penitenciarios.
            </p>
          </div>
        </div>

        {/* Botón de Refresco de Datos */}
        <button
          onClick={loadAllData}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          <i className={`fa-solid fa-arrows-rotate text-emerald-600 ${loading ? 'fa-spin' : ''}`}></i>
          <span>Actualizar Datos</span>
        </button>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
              : 'bg-rose-50 text-rose-800 border border-rose-300'
          }`}
        >
          <i
            className={`fa-solid ${
              feedbackMsg.type === 'success' ? 'fa-circle-check text-emerald-600' : 'fa-triangle-exclamation text-rose-600'
            }`}
          ></i>
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Tabs de Gestión */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('perfiles')}
          className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'perfiles'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <i className="fa-solid fa-users-viewfinder text-purple-600"></i>
          <span className="font-extrabold text-slate-900">Perfiles de Prueba ({testUsers.length})</span>
          <span className="bg-purple-100 text-purple-800 text-[9px] px-1.5 py-0.2 rounded-full font-black">Admin</span>
        </button>

        <button
          onClick={() => setActiveSubTab('profesionales')}
          className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'profesionales'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <i className="fa-solid fa-users"></i>
          <span>Profesionales ({professionals.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('nominas')}
          className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'nominas'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <i className="fa-solid fa-file-contract text-amber-600"></i>
          <span className="font-extrabold text-slate-900">Nóminas SPB ({nominas.length})</span>
          <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded-full font-black">Fase 2</span>
        </button>

        <button
          onClick={() => setActiveSubTab('autorizaciones')}
          className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'autorizaciones'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <i className="fa-solid fa-file-signature"></i>
          <span>Autorizaciones Contextuales ({authorizations.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('credenciales')}
          className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'credenciales'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <i className="fa-solid fa-id-badge"></i>
          <span>Credenciales ({credentials.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('roles')}
          className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'roles'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <i className="fa-solid fa-user-shield"></i>
          <span>Roles y Permisos</span>
        </button>

        <button
          onClick={() => setActiveSubTab('establecimientos')}
          className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'establecimientos'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <i className="fa-solid fa-building-shield"></i>
          <span>Establecimientos ({establishments.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('actividades')}
          className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'actividades'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <i className="fa-solid fa-calendar-check"></i>
          <span>Actividades ({activities.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('auditoria')}
          className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'auditoria'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <i className="fa-solid fa-clipboard-list"></i>
          <span>Auditoría ({auditEvents.length})</span>
        </button>
      </div>

      {/* ----------------- SUBTAB 0: PERFILES DE PRUEBA & PADRÓN CENTRAL ----------------- */}
      {activeSubTab === 'perfiles' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header del Subtab */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#001738] to-[#002b66] text-white p-6 rounded-3xl shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-black uppercase tracking-wider">
                  Panel de Control Administrador
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-emerald-400 font-bold text-xs">Padrón de Acceso Activo</span>
              </div>
              <h3 className="text-2xl font-black text-white">
                Perfiles Institucionales y Cuentas de Prueba
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Aquí figuran todos los perfiles creados para testing y validación de la plataforma SIFFA. Puedes modificar sus datos personales, contraseñas de acceso, roles, matrículas o fotografías, o iniciar sesión inmediatamente como cualquiera de ellos.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
              <button
                onClick={() => loadAllData()}
                disabled={loading}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer border border-white/10"
                title="Actualizar datos desde el servidor"
              >
                <i className={`fa-solid fa-rotate ${loading ? 'animate-spin' : ''}`}></i>
                <span className="hidden sm:inline">Actualizar</span>
              </button>

              <button
                onClick={() => setShowCreateUserModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg"
              >
                <i className="fa-solid fa-user-plus text-xs"></i>
                <span>Nuevo Perfil de Prueba</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Cuentas</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{testUsers.length}</span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Perfiles en memoria</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Administradores</span>
              <span className="text-2xl font-black text-purple-700 mt-1 block">
                {testUsers.filter(u => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN_CREDENTIALS').length}
              </span>
              <span className="text-[10px] text-purple-600 font-semibold mt-0.5 block">Acceso integral</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Docentes / Técnicos</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {testUsers.filter(u => u.role === 'PROFESSIONAL').length}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Cuerpo Formativo</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Guardias Garita SPB</span>
              <span className="text-2xl font-black text-sky-700 mt-1 block">
                {testUsers.filter(u => u.role === 'VALIDATOR').length}
              </span>
              <span className="text-[10px] text-sky-600 font-semibold mt-0.5 block">Control de Ingresos</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado Activo</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {testUsers.filter(u => u.status === 'ACTIVE').length} / {testUsers.length}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Habilitados</span>
            </div>
          </div>

          {/* Filtros y Buscador */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                placeholder="Buscar por nombre, email, DNI, matrícula o especialidad..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-purple-400 focus:bg-white transition-all"
              />
              {userSearchTerm && (
                <button
                  onClick={() => setUserSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-hidden focus:border-purple-400"
              >
                <option value="ALL">Todos los Roles</option>
                <option value="SUPER_ADMIN">Super Administrador</option>
                <option value="PROFESSIONAL">Docente / Técnico</option>
                <option value="VALIDATOR">Guardia Garita SPB</option>
                <option value="INSTITUTIONAL_MANAGER">Dirección SIFFA</option>
                <option value="AUDITOR">Auditoría</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-hidden focus:border-purple-400"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="ACTIVE">Solo Activos</option>
                <option value="SUSPENDED">Solo Suspendidos</option>
              </select>
            </div>
          </div>

          {/* Tabla de Perfiles */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                    <th className="p-4">Perfil / Integrante</th>
                    <th className="p-4">Rol en Plataforma</th>
                    <th className="p-4">DNI / Matrícula</th>
                    <th className="p-4">Especialidad & Unidad</th>
                    <th className="p-4">Contraseña de Prueba</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones de Administrador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {testUsers
                    .filter((u) => {
                      const search = userSearchTerm.toLowerCase();
                      const matchesSearch =
                        !userSearchTerm ||
                        u.displayName?.toLowerCase().includes(search) ||
                        u.email?.toLowerCase().includes(search) ||
                        u.firstName?.toLowerCase().includes(search) ||
                        u.lastName?.toLowerCase().includes(search) ||
                        u.documentNumber?.toLowerCase().includes(search) ||
                        u.matricula?.toLowerCase().includes(search) ||
                        u.specialty?.toLowerCase().includes(search);
                      const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
                      const matchesStatus = userStatusFilter === 'ALL' || u.status === userStatusFilter;
                      return matchesSearch && matchesRole && matchesStatus;
                    })
                    .map((user) => {
                      const isPwdVisible = showPasswords[user.email];
                      return (
                        <tr key={user.email} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. Foto y Nombre */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="relative group shrink-0">
                                {user.profilePhotoUrl ? (
                                  <img
                                    src={user.profilePhotoUrl}
                                    alt={user.displayName}
                                    className="w-11 h-11 rounded-xl object-cover border-2 border-slate-200 shadow-xs"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-xl bg-[#001738] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                    {user.firstName?.charAt(0) || user.displayName?.charAt(0) || 'U'}
                                  </div>
                                )}
                                <button
                                  onClick={() => handleOpenEditUser(user)}
                                  className="absolute inset-0 bg-slate-900/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer text-xs"
                                  title="Cambiar foto de este perfil"
                                >
                                  <i className="fa-solid fa-camera"></i>
                                </button>
                              </div>

                              <div className="min-w-0">
                                <strong className="text-slate-900 block font-bold text-sm truncate">
                                  {user.displayName || `${user.firstName} ${user.lastName}`}
                                </strong>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                  <span className="truncate">{user.email}</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard?.writeText(user.email);
                                      showNotification('success', `Email copiado: ${user.email}`);
                                    }}
                                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                    title="Copiar email"
                                  >
                                    <i className="fa-regular fa-copy text-[10px]"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Rol */}
                          <td className="p-4">
                            {user.role === 'SUPER_ADMIN' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                                <i className="fa-solid fa-crown text-[9px] text-purple-600"></i>
                                Super Admin
                              </span>
                            ) : user.role === 'VALIDATOR' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-200">
                                <i className="fa-solid fa-shield-halved text-[9px] text-sky-600"></i>
                                Guardia SPB
                              </span>
                            ) : user.role === 'INSTITUTIONAL_MANAGER' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                <i className="fa-solid fa-building-columns text-[9px] text-amber-600"></i>
                                Dirección SIFFA
                              </span>
                            ) : user.role === 'AUDITOR' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                                <i className="fa-solid fa-clipboard-check text-[9px] text-indigo-600"></i>
                                Auditor Forense
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <i className="fa-solid fa-user-check text-[9px] text-emerald-600"></i>
                                Docente SIFFA
                              </span>
                            )}
                            <span className="block text-[10px] text-slate-400 mt-1 font-mono">
                              {user.professionalRole || 'INTEGRANTE'}
                            </span>
                          </td>

                          {/* 3. DNI / Matrícula */}
                          <td className="p-4 font-mono text-[11px]">
                            <div className="text-slate-800 font-bold">
                              DNI: {user.documentNumber || '—'}
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {user.matricula || 'SIFFA-OFICIAL'}
                            </span>
                          </td>

                          {/* 4. Especialidad & Unidad */}
                          <td className="p-4 text-slate-600 text-xs">
                            <span className="font-semibold text-slate-800 block truncate max-w-[200px]">
                              {user.specialty || 'Capacitación deportiva'}
                            </span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <i className="fa-solid fa-location-dot text-slate-400 text-[9px]"></i>
                              {user.establishmentName || 'Unidad asignada'}
                            </span>
                          </td>

                          {/* 5. Contraseña de prueba */}
                          <td className="p-4 font-mono text-xs">
                            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 w-fit">
                              <span className="font-bold text-slate-800">
                                {isPwdVisible ? user.password || 'siffa2026' : '••••••••'}
                              </span>
                              <button
                                onClick={() =>
                                  setShowPasswords((prev) => ({
                                    ...prev,
                                    [user.email]: !prev[user.email],
                                  }))
                                }
                                className="text-slate-400 hover:text-slate-700 cursor-pointer text-[10px] ml-1"
                                title={isPwdVisible ? 'Ocultar contraseña' : 'Ver contraseña'}
                              >
                                <i className={`fa-solid ${isPwdVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard?.writeText(user.password || 'siffa2026');
                                  showNotification('success', `Contraseña copiada: ${user.password || 'siffa2026'}`);
                                }}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer text-[10px]"
                                title="Copiar contraseña"
                              >
                                <i className="fa-regular fa-copy"></i>
                              </button>
                            </div>
                          </td>

                          {/* 6. Estado */}
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                user.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {user.status === 'ACTIVE' ? 'ACTIVO' : 'SUSPENDIDO'}
                            </span>
                          </td>

                          {/* 7. Acciones */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botón Modificar Perfil */}
                              <button
                                onClick={() => handleOpenEditUser(user)}
                                className="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-102"
                                title="Modificar datos, rol, contraseña y fotografía de este perfil"
                              >
                                <i className="fa-solid fa-pen text-[10px]"></i>
                                <span>Modificar</span>
                              </button>

                              {/* Botón Probar Sesión con un clic */}
                              {onQuickLogin && (
                                <button
                                  onClick={() => onQuickLogin(user.email, user.role)}
                                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title={`Iniciar sesión como ${user.displayName} para probar sus permisos y vistas`}
                                >
                                  <i className="fa-solid fa-right-to-bracket text-[10px] text-emerald-400"></i>
                                  <span className="hidden xl:inline">Probar Sesión</span>
                                </button>
                              )}

                              {/* Toggle Estado */}
                              <button
                                onClick={() => handleToggleUserStatus(user)}
                                className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                  user.status === 'ACTIVE'
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                                title={user.status === 'ACTIVE' ? 'Suspender cuenta' : 'Activar cuenta'}
                              >
                                <i className={`fa-solid ${user.status === 'ACTIVE' ? 'fa-ban' : 'fa-check'} text-[10px]`}></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUBTAB 1: PROFESIONALES ----------------- */}
      {activeSubTab === 'profesionales' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Padrón oficial de docentes, directivos e instructores con legajo penitenciario.
            </p>
            <button
              onClick={() => setShowCreateProfModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <i className="fa-solid fa-user-plus"></i>
              <span>Alta de Profesional</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 uppercase font-mono">
                    <th className="p-4">Profesional</th>
                    <th className="p-4">DNI / Matrícula</th>
                    <th className="p-4">Rol Funcional</th>
                    <th className="p-4">Especialidad</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {professionals.map((prof) => (
                    <tr key={prof.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        {prof.profilePhotoUrl ? (
                          <img
                            src={prof.profilePhotoUrl}
                            alt={prof.firstName}
                            className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-400 shrink-0 shadow-xs"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <div className="w-10 h-10 rounded-xl bg-[#001738] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {prof.firstName.charAt(0)}{prof.lastName.charAt(0)}
                        </div>
                        <div>
                          <strong className="text-slate-900 block font-bold text-sm">
                            {prof.firstName} {prof.lastName}
                          </strong>
                          <span className="text-[11px] text-slate-500">{prof.email}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[11px]">
                        <div>DNI: <strong className="text-slate-800">{prof.documentNumber}</strong></div>
                        <span className="text-[10px] text-slate-400">{prof.matricula}</span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[10px]">
                          {prof.professionalRole}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 text-xs">
                        {prof.specialty}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            prof.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {prof.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditProf(prof)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Editar atributos y foto del perfil"
                          >
                            <i className="fa-solid fa-pen text-emerald-600 text-[10px]"></i>
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleToggleProfStatus(prof)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              prof.status === 'ACTIVE'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {prof.status === 'ACTIVE' ? 'Suspender' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUBTAB 1.5: FASE 2 - NÓMINAS & CIRCUITO PENITENCIARIO ----------------- */}
      {activeSubTab === 'nominas' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Banner Normativo Legal */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-6 shadow-xs space-y-2">
            <div className="flex items-center gap-2.5 text-amber-950 font-black text-sm uppercase tracking-wider">
              <i className="fa-solid fa-scale-balanced text-amber-700 text-lg"></i>
              <span>Circuito Institucional: Propuesta de Nómina SIFFA → Aprobación por Unidad Penal</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              <strong>Regla Legal No Negociable:</strong> La presentación de la nómina previa por parte de SIFFA formaliza a los profesionales asignados. 
              <strong> La emisión de credencial NO habilita el ingreso automático</strong>. La autorización de acceso depende siempre de la resolución previa y soberana de la autoridad penitenciaria de cada Unidad (Ley 24.660).
            </p>
          </div>

          {/* 1. SECCIÓN PRINCIPAL: NÓMINAS ENVIADAS A UNIDADES */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                  Requisito Previo de Acceso Penitenciario
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Nóminas Oficiales Presentadas ({nominas.length})
                </h3>
              </div>

              <button
                onClick={() => {
                  setSelectedProfIdsForNomina([]);
                  setNewNominaObs('');
                  setShowCreateNominaModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md self-start sm:self-auto"
              >
                <i className="fa-solid fa-paper-plane text-white text-xs"></i>
                <span>Presentar Nueva Nómina a Unidad</span>
              </button>
            </div>

            {/* Listado de Nóminas */}
            <div className="grid grid-cols-1 gap-4">
              {nominas.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                  No hay nóminas presentadas actualmente.
                </div>
              ) : (
                nominas.map((nom) => (
                  <div
                    key={nom.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-amber-300 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-xs bg-slate-900 text-amber-400 px-3 py-1 rounded-xl">
                          {nom.id}
                        </span>
                        <div>
                          <h4 className="font-black text-slate-900 text-base leading-snug">
                            {nom.establishmentName}
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            Presentada por: <strong>{nom.submittedByUserName}</strong> · {new Date(nom.submittedAt).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            nom.status === 'aprobada'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : nom.status === 'enviada'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : nom.status === 'parcial'
                              ? 'bg-sky-100 text-sky-800 border-sky-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {nom.status === 'aprobada' && <i className="fa-solid fa-circle-check mr-1.5 text-emerald-600"></i>}
                          {nom.status === 'enviada' && <i className="fa-solid fa-clock mr-1.5 text-amber-600"></i>}
                          {nom.status === 'rechazada' && <i className="fa-solid fa-ban mr-1.5 text-rose-600"></i>}
                          {nom.status === 'parcial' && <i className="fa-solid fa-circle-notch mr-1.5 text-sky-600"></i>}
                          {nom.status.toUpperCase()}
                        </span>

                        <button
                          onClick={() => {
                            setSelectedNominaForReview(nom);
                            setReviewDecision(nom.status === 'enviada' ? 'aprobada' : (nom.status as any));
                            setReviewObs(nom.observations || '');
                            setShowReviewNominaModal(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <i className="fa-solid fa-gavel text-slate-500 mr-1"></i>
                          <span>Evaluar (Autoridad SPB)</span>
                        </button>
                      </div>
                    </div>

                    {/* Lista de Profesionales en la Nómina */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Integrantes incluidos en esta propuesta ({nom.professionals.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {nom.professionals.map((p, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {p.firstName} {p.lastName}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500">
                                DNI: {p.documentNumber}
                              </span>
                            </div>
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                              {p.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Observaciones y dictamen de la Unidad */}
                    {nom.observations && (
                      <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2">
                        <i className="fa-solid fa-message text-amber-700 text-xs mt-0.5 shrink-0"></i>
                        <div>
                          <strong className="block text-[11px] font-bold">Observaciones / Disposición Penitenciaria:</strong>
                          <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">{nom.observations}</p>
                          {nom.approvedByUserName && (
                            <span className="text-[10px] text-amber-800/80 font-mono block mt-1">
                              Dictaminado por: {nom.approvedByUserName} ({nom.approvedAt ? new Date(nom.approvedAt).toLocaleDateString('es-AR') : ''})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2. SUB-SECCIÓN: REQUISITOS PREVIOS BLOQUEANTES (PREREQUISITES) */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-sky-700 uppercase tracking-wider block">
                  Regla 2.3: Validación Bloqueante
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Requisitos Previos Obligatorios ({prerequisites.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Seguros ART, acuerdos de confidencialidad y capacitaciones penitenciarias. Si alguno está vencido o pendiente, el ingreso en garita se bloquea automáticamente.
                </p>
              </div>

              <button
                onClick={() => setShowCreatePrereqModal(true)}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <i className="fa-solid fa-plus"></i>
                <span>+ Nuevo Requisito Previo</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 uppercase font-mono">
                      <th className="p-3.5">Profesional</th>
                      <th className="p-3.5">Unidad</th>
                      <th className="p-3.5">Tipo de Requisito</th>
                      <th className="p-3.5">Vigencia</th>
                      <th className="p-3.5">Estado</th>
                      <th className="p-3.5 text-right">Acción (Prueba)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prerequisites.map((prq) => (
                      <tr key={prq.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{prq.professionalName}</td>
                        <td className="p-3.5 text-slate-600">{prq.establishmentName}</td>
                        <td className="p-3.5 font-mono uppercase text-slate-800 font-bold">
                          {prq.type.replace('_', ' ')}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                          {prq.validUntil ? prq.validUntil.slice(0, 10) : 'Permanente'}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              prq.status === 'cumplido'
                                ? 'bg-emerald-100 text-emerald-800'
                                : prq.status === 'vencido'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {prq.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleTogglePrereqStatus(prq)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
                            title="Alternar estado entre cumplido y vencido para pruebas de bloqueo"
                          >
                            Alternar ({prq.status === 'cumplido' ? 'Vencer' : 'Cumplir'})
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 3. SUB-SECCIÓN: DISPOSITIVOS AUTORIZADOS DE GARITA (AUTHORIZED DEVICES) */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">
                  Regla 2.4: Seguridad de Puestos
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Dispositivos de Garita Autorizados ({devices.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Solo los dispositivos registrados con estado &apos;activo&apos; pueden emitir validaciones de acceso en garita.
                </p>
              </div>

              <button
                onClick={() => setShowCreateDeviceModal(true)}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <i className="fa-solid fa-tablet-screen-button"></i>
                <span>+ Autorizar Dispositivo</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 uppercase font-mono">
                      <th className="p-3.5">ID Dispositivo (Puesto)</th>
                      <th className="p-3.5">Unidad Asignada</th>
                      <th className="p-3.5">Vigencia Licencia</th>
                      <th className="p-3.5">Estado</th>
                      <th className="p-3.5 text-right">Acción (Prueba)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {devices.map((dev) => (
                      <tr key={dev.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-900">{dev.deviceId}</td>
                        <td className="p-3.5 text-slate-700">{dev.establishmentName}</td>
                        <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                          {dev.validUntil ? dev.validUntil.slice(0, 10) : 'Sin límite'}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              dev.status === 'activo'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {dev.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleToggleDeviceStatus(dev)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
                            title="Alternar estado para pruebas de bloqueo en garita"
                          >
                            {dev.status === 'activo' ? 'Revocar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ----------------- SUBTAB 2: AUTORIZACIONES CONTEXTUALES ----------------- */}
      {activeSubTab === 'autorizaciones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Autorizaciones de ingreso físico vinculadas a días, horarios y unidades específicas.
            </p>
            <button
              onClick={() => setShowCreateAuthModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Nueva Autorización Contextual</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 uppercase font-mono">
                    <th className="p-4">ID / Aprobación</th>
                    <th className="p-4">Profesional</th>
                    <th className="p-4">Unidad Penitenciaria</th>
                    <th className="p-4">Días y Horarios</th>
                    <th className="p-4">Vigencia</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {authorizations.map((auth) => (
                    <tr key={auth.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono text-[11px]">
                        <span className="font-bold text-slate-900 block">{auth.id}</span>
                        <span className="text-[10px] text-slate-500">Por: {auth.approvedBy}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {auth.professionalName || auth.professionalId}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-800 block">
                          {auth.establishmentName || auth.establishmentId}
                        </span>
                        <span className="text-[10px] text-slate-500">{auth.purpose}</span>
                      </td>
                      <td className="p-4 font-mono text-[11px]">
                        <div>Lunes a Viernes</div>
                        <span className="text-slate-500 text-[10px]">{auth.startTime} a {auth.endTime} hs</span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-600">
                        {auth.validFrom} al {auth.validUntil}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            auth.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {auth.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleIssueCredential(auth, 'DIGITAL')}
                            className="px-2.5 py-1.5 rounded-lg bg-sky-900 hover:bg-sky-800 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Emitir credencial digital para app móvil con QR dinámico Ed25519"
                          >
                            <i className="fa-solid fa-mobile-screen text-[10px]"></i>
                            <span>Digital</span>
                          </button>
                          <button
                            onClick={() => handleIssueCredential(auth, 'PHYSICAL')}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-900 hover:bg-purple-800 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Emitir carnet físico PVC con código QR fijo y token seguro"
                          >
                            <i className="fa-solid fa-id-card text-[10px]"></i>
                            <span>Física</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUBTAB 3: CREDENCIALES CRIPTOGRÁFICAS (DIGITAL & FÍSICA) ----------------- */}
      {activeSubTab === 'credenciales' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Gestión unificada de credenciales digitales (QR dinámico Ed25519 con TTL 90s) y físicas (carnet PVC con QR fijo y token opaco en tiempo real).
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 uppercase font-mono">
                    <th className="p-4">Credencial ID</th>
                    <th className="p-4">Tipo / Formato</th>
                    <th className="p-4">Profesional</th>
                    <th className="p-4">Unidad / Función</th>
                    <th className="p-4">Versión / Key ID</th>
                    <th className="p-4">Vencimiento</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {credentials.map((cred) => (
                    <tr key={cred.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{cred.id}</td>
                      <td className="p-4">
                        {cred.credentialType === 'PHYSICAL' ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                              <i className="fa-solid fa-id-card text-[9px] text-purple-700"></i>
                              <span>CARNET FÍSICO</span>
                            </span>
                            <span className="text-[9px] font-mono text-purple-700 font-bold truncate max-w-[120px]">
                              {cred.staticTokenId || 'STK-PENDING'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-200">
                              <i className="fa-solid fa-mobile-screen text-[9px] text-sky-700"></i>
                              <span>DIGITAL (MÓVIL)</span>
                            </span>
                            <span className="text-[9px] text-sky-700 font-sans">QR Dinámico 90s</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-sans font-bold text-slate-800">
                        {cred.professionalName || cred.professionalId}
                      </td>
                      <td className="p-4 font-sans">
                        <span className="block font-semibold text-slate-900">{cred.establishmentName}</span>
                        <span className="text-[10px] text-slate-500">{cred.professionalRole}</span>
                      </td>
                      <td className="p-4 text-slate-600">
                        <div>v{cred.credentialVersion}</div>
                        <span className="text-[9px] text-slate-400">{cred.keyId}</span>
                      </td>
                      <td className="p-4 text-slate-600">{cred.expiresAt.split('T')[0]}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            cred.status === 'ACTIVE' || cred.status === 'activa' || cred.status === 'ACTIVA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : cred.status === 'SUSPENDIDA' || cred.status === 'suspendida'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {cred.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap max-w-xs ml-auto">
                          {/* Imprimir Carnet Físico ISO/IEC 7810 ID-1 */}
                          <button
                            onClick={() => handlePrintCard(cred)}
                            className="px-2 py-1 rounded-lg bg-[#001738] hover:bg-[#002b66] text-white font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Imprimir carnet físico con QR fijo y leyenda obligatoria"
                          >
                            <i className="fa-solid fa-print text-[9px] text-emerald-400"></i>
                            <span>Imprimir</span>
                          </button>

                          {/* Reimprimir (Genera nuevo qrToken y revoca el anterior) */}
                          <button
                            onClick={() => handleReprintCredential(cred.id)}
                            className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                            title="Reimprimir credencial: genera un nuevo qrToken criptográfico y revoca de inmediato el previo"
                          >
                            <i className="fa-solid fa-arrows-rotate text-[9px] text-sky-600"></i>
                            <span>Reimprimir</span>
                          </button>

                          {/* Suspender */}
                          {(cred.status === 'ACTIVA' || cred.status === 'ACTIVE' || cred.status === 'activa') && (
                            <button
                              onClick={() => handleSuspendCredential(cred.id)}
                              className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10px] transition-colors cursor-pointer"
                              title="Suspender temporalmente"
                            >
                              Suspender
                            </button>
                          )}

                          {/* Marcar como Perdida */}
                          {cred.status !== 'DENUNCIADA_PERDIDA' && (
                            <button
                              onClick={() => handleMarkLostCredential(cred.id)}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-[10px] transition-colors cursor-pointer"
                              title="Marcar como denunciada por pérdida o robo (revoca token QR)"
                            >
                              Perdida
                            </button>
                          )}

                          {/* Revocar */}
                          {cred.status !== 'REVOCADA' && cred.status !== 'revocada' && cred.status !== 'REVOKED' ? (
                            <button
                              onClick={() => {
                                setSelectedCredForRevoke(cred.id);
                                setShowRevokeModal(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] transition-colors cursor-pointer"
                              title="Revocación formal administrativa"
                            >
                              Revocar
                            </button>
                          ) : (
                            <span className="text-[10px] text-rose-600 font-sans italic font-bold">
                              Revocada
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUBTAB 4: AUDITORÍA ADMINISTRATIVA ----------------- */}
      {activeSubTab === 'auditoria' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Registro inmutable de trazabilidad de todas las operaciones administrativas críticas.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 uppercase font-mono">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Actor</th>
                    <th className="p-4">Rol</th>
                    <th className="p-4">Acción</th>
                    <th className="p-4">Entidad Afectada</th>
                    <th className="p-4">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-slate-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 font-sans font-bold text-slate-800">
                        {event.actorEmail}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {event.actorRole}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-emerald-800">
                        {event.action}
                      </td>
                      <td className="p-4 text-slate-600">
                        {event.entityType}: {event.entityId}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {event.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUBTAB 5: ROLES Y PERMISOS (RBAC) ----------------- */}
      {activeSubTab === 'roles' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                Arquitectura de Seguridad RBAC
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Matriz Institucional de Roles y Permisos Separados
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Los permisos se validan tanto en el frontend como en el backend y mediante las reglas de seguridad de Firestore.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm">PROFESIONAL</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Cuerpo Técnico</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Ver perfil personal homologado</li>
                  <li>Visualizar credencial digital intransferible</li>
                  <li>Mostrar código QR rotativo para acceso perimetral</li>
                  <li>Consultar actividades y asistencias asignadas</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm">CONTROL DE INGRESOS (VALIDATOR)</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">Guardia SPB</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Acceso prioritario a módulo INGRESOS</li>
                  <li>Escanear QR de credenciales en tiempo real</li>
                  <li>Ingresar código / DNI manualmente</li>
                  <li>Ver resultado inmediato VÁLIDO / NO VÁLIDO</li>
                  <li>Registrar check-in oficial en libro de guardia</li>
                  <li>Consultar historial autorizado del puesto</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm">ADMINISTRADOR</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Gestión Institucional</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Gestionar usuarios y legajos de profesionales</li>
                  <li>Emitir, renovar y revocar credenciales</li>
                  <li>Gestionar asignaciones a unidades penitenciarias</li>
                  <li>Supervisar control de ingresos y libros de guardia</li>
                  <li>Consultar auditoría inmutable de eventos</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm">SUPERADMIN</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Acceso Total</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Acceso administrativo integral y gobernanza</li>
                  <li>Gestión de claves asimétricas Ed25519</li>
                  <li>Gestión de políticas de seguridad y convenios</li>
                  <li>Control de auditoría integral y exportación forense</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUBTAB 6: ESTABLECIMIENTOS PENITENCIARIOS ----------------- */}
      {activeSubTab === 'establecimientos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                Jurisdicción Servicio Penitenciario Bonaerense
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Unidades Penitenciarias Habilitadas
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {establishments.map((est) => (
              <div key={est.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-mono font-bold">
                    {est.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {est.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm leading-snug">{est.name}</h4>
                <div className="text-xs text-slate-500 space-y-1">
                  <p><i className="fa-solid fa-location-dot text-slate-400 mr-1.5"></i>{est.address}</p>
                  <p><i className="fa-solid fa-city text-slate-400 mr-1.5"></i>{est.municipality}, {est.province}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- SUBTAB 7: ACTIVIDADES PROGRAMADAS ----------------- */}
      {activeSubTab === 'actividades' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                Planificación Operativa
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Talleres y Actividades en Unidades Penales
              </h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 uppercase font-mono">
                    <th className="p-4">Actividad</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Establecimiento</th>
                    <th className="p-4">Docente Asignado</th>
                    <th className="p-4">Horario</th>
                    <th className="p-4">Pabellón</th>
                    <th className="p-4">Cupo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activities.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{act.title}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {act.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700">{act.establishmentName}</td>
                      <td className="p-4 font-bold text-slate-800">{act.professionalName}</td>
                      <td className="p-4 text-slate-600">{act.schedule}</td>
                      <td className="p-4 text-slate-500 font-mono text-[11px]">{act.pabellon}</td>
                      <td className="p-4 font-mono font-bold text-slate-700">{act.enrolledCount} / {act.capacity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL CREAR PROFESIONAL ----------------- */}
      {showCreateProfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="bg-[#001738] text-white px-6 py-4 flex items-center justify-between">
              <span className="font-bold text-sm">Alta de Profesional en SIFFA</span>
              <button
                onClick={() => setShowCreateProfModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleCreateProfessional} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              
              {/* Selector de Fotografía de Perfil (Exclusivo Administrador) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <i className="fa-solid fa-camera text-emerald-600"></i>
                    <span>Fotografía de Perfil (Solo Administrador)</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-bold">
                    Padrón Central
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Vista Previa de la Foto */}
                  <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-slate-200 border-2 border-emerald-500 shrink-0 shadow-sm">
                    {newProf.profilePhotoUrl ? (
                      <img
                        src={newProf.profilePhotoUrl}
                        alt="Previa"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <i className="fa-solid fa-user text-xl"></i>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                        URL de la Fotografía:
                      </label>
                      <input
                        type="url"
                        value={newProf.profilePhotoUrl}
                        onChange={(e) => setNewProf({ ...newProf, profilePhotoUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 rounded-lg cursor-pointer flex items-center gap-1 text-[11px]">
                        <i className="fa-solid fa-upload text-slate-500"></i>
                        <span>Subir Archivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageFileUpload(e, false)}
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">JPG, PNG máx 2MB</span>
                    </div>
                  </div>
                </div>

                {/* Galería de Presets Homologados */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">
                    O seleccionar retrato institucional predeterminado:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {PHOTO_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewProf({ ...newProf, profilePhotoUrl: preset.url })}
                        className={`p-1 rounded-lg border transition-all text-center cursor-pointer ${
                          newProf.profilePhotoUrl === preset.url
                            ? 'border-emerald-500 bg-emerald-50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-8 h-8 rounded-md object-cover mx-auto mb-0.5"
                        />
                        <span className="block text-[8px] font-medium text-slate-600 truncate">
                          {preset.name.split(' ')[1] || preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={newProf.firstName}
                    onChange={(e) => setNewProf({ ...newProf, firstName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={newProf.lastName}
                    onChange={(e) => setNewProf({ ...newProf, lastName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">DNI (Documento)</label>
                  <input
                    type="text"
                    required
                    value={newProf.documentNumber}
                    onChange={(e) => setNewProf({ ...newProf, documentNumber: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rol Institucional</label>
                  <select
                    value={newProf.professionalRole}
                    onChange={(e) => setNewProf({ ...newProf, professionalRole: e.target.value as FunctionalRole })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="DOCENTE">DOCENTE</option>
                    <option value="INSTRUCTOR">INSTRUCTOR (TÉCNICA / PREP. FÍSICO)</option>
                    <option value="DIRECTIVO">DIRECTIVO SIFFA</option>
                    <option value="ORGANIZADOR">ORGANIZADOR / ÁRBITRO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Correo Institucional</label>
                  <input
                    type="email"
                    required
                    value={newProf.email}
                    onChange={(e) => setNewProf({ ...newProf, email: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={newProf.phone}
                    onChange={(e) => setNewProf({ ...newProf, phone: e.target.value })}
                    placeholder="+54 9 11 ..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Matrícula</label>
                  <input
                    type="text"
                    value={newProf.matricula}
                    onChange={(e) => setNewProf({ ...newProf, matricula: e.target.value })}
                    placeholder="ATFA / SIFFA"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Especialidad</label>
                  <input
                    type="text"
                    value={newProf.specialty}
                    onChange={(e) => setNewProf({ ...newProf, specialty: e.target.value })}
                    placeholder="Fútbol y Psicología Deportiva"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateProfModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Registrar Profesional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL MODIFICAR PERFIL DE USUARIO / PRUEBA (ADMINISTRADOR) ----------------- */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
            
            <div className="bg-gradient-to-r from-[#001738] to-[#002b66] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/30">
                  <i className="fa-solid fa-user-pen text-base"></i>
                </div>
                <div>
                  <span className="font-extrabold text-sm block">Modificar Perfil y Cuenta de Prueba</span>
                  <span className="text-[11px] text-purple-300 font-mono">
                    Cuenta: {editingUser.originalEmail}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-5 text-xs max-h-[82vh] overflow-y-auto">
              
              {/* 1. SECCIÓN FOTOGRAFÍA */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-purple-800">
                    <i className="fa-solid fa-camera"></i>
                    <span>Fotografía del Perfil</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Cargar desde PC o elegir preset</span>
                </span>

                <div className="flex items-center gap-4">
                  <div className="relative w-18 h-22 rounded-2xl overflow-hidden bg-slate-200 border-2 border-purple-500 shrink-0 shadow-sm">
                    {editingUser.profilePhotoUrl ? (
                      <img
                        src={editingUser.profilePhotoUrl}
                        alt="Foto Actual"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <i className="fa-solid fa-user text-2xl"></i>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5 text-xs shadow-xs transition-colors">
                        <i className="fa-solid fa-upload"></i>
                        <span>Cargar Foto desde PC</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUserImageUpload(e, true)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingUser({
                            ...editingUser,
                            profilePhotoUrl: PHOTO_PRESETS[0].url,
                          })
                        }
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-300 rounded-xl cursor-pointer text-[11px]"
                      >
                        Resetear
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                        O ingresar URL directa de la imagen:
                      </label>
                      <input
                        type="url"
                        value={editingUser.profilePhotoUrl}
                        onChange={(e) => setEditingUser({ ...editingUser, profilePhotoUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Presets rápidos de fotos */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1.5">Fotos institucionales sugeridas:</span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {PHOTO_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingUser({ ...editingUser, profilePhotoUrl: p.url })}
                        className={`w-9 h-11 rounded-lg overflow-hidden shrink-0 border-2 cursor-pointer transition-transform hover:scale-105 ${
                          editingUser.profilePhotoUrl === p.url ? 'border-purple-600 ring-2 ring-purple-300' : 'border-slate-300'
                        }`}
                        title={p.name}
                      >
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. DATOS PERSONALES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Nombre:</label>
                  <input
                    type="text"
                    required
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Apellido:</label>
                  <input
                    type="text"
                    required
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* 3. CREDENCIALES DE ACCESO */}
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                <span className="font-black text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <i className="fa-solid fa-key text-amber-700"></i>
                  <span>Credenciales de Ingreso a la Plataforma</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Correo de Acceso (Email):</label>
                    <input
                      type="email"
                      required
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Contraseña de Acceso:</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={editingUser.password}
                        onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-purple-700 pr-8"
                        placeholder="Contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const rnd = 'siffa' + Math.floor(1000 + Math.random() * 9000);
                          setEditingUser({ ...editingUser, password: rnd });
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600 text-xs cursor-pointer"
                        title="Generar contraseña aleatoria"
                      >
                        <i className="fa-solid fa-dice"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. ROL EN LA PLATAFORMA & CATEGORÍA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Rol en la Plataforma:
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as RoleType })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Acceso Total)</option>
                    <option value="PROFESSIONAL">PROFESSIONAL (Docente / Credencial QR)</option>
                    <option value="VALIDATOR">VALIDATOR (Guardia Garita SPB)</option>
                    <option value="INSTITUTIONAL_MANAGER">INSTITUTIONAL_MANAGER (Dirección)</option>
                    <option value="AUDITOR">AUDITOR (Auditoría Forense)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Categoría Funcional:
                  </label>
                  <select
                    value={editingUser.professionalRole}
                    onChange={(e) => setEditingUser({ ...editingUser, professionalRole: e.target.value as FunctionalRole })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="DOCENTE">DOCENTE (Fútbol / Talleres)</option>
                    <option value="INSTRUCTOR">INSTRUCTOR (Prep. Física / Árbitro)</option>
                    <option value="DIRECTIVO">DIRECTIVO (Gobernanza / Médicos)</option>
                    <option value="COORDINADOR">COORDINADOR (Gestión de Campo)</option>
                  </select>
                </div>
              </div>

              {/* 5. DNI & MATRÍCULA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">DNI / Documento:</label>
                  <input
                    type="text"
                    value={editingUser.documentNumber}
                    onChange={(e) => setEditingUser({ ...editingUser, documentNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Matrícula / Registro SIFFA:</label>
                  <input
                    type="text"
                    value={editingUser.matricula}
                    onChange={(e) => setEditingUser({ ...editingUser, matricula: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* 6. ESPECIALIDAD & UNIDAD ASIGNADA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Especialidad Formativa / Función:</label>
                  <input
                    type="text"
                    value={editingUser.specialty}
                    onChange={(e) => setEditingUser({ ...editingUser, specialty: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    placeholder="Ej. Táctica Fútbol 11, Prep. Física..."
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Unidad Penitenciaria Asignada:</label>
                  <select
                    value={editingUser.establishmentId}
                    onChange={(e) => setEditingUser({ ...editingUser, establishmentId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="">Sin Asignar</option>
                    {establishments.map((est) => (
                      <option key={est.id} value={est.id}>
                        {est.name} ({est.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 7. ESTADO DE LA CUENTA */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Estado de Habilitación:</label>
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-800">
                    <input
                      type="radio"
                      name="userStatus"
                      checked={editingUser.status === 'ACTIVE'}
                      onChange={() => setEditingUser({ ...editingUser, status: 'ACTIVE' })}
                      className="accent-emerald-600"
                    />
                    <span>Activo (Habilitado para ingresar y validar)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-800">
                    <input
                      type="radio"
                      name="userStatus"
                      checked={editingUser.status === 'SUSPENDED'}
                      onChange={() => setEditingUser({ ...editingUser, status: 'SUSPENDED' })}
                      className="accent-rose-600"
                    />
                    <span>Suspendido (Acceso bloqueado)</span>
                  </label>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUserModal(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-black flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Guardar Cambios del Perfil</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL CREAR NUEVO PERFIL DE USUARIO / PRUEBA (ADMIN) ----------------- */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
            
            <div className="bg-gradient-to-r from-emerald-800 to-[#001738] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
                  <i className="fa-solid fa-user-plus text-base"></i>
                </div>
                <div>
                  <span className="font-extrabold text-sm block">Alta de Nuevo Perfil de Prueba</span>
                  <span className="text-[11px] text-emerald-200">
                    Registro de cuenta institucional y credenciales de acceso
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
              
              {/* Fotografía */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <i className="fa-solid fa-camera text-emerald-600"></i>
                  <span>Fotografía del Perfil</span>
                </span>

                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-slate-200 border-2 border-emerald-500 shrink-0">
                    <img
                      src={newUser.profilePhotoUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5 text-xs shadow-xs w-fit">
                      <i className="fa-solid fa-upload"></i>
                      <span>Cargar Foto desde PC</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUserImageUpload(e, false)}
                      />
                    </label>
                    <input
                      type="url"
                      value={newUser.profilePhotoUrl}
                      onChange={(e) => setNewUser({ ...newUser, profilePhotoUrl: e.target.value })}
                      placeholder="O ingresar URL directa..."
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Nombre y Apellido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Nombre:</label>
                  <input
                    type="text"
                    required
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    placeholder="Ej. Juan"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Apellido:</label>
                  <input
                    type="text"
                    required
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    placeholder="Ej. Pérez"
                  />
                </div>
              </div>

              {/* Email y Contraseña */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Correo de Acceso:</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                    placeholder="nombre@siffa.org"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Contraseña de Prueba:</label>
                  <input
                    type="text"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-emerald-800"
                    placeholder="Contraseña"
                  />
                </div>
              </div>

              {/* Rol y Rol Funcional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Rol en el Sistema:</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as RoleType })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="PROFESSIONAL">PROFESSIONAL (Docente / QR)</option>
                    <option value="VALIDATOR">VALIDATOR (Guardia Garita SPB)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Administrador)</option>
                    <option value="INSTITUTIONAL_MANAGER">INSTITUTIONAL_MANAGER (Directivo)</option>
                    <option value="AUDITOR">AUDITOR (Auditor)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Categoría Funcional:</label>
                  <select
                    value={newUser.professionalRole}
                    onChange={(e) => setNewUser({ ...newUser, professionalRole: e.target.value as FunctionalRole })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="DOCENTE">DOCENTE</option>
                    <option value="INSTRUCTOR">INSTRUCTOR</option>
                    <option value="DIRECTIVO">DIRECTIVO</option>
                    <option value="COORDINADOR">COORDINADOR</option>
                  </select>
                </div>
              </div>

              {/* DNI y Matrícula */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">DNI:</label>
                  <input
                    type="text"
                    value={newUser.documentNumber}
                    onChange={(e) => setNewUser({ ...newUser, documentNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    placeholder="35000000"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Matrícula SIFFA:</label>
                  <input
                    type="text"
                    value={newUser.matricula}
                    onChange={(e) => setNewUser({ ...newUser, matricula: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    placeholder="SIFFA-1001"
                  />
                </div>
              </div>

              {/* Especialidad & Unidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Especialidad:</label>
                  <input
                    type="text"
                    value={newUser.specialty}
                    onChange={(e) => setNewUser({ ...newUser, specialty: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    placeholder="Ej. Táctica, Prep. Física..."
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Unidad Penitenciaria:</label>
                  <select
                    value={newUser.establishmentId}
                    onChange={(e) => setNewUser({ ...newUser, establishmentId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="">Sin Asignar</option>
                    {establishments.map((est) => (
                      <option key={est.id} value={est.id}>
                        {est.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg"
                >
                  <i className="fa-solid fa-user-plus"></i>
                  <span>Crear Perfil</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL EDITAR PROFESIONAL (SOLO ADMINISTRADOR) ----------------- */}
      {showEditProfModal && editingProf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
            
            <div className="bg-[#001738] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <i className="fa-solid fa-user-pen text-sm"></i>
                </div>
                <div>
                  <span className="font-bold text-sm block">Editar Perfil Profesional (Administrador)</span>
                  <span className="text-[10px] text-slate-300 font-mono">Legajo: {editingProf.id}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditProfModal(false);
                  setEditingProf(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleUpdateProfessional} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              
              {/* Fotografía de Perfil con Vista Previa y Modificación */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <i className="fa-solid fa-camera text-emerald-600"></i>
                    <span>Modificar Fotografía Oficial</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Exclusivo Administrador
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-slate-200 border-2 border-emerald-500 shrink-0 shadow-sm">
                    {editingProf.profilePhotoUrl ? (
                      <img
                        src={editingProf.profilePhotoUrl}
                        alt="Foto Actual"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <i className="fa-solid fa-user text-xl"></i>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                        URL de la Fotografía:
                      </label>
                      <input
                        type="url"
                        value={editingProf.profilePhotoUrl}
                        onChange={(e) => setEditingProf({ ...editingProf, profilePhotoUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 rounded-lg cursor-pointer flex items-center gap-1 text-[11px]">
                        <i className="fa-solid fa-upload text-slate-500"></i>
                        <span>Cargar Nueva Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageFileUpload(e, true)}
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">Reemplazar imagen</span>
                    </div>
                  </div>
                </div>

                {/* Presets para Selección Rápida */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">
                    O asignar fotografía institucional:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {PHOTO_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingProf({ ...editingProf, profilePhotoUrl: preset.url })}
                        className={`p-1 rounded-lg border transition-all text-center cursor-pointer ${
                          editingProf.profilePhotoUrl === preset.url
                            ? 'border-emerald-500 bg-emerald-50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-8 h-8 rounded-md object-cover mx-auto mb-0.5"
                        />
                        <span className="block text-[8px] font-medium text-slate-600 truncate">
                          {preset.name.split(' ')[1] || preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Atributos del Profesional */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={editingProf.firstName}
                    onChange={(e) => setEditingProf({ ...editingProf, firstName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={editingProf.lastName}
                    onChange={(e) => setEditingProf({ ...editingProf, lastName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">DNI (Documento)</label>
                  <input
                    type="text"
                    required
                    value={editingProf.documentNumber}
                    onChange={(e) => setEditingProf({ ...editingProf, documentNumber: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rol Institucional</label>
                  <select
                    value={editingProf.professionalRole}
                    onChange={(e) => setEditingProf({ ...editingProf, professionalRole: e.target.value as FunctionalRole })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="DOCENTE">DOCENTE</option>
                    <option value="INSTRUCTOR">INSTRUCTOR (TÉCNICA / PREP. FÍSICO)</option>
                    <option value="DIRECTIVO">DIRECTIVO SIFFA</option>
                    <option value="ORGANIZADOR">ORGANIZADOR / ÁRBITRO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Correo Institucional</label>
                  <input
                    type="email"
                    required
                    value={editingProf.email}
                    onChange={(e) => setEditingProf({ ...editingProf, email: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={editingProf.phone}
                    onChange={(e) => setEditingProf({ ...editingProf, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Matrícula</label>
                  <input
                    type="text"
                    value={editingProf.matricula}
                    onChange={(e) => setEditingProf({ ...editingProf, matricula: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Especialidad</label>
                  <input
                    type="text"
                    value={editingProf.specialty}
                    onChange={(e) => setEditingProf({ ...editingProf, specialty: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estado</label>
                  <select
                    value={editingProf.status}
                    onChange={(e) => setEditingProf({ ...editingProf, status: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="ACTIVE">ACTIVO</option>
                    <option value="SUSPENDED">SUSPENDIDO</option>
                    <option value="INACTIVE">INACTIVO</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProfModal(false);
                    setEditingProf(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Guardar Cambios</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL CREAR AUTORIZACIÓN ----------------- */}
      {showCreateAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="bg-[#001738] text-white px-6 py-4 flex items-center justify-between">
              <span className="font-bold text-sm">Emisión de Autorización Contextual</span>
              <button
                onClick={() => setShowCreateAuthModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleCreateAuthorization} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Seleccionar Profesional</label>
                <select
                  value={newAuth.professionalId}
                  onChange={(e) => setNewAuth({ ...newAuth, professionalId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.professionalRole}) - DNI {p.documentNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Establecimiento Penitenciario Habilitado</label>
                <select
                  value={newAuth.establishmentId}
                  onChange={(e) => setNewAuth({ ...newAuth, establishmentId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  {establishments.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.name} ({est.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vigencia Desde</label>
                  <input
                    type="date"
                    value={newAuth.validFrom}
                    onChange={(e) => setNewAuth({ ...newAuth, validFrom: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vigencia Hasta</label>
                  <input
                    type="date"
                    value={newAuth.validUntil}
                    onChange={(e) => setNewAuth({ ...newAuth, validUntil: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={newAuth.startTime}
                    onChange={(e) => setNewAuth({ ...newAuth, startTime: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={newAuth.endTime}
                    onChange={(e) => setNewAuth({ ...newAuth, endTime: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Finalidad / Actividad</label>
                <input
                  type="text"
                  value={newAuth.purpose}
                  onChange={(e) => setNewAuth({ ...newAuth, purpose: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateAuthModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Emitir Autorización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL CREAR NÓMINA PREVIA ----------------- */}
      {showCreateNominaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="bg-[#001738] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="font-black text-sm block">Presentación de Nómina Previa a Unidad Penal</span>
                <span className="text-[10px] text-amber-300 font-mono">Circuito Institucional SIFFA → SPB</span>
              </div>
              <button
                onClick={() => setShowCreateNominaModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleCreateNomina} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="font-extrabold text-slate-800 block mb-1">
                  1. Unidad Penitenciaria Destino
                </label>
                <select
                  value={newNominaEstId}
                  onChange={(e) => setNewNominaEstId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
                >
                  {establishments.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.name} ({est.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-extrabold text-slate-800 block mb-1">
                  2. Seleccionar Integrantes para la Nómina ({selectedProfIdsForNomina.length} seleccionados)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Marque los profesionales del padrón que integran esta propuesta:
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2.5 bg-slate-50">
                  {professionals.map((p) => {
                    const isSelected = selectedProfIdsForNomina.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-amber-100/70 border border-amber-300' : 'hover:bg-white bg-slate-100/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProfIdsForNomina([...selectedProfIdsForNomina, p.id]);
                              } else {
                                setSelectedProfIdsForNomina(selectedProfIdsForNomina.filter((id) => id !== p.id));
                              }
                            }}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <div>
                            <strong className="text-slate-900 block">{p.firstName} {p.lastName}</strong>
                            <span className="text-[10px] text-slate-500 font-mono">DNI: {p.documentNumber}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded bg-white text-slate-700 uppercase border border-slate-200">
                          {p.professionalRole}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-extrabold text-slate-800 block mb-1">
                  3. Observaciones / Nota de Presentación
                </label>
                <textarea
                  rows={2}
                  value={newNominaObs}
                  onChange={(e) => setNewNominaObs(e.target.value)}
                  placeholder="Ej: Nómina correspondiente a las docentes asignadas a los talleres de Fútbol Femenino y Convivencia durante el primer semestre..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-snug">
                <strong>Recordatorio Legal:</strong> El envío de esta nómina no otorga permiso automático de acceso. Queda sujeta a la aprobación de la autoridad penitenciaria.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateNominaModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <i className="fa-solid fa-paper-plane text-xs"></i>
                  <span>Enviar Nómina a la Unidad</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL EVALUAR NÓMINA (AUTORIDAD SPB) ----------------- */}
      {showReviewNominaModal && selectedNominaForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="bg-[#001738] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="font-black text-sm block">Resolución de Nómina Penitenciaria</span>
                <span className="text-[10px] text-slate-300 font-mono">
                  {selectedNominaForReview.id} · {selectedNominaForReview.establishmentName}
                </span>
              </div>
              <button
                onClick={() => setShowReviewNominaModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleReviewNominaSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-extrabold text-slate-800 block mb-1">
                  Dictamen de la Autoridad Penitenciaria
                </label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-xs focus:ring-2 focus:ring-amber-500"
                >
                  <option value="aprobada">APROBADA (Habilita generación de autorizaciones)</option>
                  <option value="parcial">PARCIAL (Aprobada con observaciones específicas)</option>
                  <option value="rechazada">RECHAZADA (No autorizada por la Unidad)</option>
                </select>
              </div>

              <div>
                <label className="font-extrabold text-slate-800 block mb-1">
                  Disposición / Observaciones Oficiales
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewObs}
                  onChange={(e) => setReviewObs(e.target.value)}
                  placeholder="Ej: Aprobada según Disposición de Seguridad SPB N° 045/26 para ingreso en horarios de patio..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                <p><strong>Efecto en el sistema:</strong> Al dictaminar &apos;aprobada&apos;, se generarán o actualizarán automáticamente las autorizaciones contextuales para los {selectedNominaForReview.professionals.length} integrantes de esta nómina.</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowReviewNominaModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black cursor-pointer shadow-md"
                >
                  Guardar Resolución
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL CREAR REQUISITO PREVIO ----------------- */}
      {showCreatePrereqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="bg-[#001738] text-white px-6 py-4 flex items-center justify-between">
              <span className="font-black text-sm">Alta de Requisito Previo Obligatorio</span>
              <button
                onClick={() => setShowCreatePrereqModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleCreatePrereq} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Profesional</label>
                <select
                  value={newPrereq.professionalId}
                  onChange={(e) => setNewPrereq({ ...newPrereq, professionalId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} (DNI: {p.documentNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Unidad Penitenciaria</label>
                <select
                  value={newPrereq.establishmentId}
                  onChange={(e) => setNewPrereq({ ...newPrereq, establishmentId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  {establishments.map((est) => (
                    <option key={est.id} value={est.id}>{est.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipo de Requisito</label>
                  <select
                    value={newPrereq.type}
                    onChange={(e) => setNewPrereq({ ...newPrereq, type: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="seguro">SEGURO / ART</option>
                    <option value="acuerdo_confidencialidad">CONFIDENCIALIDAD</option>
                    <option value="documentacion">DOCUMENTACIÓN</option>
                    <option value="capacitacion">CAPACITACIÓN</option>
                    <option value="dispositivo">DISPOSITIVO</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estado</label>
                  <select
                    value={newPrereq.status}
                    onChange={(e) => setNewPrereq({ ...newPrereq, status: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="cumplido">CUMPLIDO</option>
                    <option value="pendiente">PENDIENTE</option>
                    <option value="vencido">VENCIDO</option>
                    <option value="rechazado">RECHAZADO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Fecha de Vigencia Hasta</label>
                <input
                  type="date"
                  value={newPrereq.validUntil}
                  onChange={(e) => setNewPrereq({ ...newPrereq, validUntil: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreatePrereqModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  Registrar Requisito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL CREAR DISPOSITIVO AUTORIZADO ----------------- */}
      {showCreateDeviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="bg-[#001738] text-white px-6 py-4 flex items-center justify-between">
              <span className="font-black text-sm">Autorizar Dispositivo de Garita</span>
              <button
                onClick={() => setShowCreateDeviceModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Identificador del Dispositivo / Puesto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: GARITA-EST-U33-02 o TABLET-SEC-01"
                  value={newDevice.deviceId}
                  onChange={(e) => setNewDevice({ ...newDevice, deviceId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Unidad Penitenciaria Asignada</label>
                <select
                  value={newDevice.establishmentId}
                  onChange={(e) => setNewDevice({ ...newDevice, establishmentId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  {establishments.map((est) => (
                    <option key={est.id} value={est.id}>{est.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vigencia Hasta</label>
                  <input
                    type="date"
                    value={newDevice.validUntil}
                    onChange={(e) => setNewDevice({ ...newDevice, validUntil: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estado</label>
                  <select
                    value={newDevice.status}
                    onChange={(e) => setNewDevice({ ...newDevice, status: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="activo">ACTIVO</option>
                    <option value="revocado">REVOCADO</option>
                    <option value="vencido">VENCIDO</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateDeviceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Autorizar Dispositivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL REVOCAR CREDENCIAL ----------------- */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="bg-rose-950 text-white px-6 py-4 flex items-center justify-between">
              <span className="font-bold text-sm">Revocación Formal de Credencial</span>
              <button
                onClick={() => setShowRevokeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Está a punto de revocar la credencial <strong className="text-slate-900 font-mono">{selectedCredForRevoke}</strong>.
                Esta acción invalidará inmediatamente los accesos en todas las garitas penitenciarias y se sincronizará con la lista de revocaciones offline.
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Motivo Institucional de Revocación</label>
                <textarea
                  rows={3}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Ej: Suspensión administrativa por finalización de ciclo o medida judicial preventiva..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  onClick={() => setShowRevokeModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmRevoke}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Confirmar Revocación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL CREDENCIAL FÍSICA OFICIAL (FASE 3) ----------------- */}
      {selectedPhysicalCred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-700 animate-scaleUp my-8">
            <div className="bg-[#001738] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-lg border border-purple-500/30">
                  <i className="fa-solid fa-id-card"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Credencial Física Oficial (Carnet PVC Estándar ISO/CR80)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Modelo Híbrido SIFFA · QR Fijo Opaco con Validación en Tiempo Real
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPhysicalCred(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* VISTA PREVIA IMPRESIÓN CARNET: FRENTE Y DORSO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-items-center">
                
                {/* --- FRENTE DEL CARNET --- */}
                <div className="w-[300px] h-[190px] rounded-2xl bg-gradient-to-br from-[#001738] via-[#002b66] to-[#001738] p-3 text-white flex flex-col justify-between border-2 border-sky-400/40 shadow-xl relative overflow-hidden select-none">
                  {/* Patrón de seguridad decorativo */}
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-sky-500/10 rounded-full blur-xl pointer-events-none"></div>

                  <div className="flex items-center justify-between border-b border-white/20 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm tracking-wider text-sky-400">SIFFA</span>
                      <span className="text-[7.5px] font-bold text-slate-300 uppercase tracking-tight">Identificación Oficial</span>
                    </div>
                    <span className="text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-400/20 text-sky-300 border border-sky-400/30">
                      Carnet Físico
                    </span>
                  </div>

                  <div className="flex gap-2.5 items-center my-auto">
                    <img
                      src={selectedPhysicalCred.professional.profilePhotoUrl}
                      alt="Foto"
                      className="w-16 h-18 rounded-lg object-cover border-2 border-sky-400 shrink-0 shadow-md"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-xs text-white leading-tight truncate">
                        {selectedPhysicalCred.professional.fullName}
                      </h4>
                      <p className="text-[8.5px] font-bold text-sky-300 uppercase tracking-wide">
                        {selectedPhysicalCred.professional.role}
                      </p>
                      <p className="text-[7.5px] text-slate-300 mt-0.5 font-mono truncate">
                        Mat: {selectedPhysicalCred.professional.matricula}
                      </p>
                      <p className="text-[7.5px] text-slate-400 font-mono">
                        N°: {selectedPhysicalCred.id}
                      </p>
                      {/* DNI CONDICIONAL */}
                      {selectedPhysicalCred.requiresDniOnCard ? (
                        <p className="text-[7.5px] font-black text-amber-300 font-mono">
                          DNI: {selectedPhysicalCred.printedDni}
                        </p>
                      ) : (
                        <p className="text-[7px] text-slate-400 italic">
                          DNI: Resguardado por norma
                        </p>
                      )}
                      <p className="text-[7px] text-slate-400">
                        Vence: {selectedPhysicalCred.expiresAt.slice(0, 10)}
                      </p>
                    </div>

                    <div className="text-center shrink-0">
                      <img
                        src={selectedPhysicalCred.qrDataUrl}
                        alt="QR Fijo"
                        className="w-14 h-14 bg-white p-1 rounded-md shadow-xs border border-slate-300"
                      />
                      <span className="block text-[6.5px] font-mono text-slate-400 mt-0.5 font-bold">
                        {selectedPhysicalCred.staticTokenId.slice(0, 10)}
                      </span>
                    </div>
                  </div>

                  {/* LEYENDA LEGAL NO NEGOCIABLE Y PERMANENTE */}
                  <div className="bg-amber-100 border border-amber-300 rounded-md px-1.5 py-1 text-center shadow-2xs">
                    <p className="text-[6.5px] font-extrabold text-amber-950 leading-tight">
                      ⚖️ {selectedPhysicalCred.legalDisclaimer}
                    </p>
                  </div>
                </div>

                {/* --- DORSO DEL CARNET --- */}
                <div className="w-[300px] h-[190px] rounded-2xl bg-white p-3 text-slate-900 flex flex-col justify-between border-2 border-[#002b66] shadow-xl relative overflow-hidden select-none">
                  <div className="text-center border-b border-slate-200 pb-1">
                    <span className="font-black text-[8.5px] text-[#001738] block uppercase">
                      Sistema Integral de Formación y Fútbol
                    </span>
                    <span className="text-[7px] font-bold text-slate-500">
                      Homologación en Ámbitos Penitenciarios · SIFFA
                    </span>
                  </div>

                  <div className="text-[8px] space-y-1.5 text-slate-700 leading-snug my-auto">
                    <div>
                      <strong className="text-slate-900 block text-[8px]">Destino Acreditado:</strong>
                      <span className="text-slate-600 font-medium">{selectedPhysicalCred.establishment.name}</span>
                    </div>

                    <div>
                      <strong className="text-slate-900 block text-[8px]">Token Criptográfico Fijo:</strong>
                      <span className="font-mono text-[8px] bg-slate-100 px-1 py-0.5 rounded text-purple-900 font-bold border border-slate-200">
                        {selectedPhysicalCred.staticTokenId}
                      </span>
                    </div>

                    <div className={`p-1 rounded text-[7px] font-bold leading-tight ${
                      selectedPhysicalCred.requiresDniOnCard
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {selectedPhysicalCred.requiresDniOnCard
                        ? '✓ DNI impreso a requerimiento explícito de la Unidad Penitenciaria.'
                        : 'ℹ DNI omitido por principio de confidencialidad de datos personales.'}
                    </div>

                    <p className="text-[7px] text-slate-500 leading-tight">
                      La validación en garita SPB se efectúa mediante escaneo del código QR fijo en tiempo real contra el servidor central.
                    </p>
                  </div>

                  <div className="text-center pt-1 border-t border-slate-200">
                    <span className="text-[7px] font-black text-slate-800 tracking-wider">
                      REPÚBLICA ARGENTINA · PROVINCIA DE BUENOS AIRES
                    </span>
                  </div>
                </div>

              </div>

              {/* CUADRO DE AUDITORÍA Y CUMPLIMIENTO LEGAL */}
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <i className="fa-solid fa-shield-halved"></i>
                  <span>Verificación de Requisitos Legales del Abogado (Fase 3):</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Identificador Opaco:</strong> El QR fijo contiene el token seguro{' '}
                    <code className="text-purple-300 font-mono bg-purple-950/60 px-1.5 py-0.5 rounded">
                      {selectedPhysicalCred.staticTokenId}
                    </code>{' '}
                    sin datos personales embebidos.
                  </li>
                  <li>
                    <strong>Consulta en Tiempo Real:</strong> Al escanear este código, la garita consulta el estado en vivo (revocación, vencimiento y requisitos previos bloqueantes).
                  </li>
                  <li>
                    <strong>DNI Protegido:</strong> Estado del flag de establecimiento{' '}
                    <span className="font-mono text-amber-300">requiresDniOnCard = {selectedPhysicalCred.requiresDniOnCard ? 'true' : 'false'}</span>.
                    {selectedPhysicalCred.requiresDniOnCard ? ' (DNI autorizado para impresión).' : ' (DNI protegido contra impresión innecesaria).'}
                  </li>
                  <li>
                    <strong>Leyenda Legal Visible:</strong> Impresa de forma indeleble en el frente del carnet oficial.
                  </li>
                </ul>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <a
                  href={`/api/credentials/${encodeURIComponent(selectedPhysicalCred.id)}/physical?format=html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700 cursor-pointer"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  <span>Abrir Documento Imprimible Completo (HTML)</span>
                </a>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => {
                      const printUrl = `/api/credentials/${encodeURIComponent(selectedPhysicalCred.id)}/physical?format=html`;
                      const printWindow = window.open(printUrl, '_blank');
                      if (printWindow) {
                        printWindow.focus();
                      }
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <i className="fa-solid fa-print"></i>
                    <span>Imprimir / Guardar PDF</span>
                  </button>
                  <button
                    onClick={() => setSelectedPhysicalCred(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs cursor-pointer transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal de Impresión Oficial de Tarjeta Física (ISO/IEC 7810 ID-1) */}
      <PrintCredentialModal
        credential={printCred}
        professional={printProf}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
};
