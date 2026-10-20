import React, { useState, useRef, useEffect, DragEvent } from 'react';
import { useImageManager } from '../context/ImageManagerContext';

// Helper to optimize and compress images client-side before base64 storage
function compressImage(file: File, maxDimension = 1920, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    // If SVG, read as text/dataURL directly without canvas conversion to keep vector crispness
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to webp or jpeg
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(reader.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const ImageEditModal: React.FC = () => {
  const { activeTarget, closeEditor, saveImage, resetImage, getImage } = useImageManager();

  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileSizeText, setFileSizeText] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTarget) {
      setPreviewSrc(null);
      setUrlInput('');
      setSelectedFileName(null);
      setFileSizeText(null);
      setErrorMsg(null);
      setIsSaving(false);
    }
  }, [activeTarget]);

  if (!activeTarget) return null;

  const currentDisplaySrc = getImage(activeTarget.key) || activeTarget.originalSrc;
  const isOverridden = currentDisplaySrc !== activeTarget.originalSrc;

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('El archivo seleccionado no es una imagen válida (debe ser JPG, PNG, WEBP o SVG).');
      return;
    }
    setErrorMsg(null);
    setSelectedFileName(file.name);
    setFileSizeText(`${(file.size / 1024).toFixed(1)} KB`);

    try {
      const compressedDataUrl = await compressImage(file);
      setPreviewSrc(compressedDataUrl);
    } catch {
      setErrorMsg('No se pudo procesar la imagen seleccionada.');
    }
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setErrorMsg('Ingresa una URL válida de imagen.');
      return;
    }
    setErrorMsg(null);
    setPreviewSrc(urlInput.trim());
    setSelectedFileName('URL externa');
    setFileSizeText('Remota');
  };

  const handleSave = async () => {
    const finalSrc = previewSrc || (activeTab === 'url' ? urlInput.trim() : null);
    if (!finalSrc) {
      setErrorMsg('Selecciona una imagen desde tu PC o ingresa una URL antes de guardar.');
      return;
    }

    try {
      setIsSaving(true);
      await saveImage(activeTarget.key, finalSrc, activeTarget.title);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar los cambios.');
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('¿Seguro que deseas restablecer esta imagen a su versión original de fábrica?')) {
      try {
        setIsSaving(true);
        await resetImage(activeTarget.key);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al restablecer la imagen.');
        setIsSaving(false);
      }
    }
  };

  return (
    <div
      id="siffa-image-edit-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeEditor();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-[#001738] text-white p-5 sm:p-6 flex items-start justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0 text-xl shadow-xs">
              <i className="fa-solid fa-camera-rotate"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Panel Administrador SIFFA
                </span>
                {isOverridden && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Modificada
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-white mt-1 leading-tight">
                Cambiar Imagen: {activeTarget.title}
              </h3>
              <p className="text-xs text-slate-300 font-normal">
                {activeTarget.hint || 'Carga una imagen desde tu PC o ingresa un enlace para reemplazarla.'}
              </p>
            </div>
          </div>

          <button
            onClick={closeEditor}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Comparison / Live Preview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Current Image Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <i className="fa-solid fa-image text-slate-400"></i>
                  Imagen Actual
                </span>
                {isOverridden ? (
                  <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-2 py-0.5 rounded">
                    Personalizada
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 bg-slate-200 font-bold px-2 py-0.5 rounded">
                    Por Defecto
                  </span>
                )}
              </div>

              <div className="relative aspect-video sm:aspect-square w-full rounded-xl overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center p-1">
                <img
                  src={currentDisplaySrc}
                  alt="Imagen actual"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-[11px] text-slate-500 truncate font-mono">
                {activeTarget.key}
              </div>
            </div>

            {/* New Preview Card */}
            <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-3 space-y-2 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <i className="fa-solid fa-sparkles text-emerald-600"></i>
                  Nueva Imagen
                </span>
                {previewSrc && (
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                    Lista para guardar
                  </span>
                )}
              </div>

              <div className="relative aspect-video sm:aspect-square w-full rounded-xl overflow-hidden bg-white border border-emerald-200 flex items-center justify-center p-1">
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt="Vista previa de nueva imagen"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4 text-slate-400 space-y-1">
                    <i className="fa-solid fa-cloud-arrow-up text-3xl text-emerald-500/50"></i>
                    <p className="text-xs font-medium text-slate-600">Ningún archivo cargado aún</p>
                    <p className="text-[10px] text-slate-400">Selecciona una imagen abajo para previsualizarla</p>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-emerald-700 font-medium truncate">
                {selectedFileName ? `${selectedFileName} (${fileSizeText})` : 'Pendiente de selección'}
              </div>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-[#001738] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className="fa-solid fa-laptop-arrow-down"></i>
              <span>Cargar desde mi PC</span>
            </button>

            <button
              onClick={() => setActiveTab('url')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-[#001738] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className="fa-solid fa-link"></i>
              <span>Ingresar URL de Web</span>
            </button>
          </div>

          {/* Tab 1: Upload from PC / Drag & Drop */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/gif"
                onChange={onFileInput}
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50 scale-[0.99]'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl shadow-xs">
                  <i className="fa-solid fa-file-arrow-up"></i>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">
                    Haz clic para buscar en tu equipo o arrastra el archivo aquí
                  </p>
                  <p className="text-xs text-slate-500">
                    Soporta formatos JPG, PNG, WEBP, SVG o GIF (Optimización automática de resolución)
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-folder-open text-emerald-600"></i>
                  <span>Explorar archivos de mi PC</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: URL Input */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Enlace directo a la imagen:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://ejemplo.com/foto-institucional.jpg"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  onClick={handleApplyUrl}
                  type="button"
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
                >
                  Probar Enlace
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Puedes pegar enlaces de imágenes alojadas en Unsplash, Cloudinary, AWS S3 o servidores externos.
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Revert to default option */}
          {isOverridden && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-900">Esta imagen tiene una versión personalizada activa</p>
                <p className="text-[11px] text-amber-700">Puedes volver a la imagen predeterminada original en cualquier momento.</p>
              </div>
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <i className="fa-solid fa-rotate-left"></i>
                <span>Restablecer</span>
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={closeEditor}
            disabled={isSaving}
            type="button"
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={!previewSrc || isSaving}
            type="button"
            className={`px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              previewSrc && !isSaving
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:scale-[1.01]'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            {isSaving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Guardando imagen...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk"></i>
                <span>Guardar y Aplicar a la Web</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
