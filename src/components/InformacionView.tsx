import React, { useState } from 'react';
import { SiffaLogo } from './SiffaLogo';
import { BanderaArgentina } from './BanderaArgentina';
import { EditableImage } from './EditableImage';
import { TabType } from '../types';

interface InformacionViewProps {
  initialSubSection?: 'institucional' | 'integrantes' | 'normativa' | 'faqs';
  setActiveTab?: (tab: TabType) => void;
  onOpenAuth?: () => void;
}

export const InformacionView: React.FC<InformacionViewProps> = ({
  initialSubSection = 'institucional',
  setActiveTab,
  onOpenAuth,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'institucional' | 'integrantes' | 'normativa' | 'faqs'>(
    initialSubSection
  );
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODOS');

  // Integrantes y Cuerpo Profesional de la SIFFA
  const integrantes = [
    {
      id: 'PROF-001',
      name: 'Lic. Marcela Giménez',
      cargo: 'Coordinadora General de Docencia Deportiva',
      especialidad: 'Psicología Social & DT Licencia AFA',
      matricula: 'MP-BA-84920',
      unidadAsignada: 'UP N° 33 Los Hornos',
      foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      estado: 'ACTIVO',
      categoria: 'DOCENCIA',
      antiguedad: '4 años en SIFFA',
    },
    {
      id: 'PROF-002',
      name: 'Prof. Romina Albornoz',
      cargo: 'Instructora Técnica y Preparadora Física',
      especialidad: 'Fútbol Femenino & Acondicionamiento Físico',
      matricula: 'PF-BA-22194',
      unidadAsignada: 'UP N° 47 San Martín',
      foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
      estado: 'ACTIVO',
      categoria: 'TECNICA',
      antiguedad: '3 años en SIFFA',
    },
    {
      id: 'PROF-003',
      name: 'Dra. Florencia Navarro',
      cargo: 'Directora del Área de Salud y Psicología',
      especialidad: 'Psicología en Contextos de Encierro',
      matricula: 'PSI-BA-51204',
      unidadAsignada: 'UP N° 50 Batán',
      foto: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&auto=format&fit=crop&q=80',
      estado: 'ACTIVO',
      categoria: 'SALUD',
      antiguedad: '5 años en SIFFA',
    },
    {
      id: 'PROF-004',
      name: 'Árb. Sabrina Gómez',
      cargo: 'Instructora de Reglas de Juego y Arbitraje',
      especialidad: 'Árbitra Nacional Oficial AFA / SIFFA',
      matricula: 'ARB-NAC-1108',
      unidadAsignada: 'UP N° 40 Lomas de Zamora',
      foto: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80',
      estado: 'ACTIVO',
      categoria: 'ARBITRAJE',
      antiguedad: '2 años en SIFFA',
    },
    {
      id: 'PROF-005',
      name: 'Lic. Carla Benítez',
      cargo: 'Trabajadora Social y Tutora de Morigeración',
      especialidad: 'Trabajo Social Penitenciario y Vínculos Familiares',
      matricula: 'TS-BA-39102',
      unidadAsignada: 'UP N° 33 Los Hornos',
      foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      estado: 'ACTIVO',
      categoria: 'SALUD',
      antiguedad: '4 años en SIFFA',
    },
    {
      id: 'PROF-006',
      name: 'Prof. Lucas Peralta',
      cargo: 'Coordinador Técnico de Materiales e Indumentaria',
      especialidad: 'Logística Deportiva y Seguridad en Campo',
      matricula: 'EDF-BA-90112',
      unidadAsignada: 'UP N° 51 Magdalena',
      foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      estado: 'ACTIVO',
      categoria: 'TECNICA',
      antiguedad: '3 años en SIFFA',
    },
  ];

  const autoridades = [
    {
      cargo: 'Secretaría General & Dirección Ejecutiva',
      nombre: 'Comisión Directiva Central SIFFA',
      rol: 'Gobierno Institucional y Relaciones Gremiales',
      contacto: 'secretaria@siffa.org',
    },
    {
      cargo: 'Coordinación Penitenciaria y Enlace SPB',
      nombre: 'Dirección de Articulación Institucional',
      rol: 'Homologación de Autorizaciones y Protocolos',
      contacto: 'penitenciario@siffa.org',
    },
    {
      cargo: 'Departamento Médico y de Acompañamiento Psicosocial',
      nombre: 'Cuerpo de Psicología y Trabajo Social',
      rol: 'Atención a Internas y Programas de Morigeración',
      contacto: 'salud@siffa.org',
    },
    {
      cargo: 'Seguridad Informática y Credenciales Asimétricas',
      nombre: 'Área Técnica de Infraestructura y Claves Criptográficas',
      rol: 'Administración de Claves Ed25519 y Padrón Central',
      contacto: 'sistemas@siffa.org',
    },
  ];

  const faqs = [
    {
      q: '¿Por qué no existe registro abierto al público general en SIFFA?',
      a: 'Por estrictas razones de seguridad del Servicio Penitenciario Bonaerense (SPB), solo el personal docente, arbitral y directivo expresamente habilitado mediante resolución judicial o ministerial puede ser incorporado a la plataforma. No existe autoregistro público.',
    },
    {
      q: '¿Qué tecnología de firma respalda la credencial digital?',
      a: 'Utiliza criptografía asimétrica Ed25519 (Curva Edwards de 255 bits). Cada código QR contiene un token efímero con timestamp, firma y caducidad de 90 segundos que previene capturas de pantalla, clonaciones o adulteración offline.',
    },
    {
      q: '¿Cómo se determina la validez de una credencial en el puesto de guardia?',
      a: 'La credencial jamás se considera válida únicamente por mostrar una imagen. El guardia de acceso la valida escaneando el QR con el sistema central en tiempo real o ingresando el código/DNI manualmente, comprobando el estado activo, la unidad asignada y el horario reglamentario.',
    },
    {
      q: '¿Qué ocurre si un integrante pierde la vigencia o es suspendido?',
      a: 'El administrador cambia el estado en la base de datos a INACTIVO, REVOCADO o SUSPENDIDO. Inmediatamente el validador en garita rechazará cualquier intento de acceso, protegiendo el perímetro y guardando registro inmutable en auditoría.',
    },
    {
      q: '¿Cómo se vincula SIFFA con el Servicio Penitenciario Bonaerense (SPB)?',
      a: 'A través del Convenio Marco de Cooperación N° 108/2024 ratificado por el Ministerio de Justicia y Derechos Humanos de la Provincia de Buenos Aires, que autoriza la labor docente y deportiva en las Unidades Penitenciarias N° 33, 40, 47, 50 y 51.',
    },
  ];

  const filteredIntegrantes = selectedCategoria === 'TODOS'
    ? integrantes
    : integrantes.filter((item) => item.categoria === selectedCategoria);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Institucional de Información */}
      <div className="bg-[#001738] rounded-3xl p-8 sm:p-10 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <BanderaArgentina size="xs" />
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 text-[11px] font-extrabold uppercase tracking-wider">
              Área de Información Central SIFFA
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Estructura Institucional, Integrantes y Marco Legal
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Consulte toda la información referente a la identidad de SIFFA, el cuerpo homologado de integrantes profesionales, autoridades directivas, convenios con el Servicio Penitenciario Bonaerense y normativas de seguridad.
          </p>
        </div>
      </div>

      {/* Submenú Navegable de Información: SIFFA Institucional | Integrantes | Marco Legal | Preguntas */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap gap-1">
        <button
          onClick={() => setActiveSubTab('institucional')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'institucional'
              ? 'bg-[#001738] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <i className="fa-solid fa-shield-halved text-emerald-400"></i>
          <span>1. SIFFA Institucional</span>
        </button>

        <button
          onClick={() => setActiveSubTab('integrantes')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'integrantes'
              ? 'bg-[#001738] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <i className="fa-solid fa-users text-sky-400"></i>
          <span>2. Integrantes de SIFFA</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
            {integrantes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('normativa')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'normativa'
              ? 'bg-[#001738] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <i className="fa-solid fa-scale-balanced text-amber-400"></i>
          <span>3. Marco Legal & SPB</span>
        </button>

        <button
          onClick={() => setActiveSubTab('faqs')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'faqs'
              ? 'bg-[#001738] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <i className="fa-solid fa-circle-question text-purple-400"></i>
          <span>4. Preguntas Frecuentes</span>
        </button>
      </div>

      {/* SECCIÓN 1: SIFFA INSTITUCIONAL */}
      {activeSubTab === 'institucional' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Misión, Visión y Pilares Fundamentales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-bullseye"></i>
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">Misión Institucional</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Rehabilitar, empoderar y brindar herramientas laborales concretas (arbitraje oficial, formación técnica y preparación física) a mujeres privadas de la libertad para garantizar una reinserción social digna, pacífica y sostenible.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-eye"></i>
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">Visión Estratégica</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Consolidar una red penitenciaria deportiva modelo en América Latina donde el deporte y la formación sean política pública permanente para reducir la reincidencia carcelaria y reconstruir lazos familiares y comunitarios.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">Seguridad y Disciplina</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Gobernanza institucional estricta bajo credencialización asimétrica Ed25519 y padrón cerrado, garantizando máxima trazabilidad, bioseguridad y control de ingresos en garitas del Servicio Penitenciario Bonaerense.
              </p>
            </div>
          </div>

          {/* Autoridades y Estructura Directiva */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#001738] text-white flex items-center justify-center text-lg">
                <i className="fa-solid fa-sitemap"></i>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Cuerpo Directivo y Autoridades de la SIFFA
                </h2>
                <p className="text-xs text-slate-500">
                  Estructura de gobierno, enlace ministerial y conducción gremial
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {autoridades.map((aut, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block mb-1">
                    {aut.cargo}
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm mb-1">{aut.nombre}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{aut.rol}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <i className="fa-solid fa-envelope text-slate-400"></i>
                    <span>{aut.contacto}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 2: INTEGRANTES DE SIFFA (PROFESIONALES) */}
      {activeSubTab === 'integrantes' && (
        <div className="space-y-8 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                Padrón Homologado
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                Plantel de Profesionales e Integrantes Oficiales
              </h3>
              <p className="text-xs text-slate-500">
                Docentes, entrenadoras, árbitras y psicólogas con habilitación judicial para unidades penitenciarias
              </p>
            </div>

            {/* Filtro por Categoría */}
            <div className="flex flex-wrap items-center gap-2">
              {['TODOS', 'DOCENCIA', 'TECNICA', 'SALUD', 'ARBITRAJE'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoria(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategoria === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tarjetas de Integrantes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIntegrantes.map((persona) => (
              <div
                key={persona.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <EditableImage
                      imageKey={`integrante-${persona.id}`}
                      imageTitle={`Foto: ${persona.name}`}
                      src={persona.foto}
                      alt={persona.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase">
                          {persona.estado}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {persona.id}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base leading-tight truncate">
                        {persona.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                        {persona.cargo}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 py-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Especialidad:</span>
                      <span className="font-semibold text-slate-800 text-right">{persona.especialidad}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Matrícula:</span>
                      <span className="font-mono font-bold text-slate-700">{persona.matricula}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Unidad Habilitada:</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        {persona.unidadAsignada}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-clock-rotate-left text-slate-400"></i>
                    <span>{persona.antiguedad}</span>
                  </span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <i className="fa-solid fa-certificate"></i>
                    <span>Acreditada SIFFA</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Requisitos Institucionales de Incorporación */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800">
            <h4 className="font-black text-lg mb-2 flex items-center gap-2">
              <i className="fa-solid fa-user-shield text-emerald-400"></i>
              <span>Requisitos para Acreditación de Integrantes en el Padrón SIFFA</span>
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed mb-6">
              Para ingresar a una Unidad Penitenciaria bonaerense bajo convenio SIFFA, cada profesional debe superar los siguientes requerimientos estatutarios y ministeriales:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="font-bold text-emerald-300 block mb-1">1. Título & Matrícula</span>
                <span className="text-slate-300 text-[11px]">Título profesional habilitante (AFA, psicóloga, trabajadora social o docente).</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="font-bold text-emerald-300 block mb-1">2. Reincidencia Cero</span>
                <span className="text-slate-300 text-[11px]">Certificado de Antecedentes Penales (RNR) expedido dentro de los 30 días.</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="font-bold text-emerald-300 block mb-1">3. Protocolo SPB</span>
                <span className="text-slate-300 text-[11px]">Aprobación del curso de seguridad y bioseguridad en establecimientos penitenciarios.</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="font-bold text-emerald-300 block mb-1">4. Clave Criptográfica</span>
                <span className="text-slate-300 text-[11px]">Emisión de credencial digital asimétrica con firma Ed25519 en el padrón central.</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SECCIÓN 3: CONVENIOS Y MARCO JURÍDICO */}
      {activeSubTab === 'normativa' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-scale-balanced"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Convenio Marco SPB N° 108/2024</h3>
                  <p className="text-[11px] text-slate-500">Ministerio de Justicia y Derechos Humanos de la PBA</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Habilita formalmente el ingreso de los planteles de docentes, técnicas y psicólogas de SIFFA a las Unidades Penitenciarias N° 33, 40, 47, 50 y 51 para impartir programas de capacitación deportiva, arbitraje oficial y valores humanos.
              </p>
              <div className="pt-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold">
                  Vigencia Plena 2026
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-lock"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Protocolo de Bioseguridad y Garita</h3>
                  <p className="text-[11px] text-slate-500">Dirección General de Seguridad del SPB</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Establece los requisitos de presentación obligatoria de credencial digital dinámica, requisa reglamentaria de indumentaria deportiva e inspección de elementos didácticos en el puesto de guardia perimetral antes de franquear el acceso.
              </p>
              <div className="pt-2">
                <span className="px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg text-[11px] font-bold">
                  Estándar de Control Penitenciario
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 4: PREGUNTAS FRECUENTES */}
      {activeSubTab === 'faqs' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
              Respuestas Claras
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Preguntas Frecuentes sobre SIFFA y el Sistema de Credenciales
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left font-bold text-slate-900 text-sm flex items-center justify-between gap-4 bg-slate-50 hover:bg-slate-100/70 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <i
                    className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform ${
                      openFaq === index ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  ></i>
                </button>
                {openFaq === index && (
                  <div className="px-6 py-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
