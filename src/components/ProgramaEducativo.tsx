import React from 'react';
import { TabType } from '../types';

interface ProgramaEducativoProps {
  setActiveTab: (tab: TabType) => void;
  onOpenGoogleAuth: () => void;
}

export const ProgramaEducativo: React.FC<ProgramaEducativoProps> = ({
  setActiveTab,
  onOpenGoogleAuth,
}) => {
  return (
    <div className="space-y-10">
      {/* Header Institucional */}
      <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
          <span>Programa Oficial SIFFA</span>
          <span aria-hidden="true">·</span>
          <span>Convenio Ministerio de Justicia y DDHH de la Provincia de Buenos Aires</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 text-balance leading-tight">
          "Fútbol Femenino en las Cárceles: Un Camino hacia la Readaptación Social"
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-4 max-w-3xl leading-relaxed">
          Iniciativa de intervención socioeducativa desarrollada por el Sindicato Internacional de Fútbol Femenino y Afines (SIFFA) en Unidades Penitenciarias bonaerenses. Promovemos la educación deportiva, el autocuidado en salud y la formación en oficios con perspectiva de género y pleno respeto por los derechos humanos.
        </p>
      </div>

      {/* 3 Ejes Pedagógicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl font-bold">
            <i className="fa-solid fa-futbol"></i>
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase">Eje Formativo 01</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Formación Deportiva & Táctica</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Entrenamiento de fútbol 11, fundamentación técnica, preparación física funcional y estudio del reglamento oficial IFAB. Fomenta el respeto a las reglas, el compañerismo y la resolución pacífica de controversias.
          </p>
          <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
            <li className="flex items-center gap-2">
              <i className="fa-solid fa-check text-emerald-600"></i>
              <span>Cuerpo técnico nacional con titulación ATFA / SIFFA</span>
            </li>
            <li className="flex items-center gap-2">
              <i className="fa-solid fa-check text-emerald-600"></i>
              <span>Prácticas de campo supervisadas en patios penitenciarios</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl font-bold">
            <i className="fa-solid fa-heart-pulse"></i>
          </div>
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase">Eje Formativo 02</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Salud Integral & Bienestar</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Talleres de psicología social, prevención de adicciones, salud reproductiva y hábitos de autocuidado en contexto de encierro. Estimula la reconstrucción de la autoestima y el proyecto de vida.
          </p>
          <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
            <li className="flex items-center gap-2">
              <i className="fa-solid fa-check text-blue-600"></i>
              <span>Dinámicas grupales de convivencia dialógica</span>
            </li>
            <li className="flex items-center gap-2">
              <i className="fa-solid fa-check text-blue-600"></i>
              <span>Reducción de situaciones de tensión en pabellones</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl font-bold">
            <i className="fa-solid fa-briefcase"></i>
          </div>
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase">Eje Formativo 03</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Capacitación Laboral & Oficios</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Herramientas concretas para el egreso penitenciario: confección de indumentaria deportiva, mantenimiento de campos deportivos, arbitraje oficial y gestión social en clubes barriales.
          </p>
          <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
            <li className="flex items-center gap-2">
              <i className="fa-solid fa-check text-amber-600"></i>
              <span>Certificaciones con validez pedagógica oficial</span>
            </li>
            <li className="flex items-center gap-2">
              <i className="fa-solid fa-check text-amber-600"></i>
              <span>Vinculación con el sindicato y cooperativas</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Marco Legal & Estímulo Educativo */}
      <div className="bg-[#001738] rounded-2xl border border-slate-800 p-8 text-white space-y-6">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Marco Jurídico de la Readaptación
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">
            Ley de Ejecución Penal Bonaerense N° 12.256 y Ley Nacional N° 24.660
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
            El programa de fútbol femenino se encuadra como <strong>estímulo educativo calificado</strong> bajo el artículo 140 de la ley de ejecución penal. La acreditación de asistencia y conducta en los módulos de SIFFA permite certificar horas de formación continua para la evaluación judicial de beneficios y reducción de plazos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="font-bold text-emerald-400 block text-base">Cómputo Certificado</span>
            <p className="text-xs text-slate-400 mt-1">
              Registro biométrico en campo y en el campus virtual para remitir a juzgados de ejecución.
            </p>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="font-bold text-amber-400 block text-base">Supervisión Institucional</span>
            <p className="text-xs text-slate-400 mt-1">
              Dirección General SIFFA - SPB a cargo de la Dra. Silvina Campos.
            </p>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="font-bold text-white block text-base">Perspectiva de Género</span>
            <p className="text-xs text-slate-400 mt-1">
              Alineado con las Reglas de Bangkok de las Naciones Unidas para mujeres privadas de libertad.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Institucional */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            ¿Querés participar en los proyectos formativos de SIFFA?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            Sumate como profesional docente o técnico acreditado para el desarrollo de actividades formativas y sociodeportivas en unidades penitenciarias.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('proyectos')}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
          >
            Ver Proyectos
          </button>
          <button
            onClick={onOpenGoogleAuth}
            className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer flex items-center gap-2"
          >
            <i className="fa-solid fa-lock text-emerald-600"></i>
            <span>Acceso Institucional</span>
          </button>
        </div>
      </div>
    </div>
  );
};
