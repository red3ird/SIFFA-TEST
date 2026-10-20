import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { api } from '../services/api';
import { UserProfile } from '../types';
import { BanderaArgentina } from './BanderaArgentina';
import { SiffaLogo } from './SiffaLogo';

interface MiCredencialViewProps {
  currentUser: UserProfile | null;
  onRequireLogin: () => void;
  onOpenPrintModal?: (credentialId: string) => void;
}

const CACHE_KEY = 'siffa_offline_cached_credential';

export const MiCredencialView: React.FC<MiCredencialViewProps> = ({
  currentUser,
  onRequireLogin,
  onOpenPrintModal,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isOfflineCached, setIsOfflineCached] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Cargar credencial propia del integrante autenticado
  const fetchMyCredential = async () => {
    if (!currentUser) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.getMyCredential();
      setData(res);
      setIsOfflineCached(false);

      const nowStr = new Date().toLocaleTimeString('es-AR') + ' · ' + new Date().toLocaleDateString('es-AR');
      setLastSyncTime(nowStr);

      // Guardar en caché offline para permitir lectura sin conexión en celular
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            data: res,
            savedAt: nowStr,
            userEmail: currentUser.email,
          })
        );
      } catch (e) {
        console.warn('No se pudo guardar la credencial en caché offline:', e);
      }

      // Generar imagen QR fija del enlace público
      if (res.credential?.publicVerificationUrl) {
        generateQrImage(res.credential.publicVerificationUrl);
      }
    } catch (err: any) {
      console.warn('Fallo al obtener credencial online, intentando caché offline:', err);
      // Intentar cargar desde caché local para celular con baja o nula señal
      try {
        const cachedRaw = localStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (parsed.userEmail?.toLowerCase() === currentUser.email.toLowerCase()) {
            setData(parsed.data);
            setLastSyncTime(parsed.savedAt);
            setIsOfflineCached(true);
            if (parsed.data.credential?.publicVerificationUrl) {
              generateQrImage(parsed.data.credential.publicVerificationUrl);
            }
            return;
          }
        }
      } catch {}

      setErrorMsg(
        err.message ||
          'No se pudo conectar con el servidor de credenciales ni existe una versión local guardada.'
      );
    } finally {
      setLoading(false);
    }
  };

  const generateQrImage = async (url: string) => {
    try {
      const code = await QRCode.toDataURL(url, {
        width: 220,
        margin: 1,
        color: {
          dark: '#001738',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(code);
    } catch (e) {
      console.warn('Error al generar QR code estático:', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchMyCredential();
    }
  }, [currentUser?.email]);

  const handleCopyLink = () => {
    if (data?.credential?.publicVerificationUrl) {
      navigator.clipboard.writeText(data.credential.publicVerificationUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Si no hay usuario autenticado, exigir login (padrón cerrado)
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-8 bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-5 animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#001738] text-white flex items-center justify-center text-2xl shadow-md">
          <i className="fa-solid fa-id-card"></i>
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
            <span>Acceso Privado · Padrón Cerrado</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Identificación de Integrante Requerida
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Para visualizar tu credencial oficial, QR fijo y las autorizaciones penitenciarias asignadas, identifícate con tu cuenta institucional de SIFFA.
          </p>
        </div>
        <button
          onClick={onRequireLogin}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-950/20 cursor-pointer flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-arrow-right-to-bracket text-xs"></i>
          <span>INGRESAR A MI CREDENCIAL</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fadeIn pb-10">
      
      {/* Barra de Notificación y Estado de Sincronización Móvil */}
      <div className="bg-white rounded-2xl px-4 py-2.5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-extrabold text-slate-900 text-xs">
            Mi Credencial SIFFA
          </span>
          {isOfflineCached && (
            <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
              Modo Fuera de Línea (Caché local)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          {lastSyncTime && (
            <span className="hidden sm:inline">
              Última actualización: <strong className="text-slate-700">{lastSyncTime}</strong>
            </span>
          )}
          <button
            onClick={fetchMyCredential}
            disabled={loading}
            className="p-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
            title="Sincronizar última versión"
          >
            <i className={`fa-solid fa-arrows-rotate text-emerald-600 ${loading ? 'fa-spin' : ''}`}></i>
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2">
          <i className="fa-solid fa-triangle-exclamation text-rose-600 text-base shrink-0"></i>
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {loading && !data ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            <i className="fa-solid fa-spinner fa-spin"></i>
          </div>
          <p className="text-xs text-slate-600 font-semibold">
            Cargando credencial oficial y autorizaciones...
          </p>
        </div>
      ) : data ? (
        <div className="space-y-4">
          
          {/* TARJETA CREDENCIAL PRINCIPAL (MÓVIL & ESCRITORIO) */}
          <div className="bg-white rounded-3xl border-2 border-slate-900 shadow-xl overflow-hidden relative">
            
            {/* Encabezado Institucional */}
            <div className="bg-[#001738] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <SiffaLogo size="xs" rounded="rounded-lg" />
                <div>
                  <h3 className="text-xs font-black tracking-wider text-emerald-400 uppercase leading-none">
                    SIFFA · CREDENCIAL OFICIAL
                  </h3>
                  <p className="text-[9px] text-slate-300 font-medium leading-none mt-1">
                    Sindicato Internacional de Fútbol Femenino y Afines
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    data.credential?.status === 'ACTIVA' || data.credential?.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {data.credential?.status || 'SIN EMITIR'}
                </span>
              </div>
            </div>

            {/* Cuerpo del Carnet */}
            <div className="p-5 sm:p-6 bg-gradient-to-b from-slate-50 to-white space-y-5">
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                
                {/* Foto Oficial del Integrante */}
                <div
                  data-carnet-photo="true"
                  className="w-24 h-32 rounded-2xl overflow-hidden bg-slate-200 border-2 border-slate-900 shadow-md shrink-0 relative"
                  title="Foto oficial de carnet SIFFA"
                >
                  {data.person?.profilePhotoUrl ? (
                    <img
                      src={data.person.profilePhotoUrl}
                      alt={data.person.firstName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#001738] flex items-center justify-center text-white font-black text-xl">
                      {data.person?.firstName?.charAt(0)}{data.person?.lastName?.charAt(0)}
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 text-white text-[7px] font-extrabold text-center py-0.5 tracking-wider uppercase">
                    SIFFA CARNET
                  </div>
                </div>

                {/* Datos Identificatorios Personales */}
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                    {data.person?.professionalRole || 'Integrante'}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {data.person?.firstName} {data.person?.lastName}
                  </h2>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-left">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Número de Credencial
                      </span>
                      <strong className="text-slate-900 font-mono text-xs">
                        {data.credential?.credentialNumber || 'S/N'}
                      </strong>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-left">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Vigencia
                      </span>
                      <strong className="text-emerald-700 font-mono text-xs">
                        {data.credential?.expiresAt ? new Date(data.credential.expiresAt).toLocaleDateString('es-AR') : 'S/D'}
                      </strong>
                    </div>
                  </div>

                  {data.person?.matricula && (
                    <div className="text-[11px] text-slate-600 font-mono pt-0.5">
                      Matrícula Oficial: <strong className="text-slate-800">{data.person.matricula}</strong>
                    </div>
                  )}
                </div>

              </div>

              {/* QR FIJO DE IDENTIFICACIÓN PÚBLICA */}
              <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-inner flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                    CÓDIGO QR FIJO DE IDENTIFICACIÓN
                  </span>
                  <h4 className="text-sm font-black text-slate-900">
                    Escanear para verificar vínculo institucional
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
                    Cualquier celular o puesto de garita puede escanear este código. Abre de forma segura la página oficial de verificación pública sin exponer tus datos privados.
                  </p>
                  
                  {data.credential?.publicVerificationUrl && (
                    <div className="pt-2 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <button
                        onClick={handleCopyLink}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <i className={`fa-solid ${copiedLink ? 'fa-check text-emerald-600' : 'fa-link text-slate-500'}`}></i>
                        <span>{copiedLink ? '¡Enlace copiado!' : 'Copiar URL de verificación'}</span>
                      </button>

                      <a
                        href={data.credential.publicVerificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                        <span>Abrir enlace público</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs shrink-0 flex flex-col items-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Fijo SIFFA"
                      className="w-32 h-32 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center bg-slate-100 text-slate-400 text-xs rounded-lg">
                      Generando QR...
                    </div>
                  )}
                  <span className="text-[9px] font-mono font-bold text-slate-400 mt-1 uppercase">
                    URL Oficial /v/
                  </span>
                </div>
              </div>

              {/* LEYENDA INSTITUCIONAL FIJA */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 text-center leading-relaxed">
                <i className="fa-solid fa-scale-balanced text-emerald-600 mr-1.5"></i>
                <span>{data.disclaimer}</span>
              </div>

            </div>
          </div>

          {/* AUTORIZACIONES PENITENCIARIAS VINCULADAS AL INTEGRANTE */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  REGISTRO OPERATIVO
                </span>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <i className="fa-solid fa-building-shield text-emerald-600"></i>
                  <span>Autorizaciones Penitenciarias Asignadas</span>
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {data.authorizations?.length || 0} Registradas
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              La tenencia de la credencial SIFFA <strong>no autoriza por sí misma</strong> el ingreso. Debajo constan las autorizaciones previas homologadas por las respectivas Unidades Penitenciarias:
            </p>

            {data.authorizations && data.authorizations.length > 0 ? (
              <div className="space-y-3">
                {data.authorizations.map((auth: any) => {
                  const isAuthActive = String(auth.status).toUpperCase() === 'AUTORIZADA' || String(auth.status).toUpperCase() === 'ACTIVE';
                  return (
                    <div
                      key={auth.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isAuthActive
                          ? 'bg-emerald-50/40 border-emerald-300/80'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                isAuthActive
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {isAuthActive ? 'AUTORIZACIÓN PREVIA VIGENTE' : auth.status}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 font-bold">
                              Ref: {auth.referenciaDeLaAutorizacion || 'S/D'}
                            </span>
                          </div>

                          <h4 className="text-sm font-black text-slate-900 pt-0.5">
                            {auth.establishmentName || auth.establishmentId}
                          </h4>

                          <p className="text-xs text-slate-700">
                            <strong>Actividad:</strong> {auth.actividad}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                        <div>
                          <span className="text-[10px] font-sans text-slate-500 block">Días y Horarios:</span>
                          <strong className="text-slate-800">{auth.diasYHorarios || 'A convenir con guardia'}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] font-sans text-slate-500 block">Período de Autorización:</span>
                          <strong className="text-slate-800">{auth.validFrom} al {auth.validUntil}</strong>
                        </div>
                      </div>

                      <div className="mt-2.5 text-[11px] text-emerald-800 font-semibold italic flex items-center gap-1.5">
                        <i className="fa-solid fa-circle-info text-emerald-600 text-xs"></i>
                        <span>El ingreso efectivo queda sujeto al control de la Unidad.</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-1">
                <i className="fa-solid fa-folder-open text-2xl text-slate-400 mb-1 block"></i>
                <p className="font-bold">No registras autorizaciones penitenciarias activas</p>
                <p className="text-[11px]">
                  Contacta a la Secretaría de SIFFA para tramitar la asignación de unidad y horarios.
                </p>
              </div>
            )}
          </div>

        </div>
      ) : null}

    </div>
  );
};
