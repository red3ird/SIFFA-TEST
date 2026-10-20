import React from 'react';
import { TabType } from '../types';
import { EditableImage } from './EditableImage';

interface DashboardEjecutivoProps {
  setActiveTab: (tab: TabType) => void;
  onOpenQR: () => void;
  onOpenAsistencia: () => void;
  onOpenReport: () => void;
}

export const DashboardEjecutivo: React.FC<DashboardEjecutivoProps> = ({
  setActiveTab,
  onOpenQR,
  onOpenAsistencia,
  onOpenReport,
}) => {
  const kpis = [
    {
      id: 'kpi-internas',
      label: 'Internas Participantes',
      val: '482',
      trend: '+14% este trimestre',
      sub: 'En 8 Unidades Penitenciarias SPB',
      icon: 'fa-solid fa-users-viewfinder',
      accent: 'emerald',
    },
    {
      id: 'kpi-unidades',
      label: 'Unidades Activas',
      val: '8',
      trend: '100% operativas',
      sub: 'Los Hornos, Batán, San Martín, etc.',
      icon: 'fa-solid fa-building-shield',
      accent: 'blue',
    },
    {
      id: 'kpi-docentes',
      label: 'Docentes Acreditados QR',
      val: '36',
      trend: 'Curso Autoprotección OK',
      sub: 'Supervisión Dra. Silvina Campos',
      icon: 'fa-solid fa-id-badge',
      accent: 'amber',
    },
    {
      id: 'kpi-horas',
      label: 'Horas Cátedra Dictadas',
      val: '1.240',
      trend: '+85 hrs computadas esta sem.',
      sub: 'Válidas para Ley 12.256 y 24.660',
      icon: 'fa-solid fa-clock-rotate-left',
      accent: 'emerald',
    },
  ];

  const unidadesResumen = [
    { nombre: 'U33 Los Hornos (Femenino)', internas: 114, asistencia: 96, estado: 'Óptimo', docente: 'Lic. Marcela Giménez' },
    { nombre: 'U47 San Martín (Complejo Norte)', internas: 92, asistencia: 92, estado: 'Óptimo', docente: 'Prof. Romina Albornoz' },
    { nombre: 'U50 Batán (Mar del Plata)', internas: 78, asistencia: 94, estado: 'Óptimo', docente: 'Lic. Florencia Navarro' },
    { nombre: 'U40 Lomas de Zamora', internas: 65, asistencia: 89, estado: 'Regular', docente: 'Camila Benítez' },
    { nombre: 'U51 Magdalena', internas: 52, asistencia: 91, estado: 'Óptimo', docente: 'Dr. Esteban Valenzuela' },
    { nombre: 'U54 Florencio Varela', internas: 43, asistencia: 87, estado: 'Regular', docente: 'Valeria Sosa' },
    { nombre: 'U45 Melchor Romero', internas: 24, asistencia: 93, estado: 'Óptimo', docente: 'Cuerpo Técnico SIFFA' },
    { nombre: 'U8 Los Hornos (Régimen Abierto)', internas: 14, asistencia: 98, estado: 'Óptimo', docente: 'Lic. Marcela Giménez' },
  ];

  return (
    <div className="space-y-8">
      {/* Banner de Cabecera Ejecutiva con Fotografía Institucional y Scrim de Alto Contraste */}
      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-800 bg-[#001738] text-white">
        <div className="absolute inset-0">
          <EditableImage
            imageKey="hero-stadium"
            imageTitle="Banner Hero Estadio SIFFA"
            src="/src/assets/images/siffa_hero_stadium_1790964585627.jpg"
            alt="Estadio sede SIFFA"
            className="w-full h-full object-cover opacity-25"
            containerClassName="w-full h-full"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#001128] via-[#001c3d]/95 to-[#00284f]/80 pointer-events-none"></div>
        </div>

        <div className="relative z-10 p-6 sm:p-8 lg:p-10 max-w-4xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wide">
            <span>Dashboard Ejecutivo</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300">Monitoreo Trimestral 2026</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-amber-400">Convenio PBA - SPB</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 text-balance">
            Sistema Integral de Readaptación Social SIFFA
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-6 max-w-3xl">
            Control de asistencia biométrica, validación de horas pedagógicas para la morigeración de condenas bajo la Ley Provincial 12.256 y Ley Nacional 24.660, y supervisión continua de acreditaciones docentes.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenQR}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="fa-solid fa-qrcode text-amber-300"></i>
              <span>Generar Credencial QR</span>
            </button>

            <button
              onClick={onOpenAsistencia}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="fa-solid fa-clipboard-check text-amber-400"></i>
              <span>Registrar Asistencia / Conducta</span>
            </button>

            <button
              onClick={onOpenReport}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#002f6c] hover:bg-[#003d8f] text-white font-semibold text-xs sm:text-sm border border-blue-400/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="fa-solid fa-file-contract text-white"></i>
              <span>Exportar Reporte Judicial</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards (Tabular Numerals & Single Elevation Depth) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            id={kpi.id}
            className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {kpi.label}
                </span>
                <div className="text-3xl font-black text-slate-900 mt-1 font-mono tracking-tight tabular-nums">
                  {kpi.val}
                </div>
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  kpi.accent === 'emerald'
                    ? 'bg-emerald-50 text-emerald-700'
                    : kpi.accent === 'amber'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                <i className={`${kpi.icon} text-base`}></i>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <i className="fa-solid fa-arrow-trend-up text-[10px]"></i>
                <span>{kpi.trend}</span>
              </span>
              <span className="text-slate-400 font-normal text-[11px] truncate max-w-[130px]">
                {kpi.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Grilla Principal de Indicadores y Analíticas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda (2 cols): Estudio Longitudinal y Tabla de Unidades */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tarjeta: Impacto en Formación Educativa & Certificación Penitenciaria */}
          <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <i className="fa-solid fa-graduation-cap text-emerald-700"></i>
                  <span>Impacto Formativo & Certificación Penitenciaria SIFFA</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registro académico acumulado en 8 unidades penitenciarias provinciales (2024-2026)
                </p>
              </div>
              <div className="text-xs font-semibold text-emerald-700">
                Presentismo Sostenido: 98.4%
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              {/* Barra Certificaciones SIFFA */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="text-emerald-800 font-bold">Certificaciones Oficiales Aprobadas</span>
                  <span className="font-mono text-sm font-black text-emerald-700 tabular-nums">320 Títulos</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: '92%' }}></div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Títulos homologados en arbitraje federado, entrenamiento físico y talleres textiles.
                </p>
              </div>

              {/* Barra Carga Horaria Cumplida */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="text-slate-800 font-bold">Horas de Cátedra Impartidas</span>
                  <span className="font-mono text-sm font-black text-slate-800 tabular-nums">1,420+ hs</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '95%' }}></div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Horas pedagógicas válidas para estímulo educativo bajo supervisión institucional.
                </p>
              </div>
            </div>

            {/* Módulos de Formación Distribución */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">
                Distribución Curricular del Programa SIFFA
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <i className="fa-solid fa-futbol text-emerald-600"></i>
                      <span>Deportivo</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-700 tabular-nums">45%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">Física, táctica y reglas</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <i className="fa-solid fa-heart-pulse text-blue-600"></i>
                      <span>Salud Integral</span>
                    </span>
                    <span className="font-mono font-bold text-blue-700 tabular-nums">30%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">Psicología y autocuidado</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <i className="fa-solid fa-briefcase text-amber-600"></i>
                      <span>Cap. Laboral</span>
                    </span>
                    <span className="font-mono font-bold text-amber-700 tabular-nums">25%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2">
                    <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">Arbitraje, clubes y textil</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla Resumen de Unidades Penitenciarias Activas */}
          <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <i className="fa-solid fa-building-shield text-slate-700"></i>
                  <span>Unidades Penitenciarias Adheridas (SPB)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Complejos de la Provincia de Buenos Aires bajo convenio institucional SIFFA
                </p>
              </div>
              <button
                onClick={() => setActiveTab('seguimiento')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Planilla Completa</span>
                <i className="fa-solid fa-chevron-right text-[10px]"></i>
              </button>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Unidad Penitenciaria</th>
                    <th className="px-3 py-2.5">Participantes</th>
                    <th className="px-3 py-2.5">Asistencia Prom.</th>
                    <th className="px-3 py-2.5">Docente a Cargo</th>
                    <th className="px-3 py-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unidadesResumen.map((u, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-slate-900">
                        {u.nombre}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-semibold tabular-nums">
                        {u.internas} internas
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full rounded-full"
                              style={{ width: `${u.asistencia}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-bold text-[11px] tabular-nums">{u.asistencia}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 font-medium">
                        {u.docente}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[11px] font-bold ${u.estado === 'Óptimo' ? 'text-emerald-700' : 'text-amber-700'}`}>
                          ● {u.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Columna Derecha (1 col): Supervisión Dra. Campos & Seguridad Telemetría */}
        <div className="space-y-6">
          
          {/* Tarjeta Dirección General - Dra. Silvina Campos */}
          <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-11 h-11 rounded-full bg-[#001738] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0 border border-slate-700">
                <i className="fa-solid fa-user-shield text-emerald-400"></i>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Supervisión Institucional
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                  Dra. Silvina Campos
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Dirección General SIFFA - SPB
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-2.5 text-xs text-slate-600">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900 flex items-center justify-between mb-1">
                  <span>Curso Autoprotección Docente</span>
                  <span className="text-[10px] font-bold text-emerald-700">Homologado SPB</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Supervisión directa obligatoria de las 36 docentes habilitadas para ingreso con credencial digital QR en garitas de acceso.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Protocolo de Seguridad:</span>
                <span className="font-bold text-slate-900">Nivel 3 (Acceso Penal)</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Base de Operaciones:</span>
                <span className="font-bold text-slate-900">Base Raúl Cenas</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-slate-500">Próxima Visita Judicial:</span>
                <span className="font-bold text-amber-600">Jueves 24/09 (U33 Los Hornos)</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('acreditaciones')}
              className="w-full mt-4 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-id-card-clip"></i>
              <span>Verificar Acreditaciones y Docentes</span>
            </button>
          </div>

          {/* Tarjeta Telemetría Rápida (Enlace a Monitoreo) */}
          <div className="bg-[#001738] text-white rounded-xl p-6 shadow-xs border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-satellite-dish text-emerald-400"></i>
                <h4 className="font-bold text-sm text-white">Telemetría de Traslados</h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                GPS 5s FIX
              </span>
            </div>

            <div className="mt-3 space-y-3">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">Móvil 01 (Ford Transit)</span>
                  <span className="text-emerald-400 font-mono font-bold tabular-nums">64 km/h</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  En ruta a U33 Los Hornos con 3 docentes acreditadas.
                </p>
                <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Geocerca: Corredor Seguro</span>
                  <span className="text-emerald-400">Enlace OK</span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">Móvil 02 (Mercedes Sprinter)</span>
                  <span className="text-amber-400 font-mono font-bold tabular-nums">28 km/h</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Perímetro U47 San Martín (Acceso garita).
                </p>
                <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Geocerca: Aproximación Penal</span>
                  <span className="text-emerald-400">Enlace OK</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('monitoreo')}
              className="w-full mt-4 py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 border border-white/15 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-map-location-dot text-amber-400"></i>
              <span>Abrir Centro de Monitoreo en Vivo</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
