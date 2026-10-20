import React from 'react';
import { ParticipanteJudicial } from '../types';

interface ModalReporteJudicialProps {
  participante: ParticipanteJudicial | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ModalReporteJudicial: React.FC<ModalReporteJudicialProps> = ({
  participante,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !participante) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-6 overflow-hidden shadow-2xl border border-slate-300 relative">
        
        {/* Modal Top Bar */}
        <div className="bg-[#002147] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-file-signature text-[#E87722]"></i>
            <span className="font-bold text-xs sm:text-sm">
              Expediente Oficial para Evaluación Judicial • SIFFA / SPB
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        {/* Cuerpo del Documento Membretado */}
        <div className="p-6 sm:p-8 bg-white text-slate-800 space-y-5 print:p-0">
          
          {/* Membrete Institucional Oficial */}
          <div className="border-b-2 border-[#002147] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#006A68] flex items-center justify-center text-white border-2 border-[#E87722] shadow-xs shrink-0">
                <i className="fa-solid fa-futbol text-[#E87722] text-xl"></i>
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-[#006A68] uppercase tracking-widest block">
                  SIFFA • SINDICATO INTERNACIONAL DE FÚTBOL FEMENINO Y AFINES
                </span>
                <h3 className="text-base font-black text-[#002147] uppercase leading-tight">
                  Dirección General de Coordinación y Seguridad Institucional
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  En articulación con el Servicio Penitenciario Bonaerense (SPB)
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs font-mono">
              <div className="text-slate-500 font-sans text-[10px] uppercase font-bold">Expediente N°</div>
              <div className="font-black text-[#002147] text-sm">EXP-SIFFA-2026/894</div>
              <div className="text-slate-500 text-[10px]">La Plata, {new Date().toLocaleDateString('es-AR')}</div>
            </div>
          </div>

          {/* Título del Informe */}
          <div className="text-center py-2 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-sm sm:text-base font-black text-[#002147] uppercase tracking-wide">
              INFORME TÉCNICO DE EVOLUCIÓN CONDUCTUAL Y ESTÍMULO EDUCATIVO-DEPORTIVO
            </h4>
            <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
              Ref.: Ley Provincial de Ejecución Penal N° 12.256 / Ley Nacional N° 24.660 (Art. 140 y conc.)
            </p>
          </div>

          {/* Ficha de la Interna */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Nombre de la Interna:</span>
              <strong className="text-sm font-bold text-slate-900">{participante.nombreCompleto}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Legajo Judicial SPB:</span>
              <strong className="text-sm font-mono font-bold text-[#002147]">{participante.legajo}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Unidad de Alojamiento:</span>
              <span className="font-semibold text-slate-800">{participante.unidad} ({participante.pabellon})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Beneficio Solicitado en Trámite:</span>
              <span className="font-extrabold text-[#E87722]">{participante.beneficioSolicitado}</span>
            </div>
          </div>

          {/* Indicadores Cuantitativos de Cumplimiento */}
          <div>
            <h5 className="text-xs font-bold text-[#002147] uppercase tracking-wider mb-2">
              1. Cómputo de Horas y Asistencia Homologada
            </h5>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl">
                <span className="block text-[10px] font-bold text-[#006A68] uppercase">Asistencia Global</span>
                <span className="text-xl font-black font-mono text-[#006A68]">{participante.asistenciaPorcentaje}%</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">Asistencia regular</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-600 uppercase">Índice Conducta</span>
                <span className="text-xl font-black font-mono text-[#002147]">{participante.indiceConducta} / 10</span>
                <span className="block text-[10px] font-bold text-emerald-700 mt-0.5 uppercase">{participante.calificacionSPB}</span>
              </div>
              <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl">
                <span className="block text-[10px] font-bold text-[#E87722] uppercase">Horas Acreditadas</span>
                <span className="text-xl font-black font-mono text-[#E87722]">{participante.horasComputadas} hrs</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">Cómputo Reducción</span>
              </div>
            </div>
          </div>

          {/* Dictamen Psicosocial y Conclusiones */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-[#002147] uppercase tracking-wider">
              2. Dictamen Psicosocial y Desempeño Convivencial
            </h5>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
              <p>{participante.dictamenPsicosocial}</p>
              <p className="mt-2 font-semibold text-[#006A68]">
                Conclusión Técnica: La participante evidencia internalización positiva de normas, capacidad de resolución dialógica de controversias en el campo de juego y compromiso sostenido en talleres de salida laboral.
              </p>
            </div>
          </div>

          {/* Firmas Institucionales */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="flex flex-col items-center">
              <div className="w-32 border-b-2 border-slate-400 mb-1"></div>
              <span className="font-bold text-[#002147]">Dra. Silvina Campos</span>
              <span className="text-[10px] text-slate-500 leading-tight">
                Directora General de Coordinación<br />SIFFA - SPB Matrícula Judicial 4102
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-32 border-b-2 border-slate-400 mb-1"></div>
              <span className="font-bold text-[#002147]">Lic. Marcela Giménez</span>
              <span className="text-[10px] text-slate-500 leading-tight">
                Coordinadora Técnica de Campo<br />SIFFA Matrícula ATFA 4821
              </span>
            </div>
          </div>

        </div>

        {/* Barra de Acciones Inferior */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Validez legal conforme Ley 12.256 y Res. Ministerial 402/25
          </span>
          <div className="flex items-center gap-2">
            <button
              id="reporte-btn-imprimir"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#006A68] hover:bg-[#00504e] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-print"></i>
              <span>Imprimir / Descargar Expediente</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
