import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Credential, Professional } from '../types';
import { SiffaLogo } from './SiffaLogo';
import { BanderaArgentina } from './BanderaArgentina';

interface PrintCredentialModalProps {
  credential: Credential | null;
  professional: Professional | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintCredentialModal: React.FC<PrintCredentialModalProps> = ({
  credential,
  professional,
  isOpen,
  onClose,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function genQR() {
      if (!credential?.qrToken) return;
      const host = window.location.host;
      const protocol = window.location.protocol;
      const verifyUrl = `${protocol}//${host}/v/${credential.qrToken}`;

      try {
        const code = await QRCode.toDataURL(verifyUrl, {
          width: 200,
          margin: 1,
          color: {
            dark: '#001738',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        });
        setQrCodeDataUrl(code);
      } catch (e) {
        console.warn('Error al generar QR de impresión:', e);
      }
    }

    if (isOpen && credential) {
      genQR();
    }
  }, [isOpen, credential]);

  if (!isOpen || !credential || !professional) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedExpiry = (() => {
    try {
      const d = new Date(credential.expiresAt);
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return credential.expiresAt;
    }
  })();

  const mandatoryDisclaimer =
    'Credencial de identificación de SIFFA. Su tenencia no implica autorización para ingresar a un establecimiento penitenciario. El acceso está sujeto a la autorización y al control de la autoridad penitenciaria.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-300 my-6">
        
        {/* Header del Modal */}
        <div className="bg-[#001738] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <SiffaLogo size="xs" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                SIFFA · IMPRESIÓN OFICIAL DE CARNET FÍSICO
              </span>
              <h3 className="text-base font-extrabold text-white">
                Credencial Física de Identificación
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-print"></i>
              <span>Imprimir Credencial</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal con Vista Previa Imprimible */}
        <div className="p-6 space-y-6">
          
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
            <i className="fa-solid fa-circle-info text-amber-600 text-base shrink-0"></i>
            <span>
              <strong>Formato ID-1 (85.6mm × 53.98mm):</strong> Diseñado según el principio rector SIFFA. El DNI completo <strong>no se imprime</strong> en la credencial para proteger la identidad del integrante. El QR fijo codifica la URL de verificación pública.
            </span>
          </div>

          {/* ÁREA DE IMPRESIÓN (Frente y Dorso en disposición de impresión) */}
          <div ref={printAreaRef} id="siffa-printable-card-area" className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center">
              
              {/* FRENTE DE LA TARJETA (85.6mm x 53.98mm aspect ratio approx 1.586) */}
              <div className="w-full max-w-[360px] mx-auto aspect-[1.586/1] bg-gradient-to-br from-[#001738] via-[#00224f] to-[#00122e] rounded-2xl p-4 text-white shadow-xl border-2 border-slate-900 flex flex-col justify-between relative overflow-hidden">
                
                {/* Fondo institucional decorativo */}
                <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-emerald-500/10 pointer-events-none"></div>
                
                {/* Header de la tarjeta */}
                <div className="flex items-center justify-between border-b border-white/15 pb-2">
                  <div className="flex items-center gap-2">
                    <SiffaLogo size="xs" rounded="rounded-md" />
                    <div>
                      <h4 className="text-[11px] font-black tracking-wider text-emerald-400 uppercase leading-none">
                        SIFFA
                      </h4>
                      <p className="text-[8px] text-slate-300 font-semibold leading-none mt-0.5">
                        Identificación Institucional
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded border border-white/20">
                    <BanderaArgentina size="xs" />
                    <span className="text-[8px] font-black text-sky-200">ARG</span>
                  </div>
                </div>

                {/* Contenido: Foto + Datos */}
                <div className="flex items-center gap-3.5 my-1">
                  {/* Foto oficial carnet */}
                  <div
                    data-carnet-photo="true"
                    className="w-16 h-20 rounded-xl overflow-hidden bg-slate-800 border-2 border-emerald-400 shadow-md shrink-0 relative"
                  >
                    {professional.profilePhotoUrl ? (
                      <img
                        src={professional.profilePhotoUrl}
                        alt={professional.firstName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white font-black text-sm">
                        {professional.firstName.charAt(0)}{professional.lastName.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Datos del integrante */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30 inline-block">
                      {professional.professionalRole || 'INTEGRANTE'}
                    </span>
                    <h5 className="text-sm font-black text-white leading-tight truncate">
                      {professional.firstName} {professional.lastName}
                    </h5>
                    <div className="text-[9px] font-mono text-slate-300 space-y-0.5">
                      <div>
                        <span className="text-slate-400">Credencial: </span>
                        <strong className="text-white">{credential.credentialNumber || credential.id}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Vigencia: </span>
                        <strong className="text-emerald-400">{formattedExpiry}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pie del frente */}
                <div className="border-t border-white/10 pt-1.5 flex items-center justify-between text-[8px] text-slate-400">
                  <span className="font-mono">Padrón Oficial SIFFA</span>
                  <span className="font-bold text-emerald-400 uppercase">Vínculo Institucional Acreditado</span>
                </div>

              </div>

              {/* DORSO DE LA TARJETA (Con QR Fijo y Leyenda Obligatoria) */}
              <div className="w-full max-w-[360px] mx-auto aspect-[1.586/1] bg-white rounded-2xl p-4 text-slate-900 shadow-xl border-2 border-slate-900 flex flex-col justify-between relative overflow-hidden">
                
                {/* Header Dorso */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-700">
                    Control y Verificación Digital
                  </span>
                  <span className="text-[8px] font-mono font-bold text-slate-500">
                    v/{credential.qrToken ? credential.qrToken.slice(0, 10) + '...' : ''}
                  </span>
                </div>

                {/* Contenido Dorso: QR + Leyenda */}
                <div className="flex items-center gap-3 my-1">
                  {/* QR Fijo */}
                  <div className="p-1 bg-white rounded-xl border border-slate-300 shrink-0 shadow-xs">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="QR Verificación"
                        className="w-18 h-18 object-contain"
                      />
                    ) : (
                      <div className="w-18 h-18 bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">
                        QR
                      </div>
                    )}
                  </div>

                  {/* Leyenda obligatoria */}
                  <div className="flex-1 text-[8px] text-slate-700 leading-tight space-y-1">
                    <p className="font-bold text-slate-900">
                      Escaneo de autenticidad:
                    </p>
                    <p className="text-slate-600 italic">
                      {mandatoryDisclaimer}
                    </p>
                  </div>
                </div>

                {/* Pie del Dorso */}
                <div className="border-t border-slate-200 pt-1 text-[7.5px] text-slate-500 text-center leading-none">
                  Secretaría General SIFFA · República Argentina · Registro inmutable
                </div>

              </div>

            </div>

          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Usa el diálogo del navegador para imprimir en papel o guardar como PDF.
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 bg-[#001738] hover:bg-[#002b66] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-print"></i>
                <span>Imprimir Tarjeta</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
