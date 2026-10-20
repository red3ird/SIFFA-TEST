import React, { useState, useEffect } from 'react';
import { MovilGPS, EventoSeguridad } from '../types';
import { MOVILES_TELEMETRIA, EVENTOS_SEGURIDAD } from '../data/initialData';

interface MonitoreoSeguridadProps {
  onOpenPanic: () => void;
}

export const MonitoreoSeguridad: React.FC<MonitoreoSeguridadProps> = ({ onOpenPanic }) => {
  const [moviles, setMoviles] = useState<MovilGPS[]>(MOVILES_TELEMETRIA);
  const [eventos] = useState<EventoSeguridad[]>(EVENTOS_SEGURIDAD);
  const [countdown, setCountdown] = useState<number>(5);
  const [selectedMovil, setSelectedMovil] = useState<MovilGPS>(MOVILES_TELEMETRIA[0]);

  // Simulación del pulso GPS de 5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setMoviles((current) =>
            current.map((m) => {
              if (m.estado === 'En Ruta') {
                const deltaSpeed = Math.floor(Math.random() * 7) - 3;
                return {
                  ...m,
                  velocidadKmh: Math.max(45, Math.min(80, m.velocidadKmh + deltaSpeed)),
                  ultimoPing: 'Hace 1 seg (Fix OK)',
                };
              }
              return { ...m, ultimoPing: 'Hace 1 seg (Fix OK)' };
            })
          );
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Encabezado del Centro de Monitoreo */}
      <div className="relative rounded-2xl overflow-hidden shadow-xs border border-slate-800 bg-[#001738] text-white p-6 sm:p-8">
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/siffa_security_logistics_1790964618079.jpg"
            alt="Centro de Operaciones y Monitoreo Base Raúl Cenas"
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#001128] via-[#001c3d]/90 to-[#002b54]/60"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-emerald-400 uppercase tracking-wide">
              <span>Base Operativa Raúl Cenas</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono tabular-nums text-slate-300">Ping satelital: {countdown}s</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-emerald-400">Canal Cifrado AES-256</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Monitoreo y Telemetría de Seguridad Operativa
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Seguimiento continuo de la flota de traslado docente hacia las Unidades Penitenciarias bonaerenses. Verificación de geocercas seguras y enlace de respuesta táctica inmediata.
            </p>
          </div>

          {/* Botón Antipánico Base Raúl Cenas */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="monitoreo-btn-panico-central"
              onClick={onOpenPanic}
              className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-md border border-rose-400/50 flex items-center gap-2.5 cursor-pointer transition-transform hover:scale-102"
            >
              <i className="fa-solid fa-triangle-exclamation text-base"></i>
              <span>ACTIVAR PROTOCOLO ANTIPÁNICO</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Mapa Esquemático Vectorial (2 Cols) y Móviles / Logs (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Mapa Esquemático Interactivo de Rutas y Geocercas (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#000f24] rounded-2xl overflow-hidden border border-slate-800 shadow-xs">
            
            {/* Header del Mapa */}
            <div className="p-4 bg-[#000a1a] border-b border-slate-800 flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-map-location-dot text-emerald-400"></i>
                <span className="font-bold">Cartografía Operativa · Corredores Penitenciarios PBA</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Corredor Seguro
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Aproximación Penal
                </span>
              </div>
            </div>

            {/* Canvas / SVG Visualizer del Mapa */}
            <div className="relative w-full h-[380px] bg-[#001128] flex items-center justify-center overflow-hidden select-none">
              
              {/* Grilla táctica de radar */}
              <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#10B981" strokeWidth="0.8" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <circle cx="50%" cy="50%" r="90" fill="none" stroke="#10B981" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="50%" cy="50%" r="160" fill="none" stroke="#10B981" strokeWidth="1" strokeDasharray="4 4" />
              </svg>

              {/* Trazado de Rutas / Autopistas Esquemáticas */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M 120 180 Q 260 220 380 260"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  className="opacity-70"
                />
                <path
                  d="M 120 180 Q 140 100 210 80"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  className="opacity-70"
                />
                <path
                  d="M 380 260 Q 420 310 460 340"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  className="opacity-50"
                />
              </svg>

              {/* Geocerca U33 Los Hornos */}
              <div className="absolute top-[230px] left-[350px] w-24 h-24 rounded-full border-2 border-dashed border-emerald-400/70 bg-emerald-500/10 flex items-center justify-center text-center pointer-events-none">
                <span className="text-[9px] font-mono text-emerald-300 font-bold bg-black/70 px-1 py-0.5 rounded">
                  Geocerca U33
                </span>
              </div>

              {/* Geocerca U47 San Martín */}
              <div className="absolute top-[50px] left-[180px] w-20 h-20 rounded-full border-2 border-dashed border-amber-400/70 bg-amber-500/10 flex items-center justify-center text-center pointer-events-none">
                <span className="text-[9px] font-mono text-amber-300 font-bold bg-black/70 px-1 py-0.5 rounded">
                  Geocerca U47
                </span>
              </div>

              {/* Punto Central: Base Operativa Raúl Cenas */}
              <div className="absolute top-[160px] left-[100px] flex flex-col items-center cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-[#001738] border-2 border-emerald-400 flex items-center justify-center text-white text-xs shadow-lg">
                  <i className="fa-solid fa-tower-observation text-emerald-400"></i>
                </div>
                <span className="text-[10px] font-bold text-white bg-slate-900/90 px-1.5 py-0.5 rounded mt-1 border border-slate-700 whitespace-nowrap">
                  Base Raúl Cenas
                </span>
              </div>

              {/* Marcador Móvil 01 en Movimiento */}
              <div
                onClick={() => setSelectedMovil(moviles[0])}
                className="absolute top-[215px] left-[270px] flex flex-col items-center cursor-pointer transform hover:scale-110 transition-transform"
              >
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white text-xs shadow-md">
                    <i className="fa-solid fa-van-shuttle text-[11px]"></i>
                  </div>
                  <span className="animate-ping absolute -inset-1 rounded-full bg-emerald-400 opacity-60"></span>
                </div>
                <div className="text-[10px] font-mono font-bold text-emerald-300 bg-slate-950/90 px-1.5 py-0.5 rounded mt-1 border border-emerald-500/40 whitespace-nowrap shadow-sm tabular-nums">
                  MOV-01 ({moviles[0].velocidadKmh} km/h)
                </div>
              </div>

              {/* Marcador Móvil 02 en Garita U47 */}
              <div
                onClick={() => setSelectedMovil(moviles[1])}
                className="absolute top-[80px] left-[200px] flex flex-col items-center cursor-pointer transform hover:scale-110 transition-transform"
              >
                <div className="w-7 h-7 rounded-full bg-amber-600 border-2 border-white flex items-center justify-center text-white text-xs shadow-md">
                  <i className="fa-solid fa-bus text-[11px]"></i>
                </div>
                <div className="text-[10px] font-mono font-bold text-amber-300 bg-slate-950/90 px-1.5 py-0.5 rounded mt-1 border border-amber-500/40 whitespace-nowrap shadow-sm tabular-nums">
                  MOV-02 (28 km/h)
                </div>
              </div>

              {/* Controles de Vista de Mapa */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-xs p-1.5 rounded-lg border border-slate-800 text-xs text-white">
                <button className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center cursor-pointer" title="Centrar Base">
                  <i className="fa-solid fa-crosshairs text-xs"></i>
                </button>
              </div>

            </div>

            {/* Detalle del Móvil Seleccionado */}
            <div className="p-5 bg-[#000a1a] border-t border-slate-800 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-amber-400 font-mono uppercase font-bold">
                    {selectedMovil.codigo}
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    {selectedMovil.vehiculo} · Patente: <span className="font-mono text-slate-300">{selectedMovil.patente}</span>
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-slate-900 text-emerald-400 border border-emerald-500/40 font-mono text-[11px] font-bold tabular-nums">
                    Velocidad: {selectedMovil.velocidadKmh} km/h
                  </span>
                  <span className="px-2.5 py-1 rounded bg-slate-900 text-emerald-300 border border-slate-700 text-[11px] font-bold">
                    {selectedMovil.geocercaEstado}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Conductor Asignado:</span>
                  <span className="font-semibold text-white">{selectedMovil.conductor}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Destino Penitenciario:</span>
                  <span className="font-semibold text-amber-400">{selectedMovil.destino}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Docentes a Bordo:</span>
                  <span className="font-medium text-slate-200 line-clamp-1">
                    {selectedMovil.docentesABordo.join(', ')}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Columna Derecha: Tarjetas de Móviles & Registro de Eventos */}
        <div className="space-y-4">
          
          {/* Tarjetas de Móviles de Traslado */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <i className="fa-solid fa-truck-shield text-emerald-700"></i>
                <span>Flota de Custodia SIFFA</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono font-bold">
                3 Unidades Activas
              </span>
            </div>

            <div className="space-y-2 mt-3">
              {moviles.map((m) => {
                const isSelected = selectedMovil.id === m.id;
                return (
                  <div
                    key={m.id}
                    id={`card-movil-${m.id}`}
                    onClick={() => setSelectedMovil(m)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        {m.codigo}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800">
                        ● {m.estado}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 mt-0.5">
                      {m.vehiculo}
                    </h4>

                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-600 tabular-nums">
                      <span>Vel: <strong>{m.velocidadKmh} km/h</strong></span>
                      <span>Bat: <strong className="text-emerald-700">{m.bateriaTelemetria}%</strong></span>
                      <span className="text-slate-400">{m.ultimoPing}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registro de Eventos y Telemetría en Tiempo Real */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <i className="fa-solid fa-list-check text-slate-700"></i>
                <span>Consola de Telemetría</span>
              </h3>
              <span className="text-[10px] text-emerald-700 font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                EN LÍNEA
              </span>
            </div>

            <div className="space-y-2 mt-3 max-h-[220px] overflow-y-auto pr-1 font-mono text-[11px]">
              {eventos.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 leading-snug"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span className="font-bold text-slate-600 tabular-nums">{evt.timestamp}</span>
                    <span className="font-bold text-slate-700">
                      {evt.tipo}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-slate-800">{evt.mensaje}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
