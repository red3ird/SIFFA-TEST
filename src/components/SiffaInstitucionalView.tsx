import React from 'react';
import { SiffaLogo } from './SiffaLogo';
import { BanderaArgentina } from './BanderaArgentina';
import { EditableImage } from './EditableImage';
import { TabType } from '../types';

interface SiffaInstitucionalViewProps {
  setActiveTab: (tab: TabType) => void;
  onOpenGoogleAuth: () => void;
}

export const SiffaInstitucionalView: React.FC<SiffaInstitucionalViewProps> = ({
  setActiveTab,
  onOpenGoogleAuth,
}) => {
  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Header Institucional */}
      <div className="bg-[#001738] rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <BanderaArgentina size="xs" />
              <span>Institución Oficial · Personería Gremial y Deportiva</span>
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
            SIFFA: Sindicato Internacional de Fútbol Femenino y Afines
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Organización pionera dedicada al desarrollo integral, profesionalización y transformación humana a través del fútbol femenino, con despliegue operativo prioritario en contextos de privación de la libertad en convenio con el Servicio Penitenciario Bonaerense.
          </p>
        </div>
      </div>

      {/* Misión, Visión y Pilares Fundamentales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xl mb-4">
            <i className="fa-solid fa-bullseye"></i>
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg mb-2">Misión Institucional</h3>
          <p className="text-slate-600 text-xs leading-relaxed">
            Rehabilitar, empoderar y brindar herramientas laborales concretas (arbitraje, entrenamiento técnico, preparación física) a mujeres privadas de la libertad para garantizar una reinserción social digna y sostenible.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center text-xl mb-4">
            <i className="fa-solid fa-eye"></i>
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg mb-2">Visión Estratégica</h3>
          <p className="text-slate-600 text-xs leading-relaxed">
            Consolidar una red penitenciaria modelo en América Latina donde el deporte sea política pública de Estado para la reducción del índice de reincidencia y la reconstrucción del tejido comunitario.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-xl mb-4">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg mb-2">Seguridad y Disciplina</h3>
          <p className="text-slate-600 text-xs leading-relaxed">
            Gobernanza estricta bajo credencialización asimétrica Ed25519 y padrón cerrado, garantizando máxima trazabilidad, bioseguridad y control de accesos a unidades de máxima y mediana seguridad.
          </p>
        </div>
      </div>

      {/* Autoridades y Estructura Organizacional */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
            Gobernanza Institucional
          </span>
          <h2 className="text-2xl font-black text-slate-900">
            Comisión Directiva y Equipo de Supervisión
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <EditableImage
              imageKey="autoridad-silvina-campos"
              imageTitle="Dra. Silvina Campos (Directora General)"
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80"
              alt="Dra. Silvina Campos"
              className="w-20 h-20 rounded-2xl mx-auto object-cover border-2 border-emerald-500 shadow-xs"
            />
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Dra. Silvina Campos</h4>
              <p className="text-[11px] text-emerald-700 font-bold uppercase">Directora General SIFFA</p>
              <p className="text-[11px] text-slate-500 mt-1">Especialista en Derecho Penal y Política Penitenciaria</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <EditableImage
              imageKey="autoridad-matias-medina"
              imageTitle="Lic. Matías Medina (Secretario Técnico & Sistemas)"
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
              alt="Matías Medina"
              className="w-20 h-20 rounded-2xl mx-auto object-cover border-2 border-emerald-500 shadow-xs"
            />
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Lic. Matías Medina</h4>
              <p className="text-[11px] text-emerald-700 font-bold uppercase">Secretario Técnico & Sistemas</p>
              <p className="text-[11px] text-slate-500 mt-1">Arquitectura de Credenciales Digitales e Identidad</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <EditableImage
              imageKey="autoridad-marcela-gimenez"
              imageTitle="Lic. Marcela Giménez (Coordinadora Docente)"
              src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80"
              alt="Lic. Marcela Giménez"
              className="w-20 h-20 rounded-2xl mx-auto object-cover border-2 border-emerald-500 shadow-xs"
            />
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Lic. Marcela Giménez</h4>
              <p className="text-[11px] text-emerald-700 font-bold uppercase">Coordinadora Docente (UP33)</p>
              <p className="text-[11px] text-slate-500 mt-1">Directora Técnica Nacional ATFA / Docente Titular</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <EditableImage
              imageKey="autoridad-florencia-navarro"
              imageTitle="Lic. Florencia Navarro (Gabinete Psicosocial)"
              src="https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80"
              alt="Lic. Florencia Navarro"
              className="w-20 h-20 rounded-2xl mx-auto object-cover border-2 border-emerald-500 shadow-xs"
            />
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Lic. Florencia Navarro</h4>
              <p className="text-[11px] text-emerald-700 font-bold uppercase">Gabinete Psicosocial (UP50)</p>
              <p className="text-[11px] text-slate-500 mt-1">Psicología de Grupos y Evaluación de Conducta</p>
            </div>
          </div>
        </div>
      </div>

      {/* Marco de Convenio y Padrón Cerrado */}
      <div className="bg-[#001738] rounded-3xl p-8 border border-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase">
            <i className="fa-solid fa-file-contract"></i>
            <span>Convenio Marco Ministerio de Justicia - SIFFA</span>
          </div>
          <h3 className="text-xl font-bold">¿Perteneces al cuerpo profesional de SIFFA?</h3>
          <p className="text-slate-300 text-xs max-w-xl leading-relaxed">
            El acceso a credenciales digitales y gestión operativa requiere autenticación en nuestro padrón cerrado. Si ya fuiste dado de alta por la administración, puedes identificarte de inmediato.
          </p>
        </div>
        <button
          onClick={onOpenGoogleAuth}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer whitespace-nowrap"
        >
          <i className="fa-solid fa-id-card-clip mr-2"></i>
          <span>Identificarme en SIFFA</span>
        </button>
      </div>
    </div>
  );
};
