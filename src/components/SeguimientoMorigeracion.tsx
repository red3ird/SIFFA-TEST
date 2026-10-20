import React, { useState } from 'react';
import { ParticipanteJudicial } from '../types';
import { PARTICIPANTES_DATA } from '../data/initialData';

interface SeguimientoMorigeracionProps {
  onOpenReportForParticipant: (participante: ParticipanteJudicial) => void;
  onOpenAsistencia: () => void;
}

export const SeguimientoMorigeracion: React.FC<SeguimientoMorigeracionProps> = ({
  onOpenReportForParticipant,
  onOpenAsistencia,
}) => {
  const [participantes] = useState<ParticipanteJudicial[]>(PARTICIPANTES_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnidad, setSelectedUnidad] = useState<string>('Todas');
  const [selectedBeneficio, setSelectedBeneficio] = useState<string>('Todos');

  const unidadesList = ['Todas', 'U33 Los Hornos', 'U47 San Martín', 'U50 Batán', 'U40 Lomas de Zamora', 'U51 Magdalena'];

  const filteredParticipantes = participantes.filter((p) => {
    const matchesSearch =
      p.nombreCompleto.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.legajo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.unidad.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.dictamenPsicosocial.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUnidad = selectedUnidad === 'Todas' || p.unidad === selectedUnidad;
    const matchesBeneficio = selectedBeneficio === 'Todos' || p.beneficioSolicitado === selectedBeneficio;

    return matchesSearch && matchesUnidad && matchesBeneficio;
  });

  return (
    <div className="space-y-6">
      {/* Header Institucional del Módulo Judicial */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
            <span>Data Analytics Judicial</span>
            <span aria-hidden="true">·</span>
            <span>Ley de Ejecución Penal N° 12.256 & N° 24.660</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Planilla Digital de Seguimiento y Morigeración de Penas
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Cómputo biométrico de asistencia, evaluación continua de conducta sociodeportiva y avance físico-psicológico para presentación ante Juzgados de Ejecución Penal y Defensorías Públicas bonaerenses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            id="btn-registrar-asistencia-modal"
            onClick={onOpenAsistencia}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-user-plus text-emerald-700"></i>
            <span>Nueva Observación</span>
          </button>

          <button
            id="btn-exportar-reporte-general"
            onClick={() => onOpenReportForParticipant(participantes[0])}
            className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-file-pdf text-amber-300"></i>
            <span>Exportar Reporte Oficial Judicial</span>
          </button>
        </div>
      </div>

      {/* Resumen Normativo y Estimulo Educativo */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#001738] text-emerald-400 flex items-center justify-center text-lg shrink-0">
            <i className="fa-solid fa-scale-balanced"></i>
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900">
              Régimen de Reducción de Plazos por Actividad Sociodeportiva (Art. 140)
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Cada 120 horas de cursado acreditadas con índice de conducta mayor a 8/10 habilitan dictamen favorable para salidas transitorias, régimen abierto o morigeración de pena.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs font-mono font-bold shrink-0">
          <div className="text-right">
            <span className="block text-[10px] text-slate-400 uppercase font-sans">Promedio Asistencia</span>
            <span className="text-emerald-700 text-sm font-bold tabular-nums">93.0%</span>
          </div>
          <div className="text-right border-l border-slate-200 pl-6">
            <span className="block text-[10px] text-slate-400 uppercase font-sans">Promedio Conducta</span>
            <span className="text-slate-900 text-sm font-bold tabular-nums">9.3 / 10</span>
          </div>
        </div>
      </div>

      {/* Controles de Filtros y Búsqueda */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Buscador */}
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            id="seguimiento-input-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por interna, legajo SPB, pabellón o dictamen..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-800"
          />
        </div>

        {/* Filtro por Unidad */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Unidad:</span>
          <select
            id="seguimiento-select-unidad"
            value={selectedUnidad}
            onChange={(e) => setSelectedUnidad(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            {unidadesList.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla Interactiva de Datos */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#001738] text-white uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Nombre & Legajo SPB</th>
                <th className="px-4 py-3.5">Unidad / Pabellón</th>
                <th className="px-4 py-3.5">Asistencia %</th>
                <th className="px-4 py-3.5">Índice Conducta</th>
                <th className="px-4 py-3.5">Avance Fís./Psic.</th>
                <th className="px-4 py-3.5">Horas Cómputo</th>
                <th className="px-4 py-3.5">Beneficio Solicitado</th>
                <th className="px-4 py-3.5 text-center">Acción Judicial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredParticipantes.map((p) => {
                const isEjemplar = p.indiceConducta === 10;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {p.nombreCompleto}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                        {p.legajo}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{p.unidad}</div>
                      <div className="text-[11px] text-slate-500">{p.pabellon}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-14 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{ width: `${p.asistenciaPorcentaje}%` }}
                          ></div>
                        </div>
                        <span className="font-mono font-bold text-emerald-800 tabular-nums">
                          {p.asistenciaPorcentaje}%
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded tabular-nums ${
                            isEjemplar
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {p.indiceConducta}/10
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">
                          {p.calificacionSPB}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-xs text-slate-700">
                        {p.avanceFisicoPsicologico}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800 tabular-nums">
                      {p.horasComputadas} hrs
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold text-slate-800">
                        {p.beneficioSolicitado}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <button
                        id={`btn-expediente-${p.id}`}
                        onClick={() => onOpenReportForParticipant(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                        title="Ver y emitir informe oficial para el juzgado"
                      >
                        <i className="fa-solid fa-file-contract text-amber-300"></i>
                        <span>Informe</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredParticipantes.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No se encontraron internas con los criterios seleccionados.
          </div>
        )}
      </div>
    </div>
  );
};
