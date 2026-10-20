import React, { useState } from 'react';
import { DocenteAcreditado } from '../types';
import { DOCENTES_DATA } from '../data/initialData';

interface AcreditacionesQRProps {
  onSelectDocenteForQR: (docente: DocenteAcreditado) => void;
  onSimulateGuardScan: (docente: DocenteAcreditado) => void;
}

export const AcreditacionesQR: React.FC<AcreditacionesQRProps> = ({
  onSelectDocenteForQR,
  onSimulateGuardScan,
}) => {
  const [docentes] = useState<DocenteAcreditado[]>(DOCENTES_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<'Todos' | 'Aprobado' | 'En Trámite'>('Todos');

  const filteredDocentes = docentes.filter((doc) => {
    const matchesSearch =
      doc.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.apellido.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.dni.includes(searchQuery) ||
      doc.matricula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.rol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.unidadAsignada.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEstado =
      filterEstado === 'Todos' || doc.autoproteccionEstado === filterEstado;

    return matchesSearch && matchesEstado;
  });

  return (
    <div className="space-y-6">
      {/* Encabezado Institucional del Módulo */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
            <span>Seguridad Penitenciaria SPB</span>
            <span aria-hidden="true">·</span>
            <span>Credencial Laboral de Ingreso</span>
            <span aria-hidden="true">·</span>
            <span>Protocolo Nivel 3</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Acreditaciones Laborales & Credencial Digital QR
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Padrón oficial de cuerpo docente, entrenadoras y técnicas habilitadas para el ingreso a dictar clases en unidades penitenciarias. 
            <strong className="text-slate-800 ml-1">
              (Esta credencial QR es para control en guardia/garita al ir a trabajar; para registrarse en la web se utiliza la cuenta de Google).
            </strong>
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0 text-left md:text-right">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Supervisión General
          </div>
          <div className="font-extrabold text-sm text-slate-900 mt-0.5">
            Dra. Silvina Campos
          </div>
          <div className="text-[11px] text-slate-500">
            Dirección General SIFFA - SPB
          </div>
        </div>
      </div>

      {/* Nota Aclaratoria sobre el Uso de las Credenciales */}
      <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-950 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-sm mt-0.5">
          <i className="fa-solid fa-id-card-clip"></i>
        </div>
        <div>
          <h4 className="font-bold text-emerald-900 text-xs sm:text-sm">
            Finalidad de las Credenciales QR: Acceso Laboral a Penales
          </h4>
          <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
            Las credenciales con código QR son documentos oficiales de portación obligatoria para el personal docente al momento de presentarse a trabajar en las unidades del Servicio Penitenciario Bonaerense. Verifican el curso de autoprotección, matrícula y habilitación de seguridad penal.
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Buscador */}
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            id="acreditaciones-input-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar docente acreditada por nombre, DNI, matrícula, rol o penal..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-800 transition-colors"
          />
        </div>

        {/* Filtros de Estado */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Estado Autoprotección:</span>
          {(['Todos', 'Aprobado', 'En Trámite'] as const).map((estado) => (
            <button
              key={estado}
              id={`filter-docente-${estado}`}
              onClick={() => setFilterEstado(estado)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                filterEstado === estado
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {estado}
            </button>
          ))}
        </div>
      </div>

      {/* Grilla de Tarjetas de Docentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocentes.map((doc) => {
          const isAprobado = doc.autoproteccionEstado === 'Aprobado';
          return (
            <div
              key={doc.id}
              id={`card-docente-${doc.id}`}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Header de la tarjeta */}
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-start gap-3.5">
                  <div
                    data-carnet-photo="true"
                    className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0"
                    title="Foto institucional de carnet"
                  >
                    <img
                      src={doc.fotoUrl}
                      alt={`${doc.nombre} ${doc.apellido}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-[#001738] flex items-center justify-center text-white font-bold text-base -z-10">
                      {doc.nombre.charAt(0)}{doc.apellido.charAt(0)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="font-mono text-slate-400">
                        {doc.matricula}
                      </span>
                      <span className={`font-semibold ${isAprobado ? 'text-emerald-700' : 'text-amber-700'}`}>
                        ● {doc.autoproteccionEstado}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base truncate mt-0.5">
                      {doc.nombre} {doc.apellido}
                    </h3>
                    <p className="text-xs text-emerald-800 font-semibold line-clamp-1">
                      {doc.rol}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      DNI: {doc.dni}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cuerpo con detalles de autoprotección y unidad */}
              <div className="p-5 space-y-3 text-xs text-slate-600 bg-slate-50/50 flex-1">
                <div className="flex items-start gap-2">
                  <i className="fa-solid fa-location-dot text-amber-600 mt-0.5 text-xs"></i>
                  <div>
                    <span className="text-[11px] font-bold text-slate-700">Asignación Penal:</span>
                    <p className="text-[11px] text-slate-600 font-medium leading-tight">
                      {doc.unidadAsignada}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <i className="fa-solid fa-shield-check text-emerald-700 mt-0.5 text-xs"></i>
                  <div>
                    <span className="text-[11px] font-bold text-slate-700">Capacitación Autoprotección:</span>
                    <p className="text-[11px] text-slate-600 leading-tight">
                      {doc.autoproteccionNota}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      Fecha: {doc.autoproteccionFecha} · Sup: {doc.supervisadoPor}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Nivel de Acceso en Puerta:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {doc.nivelSeguridad}
                  </span>
                </div>
              </div>

              {/* Botones de acción (Ver Credencial QR de Trabajo y Simular Escaneo) */}
              <div className="p-3 bg-white border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  id={`btn-ver-qr-${doc.id}`}
                  onClick={() => onSelectDocenteForQR(doc)}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <i className="fa-solid fa-qrcode text-amber-300"></i>
                  <span>Credencial QR</span>
                </button>

                <button
                  id={`btn-scan-garita-${doc.id}`}
                  onClick={() => onSimulateGuardScan(doc)}
                  className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Simular validación de acceso en garita de guardia penitenciaria"
                >
                  <i className="fa-solid fa-barcode text-xs"></i>
                  <span>Probar Guardia</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDocentes.length === 0 && (
        <div className="bg-white rounded-xl p-10 text-center border border-slate-200">
          <i className="fa-solid fa-user-slash text-slate-300 text-4xl mb-3"></i>
          <h4 className="font-bold text-slate-700 text-sm">No se encontraron docentes</h4>
          <p className="text-xs text-slate-500 mt-1">
            Intente con otro término de búsqueda o cambie el filtro de estado.
          </p>
        </div>
      )}
    </div>
  );
};
