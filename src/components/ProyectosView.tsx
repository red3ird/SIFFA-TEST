import React from 'react';
import { TabType } from '../types';

interface ProyectosViewProps {
  setActiveTab: (tab: TabType) => void;
}

export const ProyectosView: React.FC<ProyectosViewProps> = ({ setActiveTab }) => {
  const proyectos = [
    {
      id: 'futbol-11',
      title: 'Fútbol 11 y Fundamentos Técnicos',
      subtitle: 'Entrenamiento Táctico y Convivencia',
      description: 'Prácticas deportivas sistemáticas orientadas a la disciplina de equipo, respeto a las reglas de juego y fomento de liderazgos positivos dentro de los pabellones femeninos.',
      unidades: 'UP33 Los Hornos, UP47 San Martín, UP50 Batán',
      participantes: '220 Alumnas',
      icon: 'fa-futbol',
      color: 'emerald',
      badge: 'Programa Central',
    },
    {
      id: 'arbitraje',
      title: 'Escuela Homologada de Árbitras Oficiales',
      subtitle: 'Capacitación Laboral con Salida Concreta',
      description: 'Formación teórico-práctica con certificación oficial en reglamentos de juego, arbitraje de campo y juezas de línea, permitiendo inserción laboral formal al recuperar la libertad.',
      unidades: 'UP33 Los Hornos, UP51 Magdalena',
      participantes: '85 Certificadas',
      icon: 'fa-whistle',
      color: 'sky',
      badge: 'Formación con Oficio',
    },
    {
      id: 'acondicionamiento',
      title: 'Preparación Física & Prevención de Salud',
      subtitle: 'Salud Integral y Manejo del Estrés',
      description: 'Rutinas de biomecánica, movilidad articular y hábitos saludables dirigidas por profesoras nacionales de educación física, impactando directamente en la salud física y mental.',
      unidades: 'UP40 Lomas de Zamora, UP47 San Martín',
      participantes: '180 Participantes',
      icon: 'fa-heart-pulse',
      color: 'amber',
      badge: 'Salud y Bienestar',
    },
    {
      id: 'psicologia',
      title: 'Taller de Mediación y Psicología Deportiva',
      subtitle: 'Gestión Emocional y Resolución de Conflictos',
      description: 'Espacios de diálogo guiados por licenciadas en psicología y sociología para canalizar tensiones del encierro mediante el juego limpio y acuerdos de convivencia.',
      unidades: 'Todas las Unidades Asignadas',
      participantes: '482 Registradas',
      icon: 'fa-brain',
      color: 'purple',
      badge: 'Soporte Psicosocial',
    },
  ];

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Header Proyectos */}
      <div className="bg-[#001738] rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider inline-block mb-3">
            Programas Sociodeportivos Institucionales
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
            Proyectos SIFFA en Contexto de Encierro
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Iniciativas integrales que combinan el rigor técnico deportivo con la capacitación laboral y el acompañamiento psicosocial, operadas por el cuerpo profesional acreditado de SIFFA en cárceles de la Provincia de Buenos Aires.
          </p>
        </div>
      </div>

      {/* Grid de Proyectos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {proyectos.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold uppercase">
                  {p.badge}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  <i className="fa-solid fa-users text-emerald-600 mr-1.5"></i>
                  {p.participantes}
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 mb-1">{p.title}</h3>
              <p className="text-xs text-emerald-700 font-bold mb-3">{p.subtitle}</p>
              <p className="text-slate-600 text-xs leading-relaxed mb-6">{p.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium truncate max-w-[240px]">
                <i className="fa-solid fa-location-dot text-slate-400 mr-1.5"></i>
                {p.unidades}
              </span>
              <button
                onClick={() => setActiveTab('informacion')}
                className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Conocer SIFFA</span>
                <i className="fa-solid fa-chevron-right text-[10px]"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Estadísticas de Impacto */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
        <div>
          <span className="text-3xl sm:text-4xl font-mono font-black text-emerald-400 block mb-1">482</span>
          <span className="text-xs text-slate-400 font-medium">Internas en Formación</span>
        </div>
        <div>
          <span className="text-3xl sm:text-4xl font-mono font-black text-white block mb-1">8</span>
          <span className="text-xs text-slate-400 font-medium">Unidades Penitenciarias</span>
        </div>
        <div>
          <span className="text-3xl sm:text-4xl font-mono font-black text-amber-400 block mb-1">85</span>
          <span className="text-xs text-slate-400 font-medium">Árbitras Homologadas</span>
        </div>
        <div>
          <span className="text-3xl sm:text-4xl font-mono font-black text-sky-400 block mb-1">0%</span>
          <span className="text-xs text-slate-400 font-medium">Incidentes de Disciplina</span>
        </div>
      </div>
    </div>
  );
};
