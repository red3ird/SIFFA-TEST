import React from 'react';
import { TabType } from '../types';
import { EditableImage } from './EditableImage';

interface ProfesionalesPublicViewProps {
  onOpenGoogleAuth: () => void;
  setActiveTab: (tab: TabType) => void;
}

export const ProfesionalesPublicView: React.FC<ProfesionalesPublicViewProps> = ({
  onOpenGoogleAuth,
  setActiveTab,
}) => {
  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Header */}
      <div className="bg-[#001738] rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider inline-block mb-3">
            Cuerpo Profesional Penitenciario
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
            Acreditación y Homologación de Profesionales SIFFA
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Ingreso y permanencia en establecimientos penitenciarios bajo rigurosos protocolos éticos, validación de antecedentes penales, títulos habilitantes (ATFA, Educación Física, Licenciatura en Psicología) y firma criptográfica asimétrica Ed25519.
          </p>
        </div>
      </div>

      {/* Protocolo de Acreditación */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
            Requisitos Institucionales
          </span>
          <h2 className="text-2xl font-black text-slate-900">
            Estándares de Seguridad para Ingreso a Unidades SPB
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
              01
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">Idoneidad Técnica y Título</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Matrícula profesional vigente emitida por entidad oficial (Asociación de Técnicos del Fútbol Argentino, Colegios de Psicólogos o Ministerio de Educación).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
              02
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">Aptitud de Seguridad SPB</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Certificado de reincidencia nacional sin antecedentes incompatibles y autorización expresa de la Dirección de Seguridad del Servicio Penitenciario Bonaerense.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
              03
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">Credencial Digital Ed25519</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Emisión de token digital individual intransferible con rotación dinámica de código QR cada 90 segundos para validación en garita y libros de guardia.
            </p>
          </div>
        </div>
      </div>

      {/* Roster de Profesionales Destacados */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
              Padrón Homologado
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Cuerpo Docente y Especialistas Acreditados
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('credencial')}
            className="px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            <i className="fa-solid fa-qrcode mr-1.5"></i>
            <span>Portal de Verificación de Credencial</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-colors space-y-3">
            <div className="flex items-center gap-3">
              <EditableImage
                imageKey="docente-marcela-gimenez"
                imageTitle="Docente: Lic. Marcela Giménez"
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80"
                alt="Marcela Giménez"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400"
              />
              <div>
                <h4 className="font-black text-slate-900 text-sm">Lic. Marcela Giménez</h4>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Docente Titular
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p><strong>Matrícula:</strong> ATFA-4821 / SIFFA-0089</p>
              <p><strong>Destino:</strong> UP33 Los Hornos</p>
              <p><strong>Especialidad:</strong> Táctica de Fútbol 11</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-colors space-y-3">
            <div className="flex items-center gap-3">
              <EditableImage
                imageKey="docente-romina-albornoz"
                imageTitle="Docente: Prof. Romina Albornoz"
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80"
                alt="Romina Albornoz"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400"
              />
              <div>
                <h4 className="font-black text-slate-900 text-sm">Prof. Romina Albornoz</h4>
                <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                  Instructora
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p><strong>Matrícula:</strong> PE-1928 / SIFFA-0104</p>
              <p><strong>Destino:</strong> UP47 San Martín</p>
              <p><strong>Especialidad:</strong> Preparación Física</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-colors space-y-3">
            <div className="flex items-center gap-3">
              <EditableImage
                imageKey="docente-florencia-navarro"
                imageTitle="Docente: Lic. Florencia Navarro"
                src="https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80"
                alt="Florencia Navarro"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400"
              />
              <div>
                <h4 className="font-black text-slate-900 text-sm">Lic. Florencia Navarro</h4>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  Docente Psicosocial
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p><strong>Matrícula:</strong> MP-8920 / SIFFA-0122</p>
              <p><strong>Destino:</strong> UP50 Batán</p>
              <p><strong>Especialidad:</strong> Psicología de Grupos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to action de identificación */}
      <div className="p-6 bg-slate-900 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm">¿Eres profesional asignado de SIFFA?</h4>
          <p className="text-xs text-slate-400">Ingresa con tu correo oficial para ver tu credencial digital y asignaciones.</p>
        </div>
        <button
          onClick={onOpenGoogleAuth}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-colors whitespace-nowrap"
        >
          Iniciar Sesión
        </button>
      </div>
    </div>
  );
};
