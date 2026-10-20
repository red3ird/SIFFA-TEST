/**
 * ============================================================================
 * [FASE 2] CREDENCIAL DIGITAL DINÁMICA ASIMÉTRICA (Ed25519 90s / Offline CRL)
 * ============================================================================
 * Este componente implementa el flujo de QR rotativo dinámico de 90 segundos con
 * firma criptográfica Ed25519, paquete offline y control anti-replay en memoria.
 * 
 * Estado: DESACTIVADO DEL FLUJO PRINCIPAL Y MARCADO COMO FASE 2.
 * El flujo principal activo utiliza la credencial con QR fijo institucional que
 * resuelve a la URL pública /v/:qrToken (MiCredencialView y PublicVerifyView).
 * Este módulo se preserva íntegramente para su reincorporación como complemento
 * avanzado en la Fase 2.
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { api } from '../services/api';
import { SiffaLogo } from './SiffaLogo';
import { BanderaArgentina } from './BanderaArgentina';
import { Professional, Credential, Authorization, DynamicQRPayload, UserProfile } from '../types';

export const LEGAL_DISCLAIMER =
  'Credencial de identificación de SIFFA. Su tenencia no implica autorización para ingresar a un establecimiento penitenciario. El acceso está sujeto a la autorización y al control de la autoridad penitenciaria.';

interface CredencialDigitalViewProps {
  onOpenValidatorWithPayload?: (payload: DynamicQRPayload, establishmentId: string) => void;
  currentUser?: UserProfile | null;
  onRequireLogin?: () => void;
}

export const CredencialDigitalView: React.FC<CredencialDigitalViewProps> = ({
  onOpenValidatorWithPayload,
  currentUser,
  onRequireLogin,
}) => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [authorizations, setAuthorizations] = useState<Authorization[]>([]);

  const [selectedProfId, setSelectedProfId] = useState<string>('PROF-01');
  const [dynamicQR, setDynamicQR] = useState<DynamicQRPayload | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [isLoadingQR, setIsLoadingQR] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [liveTime, setLiveTime] = useState<Date>(new Date());
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const clockRef = useRef<NodeJS.Timeout | null>(null);

  // Live ticking clock for anti-screenshot protection
  useEffect(() => {
    clockRef.current = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => {
      if (clockRef.current) clearInterval(clockRef.current);
    };
  }, []);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [pros, creds, auths] = await Promise.all([
          api.getProfessionals(),
          api.getCredentials(),
          api.getAuthorizations(),
        ]);
        setProfessionals(pros);
        setCredentials(creds);
        setAuthorizations(auths);
        if (pros.length > 0) {
          if (currentUser?.email) {
            const matched = pros.find(
              (p) => p.email.toLowerCase() === currentUser.email.toLowerCase()
            );
            if (matched) {
              setSelectedProfId(matched.id);
            } else {
              setSelectedProfId(pros[0].id);
            }
          } else {
            setSelectedProfId(pros[0].id);
          }
        }
      } catch (err: any) {
        setErrorMsg('Error al conectar con la API de credenciales SIFFA');
      }
    }
    loadData();
  }, [currentUser?.email]);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const userMatchedProf = professionals.find(
    (p) => p.email.toLowerCase() === currentUser?.email?.toLowerCase()
  );

  // Cada profesional o integrante SOLO ve su propia credencial vinculada a su correo; el admin puede supervisar.
  const currentProf = isSuperAdmin
    ? (professionals.find((p) => p.id === selectedProfId) || userMatchedProf || professionals[0])
    : userMatchedProf;

  const currentCred = currentProf
    ? (credentials.find((c) => c.professionalId === currentProf.id && c.status === 'ACTIVE') || credentials.find((c) => c.professionalId === currentProf.id))
    : null;
  const currentAuth = authorizations.find((a) => a.id === currentCred?.authorizationId);

  // Fetch Dynamic QR
  const fetchQR = async (credId: string) => {
    setIsLoadingQR(true);
    setErrorMsg(null);
    try {
      const res = await api.getDynamicQR(credId);
      setDynamicQR(res.dynamicQR);
      setTimeLeft(res.expiresInSeconds || 90);

      // Render crisp QR Code image with compact sizing
      const qrString = JSON.stringify(res.dynamicQR);
      const url = await QRCode.toDataURL(qrString, {
        width: 160,
        margin: 0,
        color: {
          dark: '#001738',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al generar código QR firmado');
    } finally {
      setIsLoadingQR(false);
    }
  };

  useEffect(() => {
    if (currentCred) {
      fetchQR(currentCred.id);
    }
  }, [currentCred?.id]);

  // Countdown timer for 90s dynamic QR
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (currentCred) fetchQR(currentCred.id);
          return 90;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentCred?.id]);

  const handleCopyPayload = () => {
    if (!dynamicQR) return;
    navigator.clipboard.writeText(JSON.stringify(dynamicQR, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  const handleSendToValidator = () => {
    if (dynamicQR && onOpenValidatorWithPayload) {
      onOpenValidatorWithPayload(dynamicQR, dynamicQR.eid);
    }
  };

  // BARRERA DE SEGURIDAD ESTRICTA: Autenticación obligatoria para Credencial QR
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto my-6 bg-white rounded-3xl border-2 border-slate-900 shadow-xl p-6 sm:p-8 text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-300 flex items-center justify-center text-2xl shadow-sm">
          <i className="fa-solid fa-lock"></i>
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
            <BanderaArgentina size="xs" />
            <span>Acceso Restringido · Padrón Cerrado SIFFA</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Identificación Obligatoria para Credencial QR
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Para visualizar tu credencial digital con código QR dinámico de seguridad penitenciaria (firma Ed25519), identifícate con tu cuenta autorizada de la SIFFA.
          </p>
        </div>

        <button
          onClick={onRequireLogin}
          className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/20 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-key text-amber-300"></i>
          <span>Identificarme con mi Cuenta</span>
        </button>
      </div>
    );
  }

  // Si el usuario está autenticado pero aún no tiene legajo profesional/credencial emitida
  if (currentUser && !currentProf && !isSuperAdmin) {
    return (
      <div className="max-w-xl mx-auto my-6 bg-white rounded-3xl border-2 border-slate-900 shadow-xl p-6 sm:p-8 text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-300 flex items-center justify-center text-2xl shadow-sm">
          <i className="fa-solid fa-id-card"></i>
        </div>
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
            <BanderaArgentina size="xs" />
            <span>Padrón Cerrado SIFFA · Usuario Identificado</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Credencial en Proceso de Emisión
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Hola <strong>{currentUser.name}</strong> (<span className="font-mono">{currentUser.email}</span>). Tu cuenta está activa en el padrón cerrado, pero aún no tienes una credencial oficial con firma criptográfica emitida por la Dirección del SIFFA.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto animate-fadeIn space-y-3">
      
      {/* Barra Superior Compacta: Estado y Rol */}
      <div className="bg-white rounded-2xl px-4 py-2 border border-slate-200 shadow-xs flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <BanderaArgentina size="xs" />
          <span className="font-black text-slate-900 text-xs tracking-tight">
            Pase Digital SIFFA
          </span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 hidden sm:inline">
            Firma Ed25519 · Cero Almacenamiento Local
          </span>
        </div>

        {/* Modo Administrador: selector compacto */}
        {isSuperAdmin ? (
          <div className="flex items-center gap-1.5">
            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
              Admin
            </span>
            <select
              value={selectedProfId}
              onChange={(e) => setSelectedProfId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-800 text-[11px] focus:outline-hidden"
            >
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.professionalRole})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <span className="text-[11px] text-slate-600 font-bold truncate max-w-[180px]">
            {currentProf?.firstName} {currentProf?.lastName}
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <i className="fa-solid fa-triangle-exclamation text-sm"></i>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TARJETA CREDENCIAL COMPACTA - FITS PERFECTLY IN VIEWPORT WITHOUT SCROLLING */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto bg-white rounded-3xl border-2 border-slate-900 shadow-2xl overflow-hidden relative">
        
        {/* 1. Franja Superior Institucional */}
        <div className="bg-[#001738] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <SiffaLogo size="xs" rounded="rounded-lg" />
            <div>
              <h3 className="text-xs font-black tracking-wider text-emerald-400 uppercase leading-none">
                SIFFA · CREDENCIAL OFICIAL
              </h3>
              <p className="text-[9px] text-slate-300 font-medium leading-none mt-1">
                Servicio Penitenciario Bonaerense
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md border border-white/15">
              <BanderaArgentina size="xs" />
              <span className="text-[8px] font-black tracking-widest text-sky-200 uppercase">ARG</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                currentCred?.status === 'ACTIVE' || currentCred?.status === 'activa'
                  ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {currentCred?.status === 'ACTIVE' || currentCred?.status === 'activa' ? 'ACTIVA' : currentCred?.status || 'INACTIVA'}
            </span>
          </div>
        </div>

        {/* 2. Barra Dinámica Anti-Captura en Vivo con Reloj */}
        <div className="bg-slate-900 text-white px-3.5 py-1.5 flex items-center justify-between text-[10px] border-b border-emerald-500/30 select-none">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold text-emerald-400 uppercase tracking-widest text-[9px]">
              VERIFICACIÓN ACTIVA
            </span>
          </div>
          <div className="font-mono font-bold text-slate-200 text-[10px]">
            <span>{liveTime.toLocaleTimeString('es-AR')}</span>
            <span className="text-slate-400 ml-1.5">· {liveTime.toLocaleDateString('es-AR')}</span>
          </div>
        </div>

        {/* 3. Cuerpo de la Credencial: Foto + Identidad (Compacto) */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-b from-slate-50 to-white space-y-3">
          
          <div className="flex items-center gap-3.5">
            {/* Foto Oficial del Profesional (Configurada exclusivamente desde Gestión SIFFA) */}
            <div
              data-carnet-photo="true"
              className="relative w-16 h-20 sm:w-18 sm:h-22 rounded-xl overflow-hidden bg-slate-200 border-2 border-slate-900 shrink-0 shadow-md"
              title="Foto oficial del carnet SIFFA"
            >
              {currentProf?.profilePhotoUrl ? (
                <img
                  src={currentProf.profilePhotoUrl}
                  alt={currentProf.firstName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              <div className="absolute inset-0 bg-[#001738] flex items-center justify-center text-white font-black text-sm -z-10">
                {currentProf?.firstName?.charAt(0)}{currentProf?.lastName?.charAt(0)}
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 text-white text-[7px] font-extrabold text-center py-0.5 tracking-wider uppercase flex items-center justify-center gap-0.5">
                <BanderaArgentina size="xs" />
                <span>SIFFA</span>
              </div>
            </div>

            {/* Datos Personales y Rol */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[9px] font-extrabold uppercase tracking-wide">
                  {currentProf?.professionalRole}
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  {currentProf?.id}
                </span>
              </div>

              <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
                {currentProf?.firstName} {currentProf?.lastName}
              </h2>

              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-600 font-mono">
                <div>
                  <span className="text-slate-400 font-sans block text-[9px]">DNI:</span>
                  <strong className="text-slate-800">{currentProf?.documentNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-sans block text-[9px]">Matrícula:</span>
                  <strong className="text-slate-800">{currentProf?.matricula?.split(' ')[0]}</strong>
                </div>
              </div>

              <div className="text-[10px] text-slate-600 truncate">
                <span className="text-slate-400 text-[9px]">Unidad: </span>
                <span className="font-bold text-slate-800">
                  {currentCred?.establishmentName || 'UP N° 33 Los Hornos'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Contenedor Compacto del Código QR Dinámico Criptográfico */}
          <div className="bg-white p-2.5 sm:p-3 rounded-2xl border-2 border-slate-900 shadow-inner flex flex-col items-center text-center">
            
            <div className="relative p-1.5 bg-white rounded-xl shadow-xs">
              {isLoadingQR ? (
                <div className="w-32 h-32 sm:w-36 sm:h-36 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                  <i className="fa-solid fa-spinner fa-spin text-xl text-emerald-600"></i>
                  <span className="text-[10px] font-semibold">Firmando Ed25519...</span>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Código QR Dinámico SIFFA"
                  className="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded-lg"
                />
              ) : (
                <div className="w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 text-xs">
                  QR no disponible
                </div>
              )}
            </div>

            {/* Barra de expiración de 90 segundos */}
            <div className="w-full mt-2 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500 flex items-center gap-1">
                  <i className="fa-solid fa-clock-rotate-left text-emerald-600 text-[9px]"></i>
                  <span>Rotación:</span>
                </span>
                <span className={`font-bold ${timeLeft <= 15 ? 'text-red-600' : 'text-slate-800'}`}>
                  {timeLeft}s
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timeLeft <= 15 ? 'bg-red-500' : 'bg-emerald-600'
                  }`}
                  style={{ width: `${(timeLeft / 90) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Botones de Acción Operativa */}
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={() => currentCred && fetchQR(currentCred.id)}
                disabled={isLoadingQR}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                title="Generar nuevo token criptográfico"
              >
                <i className={`fa-solid fa-arrows-rotate text-emerald-600 ${isLoadingQR ? 'fa-spin' : ''}`}></i>
                <span>Regenerar</span>
              </button>

              {(isSuperAdmin || currentUser?.role === 'VALIDATOR') && (
                <button
                  onClick={handleSendToValidator}
                  disabled={!dynamicQR}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                  title="Enviar token al módulo de control de guardia"
                >
                  <i className="fa-solid fa-shield text-emerald-400 text-[10px]"></i>
                  <span>Probar en Garita</span>
                </button>
              )}

              <button
                onClick={handleCopyPayload}
                disabled={!dynamicQR}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                title="Copiar token JSON"
              >
                <i className="fa-solid fa-copy text-slate-500 text-[10px]"></i>
                <span>{copiedPayload ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>

          </div>

          {/* Leyenda Legal Obligatoria y Permanente (Requisito Legal No Negociable) */}
          <div className="bg-amber-50/95 border-2 border-amber-300 rounded-xl px-2.5 py-1.5 text-center shadow-xs">
            <p className="text-[9px] sm:text-[9.5px] font-bold text-amber-950 leading-tight">
              <i className="fa-solid fa-scale-balanced text-amber-700 mr-1"></i>
              {LEGAL_DISCLAIMER}
            </p>
          </div>

          {/* Pie de credencial */}
          <div className="text-center pt-1 border-t border-slate-200">
            <p className="text-[8px] font-mono text-slate-400 truncate">
              ID TOKEN: {dynamicQR?.jti ? dynamicQR.jti.slice(0, 14) : 'SIFFA-SEC'} · ED25519
            </p>
            <div className="text-[8px] text-slate-500 flex items-center justify-center gap-1 mt-0.5">
              <BanderaArgentina size="xs" />
              <span>Validez en garita por escaneo del sistema central SIFFA</span>
            </div>
          </div>

        </div>
      </div>

      {/* Botón para expandir detalles técnicos sin ocupar espacio en pantalla principal */}
      <div className="text-center pt-1">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 cursor-pointer py-1 px-3 rounded-lg hover:bg-white transition-colors"
        >
          <i className="fa-solid fa-code text-slate-400"></i>
          <span>{showTechnicalDetails ? 'Ocultar Telemetría Criptográfica' : 'Ver Telemetría Criptográfica y Raw JSON'}</span>
          <i className={`fa-solid fa-chevron-down text-[9px] transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`}></i>
        </button>
      </div>

      {/* Panel Técnico Desplegable (Solo si el usuario decide expandirlo) */}
      {showTechnicalDetails && (
        <div className="bg-[#001738] rounded-2xl p-4 text-white shadow-md border border-slate-800 space-y-2 animate-fadeIn text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
              <i className="fa-solid fa-key"></i>
              <span>PAYLOAD FIRMADO EN BACKEND (Ed25519)</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
              Key ID: {dynamicQR?.kid || 'siffa-ed25519-v1'}
            </span>
          </div>

          <pre className="bg-black/50 p-2.5 rounded-xl font-mono text-[10px] text-emerald-300 overflow-x-auto border border-emerald-500/20 max-h-40">
            {dynamicQR ? JSON.stringify(dynamicQR, null, 2) : '// Cargando payload...'}
          </pre>

          <p className="text-[10px] text-slate-400 leading-relaxed">
            La clave privada reside exclusivamente en el servidor central. La garita valida la firma criptográfica asimétrica contra la clave pública y el padrón cerrado de SIFFA en tiempo real.
          </p>
        </div>
      )}

    </div>
  );
};
