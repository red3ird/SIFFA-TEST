import React, { useState } from 'react';
import { VideoLeccion, UserProfile } from '../types';
import { VIDEOS_CAMPUS } from '../data/initialData';
import { EditableImage } from './EditableImage';

interface CampusVirtualProps {
  currentUser: UserProfile | null;
  onOpenGoogleAuth: () => void;
}

export const CampusVirtual: React.FC<CampusVirtualProps> = ({
  currentUser,
  onOpenGoogleAuth,
}) => {
  const [activeModulo, setActiveModulo] = useState<'Todos' | 'Deportivo' | 'Salud' | 'Laboral'>('Todos');
  const [selectedVideo, setSelectedVideo] = useState<VideoLeccion>(VIDEOS_CAMPUS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(34); // %
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const filteredVideos = VIDEOS_CAMPUS.filter(
    (v) => activeModulo === 'Todos' || v.modulo === activeModulo
  );

  const handleDownloadResource = (nombre: string) => {
    setDownloadToast(`Descargando documento oficial: ${nombre}`);
    setTimeout(() => {
      setDownloadToast(null);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast de descarga */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#001738] text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500/40 flex items-center gap-3 text-xs font-semibold">
          <i className="fa-solid fa-circle-check text-emerald-400 text-base"></i>
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Banner de Estado de Usuario con Google */}
      {currentUser ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <span className="font-bold text-emerald-950 block">
                Sesión Iniciada con Google: {currentUser.name}
              </span>
              <span className="text-emerald-800 text-[11px]">
                {currentUser.email} · Rol: <strong>{currentUser.role}</strong>
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-emerald-900 bg-white/80 px-2.5 py-1 rounded-md border border-emerald-300">
              Certificación Activa: {currentUser.clasesCompletadas} clases registradas
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <i className="fa-brands fa-google text-slate-700 text-base"></i>
            <div>
              <span className="font-bold text-slate-900 block">
                Registro Educativo con Cuenta de Google
              </span>
              <span className="text-slate-500 text-[11px]">
                Inicia sesión para guardar tu progreso en las clases y acceder a certificados oficiales del sindicato.
              </span>
            </div>
          </div>
          <button
            onClick={onOpenGoogleAuth}
            className="px-4 py-2 bg-[#001738] hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
          >
            Acceder con Google
          </button>
        </div>
      )}

      {/* Encabezado del Campus */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
            <span>Modalidad Híbrida Penitenciaria</span>
            <span aria-hidden="true">·</span>
            <span>Carga Horaria Homologada</span>
            <span aria-hidden="true">·</span>
            <span>Ley 12.256</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Campus Virtual SIFFA: Educación y Readaptación
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Aulas audiovisuales transmitidas a los sumideros educativos de las Unidades Penitenciarias. Acreditación de horas cátedra computables para la reducción de penas y reinserción social.
          </p>
        </div>

        {/* Filtros de Módulo (Botones Segmentados Funcionales) */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {(['Todos', 'Deportivo', 'Salud', 'Laboral'] as const).map((modulo) => (
            <button
              key={modulo}
              id={`btn-modulo-${modulo.toLowerCase()}`}
              onClick={() => setActiveModulo(modulo)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeModulo === modulo
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {modulo === 'Todos' ? 'Todos los Módulos' : `Módulo ${modulo}`}
            </button>
          ))}
        </div>
      </div>

      {/* Reproductor de Video Interactivo Simulado y Panel de Lección */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Reproductor Audiovisual (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#000f24] rounded-2xl overflow-hidden shadow-sm border border-slate-800 text-white relative">
            
            {/* Pantalla de Video Simulada */}
            <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden">
              <EditableImage
                imageKey="campus-virtual-thumbnail"
                imageTitle={`Video: ${selectedVideo.titulo}`}
                src={selectedVideo.thumbnail || "/src/assets/images/siffa_education_campus_1790964607074.jpg"}
                alt={selectedVideo.titulo}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-85' : 'opacity-65'}`}
                containerClassName="w-full h-full"
                referrerPolicy="no-referrer"
              />

              {/* Ticker Institucional en Pantalla */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-xs px-3 py-1 rounded-md border border-white/10 text-[10px] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>SIFFA VOD EDUCATIVO · 1080p HD</span>
              </div>

              <div className="absolute top-4 right-4 bg-emerald-600/90 text-white text-[11px] font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                Módulo {selectedVideo.modulo}
              </div>

              {/* Botón Central de Play/Pause */}
              <button
                id="video-btn-play-center"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center text-xl shadow-lg transition-transform hover:scale-105 cursor-pointer z-10"
                aria-label={isPlaying ? "Pausar video" : "Reproducir video"}
              >
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-1'}`}></i>
              </button>

              {/* Estado de reproducción en pantalla */}
              {isPlaying && (
                <div className="absolute bottom-14 left-4 bg-slate-900/90 text-emerald-400 text-[11px] font-mono px-2.5 py-1 rounded border border-emerald-500/30">
                  <i className="fa-solid fa-play mr-1"></i> Reproduciendo sesión formativa
                </div>
              )}
            </div>

            {/* Barra de Controles del Reproductor */}
            <div className="p-4 bg-[#000a1a] border-t border-slate-800">
              {/* Scrubber / Barra de Progreso */}
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const newPct = Math.round((clickX / rect.width) * 100);
                  setVideoProgress(Math.min(100, Math.max(0, newPct)));
                }}
                className="w-full bg-slate-800 h-1.5 rounded-full mb-3 cursor-pointer overflow-hidden"
              >
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-150"
                  style={{ width: `${videoProgress}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="text-white hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-sm`}></i>
                  </button>

                  <button
                    onClick={() => setVideoProgress((prev) => Math.max(0, prev - 10))}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Retroceder 10s"
                  >
                    <i className="fa-solid fa-rotate-left"></i>
                  </button>

                  <button
                    onClick={() => setVideoProgress((prev) => Math.min(100, prev + 10))}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Avanzar 10s"
                  >
                    <i className="fa-solid fa-rotate-right"></i>
                  </button>

                  <div className="text-[11px] font-mono text-slate-400">
                    <span className="text-white font-bold tabular-nums">14:20</span> / {selectedVideo.duracion}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-400 text-xs">
                  <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">1.0x</span>
                  <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-white cursor-pointer" title="Configuración">
                    <i className="fa-solid fa-gear"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Ficha de la Clase Activa */}
            <div className="p-6 bg-white text-slate-900 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-500">
                <span className="font-semibold text-emerald-800">
                  {selectedVideo.profesora}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  Duración: {selectedVideo.duracion}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-600">Acreditada SPB</span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {selectedVideo.titulo}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                {selectedVideo.descripcion}
              </p>

              {/* Materiales descargables de la lección */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <i className="fa-solid fa-file-arrow-down text-emerald-700"></i>
                  <span>Material Didáctico y Guías Oficiales</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedVideo.recursos.map((rec: any, idx: number) => (
                    <button
                      key={idx}
                      id={`btn-descarga-recurso-${idx}`}
                      onClick={() => handleDownloadResource(rec.nombre)}
                      className="p-3 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl text-left flex items-center justify-between text-xs transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <i className={`fa-solid ${rec.tipo === 'PDF' ? 'fa-file-pdf text-rose-500' : 'fa-file-word text-blue-500'} text-base shrink-0`}></i>
                        <span className="font-semibold text-slate-700 truncate group-hover:text-emerald-800">
                          {rec.nombre}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                        {rec.peso}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Clases y Autoevaluación Interactiva (1 Col) */}
        <div className="space-y-4">
          
          {/* Tarjeta de Lista de Clases del Campus */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <i className="fa-solid fa-list-ul text-slate-600"></i>
                <span>Plan de Clases Disponibles</span>
              </h3>
              <span className="text-xs font-bold text-emerald-700 font-mono tabular-nums">
                {filteredVideos.length} Lecciones
              </span>
            </div>

            <div className="space-y-2 mt-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredVideos.map((video) => {
                const isSelected = selectedVideo.id === video.id;
                return (
                  <div
                    key={video.id}
                    id={`leccion-item-${video.id}`}
                    onClick={() => {
                      setSelectedVideo(video);
                      setIsPlaying(true);
                      setVideoProgress(15);
                    }}
                    className={`p-3 rounded-xl border text-left flex gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/60 border-emerald-500/80 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="relative w-20 h-14 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                      <EditableImage
                        imageKey={`campus-video-${video.id}`}
                        imageTitle={`Miniatura: ${video.titulo}`}
                        src={video.thumbnail || "/src/assets/images/siffa_education_campus_1790964607074.jpg"}
                        alt={video.titulo}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono px-1 rounded z-10 pointer-events-none">
                        {video.duracion}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        {video.modulo}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-2 mt-0.5 leading-snug">
                        {video.titulo}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {video.profesora}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test Evaluativo / Quiz Rápido */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <i className="fa-solid fa-graduation-cap text-emerald-700"></i>
              <h4 className="font-bold text-xs uppercase tracking-wide text-slate-900">
                Comprobación de Conocimientos
              </h4>
            </div>

            <div className="mt-3 text-xs">
              <p className="font-semibold text-slate-800 mb-3 leading-snug">
                ¿Cuál es la norma reglamentaria fundamental para la mediación en situaciones de roce durante el partido carcelario?
              </p>

              <div className="space-y-2">
                {[
                  'Regla del diálogo constructivo y pausa técnica supervisada por capitana.',
                  'Sanción inmediata sin derecho a réplica ni mediación.',
                  'Derivación directa a cuerpo de requisa penitenciaria.'
                ].map((opt, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuizAnswer(index);
                      setQuizSubmitted(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                      quizAnswer === index
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-bold mr-1.5">{String.fromCharCode(65 + index)})</span> {opt}
                  </button>
                ))}
              </div>

              {!quizSubmitted ? (
                <button
                  disabled={quizAnswer === null}
                  onClick={() => setQuizSubmitted(true)}
                  className={`w-full mt-3.5 py-2.5 rounded-lg font-bold text-xs text-white transition-colors cursor-pointer ${
                    quizAnswer !== null
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-xs'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Confirmar Respuesta
                </button>
              ) : (
                <div className="mt-3.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                  <div className="font-bold flex items-center gap-1.5 mb-0.5">
                    <i className="fa-solid fa-circle-check text-emerald-600"></i>
                    {quizAnswer === 0 ? '¡Respuesta Correcta!' : 'Respuesta Registrada en Legajo'}
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Acreditada 1 hora de formación teórica computada en el legajo del campus virtual.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
