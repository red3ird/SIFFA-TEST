import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SiffaLogo } from './SiffaLogo';
import {
  Establishment,
  DynamicQRPayload,
  Credential,
  CheckInRecord,
  UserProfile,
} from '../types';

interface IngresosOperativoViewProps {
  currentUser: UserProfile | null;
  initialPayload?: DynamicQRPayload | null;
  initialEstablishmentId?: string;
  onOpenGoogleAuth: () => void;
}

export const IngresosOperativoView: React.FC<IngresosOperativoViewProps> = ({
  currentUser,
  initialPayload,
  initialEstablishmentId,
  onOpenGoogleAuth,
}) => {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstId, setSelectedEstId] = useState<string>(initialEstablishmentId || 'EST-U33');
  const [activeMethod, setActiveMethod] = useState<'scan' | 'manual'>('scan');

  // Input states
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [credentialsSample, setCredentialsSample] = useState<Credential[]>([]);
  const [rawScanJson, setRawScanJson] = useState('');

  // Status & processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingCheckIn, setIsSavingCheckIn] = useState(false);
  const [checkInSavedNotice, setCheckInSavedNotice] = useState<string | null>(null);

  // Validation Result
  const [validationResult, setValidationResult] = useState<{
    decision: 'ALLOWED' | 'DENIED';
    reasonCode: string;
    message: string;
    accessEventId?: string;
    timestamp: string;
    method: 'QR' | 'MANUAL' | 'QR_ESTATICO';
    professional?: {
      id: string;
      fullName: string;
      documentNumber: string;
      professionalRole: string;
      matricula?: string;
      profilePhotoUrl?: string;
    };
    authorization?: {
      id: string;
      purpose?: string;
      establishmentName?: string;
      validUntil?: string;
      timeWindow?: string;
    };
    credentialId?: string;
  } | null>(null);

  // Recent check-in events in guard house
  const [recentCheckIns, setRecentCheckIns] = useState<CheckInRecord[]>([]);

  const loadInitialData = async () => {
    try {
      const [ests, creds, checkins] = await Promise.all([
        api.getEstablishments(),
        api.getCredentials(),
        api.getCheckIns(),
      ]);
      setEstablishments(ests);
      setCredentialsSample(creds);
      setRecentCheckIns(checkins);
    } catch (e) {
      console.error('Error al cargar datos de control de ingresos', e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (initialPayload) {
      setActiveMethod('scan');
      setRawScanJson(JSON.stringify(initialPayload, null, 2));
      handleValidateQR(initialPayload);
    }
  }, [initialPayload]);

  // Security Check: Authorized Access for Ingresos
  const isAuthorizedRole = currentUser && (
    currentUser.role === 'SUPER_ADMIN' ||
    currentUser.role === 'ADMIN_CREDENTIALS' ||
    currentUser.role === 'VALIDATOR' ||
    currentUser.role === 'INSTITUTIONAL_MANAGER'
  );

  // METHOD 1: Validate QR Payload
  const handleValidateQR = async (payloadToUse?: DynamicQRPayload) => {
    let payload: DynamicQRPayload;
    if (payloadToUse) {
      payload = payloadToUse;
    } else {
      try {
        payload = JSON.parse(rawScanJson);
      } catch {
        setValidationResult({
          decision: 'DENIED',
          reasonCode: 'QR_INVALIDO',
          message: 'El código escaneado no contiene una firma o estructura válida de SIFFA.',
          timestamp: new Date().toLocaleTimeString('es-AR'),
          method: 'QR',
        });
        return;
      }
    }

    setIsProcessing(true);
    setCheckInSavedNotice(null);

    try {
      const res = await api.validateAccessOnline({
        qrPayload: payload,
        establishmentId: selectedEstId,
        validatorDeviceId: `GARITA-${selectedEstId}-01`,
      });

      setValidationResult({
        decision: res.decision,
        reasonCode: res.reasonCode,
        message: res.message,
        accessEventId: res.accessEventId,
        timestamp: new Date().toLocaleTimeString('es-AR'),
        method: 'QR',
        credentialId: payload.cid,
        professional: res.professional ? {
          id: res.professional.id,
          fullName: `${res.professional.firstName} ${res.professional.lastName}`,
          documentNumber: res.professional.documentNumber,
          professionalRole: res.professional.professionalRole,
          matricula: res.professional.matricula,
          profilePhotoUrl: res.professional.profilePhotoUrl,
        } : undefined,
        authorization: res.authorization ? {
          id: res.authorization.id,
          purpose: res.authorization.purpose,
          establishmentName: res.authorization.establishmentName,
          validUntil: res.authorization.validUntil,
          timeWindow: `${res.authorization.startTime || '08:00'} - ${res.authorization.endTime || '18:00'}`,
        } : undefined,
      });
    } catch (err: any) {
      setValidationResult({
        decision: 'DENIED',
        reasonCode: 'ERROR_CONEXION',
        message: err.message || 'Error de comunicación con el servicio central de validación',
        timestamp: new Date().toLocaleTimeString('es-AR'),
        method: 'QR',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // METHOD 2: Validate Manual Code (DNI or Credential Code)
  const handleValidateManual = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualCodeInput.trim()) return;

    setIsProcessing(true);
    setCheckInSavedNotice(null);

    try {
      const res = await api.validateAccessByCode({
        code: manualCodeInput.trim(),
        establishmentId: selectedEstId,
        validatorDeviceId: `GARITA-MANUAL-${selectedEstId}`,
      });

      setValidationResult({
        decision: res.decision,
        reasonCode: res.reasonCode,
        message: res.message,
        accessEventId: res.accessEventId,
        timestamp: new Date().toLocaleTimeString('es-AR'),
        method: (res as any).method === 'QR_ESTATICO' ? 'QR_ESTATICO' : 'MANUAL',
        credentialId: res.credential?.id || manualCodeInput.trim(),
        professional: res.professional ? {
          id: res.professional.id,
          fullName: (res.professional as any).fullName || `${res.professional.firstName} ${res.professional.lastName}`,
          documentNumber: res.professional.documentNumber,
          professionalRole: res.professional.professionalRole,
          matricula: res.professional.matricula,
          profilePhotoUrl: res.professional.profilePhotoUrl,
        } : undefined,
        authorization: res.authorization ? {
          id: res.authorization.id,
          purpose: res.authorization.purpose,
          establishmentName: res.authorization.establishmentName,
          validUntil: res.authorization.validUntil,
          timeWindow: (res.authorization as any).timeWindow,
        } : undefined,
      });
    } catch (err: any) {
      setValidationResult({
        decision: 'DENIED',
        reasonCode: 'ERROR_CONEXION',
        message: err.message || 'Error durante la consulta del código',
        timestamp: new Date().toLocaleTimeString('es-AR'),
        method: 'MANUAL',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Simulation Test Buttons
  const handleSimulateScenario = async (scenario: 'VALID_MARCELA' | 'VALID_ROMINA' | 'REVOKED' | 'EXPIRED' | 'WRONG_EST') => {
    setIsProcessing(true);
    try {
      if (scenario === 'VALID_MARCELA') {
        const res = await api.getDynamicQR('CRED-001');
        setRawScanJson(JSON.stringify(res.dynamicQR, null, 2));
        setActiveMethod('scan');
        await handleValidateQR(res.dynamicQR);
      } else if (scenario === 'VALID_ROMINA') {
        setManualCodeInput('35412780'); // DNI Romina
        setActiveMethod('manual');
        const res = await api.validateAccessByCode({
          code: '35412780',
          establishmentId: selectedEstId,
        });
        setValidationResult({
          decision: res.decision,
          reasonCode: res.reasonCode,
          message: res.message,
          accessEventId: res.accessEventId,
          timestamp: new Date().toLocaleTimeString('es-AR'),
          method: 'MANUAL',
          credentialId: 'CRED-002',
          professional: res.professional ? {
            id: res.professional.id,
            fullName: (res.professional as any).fullName || `${res.professional.firstName} ${res.professional.lastName}`,
            documentNumber: res.professional.documentNumber,
            professionalRole: res.professional.professionalRole,
            matricula: res.professional.matricula,
            profilePhotoUrl: res.professional.profilePhotoUrl,
          } : undefined,
          authorization: res.authorization as any,
        });
      } else if (scenario === 'REVOKED') {
        setManualCodeInput('CRED-REVOKED-004');
        setActiveMethod('manual');
        const res = await api.validateAccessByCode({
          code: 'CRED-REVOKED-004',
          establishmentId: selectedEstId,
        });
        setValidationResult({
          decision: res.decision,
          reasonCode: res.reasonCode,
          message: res.message,
          accessEventId: res.accessEventId,
          timestamp: new Date().toLocaleTimeString('es-AR'),
          method: 'MANUAL',
          credentialId: 'CRED-REVOKED-004',
          professional: res.professional as any,
        });
      } else if (scenario === 'EXPIRED') {
        setManualCodeInput('CRED-EXPIRED-006');
        setActiveMethod('manual');
        const res = await api.validateAccessByCode({
          code: 'CRED-EXPIRED-006',
          establishmentId: selectedEstId,
        });
        setValidationResult({
          decision: res.decision,
          reasonCode: res.reasonCode,
          message: res.message,
          accessEventId: res.accessEventId,
          timestamp: new Date().toLocaleTimeString('es-AR'),
          method: 'MANUAL',
          credentialId: 'CRED-EXPIRED-006',
        });
      } else if (scenario === 'WRONG_EST') {
        const res = await api.getDynamicQR('CRED-001'); // U33 Los Hornos
        const badPayload = { ...res.dynamicQR, eid: 'EST-U50' }; // Mandar a Batán
        setRawScanJson(JSON.stringify(badPayload, null, 2));
        setActiveMethod('scan');
        await handleValidateQR(badPayload);
      }
    } catch (e: any) {
      alert(e.message || 'Error en simulación');
    } finally {
      setIsProcessing(false);
    }
  };

  // ONE-CLICK OFFICIAL CHECK-IN REGISTRATION
  const handleConfirmOfficialCheckIn = async () => {
    if (!validationResult || validationResult.decision !== 'ALLOWED') return;

    setIsSavingCheckIn(true);
    try {
      const res = await api.confirmCheckIn({
        accessEventId: validationResult.accessEventId,
        method: validationResult.method,
        establishmentId: selectedEstId,
        professionalId: validationResult.professional?.id,
        credentialId: validationResult.credentialId,
        notes: `Control en garita realizado por ${currentUser?.name || 'Personal Autorizado SPB'}.`,
      });

      setCheckInSavedNotice(res.message);
      // Reload checkins
      const updated = await api.getCheckIns();
      setRecentCheckIns(updated);
    } catch (err: any) {
      alert(err.message || 'Error al guardar el ingreso en guardia');
    } finally {
      setIsSavingCheckIn(false);
    }
  };

  const selectedEstablishmentObj = establishments.find((e) => e.id === selectedEstId);

  // If user is not logged in or lacks permissions for INGRESOS
  if (!currentUser || !isAuthorizedRole) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-3xl border-2 border-slate-900 shadow-2xl p-8 sm:p-12 text-center space-y-6 animate-fadeIn">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 text-emerald-400 flex items-center justify-center text-3xl shadow-md border-2 border-emerald-400/40">
          <i className="fa-solid fa-shield-halved"></i>
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider">
            Zona Operativa Restringida · Control de Ingresos SPB
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Acceso Exclusivo para Personal Autorizado
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            El módulo de <strong>Ingresos y Control de Acceso</strong> está reservado para personal de guardia de unidades penitenciarias, directivos y administradores homologados de SIFFA.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 text-left space-y-1.5">
          <p className="font-bold text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-amber-600"></i>
            <span>Protocolo de Seguridad Penitenciaria</span>
          </p>
          <p className="leading-relaxed">
            Por disposición reglamentaria del Ministerio de Justicia y Derechos Humanos, cada validación en garita debe quedar registrada bajo el usuario oficial del operador a cargo.
          </p>
        </div>

        <button
          onClick={onOpenGoogleAuth}
          className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-950/20 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-key text-amber-300"></i>
          <span>Identificarme como Personal Autorizado</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner de Control de Ingresos */}
      <div className="bg-[#001738] rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600/30 border border-emerald-400/40 text-emerald-400 flex items-center justify-center text-2xl shrink-0">
            <i className="fa-solid fa-shield-check"></i>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-1">
              <span>Puesto de Control de Guardia</span>
              <span>·</span>
              <span>{currentUser.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Control Operativo de Ingresos Penitenciarios
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Validación de credenciales de identificación SIFFA y verificación de autorizaciones previas vigentes.
            </p>
          </div>
        </div>

        {/* Selector de Establecimiento Activo */}
        <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-700 w-full md:w-auto">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Unidad Penitenciaria (Puesto Activo):
          </label>
          <select
            value={selectedEstId}
            onChange={(e) => setSelectedEstId(e.target.value)}
            className="w-full bg-[#001738] text-white border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
          >
            {establishments.map((est) => (
              <option key={est.id} value={est.id}>
                {est.name} ({est.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aclaración Legal Obligatoria y Permanente */}
      <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl px-5 py-3 text-xs text-amber-950 flex items-center gap-3 shadow-xs">
        <i className="fa-solid fa-scale-balanced text-amber-700 text-base shrink-0"></i>
        <p className="font-semibold leading-relaxed">
          <strong className="font-black text-amber-900 uppercase tracking-wide mr-1.5">Aviso Normativo Obligatorio:</strong>
          La decisión final de ingreso corresponde siempre a la autoridad penitenciaria, incluso con credencial y autorización vigentes. La credencial de SIFFA acredita vínculo institucional y no reemplaza la orden de ingreso de la Unidad.
        </p>
      </div>

      {/* Selector de Métodos de Validación: 1. Escanear QR / 2. Ingresar Código Manual */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMethod('scan')}
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeMethod === 'scan'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className="fa-solid fa-qrcode"></i>
              <span>1. Escanear Código QR</span>
            </button>

            <button
              onClick={() => setActiveMethod('manual')}
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeMethod === 'manual'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className="fa-solid fa-keyboard"></i>
              <span>2. Ingresar Código Manualmente</span>
            </button>
          </div>

          {/* Simuladores de Escenario para Pruebas Rápidas */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">Pruebas Rápidas:</span>
            <button
              onClick={() => handleSimulateScenario('VALID_MARCELA')}
              className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg font-bold text-[11px] border border-emerald-300 cursor-pointer"
              title="Docente autorizada U33"
            >
              Válida (QR)
            </button>
            <button
              onClick={() => handleSimulateScenario('VALID_ROMINA')}
              className="px-2.5 py-1 bg-sky-50 text-sky-800 hover:bg-sky-100 rounded-lg font-bold text-[11px] border border-sky-300 cursor-pointer"
              title="Validar por DNI"
            >
              Válida (DNI)
            </button>
            <button
              onClick={() => handleSimulateScenario('REVOKED')}
              className="px-2.5 py-1 bg-rose-50 text-rose-800 hover:bg-rose-100 rounded-lg font-bold text-[11px] border border-rose-300 cursor-pointer"
              title="Credencial revocada"
            >
              Revocada
            </button>
            <button
              onClick={() => handleSimulateScenario('EXPIRED')}
              className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg font-bold text-[11px] border border-amber-300 cursor-pointer"
              title="Credencial vencida"
            >
              Vencida
            </button>
          </div>
        </div>

        {/* Panel del Método 1: Escanear QR */}
        {activeMethod === 'scan' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl">
                <i className="fa-solid fa-camera"></i>
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Lector de Código QR Dinámico
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apunte la cámara del dispositivo a la credencial del profesional, o pegue el payload JSON del código QR en el campo inferior para validación inmediata.
                </p>
              </div>

              <div className="max-w-lg mx-auto space-y-3 text-left">
                <textarea
                  value={rawScanJson}
                  onChange={(e) => setRawScanJson(e.target.value)}
                  placeholder='Pegue aquí el JSON o código QR escaneado (ej: {"ver":1,"cid":"CRED-001"...})'
                  rows={3}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  onClick={() => handleValidateQR()}
                  disabled={isProcessing}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-bolt"></i>
                  <span>{isProcessing ? 'Verificando con Servidor SIFFA...' : 'Validar Credencial Escaneada'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Panel del Método 2: Ingresar Código Manual */}
        {activeMethod === 'manual' && (
          <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200">
            <form onSubmit={handleValidateManual} className="max-w-xl mx-auto space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center text-3xl">
                <i className="fa-solid fa-id-card"></i>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Validación Manual en Contingencia y Credencial Física
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ingrese el número de DNI, Identificador de Credencial o Token Fijo del carnet impreso (ej. <strong>CRED-001</strong>, <strong>STK-9F4A81BC2289</strong> o <strong>32849120</strong>).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  placeholder="Ej: CRED-PHYS-001, STK-9F4A81BC2289 o DNI 32849120"
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
                >
                  {isProcessing ? 'Buscando...' : 'Comprobar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* RESULTADO DE LA VALIDACIÓN VISUALMENTE INMEDIATO */}
        {validationResult && (
          <div className="pt-2 animate-scaleUp">
            {validationResult.decision === 'ALLOWED' ? (
              /* RESULTADO VÁLIDO: Banner verde institucional prominente */
              <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-md">
                      <i className="fa-solid fa-circle-check"></i>
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">
                        Control de Identificación SIFFA · Guardia SPB
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight leading-none">
                        AUTORIZACIÓN PREVIA VIGENTE
                      </h2>
                      <p className="text-xs font-black text-emerald-800 mt-1 uppercase tracking-wide">
                        Sujeto a control de la Unidad Penitenciaria
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-200/60 px-3 py-1 rounded-full">
                      Hora: {validationResult.timestamp}
                    </span>
                  </div>
                </div>

                {/* Advertencia Legal Operativa Obligatoria */}
                <div className="bg-amber-100/90 border border-amber-300 rounded-2xl p-3 text-xs text-amber-950 flex items-start gap-2.5">
                  <i className="fa-solid fa-scale-balanced text-amber-700 text-sm mt-0.5 shrink-0"></i>
                  <div>
                    <strong className="font-black text-amber-950 block">Aclaración Legal y Operativa:</strong>
                    <span className="text-[11px] text-amber-900 leading-snug">
                      La decisión final de ingreso corresponde siempre a la autoridad penitenciaria, incluso con credencial y autorización vigentes.
                    </span>
                  </div>
                </div>

                {/* Datos del Profesional */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  <div className="sm:col-span-1 text-center sm:text-left">
                    <img
                      src={validationResult.professional?.profilePhotoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'}
                      alt="Foto Profesional"
                      className="w-28 h-28 mx-auto sm:mx-0 rounded-2xl object-cover border-4 border-emerald-400 shadow-md"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-3">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase text-emerald-700 tracking-wider">
                        {validationResult.professional?.professionalRole || 'DOCENTE'}
                      </span>
                      <h3 className="text-2xl font-black text-slate-900">
                        {validationResult.professional?.fullName}
                      </h3>
                      <p className="text-xs text-slate-600 font-mono mt-0.5">
                        DNI: {validationResult.professional?.documentNumber} · Matrícula: {validationResult.professional?.matricula || 'Homologada'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs bg-white/80 p-3.5 rounded-2xl border border-emerald-200">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Establecimiento Homologado:</span>
                        <span className="font-extrabold text-slate-800">
                          {validationResult.authorization?.establishmentName || selectedEstablishmentObj?.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Actividad y Horario:</span>
                        <span className="font-extrabold text-emerald-800">
                          {validationResult.authorization?.purpose || 'Taller Deportivo'} ({validationResult.authorization?.timeWindow || '08:00 - 18:00'})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón de Registro de Ingreso */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-emerald-200">
                  <div className="text-xs text-emerald-900 flex items-center gap-2">
                    <i className="fa-solid fa-fingerprint text-emerald-600 text-base"></i>
                    <span>
                      Método de verificación:{' '}
                      <strong>
                        {validationResult.method === 'QR'
                          ? 'Código QR Dinámico (Ed25519 con TTL)'
                          : validationResult.method === 'QR_ESTATICO'
                          ? 'Código QR Fijo · Credencial Física'
                          : 'Validación Manual por Padrón'}
                      </strong>
                    </span>
                  </div>

                  <button
                    onClick={handleConfirmOfficialCheckIn}
                    disabled={isSavingCheckIn || !!checkInSavedNotice}
                    className="w-full sm:w-auto px-8 py-4 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2.5 hover:scale-[1.02]"
                  >
                    <i className="fa-solid fa-clipboard-check text-amber-300 text-base"></i>
                    <span>
                      {isSavingCheckIn
                        ? 'Registrando en Libro...'
                        : checkInSavedNotice
                        ? 'Ingreso Asentado en Guardia'
                        : 'REGISTRAR INGRESO EN LIBRO DE GUARDIA'}
                    </span>
                  </button>
                </div>

                {checkInSavedNotice && (
                  <div className="p-3 bg-emerald-200 text-emerald-950 font-bold text-xs rounded-xl flex items-center gap-2">
                    <i className="fa-solid fa-circle-check text-emerald-700"></i>
                    <span>{checkInSavedNotice}</span>
                  </div>
                )}
              </div>
            ) : (
              /* RESULTADO INVÁLIDO: Banner rojo institucional */
              <div className="bg-rose-50 border-2 border-rose-500 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
                <div className="flex items-center gap-3 border-b border-rose-200 pb-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-2xl shadow-md">
                    <i className="fa-solid fa-ban"></i>
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-800 block">
                      Seguridad Penitenciaria · Acceso Denegado
                    </span>
                    <h2 className="text-2xl font-black text-rose-950 tracking-tight leading-none">
                      CREDENCIAL NO VÁLIDA
                    </h2>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-rose-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <span>Causa: {validationResult.message}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Código de resolución técnica: <span className="font-mono font-bold text-rose-900 bg-rose-100 px-2 py-0.5 rounded">{validationResult.reasonCode}</span>.
                    Por estrictas normas del Servicio Penitenciario Bonaerense, la persona no está habilitada para ingresar al establecimiento en este momento.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historial Reciente de Ingresos Registrados en este Puesto */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
              Auditoría en Tiempo Real
            </span>
            <h3 className="text-lg font-black text-slate-900">
              Últimos Ingresos Registrados en el Puesto de Control
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500 font-mono">
            Total en Guardia: {recentCheckIns.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Registro</th>
                <th className="py-2.5 px-3">Profesional</th>
                <th className="py-2.5 px-3">DNI</th>
                <th className="py-2.5 px-3">Establecimiento</th>
                <th className="py-2.5 px-3">Método</th>
                <th className="py-2.5 px-3">Guardia Responsable</th>
                <th className="py-2.5 px-3">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentCheckIns.slice(0, 6).map((c) => (
                <tr key={c.validationId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{c.validationId}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{c.professionalName}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{c.documentNumber}</td>
                  <td className="py-2.5 px-3 text-slate-700">{c.establishmentName}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.method === 'QR' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {c.method}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{c.guardName}</td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                    {new Date(c.timestamp).toLocaleString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
