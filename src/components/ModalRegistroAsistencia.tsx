import React, { useState } from 'react';

interface ModalRegistroAsistenciaProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (mensaje: string) => void;
}

export const ModalRegistroAsistencia: React.FC<ModalRegistroAsistenciaProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
}) => {
  const [unidad, setUnidad] = useState('U33 Los Hornos');
  const [docente, setDocente] = useState('Lic. Marcela Giménez');
  const [tipoActividad, setTipoActividad] = useState('Entrenamiento Táctico y Físico');
  const [participanteNombre, setParticipanteNombre] = useState('');
  const [legajo, setLegajo] = useState('');
  const [asistencia, setAsistencia] = useState('Presente');
  const [conducta, setConducta] = useState(10);
  const [observaciones, setObservaciones] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSuccess(`Registro de conducta guardado exitosamente para ${participanteNombre || 'la participante'} en ${unidad}.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-300">
        
        {/* Header */}
        <div className="bg-[#002147] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-clipboard-check text-[#E87722]"></i>
            <span className="font-bold text-xs sm:text-sm">
              Registro Diario de Asistencia y Conducta Deportiva
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Unidad Penitenciaria:</label>
              <select
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#006A68]"
              >
                <option value="U33 Los Hornos">U33 Los Hornos</option>
                <option value="U47 San Martín">U47 San Martín</option>
                <option value="U50 Batán">U50 Batán</option>
                <option value="U40 Lomas de Zamora">U40 Lomas de Zamora</option>
                <option value="U51 Magdalena">U51 Magdalena</option>
                <option value="U54 Florencio Varela">U54 Florencio Varela</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Docente Responsable:</label>
              <select
                value={docente}
                onChange={(e) => setDocente(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#006A68]"
              >
                <option value="Lic. Marcela Giménez">Lic. Marcela Giménez</option>
                <option value="Prof. Romina Albornoz">Prof. Romina Albornoz</option>
                <option value="Lic. Florencia Navarro">Lic. Florencia Navarro</option>
                <option value="Camila Benítez">Camila Benítez</option>
                <option value="Valeria Sosa">Valeria Sosa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre de la Interna:</label>
              <input
                type="text"
                required
                value={participanteNombre}
                onChange={(e) => setParticipanteNombre(e.target.value)}
                placeholder="Ej. Vanesa Morales"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#006A68]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Legajo SPB:</label>
              <input
                type="text"
                required
                value={legajo}
                onChange={(e) => setLegajo(e.target.value)}
                placeholder="Ej. SPB-88341/U33"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-[#006A68]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Módulo / Actividad:</label>
              <select
                value={tipoActividad}
                onChange={(e) => setTipoActividad(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#006A68]"
              >
                <option value="Entrenamiento Táctico y Físico">Deportivo: Entrenamiento Táctico</option>
                <option value="Partido Interpabellones">Deportivo: Torneo Interpabellones</option>
                <option value="Taller de Salud Emocional">Salud: Taller de Manejo Emocional</option>
                <option value="Taller Textil y Arbitraje">Laboral: Arbitraje y Textil</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Índice de Conducta (1 al 10): <span className="font-mono text-[#006A68] font-black">{conducta}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={conducta}
                onChange={(e) => setConducta(Number(e.target.value))}
                className="w-full accent-[#006A68] cursor-pointer mt-2"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Observaciones para el Juzgado de Ejecución:</label>
            <textarea
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Describa el comportamiento, juego limpio, liderazgo positivo y actitud en el campo..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#006A68]"
            ></textarea>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#006A68] hover:bg-[#00504e] text-white font-bold rounded-lg shadow-sm cursor-pointer"
            >
              Guardar en Planilla Oficial
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
