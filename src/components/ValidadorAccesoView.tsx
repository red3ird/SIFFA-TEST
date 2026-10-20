import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SiffaLogo } from './SiffaLogo';
import {
  Establishment,
  DynamicQRPayload,
  ValidationMode,
  AccessEvent,
  OfflinePackage,
  Credential,
} from '../types';

interface ValidadorAccesoViewProps {
  initialPayload?: DynamicQRPayload | null;
  initialEstablishmentId?: string;
}

export const ValidadorAccesoView: React.FC<ValidadorAccesoViewProps> = ({
  initialPayload,
  initialEstablishmentId,
}) => {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstId, setSelectedEstId] = useState<string>(initialEstablishmentId || 'EST-U33');
  const [validationMode, setValidationMode] = useState<ValidationMode>('ONLINE');
  const [offlinePackage, setOfflinePackage] = useState<OfflinePackage | null>(null);
  const [isDownloadingPackage, setIsDownloadingPackage] = useState(false);

  // Scanner Input
  const [rawPayloadInput, setRawPayloadInput] = useState<string>('');
  const [credentials, setCredentials] = useState<Credential[]>([]);

  // Validation Result State
  const [decisionResult, setDecisionResult] = useState<{
    decision: 'ALLOWED' | 'DENIED';
    reasonCode: string;
    message: string;
    professionalName?: string;
    documentNumber?: string;
    role?: string;
    timestamp?: string;
    mode?: string;
  } | null>(null);

  const [recentEvents, setRecentEvents] = useState<AccessEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [ests, creds, events] = await Promise.all([
          api.getEstablishments(),
          api.getCredentials(),
          api.getAccessEvents(),
        ]);
        setEstablishments(ests);
        setCredentials(creds);
        setRecentEvents(events);
      } catch (e) {
        console.error('Error al cargar datos del validador', e);
      }
    }
    loadData();
  }, []);

  // Sync initial payload if provided
  useEffect(() => {
    if (initialPayload) {
      setRawPayloadInput(JSON.stringify(initialPayload, null, 2));
      if (initialEstablishmentId) setSelectedEstId(initialEstablishmentId);
    }
  }, [initialPayload, initialEstablishmentId]);

  // Handle Offline package download
  const handleDownloadOfflinePackage = async () => {
    setIsDownloadingPackage(true);
    try {
      const pkg = await api.getOfflinePackage(selectedEstId);
      setOfflinePackage(pkg);
    } catch (e: any) {
      alert(e.message || 'Error al descargar paquete offline');
    } finally {
      setIsDownloadingPackage(false);
    }
  };

  // Perform Validation
  const handleValidatePayload = async (payloadToValidate?: DynamicQRPayload) => {
    let payload: DynamicQRPayload;

    const trimmedInput = rawPayloadInput.trim();

    // Soporte para Código QR Fijo institucional (URL /v/:qrToken o token opaco seguro)
    if (!payloadToValidate && (trimmedInput.includes('/v/') || (!trimmedInput.startsWith('{') && trimmedInput.length > 0))) {
      const token = trimmedInput.replace(/.*\/v\//, '').trim();
      setIsProcessing(true);
      try {
        const verifyRes = await api.getPublicVerification(token);
        if (verifyRes.valid && verifyRes.status === 'ACTIVA') {
          const authText = verifyRes.validatorContext?.authorizationStatusText || 'AUTORIZACIÓN PREVIA VIGENTE';
          const authNotice = verifyRes.validatorContext?.disclaimerPenitenciaria || 'El ingreso efectivo queda sujeto al control de la Unidad.';
          setDecisionResult({
            decision: 'ALLOWED',
            reasonCode: 'QR_FIJO_VINCULO_VALIDO',
            message: `${authText} · ${authNotice}`,
            professionalName: verifyRes.personName,
            role: verifyRes.roleInSiffa,
            timestamp: new Date().toLocaleTimeString(),
            mode: 'QR_FIJO_PUBLICO',
          });
        } else {
          setDecisionResult({
            decision: 'DENIED',
            reasonCode: 'CREDENCIAL_NO_VIGENTE',
            message: verifyRes.reason || 'Credencial no vigente o suspendida. Sin habilitación para ingreso.',
            timestamp: new Date().toLocaleTimeString(),
            mode: 'QR_FIJO_PUBLICO',
          });
        }
      } catch (err: any) {
        setDecisionResult({
          decision: 'DENIED',
          reasonCode: 'ERROR_VERIFICACION',
          message: err.message || 'Error al validar token de credencial.',
          timestamp: new Date().toLocaleTimeString(),
        });
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (payloadToValidate) {
      payload = payloadToValidate;
    } else {
      try {
        payload = JSON.parse(rawPayloadInput);
      } catch {
        setDecisionResult({
          decision: 'DENIED',
          reasonCode: 'JSON_INVALIDO',
          message: 'El texto escaneado no es un JSON válido ni una URL válida /v/:qrToken.',
          timestamp: new Date().toLocaleTimeString(),
        });
        return;
      }
    }

    setIsProcessing(true);

    try {
      if (validationMode === 'ONLINE') {
        // ONLINE validation against server
        const res = await api.validateAccessOnline({
          qrPayload: payload,
          establishmentId: selectedEstId,
          validatorDeviceId: 'GARITA-SPB-CONTROL-01',
        });

        setDecisionResult({
          decision: res.decision,
          reasonCode: res.reasonCode,
          message: res.message,
          professionalName: res.professional ? `${res.professional.firstName} ${res.professional.lastName}` : undefined,
          documentNumber: res.professional?.documentNumber,
          role: res.professional?.professionalRole,
          timestamp: new Date().toLocaleTimeString(),
          mode: 'ONLINE',
        });

        // Refresh recent events
        const updatedEvents = await api.getAccessEvents();
        setRecentEvents(updatedEvents);
      } else {
        // OFFLINE validation using TweetNaCl detached verification + cached package
        if (!offlinePackage) {
          setDecisionResult({
            decision: 'DENIED',
            reasonCode: 'PAQUETE_OFFLINE_NO_DISPONIBLE',
            message: 'Debe descargar el paquete offline de esta unidad antes de validar sin conexión.',
            timestamp: new Date().toLocaleTimeString(),
            mode: 'OFFLINE',
          });
          setIsProcessing(false);
          return;
        }

        const res = api.validateAccessOffline({
          qrPayload: payload,
          offlinePackage: offlinePackage,
          targetEstablishmentId: selectedEstId,
        });

        setDecisionResult({
          decision: res.decision,
          reasonCode: res.reasonCode,
          message: res.message,
          professionalName: res.credential?.professionalName,
          documentNumber: res.credential?.documentNumber,
          role: res.credential?.professionalRole,
          timestamp: new Date().toLocaleTimeString(),
          mode: 'OFFLINE (TweetNaCl Ed25519)',
        });
      }
    } catch (e: any) {
      setDecisionResult({
        decision: 'DENIED',
        reasonCode: 'ERROR_CONEXION',
        message: e.message || 'Error durante la verificación',
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Scenario Generators for Testing
  const handleTestScenario = async (type: 'VALID' | 'WRONG_ESTABLISHMENT' | 'REVOKED' | 'EXPIRED' | 'TAMPERED_SIG') => {
    setIsProcessing(true);
    try {
      // 1. Valid Active credential (Marcela Giménez)
      const validCred = credentials.find((c) => c.status === 'ACTIVE') || credentials[0];
      const res = await api.getDynamicQR(validCred ? validCred.id : 'CRED-001');
      let payload = { ...res.dynamicQR };

      if (type === 'WRONG_ESTABLISHMENT') {
        // Target establishment differs from authorization
        payload.eid = 'EST-U50'; // Batán
      } else if (type === 'REVOKED') {
        // Use a revoked credential
        const revoked = credentials.find((c) => c.status === 'REVOKED');
        if (revoked) {
          const revRes = await api.getDynamicQR(revoked.id);
          payload = { ...revRes.dynamicQR };
        } else {
          payload.cid = 'CRED-REVOKED-TEST';
        }
      } else if (type === 'EXPIRED') {
        // Expired timestamp (issued 2 hours ago)
        payload.exp = Math.floor(Date.now() / 1000) - 7200;
        payload.iat = payload.exp - 90;
      } else if (type === 'TAMPERED_SIG') {
        // Tamper signature with corrupt hex
        payload.sig = 'bad00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001';
      }

      setRawPayloadInput(JSON.stringify(payload, null, 2));
      await handleValidatePayload(payload);
    } catch (e: any) {
      alert(e.message || 'Error en prueba de escenario');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedEst = establishments.find((e) => e.id === selectedEstId);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Puesto de Control */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <SiffaLogo size="md" />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <i className="fa-solid fa-building-shield text-emerald-400"></i>
              <span>Puesto de Control Penitenciario · Garita de Guardia</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Validador Criptográfico de Acceso Físico
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Motor de decisión contextual con firma asimétrica Ed25519 y soporte modo desconectado (Offline).
            </p>
          </div>
        </div>

        {/* Configuración de Garita: Establecimiento & Modo Online/Offline */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs flex items-center gap-2">
            <label className="font-bold text-slate-600">Establecimiento:</label>
            <select
              value={selectedEstId}
              onChange={(e) => setSelectedEstId(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
            >
              {establishments.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.name} ({est.code})
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Online / Offline */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setValidationMode('ONLINE')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                validationMode === 'ONLINE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-wifi text-[10px]"></i>
              <span>ONLINE</span>
            </button>
            <button
              onClick={() => {
                setValidationMode('OFFLINE');
                if (!offlinePackage) handleDownloadOfflinePackage();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                validationMode === 'OFFLINE'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-cloud-slash text-[10px]"></i>
              <span>OFFLINE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Banner de Estado Offline si aplica */}
      {validationMode === 'OFFLINE' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center text-amber-800 shrink-0">
              <i className="fa-solid fa-plane-slash"></i>
            </div>
            <div>
              <p className="font-bold">Modo Desconectado Activo (Sin Acceso a Internet)</p>
              <p className="text-[11px] text-amber-700">
                {offlinePackage
                  ? `Paquete v${offlinePackage.packageVersion} cargado para ${offlinePackage.establishmentName}. Clave pública Ed25519 lista.`
                  : 'Descargue el paquete de credenciales local para verificar firmas desconectado.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadOfflinePackage}
            disabled={isDownloadingPackage}
            className="px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            <i className={`fa-solid fa-download ${isDownloadingPackage ? 'fa-spin' : ''}`}></i>
            <span>{offlinePackage ? 'Actualizar Paquete Offline' : 'Descargar Paquete'}</span>
          </button>
        </div>
      )}

      {/* Grid: Escaneo / Pruebas & Resultado de Acceso */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Escenarios de Prueba & Entrada de Payload */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Card: Botones de Pruebas de Decisión Contextual */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <i className="fa-solid fa-vial-circle-check text-emerald-600"></i>
                <span>Simulador de Escaneo en Garita (1-Click)</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                {selectedEst?.code}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Pruebe cómo el motor contextual evalúa cada regla de seguridad:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => handleTestScenario('VALID')}
                disabled={isProcessing}
                className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <i className="fa-solid fa-circle-check text-emerald-600 text-base"></i>
                  <div>
                    <p className="font-bold">1. Credencial Válida en Horario</p>
                    <p className="text-[10px] text-emerald-700 font-normal">
                      Firma auténtica, establecimiento coincide y autorización activa
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                  HABILITADO
                </span>
              </button>

              <button
                onClick={() => handleTestScenario('WRONG_ESTABLISHMENT')}
                disabled={isProcessing}
                className="p-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-950 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <i className="fa-solid fa-map-location-dot text-rose-600 text-base"></i>
                  <div>
                    <p className="font-bold">2. Establecimiento Incorrecto</p>
                    <p className="text-[10px] text-rose-700 font-normal">
                      Profesional autorizado para otra unidad (ej: Batán en vez de Los Hornos)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full font-mono">
                  DENEGADO
                </span>
              </button>

              <button
                onClick={() => handleTestScenario('REVOKED')}
                disabled={isProcessing}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <i className="fa-solid fa-ban text-slate-700 text-base"></i>
                  <div>
                    <p className="font-bold">3. Credencial Revocada Administrativamente</p>
                    <p className="text-[10px] text-slate-600 font-normal">
                      Pase revocado por auditoría o suspensión preventiva
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                  REVOCADA
                </span>
              </button>

              <button
                onClick={() => handleTestScenario('EXPIRED')}
                disabled={isProcessing}
                className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <i className="fa-solid fa-hourglass-end text-amber-600 text-base"></i>
                  <div>
                    <p className="font-bold">4. Código QR Dinámico Expirado</p>
                    <p className="text-[10px] text-amber-700 font-normal">
                      Token QR mayor a 90 segundos de antigüedad (previene capturas de pantalla)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-mono">
                  EXPIRADO
                </span>
              </button>

              <button
                onClick={() => handleTestScenario('TAMPERED_SIG')}
                disabled={isProcessing}
                className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-950 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <i className="fa-solid fa-shield-virus text-purple-600 text-base"></i>
                  <div>
                    <p className="font-bold">5. Firma Criptográfica Adulterada</p>
                    <p className="text-[10px] text-purple-700 font-normal">
                      Firma Ed25519 no coincide con la clave pública de SIFFA
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-mono">
                  FIRMA INVALIDA
                </span>
              </button>
            </div>
          </div>

          {/* Card: Entrada Manual / Scanner Óptico Raw */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <i className="fa-solid fa-qrcode text-slate-700"></i>
              <span>Lectura Directa de Payload QR (Cámara o Raw)</span>
            </h3>
            <textarea
              rows={4}
              value={rawPayloadInput}
              onChange={(e) => setRawPayloadInput(e.target.value)}
              placeholder='Pegue aquí el JSON del QR dinámico (ej: {"ver":1,"cid":"CRED-001","sig":"..."})'
              className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            <button
              onClick={() => handleValidatePayload()}
              disabled={isProcessing || !rawPayloadInput.trim()}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <i className={`fa-solid fa-magnifying-glass ${isProcessing ? 'fa-spin' : ''}`}></i>
              <span>Verificar y Evaluar Decisión de Ingreso</span>
            </button>
          </div>

        </div>

        {/* Columna Derecha: Pantalla de Decisión de Garita (HUD) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Pantalla Principal de Decisión de Acceso */}
          <div className={`rounded-3xl p-6 border-2 shadow-2xl transition-all relative overflow-hidden ${
            !decisionResult
              ? 'bg-slate-900 text-white border-slate-800'
              : decisionResult.decision === 'ALLOWED'
              ? 'bg-gradient-to-br from-emerald-950 via-[#001738] to-slate-950 text-white border-emerald-500'
              : 'bg-gradient-to-br from-rose-950 via-[#1a0008] to-slate-950 text-white border-rose-500'
          }`}>
            
            {/* Header del HUD */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-terminal text-emerald-400"></i>
                <span>PUESTO DE CONTROL · {selectedEst?.code}</span>
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/10">
                MODO: {validationMode}
              </span>
            </div>

            {/* Gran Indicador de Decisión */}
            <div className="py-8 text-center space-y-3">
              {!decisionResult ? (
                <div className="space-y-3 py-6 text-slate-400">
                  <div className="w-16 h-16 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 text-2xl">
                    <i className="fa-solid fa-barcode fa-beat-fade"></i>
                  </div>
                  <h3 className="text-base font-bold text-slate-300">
                    A la espera de escaneo en garita...
                  </h3>
                  <p className="text-xs max-w-xs mx-auto">
                    Seleccione un escenario de prueba a la izquierda o acerque el código QR dinámico.
                  </p>
                </div>
              ) : decisionResult.decision === 'ALLOWED' ? (
                <div className="space-y-3">
                  <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/40 animate-scaleUp">
                    <i className="fa-solid fa-check"></i>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-black text-emerald-400 tracking-widest uppercase">
                      RESOLUCIÓN SPB · CONSTANCIA OFICIAL
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      AUTORIZACIÓN PREVIA VIGENTE
                    </h2>
                    <p className="text-xs text-emerald-300 font-bold italic pt-1">
                      El ingreso efectivo queda sujeto al control de la Unidad.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-20 h-20 mx-auto rounded-full bg-rose-600 text-white flex items-center justify-center text-4xl shadow-lg shadow-rose-600/40 animate-scaleUp">
                    <i className="fa-solid fa-xmark"></i>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-black text-rose-400 tracking-widest uppercase">
                      RESOLUCIÓN SPB · CONTROL DE ACCESO
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      SIN AUTORIZACIÓN PREVIA VIGENTE
                    </h2>
                    <p className="text-xs text-rose-300 font-medium italic pt-1">
                      No registra habilitación válida para este establecimiento o franja horaria.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Ficha Contextual si hubo evaluación */}
            {decisionResult && (
              <div className="bg-black/40 rounded-2xl p-4 border border-white/10 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-slate-400 font-bold">CÓDIGO DE MOTIVO:</span>
                  <span className={`font-mono font-black px-2 py-0.5 rounded text-[11px] ${
                    decisionResult.decision === 'ALLOWED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {decisionResult.reasonCode}
                  </span>
                </div>

                <p className="text-slate-200 text-xs leading-relaxed">
                  {decisionResult.message}
                </p>

                {decisionResult.professionalName && (
                  <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-white/10">
                    <div>
                      <span className="text-slate-400 block font-sans text-[9px]">PROFESIONAL:</span>
                      <strong className="text-white">{decisionResult.professionalName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans text-[9px]">DNI:</span>
                      <strong className="text-white">{decisionResult.documentNumber || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans text-[9px]">FUNCIÓN:</span>
                      <strong className="text-emerald-400">{decisionResult.role || 'DOCENTE'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans text-[9px]">HORA EVENTO:</span>
                      <strong className="text-slate-300">{decisionResult.timestamp}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer del HUD */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>ESTACIÓN: GARITA-SPB-CONTROL-01</span>
              <span>FIRMA ASIMÉTRICA ED25519</span>
            </div>

          </div>

          {/* Tabla de Eventos Recientes de Acceso en Vivo */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-list-check text-slate-600"></i>
                <span>Registro de Decisiones en Garita (Log en Vivo)</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-500">
                {recentEvents.length} eventos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] text-slate-400 uppercase font-mono">
                    <th className="py-2">Hora</th>
                    <th className="py-2">Profesional</th>
                    <th className="py-2">Decisión</th>
                    <th className="py-2">Motivo</th>
                    <th className="py-2">Modo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {recentEvents.slice(0, 6).map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50">
                      <td className="py-2 text-slate-500">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                      <td className="py-2 font-sans font-bold text-slate-800">{ev.professionalName || ev.professionalId}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          ev.decision === 'ALLOWED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {ev.decision}
                        </span>
                      </td>
                      <td className="py-2 text-slate-600 text-[10px]">{ev.reasonCode}</td>
                      <td className="py-2 text-[10px] text-slate-400">{ev.validationMode}</td>
                    </tr>
                  ))}
                  {recentEvents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400 text-xs">
                        No hay registros de acceso aún
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
