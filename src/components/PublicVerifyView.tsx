import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PublicVerificationResult, UserProfile } from '../types';
import { SiffaLogo } from './SiffaLogo';
import { BanderaArgentina } from './BanderaArgentina';

interface PublicVerifyViewProps {
  qrToken: string;
  onGoHome?: () => void;
  currentUser?: UserProfile | null;
  onOpenLogin?: () => void;
}

export const PublicVerifyView: React.FC<PublicVerifyViewProps> = ({
  qrToken,
  onGoHome,
  currentUser,
  onOpenLogin,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<PublicVerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function verify() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const data = await api.getPublicVerification(qrToken);
        if (isMounted) {
          setResult(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Error al conectar con el servicio de verificación.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (qrToken) {
      verify();
    } else {
      setLoading(false);
      setErrorMessage('Token de credencial no proporcionado.');
    }

    return () => {
      isMounted = false;
    };
  }, [qrToken]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 md:p-8 selection:bg-emerald-500 selection:text-white">
      {/* Barra Superior con Logo SIFFA */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <SiffaLogo size="sm" rounded="rounded-xl" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                SIFFA OFICIAL
              </span>
              <BanderaArgentina size="xs" />
            </div>
            <h1 className="text-sm font-extrabold text-white tracking-tight">
              Verificación Pública de Credencial
            </h1>
          </div>
        </div>

        {onGoHome && (
          <button
            onClick={onGoHome}
            className="text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-house text-emerald-400 text-xs"></i>
            <span className="hidden sm:inline">Portal SIFFA</span>
          </button>
        )}
      </header>

      {/* Contenido Central */}
      <main className="max-w-xl w-full mx-auto my-6 sm:my-10">
        {loading ? (
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 text-center space-y-4 shadow-2xl animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl">
              <i className="fa-solid fa-spinner fa-spin"></i>
            </div>
            <h2 className="text-base font-bold text-slate-200">
              Consultando registro oficial SIFFA...
            </h2>
            <p className="text-xs text-slate-400">
              Validando identificador criptográfico contra el padrón institucional.
            </p>
          </div>
        ) : errorMessage || !result || !result.valid ? (
          /* CASO: CREDENCIAL NO VIGENTE O NO VÁLIDA (SIN FOTO NI NOMBRE PARA PREVENIR ENUMERACIÓN Y SUPLANTACIÓN) */
          <div className="bg-slate-900 rounded-3xl overflow-hidden border-2 border-rose-600/80 shadow-2xl shadow-rose-950/40 animate-scaleUp">
            <div className="bg-rose-600 px-6 py-4 flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider block text-rose-100">
                  ESTADO DE VERIFICACIÓN
                </span>
                <h2 className="text-lg font-black tracking-tight">
                  Credencial no vigente
                </h2>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl">
                  <i className="fa-solid fa-ban"></i>
                </div>
                <h3 className="text-base font-extrabold text-white">
                  {result?.statusLabel || 'Credencial no válida'}
                </h3>
                <p className="text-xs text-rose-200/90 leading-relaxed max-w-md mx-auto">
                  {result?.reason || 'El identificador consultado no corresponde a una credencial vigente en el sistema institucional o se encuentra dada de baja.'}
                </p>
              </div>

              {/* Leyenda institucional obligatoria */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed text-center">
                <i className="fa-solid fa-triangle-exclamation text-amber-400 mr-1.5"></i>
                <span>
                  {result?.disclaimer ||
                    'Credencial de identificación de SIFFA. Su tenencia no implica autorización para ingresar a un establecimiento penitenciario. El acceso está sujeto a la autorización y al control de la autoridad penitenciaria.'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* CASO: CREDENCIAL VIGENTE Y ACTIVA (MUESTRA SOLO LO NECESARIO: FOTO, NOMBRE, FUNCIÓN, NÚMERO Y VIGENCIA) */
          <div className="bg-slate-900 rounded-3xl overflow-hidden border-2 border-emerald-500 shadow-2xl shadow-emerald-950/30 animate-scaleUp">
            
            {/* Header del carnet de verificación */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 flex items-center justify-between text-white border-b border-emerald-400/30">
              <div className="flex items-center gap-2.5">
                <i className="fa-solid fa-circle-check text-xl text-white"></i>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block text-emerald-100">
                    IDENTIFICACIÓN SIFFA
                  </span>
                  <h2 className="text-base font-extrabold leading-tight">
                    Credencial Oficial Vigente
                  </h2>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider border border-white/30">
                ACTIVA
              </span>
            </div>

            {/* Ficha Personal Mínima (Sin DNI, sin teléfono, sin correo, sin unidad) */}
            <div className="p-6 sm:p-8 space-y-6">
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
                {/* Fotografía de carnet */}
                <div
                  data-carnet-photo="true"
                  className="w-28 h-36 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 shadow-xl shrink-0 relative"
                >
                  {result.photoUrl ? (
                    <img
                      src={result.photoUrl}
                      alt={result.personName || 'Personal SIFFA'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                      <i className="fa-solid fa-user text-3xl"></i>
                      <span className="text-[9px] mt-1 font-bold">Sin foto</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 py-0.5 text-[8px] font-bold text-center text-slate-300 uppercase tracking-wider border-t border-slate-800">
                    SIFFA
                  </div>
                </div>

                {/* Datos identificatorios permitidos */}
                <div className="flex-1 space-y-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
                      Nombre y Apellido
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      {result.personName}
                    </h3>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Función / Rol Institucional
                    </span>
                    <div className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      {result.roleInSiffa}
                    </div>
                  </div>

                  <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Número de Credencial
                      </span>
                      <strong className="text-white font-mono text-xs">
                        {result.credentialNumber}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Vigencia
                      </span>
                      <strong className="text-emerald-400 font-mono text-xs">
                        {result.expiresAtFormatted}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* REGLA CRÍTICA: LEYENDA FIJA OBLIGATORIA */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed text-center">
                <i className="fa-solid fa-scale-balanced text-emerald-400 mr-2 text-xs"></i>
                <span className="font-medium">
                  {result.disclaimer}
                </span>
              </div>

              {/* SECCIÓN ESPECIAL PARA PERSONAL DE GUARDIA O ADMIN AUTENTICADO */}
              {result.validatorContext && (
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-emerald-500/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <i className="fa-solid fa-shield"></i>
                      <span>INFORMACIÓN OPERATIVA PARA CONTROL PENITENCIARIO</span>
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                      SESIÓN VALIDATOR
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-black text-emerald-300 flex items-center gap-2">
                      <i className="fa-solid fa-circle-check text-emerald-400"></i>
                      <span>{result.validatorContext.authorizationStatusText}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 italic font-semibold">
                      "{result.validatorContext.disclaimerPenitenciaria}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Unidad Penitenciaria:</span>
                      <strong className="text-white">{result.validatorContext.establishmentName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Días y Horarios:</span>
                      <strong className="text-white font-mono">{result.validatorContext.diasYHorarios}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Actividad Programada:</span>
                      <strong className="text-white">{result.validatorContext.actividad}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Referencia de Autorización:</span>
                      <strong className="text-amber-300 font-mono text-[11px]">
                        {result.validatorContext.referenciaDeLaAutorizacion}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Si la garita no tiene sesión y necesita verificar autorización contextual */}
              {!result.validatorContext && onOpenLogin && (
                <div className="pt-2 text-center">
                  <button
                    onClick={onOpenLogin}
                    className="text-[11px] text-slate-400 hover:text-emerald-300 underline transition-colors cursor-pointer"
                  >
                    ¿Puesto de Guardia o Validador? Inicia sesión para ver autorización de la Unidad
                  </button>
                </div>
              )}

            </div>
          </div>
        )}
      </main>

      {/* Footer mínimo con aviso de seguridad y no-indexación */}
      <footer className="max-w-xl w-full mx-auto text-center border-t border-slate-900 pt-4 text-[10px] text-slate-500 space-y-1">
        <p>
          SIFFA · Sistema de Identificación Institucional y Acreditación de Personal
        </p>
        <p className="font-mono text-[9px] text-slate-600">
          Ruta pública /v/ · Consultas protegidas por rate limiting · Protocolo criptográfico sin divulgación de PII
        </p>
      </footer>
    </div>
  );
};
