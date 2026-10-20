import React from 'react';
import { useImageManager } from '../context/ImageManagerContext';

interface CatalogItem {
  key: string;
  originalSrc: string;
  title: string;
  category: string;
  location: string;
  hint: string;
}

const KNOWN_SITE_IMAGES: CatalogItem[] = [
  {
    key: 'logo-oficial-siffa',
    originalSrc: '/src/assets/images/siffa_official_logo_1791900555840.jpg',
    title: 'Logo Oficial SIFFA',
    category: 'Identidad y Marca',
    location: 'Barra superior, Portada, Credenciales y Modales',
    hint: 'Formato vertical u horizontal recomendado. Se visualiza con fondo blanco y preservación de bordes.',
  },
  {
    key: 'hero-stadium',
    originalSrc: '/src/assets/images/siffa_hero_stadium_1790964585627.jpg',
    title: 'Banner Hero Estadio Deportivo',
    category: 'Portada Institucional',
    location: 'Cabecera de Inicio (Home) y Dashboard Ejecutivo',
    hint: 'Proporción panorámica 16:9 o 21:9 recomendada.',
  },
  {
    key: 'autoridad-silvina-campos',
    originalSrc: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    title: 'Dra. Silvina Campos (Directora General)',
    category: 'Comisión Directiva',
    location: 'Pestaña Institucional / Comisión Directiva',
    hint: 'Foto de perfil cuadrada o 4:5.',
  },
  {
    key: 'autoridad-matias-medina',
    originalSrc: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    title: 'Lic. Matías Medina (Secretario Técnico & Sistemas)',
    category: 'Comisión Directiva',
    location: 'Pestaña Institucional / Comisión Directiva',
    hint: 'Foto de perfil cuadrada o 4:5.',
  },
  {
    key: 'autoridad-marcela-gimenez',
    originalSrc: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    title: 'Lic. Marcela Giménez (Coordinadora Docente)',
    category: 'Comisión Directiva',
    location: 'Pestaña Institucional y Profesionales UP33',
    hint: 'Foto de perfil cuadrada.',
  },
  {
    key: 'autoridad-florencia-navarro',
    originalSrc: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80',
    title: 'Lic. Florencia Navarro (Gabinete Psicosocial)',
    category: 'Comisión Directiva',
    location: 'Pestaña Institucional y Profesionales UP50',
    hint: 'Foto de perfil cuadrada.',
  },
];

export const ImageCatalogModal: React.FC = () => {
  const { catalogOpen, setCatalogOpen, getImage, openEditor, customImages } = useImageManager();

  if (!catalogOpen) return null;

  const categories = Array.from(new Set(KNOWN_SITE_IMAGES.map((i) => i.category)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) setCatalogOpen(false);
      }}
    >
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#001738] text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center text-lg">
              <i className="fa-solid fa-images"></i>
            </div>
            <div>
              <h3 className="text-lg font-black text-white leading-tight">
                Catálogo de Imágenes del Sitio Web
              </h3>
              <p className="text-xs text-slate-300">
                Selecciona cualquier imagen para reemplazarla directamente desde tu PC o por URL.
              </p>
            </div>
          </div>

          <button
            onClick={() => setCatalogOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-8">
          {categories.map((category) => {
            const items = KNOWN_SITE_IMAGES.filter((i) => i.category === category);
            return (
              <div key={category} className="space-y-3">
                <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{category}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => {
                    const currentSrc = getImage(item.key) || item.originalSrc;
                    const isCustom = Boolean(customImages[item.key] || (currentSrc !== item.originalSrc));

                    return (
                      <div
                        key={item.key}
                        className="rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all p-3.5 flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 border border-slate-200 flex items-center justify-center group">
                            <img
                              src={currentSrc}
                              alt={item.title}
                              className="w-full h-full object-contain p-1"
                            />
                            {isCustom && (
                              <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                                Modificada
                              </div>
                            )}
                          </div>

                          <div>
                            <h5 className="font-extrabold text-slate-900 text-sm leading-snug">
                              {item.title}
                            </h5>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {item.location}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setCatalogOpen(false);
                            openEditor({
                              key: item.key,
                              originalSrc: item.originalSrc,
                              title: item.title,
                              hint: item.hint,
                            });
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <i className="fa-solid fa-camera"></i>
                          <span>Cambiar Imagen</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={() => setCatalogOpen(false)}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar Catálogo
          </button>
        </div>

      </div>
    </div>
  );
};
