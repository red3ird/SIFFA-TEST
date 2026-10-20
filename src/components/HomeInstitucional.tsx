import React from 'react';
import { TabType, UserProfile } from '../types';
import { SiffaLogo } from './SiffaLogo';
import { BanderaArgentina } from './BanderaArgentina';
import { EditableImage } from './EditableImage';

interface HomeInstitucionalProps {
  setActiveTab: (tab: TabType) => void;
  onOpenQR: () => void;
  onOpenGoogleAuth: () => void;
  currentUser: UserProfile | null;
}

export const HomeInstitucional: React.FC<HomeInstitucionalProps> = ({
  setActiveTab,
  onOpenQR,
  onOpenGoogleAuth,
  currentUser,
}) => {
  return (
    <div className="space-y-12 animate-fadeIn">
      
      {/* 1. Hero Institucional de Alto Impacto con Logo Oficial */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-800 bg-[#001738] text-white">
        <div className="absolute inset-0">
          <EditableImage
            imageKey="hero-stadium"
            imageTitle="Banner Hero Estadio Deportivo"
            src="/src/assets/images/siffa_hero_stadium_1790964585627.jpg"
            alt="Centro deportivo y estadio SIFFA"
            className="w-full h-full object-cover object-center opacity-30"
            containerClassName="w-full h-full"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#001128] via-[#001c3d]/95 to-[#002b54]/75 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 p-8 sm:p-12 lg:p-16 max-w-5xl">
          
          {/* Logo Oficial & Badge de Autoridad */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <SiffaLogo size="md" />
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wide uppercase">
              <span>Sindicato Internacional de Fútbol Femenino y Afines</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="text-slate-300">Programa Institucional de Transformación Sociodeportiva</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="text-amber-400 flex items-center gap-1.5">
                <BanderaArgentina size="xs" />
                <span>Convenio PBA - SPB · Argentina</span>
              </span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white text-balance leading-tight mb-5">
            Fútbol Femenino en las Cárceles: Formación, Dignidad y Desarrollo Social
          </h1>

          <p className="text-base sm:text-lg text-slate-200 font-normal leading-relaxed max-w-3xl mb-8">
            Portal oficial del programa de formación deportiva, capacitación laboral y educación en valores implementado por el <strong>SIFFA</strong> en Unidades Penitenciarias de la Provincia de Buenos Aires. Una herramienta de transformación humana orientada al aprendizaje continuo y la preparación sociolaboral.
          </p>

          {/* Botones de Acción Inmediata */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setActiveTab('proyectos')}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-all shadow-lg hover:shadow-emerald-600/30 cursor-pointer whitespace-nowrap"
            >
              <span>Conocer Proyectos Formativos</span>
              <i className="fa-solid fa-arrow-right text-xs"></i>
            </button>

            <button
              onClick={onOpenQR}
              className="inline-flex items-center gap-2.5 px-5 py-3.5 text-sm font-semibold text-slate-100 bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md rounded-xl transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="fa-solid fa-qrcode text-amber-300"></i>
              <span>Credencial Digital (Docentes)</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('seccion-quienes-somos');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="fa-solid fa-circle-info text-emerald-400"></i>
              <span>Quiénes Somos & Qué Hacemos</span>
            </button>

            {!currentUser && (
              <button
                onClick={onOpenGoogleAuth}
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer whitespace-nowrap ml-auto"
              >
                <i className="fa-solid fa-user-lock text-emerald-400"></i>
                <span>Identificación Institucional</span>
              </button>
            )}
          </div>
        </div>

        {/* Información Institucional: Dirección General */}
        <div className="relative z-10 border-t border-slate-700/60 bg-[#000f24]/90 px-8 py-4 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm shrink-0">
              <i className="fa-solid fa-user-tie"></i>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-wider">Dirección General</span>
              <span className="text-white font-bold text-sm">Dra. Silvina Campos (SIFFA)</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Programa Oficial PBA · Servicio Penitenciario Bonaerense</span>
          </div>
        </div>
      </section>

      {/* 2. SECCIÓN PRINCIPAL: QUIÉNES SOMOS & QUÉ HACEMOS (Énfasis Claro y Directo) */}
      <section id="seccion-quienes-somos" className="space-y-6 scroll-mt-20">
        
        {/* Cabecera de la Sección */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
              <i className="fa-solid fa-landmark"></i>
              <span>Identidad & Misión Institucional</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
              Quiénes Somos y Qué Hacemos
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Sindicato Internacional de Fútbol Femenino y Afines · Personería Jurídica
          </span>
        </div>

        {/* Bloque 1: QUIÉNES SOMOS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <i className="fa-solid fa-users-gear text-emerald-600"></i>
              <span>Nuestra Organización</span>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 leading-snug">
              Somos el sindicato que promueve la jerarquización, el respeto y la inclusión a través del fútbol femenino
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed">
              El <strong>Sindicato Internacional de Fútbol Femenino y Afines (SIFFA)</strong> es una entidad gremial, formativa y social nacida para defender los derechos de las futbolistas, democratizar el acceso a la práctica deportiva y utilizar la potencia pedagógica del fútbol como vehículo de integración humana.
            </p>

            <p className="text-sm text-slate-600 leading-relaxed">
              En articulación estratégica con el <strong>Ministerio de Justicia y Derechos Humanos de la Provincia de Buenos Aires</strong> y el <strong>Servicio Penitenciario Bonaerense (SPB)</strong>, SIFFA diseña, coordina y ejecuta de manera continua el programa sociodeportivo en unidades penitenciarias provinciales, bajo la supervisión general de la <strong>Dra. Silvina Campos</strong> y un calificado equipo de entrenadoras, preparadoras físicas, psicólogas y talleristas.
            </p>

            {/* Sellos de Respaldo */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <i className="fa-solid fa-certificate text-emerald-600"></i>
                <span>Técnicas Homologadas ATFA</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <i className="fa-solid fa-scale-balanced text-blue-600"></i>
                <span>Supervisión Judicial SPB</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <i className="fa-solid fa-shield-halved text-amber-600"></i>
                <span>Seguridad Asimétrica Ed25519</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#001738] to-[#002b54] text-white rounded-3xl shadow-lg border border-slate-800 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Emblema SIFFA Grande con silueta femenina sin márgenes blancos ni textos redundantes */}
            <SiffaLogo size="2xl" rounded="rounded-3xl" className="shadow-2xl border-4 border-emerald-400/50" />
          </div>
        </div>

        {/* Bloque 2: QUÉ HACEMOS (Los 4 Pilares de Acción) */}
        <div>
          <div className="mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Líneas de Acción Estratégica
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">
              Qué Hacemos: 4 Áreas de Trabajo Concreto
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Área 1 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-emerald-500 hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl font-bold">
                  <i className="fa-solid fa-futbol"></i>
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  1. Formación Deportiva & Táctica
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Entrenamientos semanales de fútbol 11 y espacios reducidos en canchas penitenciarias. Clínicas de técnica individual, táctica colectiva y preparación física coordinadas por directores técnicos titulados.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <span>Aval técnico ATFA</span>
                <i className="fa-solid fa-check text-xs ml-auto"></i>
              </div>
            </div>

            {/* Área 2 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-blue-500 hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl font-bold">
                  <i className="fa-solid fa-hand-holding-heart"></i>
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  2. Educación en Valores & Salud
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Talleres de psicología deportiva, autorregulación de la frustración, mediación pacífica ante roces de patio, hábitos saludables y construcción de convivencia positiva dentro del pabellón.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-blue-700 font-bold flex items-center gap-1">
                <span>Psicología Social</span>
                <i className="fa-solid fa-check text-xs ml-auto"></i>
              </div>
            </div>

            {/* Área 3 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-amber-500 hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl font-bold">
                  <i className="fa-solid fa-briefcase"></i>
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  3. Oficios & Capacitación Laboral
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cursos con certificación oficial en arbitraje homologado (reglamento IFAB/AFA), corte y confección textil de indumentaria deportiva y gestión comunitaria de clubes de barrio para el egreso.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-amber-700 font-bold flex items-center gap-1">
                <span>Certificación Oficial</span>
                <i className="fa-solid fa-check text-xs ml-auto"></i>
              </div>
            </div>

            {/* Área 4 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-800 hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center text-xl font-bold">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  4. Seguridad Penitenciaria & QR
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sistema de acreditación estricta del personal docente mediante credenciales con firma criptográfica asimétrica Ed25519 y validación contextual de accesos laborales en las garitas de control del SPB.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-800 font-bold flex items-center gap-1">
                <span>Criptografía Ed25519</span>
                <i className="fa-solid fa-check text-xs ml-auto"></i>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* 3. Accesos Directos a los Módulos del Sistema */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              Plataformas Integradas de la Web
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Acceso a los entornos de capacitación audiovisual, acreditaciones laborales y seguimiento institucional.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Proyectos y Clínicas Deportivas */}
          <div
            onClick={() => setActiveTab('proyectos')}
            className="group p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform text-xl">
                <i className="fa-solid fa-futbol"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Proyectos & Clínicas Deportivas
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                Talleres de fútbol formativo, preparación física y escuelas técnicas desarrolladas semanalmente en las unidades penitenciarias.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>Ver Proyectos</span>
              <i className="fa-solid fa-chevron-right text-[10px] transform group-hover:translate-x-1 transition-transform"></i>
            </div>
          </div>

          {/* Card 2: Credencial Digital con QR Dinámico */}
          <div
            onClick={onOpenQR}
            className="group p-6 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform text-xl">
                <i className="fa-solid fa-qrcode"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Mi Credencial Digital (QR)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                Pase laboral con token rotativo cada 90 segundos y firma asimétrica de servidor Ed25519 para ingreso a establecimientos penales.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
              <span>Ver Mi Credencial</span>
              <i className="fa-solid fa-chevron-right text-[10px] transform group-hover:translate-x-1 transition-transform"></i>
            </div>
          </div>

          {/* Card 3: Programa Pedagógico y Marco Legal */}
          <div
            onClick={() => setActiveTab('programa')}
            className="group p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform text-xl">
                <i className="fa-solid fa-book-open-reader"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                Marco Pedagógico & Ley
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                Fundamentos jurídicos de la Ley de Ejecución Penal (Ley 12.256 / 24.660), estímulo educativo y estándares de derechos humanos.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
              <span>Conocer el Programa</span>
              <i className="fa-solid fa-chevron-right text-[10px] transform group-hover:translate-x-1 transition-transform"></i>
            </div>
          </div>
        </div>
      </section>

      {/* Comunicados Institucionales y Resoluciones */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span>Gobernanza & Normativas</span>
              <span aria-hidden="true">·</span>
              <span>Resoluciones Oficiales</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Comunicados Institucionales SIFFA
            </h2>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 px-3 -mx-3 rounded-lg transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-emerald-700">Resolución SIFFA-2026-08</span>
                <span aria-hidden="true">·</span>
                <span>14 de Febrero de 2026</span>
                <span aria-hidden="true">·</span>
                <span>Dirección General: Dra. Campos</span>
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Homologación del Protocolo de Credenciales Digitales de Acceso Laboral para Docentes
              </h4>
              <p className="text-xs text-slate-600 line-clamp-1">
                Aprobación del carnet digital con código QR para todo el personal docente que concurre a trabajar a las unidades penitenciarias provinciales.
              </p>
            </div>
            <button
              onClick={onOpenQR}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <i className="fa-solid fa-qrcode text-emerald-700"></i>
              <span>Ver Credencial</span>
            </button>
          </div>

          <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 px-3 -mx-3 rounded-lg transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-blue-700">Convenio PBA-SPB-2026</span>
                <span aria-hidden="true">·</span>
                <span>28 de Enero de 2026</span>
                <span aria-hidden="true">·</span>
                <span>Unidades U33, U47, U50 y U51</span>
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Carga Horaria Computable como Estímulo Educativo (Art. 140 Ley 12.256)
              </h4>
              <p className="text-xs text-slate-600 line-clamp-1">
                Incorporación formal de los módulos formativos de fútbol femenino como actividad pedagógica válida para la reducción de plazos de condena.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('programa')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <i className="fa-solid fa-book-open text-blue-700"></i>
              <span>Ver Marco Legal</span>
            </button>
          </div>
        </div>
      </section>

      {/* 6. Banner de Gobernanza Institucional */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold tracking-wide uppercase">
            <i className="fa-solid fa-shield-halved"></i>
            <span>Estándares Internacionales de Derechos Humanos</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white text-balance">
            Programa Auditado bajo Reglas de Bangkok y Reglas Mandela de la ONU
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            SIFFA opera bajo estricto cumplimiento de los tratados internacionales de tratamiento penitenciario femenino con perspectiva de género, resguardo de la dignidad humana y trazabilidad pedagógica verificable.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setActiveTab('proyectos')}
            className="px-5 py-2.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            Ver Proyectos y Talleres
          </button>
        </div>
      </section>

    </div>
  );
};
