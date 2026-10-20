import React, { useState } from 'react';

interface ModalAlertaPanicoProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalAlertaPanico: React.FC<ModalAlertaPanicoProps> = ({ isOpen, onClose }) => {
  const [alertaEnviada, setAlertaEnviada] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleActivarProtocolo = () => {
    setAlertaEnviada(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border-2 border-red-500 relative">
        
        {/* Header Rojo Crítico */}
        <div className="bg-red-600 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation animate-bounce"></i>
            <span className="font-black text-xs sm:text-sm tracking-wide">
              PROTOCOLO DE EMERGENCIA • BASE RAÚL CENAS
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 text-center text-xs text-slate-700 space-y-4">
          
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl border-2 border-red-200">
            <i className="fa-solid fa-tower-broadcast animate-pulse"></i>
          </div>

          <div>
            <h3 className="text-base font-black text-[#002147]">
              Canal de Enlace Inmediato con Centro de Operaciones
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              La activación de esta señal notifica de forma prioritaria a la Base Central Raúl Cenas, al Comando de Seguridad del Servicio Penitenciario Bonaerense (SPB) y al Sistema 911 con las coordenadas geográficas de los móviles en ruta.
            </p>
          </div>

          {!alertaEnviada ? (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900 text-left space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>Verificación de Seguridad Obligatoria:</span>
              </div>
              <p>• Geoposicionamiento satelital transmitido cada 1 segundo.</p>
              <p>• Grabación de audio ambiente encriptado en cabina.</p>
              <p>• Notificación instantánea al teléfono de guardia de Dra. Campos.</p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-300 p-3.5 rounded-xl text-red-900 text-left space-y-1.5 animate-fadeIn">
              <div className="font-black flex items-center gap-1.5 text-red-700 text-xs">
                <i className="fa-solid fa-shield-halved animate-spin"></i>
                <span>¡ALERTA EMITIDA CON ÉXITO!</span>
              </div>
              <p className="text-[11px]">Código de Evento: <strong>SEC-EMERG-2026-0914</strong></p>
              <p className="text-[11px]">Canal VHF 4 Encriptado abierto. Móvil de apoyo en ruta.</p>
              <p className="text-[11px] font-mono text-slate-600">Timestamp: {new Date().toLocaleTimeString('es-AR')}</p>
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-3">
            {!alertaEnviada ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleActivarProtocolo}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-bell"></i>
                  <span>CONFIRMAR ALERTA</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-[#002147] hover:bg-[#001630] text-white font-bold rounded-lg cursor-pointer"
              >
                Cerrar Panel de Emergencia
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
