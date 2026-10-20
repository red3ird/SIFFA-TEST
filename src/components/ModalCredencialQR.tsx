import React, { useState } from 'react';
import { SiffaLogo } from './SiffaLogo';
import { BanderaArgentina } from './BanderaArgentina';
import { DocenteAcreditado } from '../types';

interface ModalCredencialQRProps {
  docente: DocenteAcreditado | null;
  isOpen: boolean;
  onClose: () => void;
  onSimulateGuardScan: (docente: DocenteAcreditado) => void;
}

export const ModalCredencialQR: React.FC<ModalCredencialQRProps> = ({
  docente,
  isOpen,
  onClose,
  onSimulateGuardScan,
}) => {
  const [scanResult, setScanResult] = useState<boolean | null>(null);

  if (!isOpen || !docente) return null;

  const handleSimulateScan = () => {
    setScanResult(true);
    setTimeout(() => {
      onSimulateGuardScan(docente);
    }, 400);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-scaleUp">
        
        {/* Header Modal Bar */}
        <div className="bg-[#001738] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <i className="fa-solid fa-id-card text-emerald-400"></i>
            <span className="font-bold text-xs sm:text-sm tracking-wide">
              Credencial Digital de Seguridad Penitenciaria · SIFFA
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Tarjeta Física Simulación - Credencial con Holograma */}
        <div className="p-6 bg-slate-100 flex flex-col items-center">
          
          <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-slate-900 shadow-md p-5 relative overflow-hidden">
            
            {/* Holograma de Seguridad con Bandera Argentina */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-2xs">
              <BanderaArgentina size="xs" />
              <span>ARG · SPB</span>
            </div>

            {/* Encabezado de la Credencial */}
            <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-900">
              <SiffaLogo size="sm" rounded="rounded-lg" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">
                    SIFFA · REPÚBLICA ARGENTINA
                  </span>
                  <BanderaArgentina size="xs" />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase leading-tight">
                  Programa de Readaptación Social en Cárceles
                </h4>
                <span className="text-[9px] text-slate-500 font-mono">
                  Supervisión: Dra. Silvina Campos (Dir. General)
                </span>
              </div>
            </div>

            {/* Foto, Datos del Docente & Código QR */}
            <div className="grid grid-cols-3 gap-3 my-4 items-center">
              {/* Foto Oficial */}
              <div className="col-span-1 flex flex-col items-center">
                <div
                  data-carnet-photo="true"
                  className="relative w-20 h-24 rounded-lg overflow-hidden bg-slate-100 border-2 border-slate-900 shadow-xs"
                  title="Foto oficial de carnet"
                >
                  <img
                    src={docente.fotoUrl}
                    alt={docente.nombre}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-[#001738] flex items-center justify-center text-white font-bold text-sm -z-10">
                    {docente.nombre.charAt(0)}{docente.apellido.charAt(0)}
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-center gap-1">
                  <BanderaArgentina size="xs" />
                  <span className="text-[8px] font-bold text-center text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded uppercase">
                    {docente.autoproteccionEstado}
                  </span>
                </div>
              </div>

              {/* Datos Personales y Rol */}
              <div className="col-span-2 space-y-1 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Personal Acreditado:</span>
                  <div className="font-extrabold text-slate-900 text-sm leading-tight">
                    {docente.nombre} {docente.apellido}
                  </div>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Función Oficial:</span>
                  <div className="font-semibold text-emerald-800 text-xs leading-snug">
                    {docente.rol}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[11px] font-mono pt-1">
                  <div>
                    <span className="text-[8px] text-slate-400 font-sans block">DNI:</span>
                    <strong className="text-slate-800 tabular-nums">{docente.dni}</strong>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 font-sans block">Matrícula:</span>
                    <strong className="text-slate-800 text-[10px]">{docente.matricula.split(' ')[0]}</strong>
                  </div>
                </div>

                <div className="text-[10px] pt-1">
                  <span className="text-slate-500 font-semibold">Unidad Asignada:</span>
                  <p className="font-bold text-slate-800 truncate">{docente.unidadAsignada}</p>
                </div>
              </div>
            </div>

            {/* Código QR Interactivo de Alta Seguridad */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative p-1 bg-white border border-slate-300 rounded-lg shrink-0">
                {/* Visualizador QR SVG */}
                <svg className="w-20 h-20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="100" fill="white" />
                  <rect x="5" y="5" width="26" height="26" fill="#001738" />
                  <rect x="9" y="9" width="18" height="18" fill="white" />
                  <rect x="13" y="13" width="10" height="10" fill="#10B981" />

                  <rect x="69" y="5" width="26" height="26" fill="#001738" />
                  <rect x="73" y="9" width="18" height="18" fill="white" />
                  <rect x="77" y="13" width="10" height="10" fill="#10B981" />

                  <rect x="5" y="69" width="26" height="26" fill="#001738" />
                  <rect x="9" y="73" width="18" height="18" fill="white" />
                  <rect x="13" y="77" width="10" height="10" fill="#10B981" />

                  {/* Datos QR modulados */}
                  <rect x="36" y="10" width="8" height="8" fill="#001738" />
                  <rect x="48" y="10" width="14" height="6" fill="#10B981" />
                  <rect x="36" y="24" width="24" height="6" fill="#001738" />
                  <rect x="10" y="38" width="14" height="8" fill="#10B981" />
                  <rect x="28" y="38" width="10" height="10" fill="#001738" />
                  <rect x="44" y="36" width="12" height="14" fill="#10B981" />
                  <rect x="62" y="38" width="16" height="8" fill="#001738" />
                  <rect x="82" y="38" width="8" height="12" fill="#10B981" />
                  <rect x="36" y="54" width="8" height="16" fill="#001738" />
                  <rect x="48" y="54" width="22" height="8" fill="#10B981" />
                  <rect x="74" y="54" width="16" height="8" fill="#001738" />
                  <rect x="36" y="74" width="14" height="16" fill="#10B981" />
                  <rect x="54" y="68" width="16" height="12" fill="#001738" />
                  <rect x="74" y="68" width="16" height="22" fill="#001738" />
                </svg>
              </div>

              <div className="text-left text-[11px] leading-tight flex-1">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">
                  Token Criptográfico:
                </span>
                <span className="font-mono text-[10px] text-slate-700 break-all font-bold block">
                  SHA256: 8F02B...SIFFA-SPB
                </span>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                  <i className="fa-solid fa-circle-check"></i>
                  <span>Habilitado Nivel 3 (Garita)</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Vence: <strong className="text-slate-800">{docente.vigencia}</strong>
                </div>
              </div>
            </div>

            {/* Pie de la Credencial */}
            <div className="mt-3 pt-2 border-t border-slate-200 text-center">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                Ley Provincial 12.256 · Res. Min. Justicia 402/25
              </span>
            </div>

          </div>

        </div>

        {/* Feedback de Escaneo Simulado */}
        {scanResult && (
          <div className="px-6 py-2.5 bg-emerald-50 border-y border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-circle-check text-emerald-600 text-base"></i>
              <span>Garita de Guardia 1 (SPB): Acceso Autorizado · Identidad Verificada</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-600">Timestamp: OK</span>
          </div>
        )}

        {/* Acciones del Modal */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            id="modal-btn-imprimir"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-print"></i>
            <span>Imprimir Credencial</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              id="modal-btn-simular-guardia"
              onClick={handleSimulateScan}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-barcode text-emerald-400"></i>
              <span>Simular Escaneo en Garita</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
