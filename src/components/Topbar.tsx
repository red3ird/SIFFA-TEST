import React, { useState, useEffect } from 'react';
import { TabType, UserProfile } from '../types';
import { SiffaLogo } from './SiffaLogo';
import { BanderaArgentina } from './BanderaArgentina';

interface TopbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenQR: () => void;
  onOpenGoogleAuth: () => void; // Keep prop name for compatibility, invokes institutional login
  currentUser: UserProfile | null;
  onLogout?: () => void;
  onQuickLogin?: (email: string, role: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenQR,
  onOpenGoogleAuth,
  currentUser,
  onLogout,
  onQuickLogin,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  // Determine current user persona type
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN_CREDENTIALS';
  const isValidator = currentUser?.role === 'VALIDATOR';
  const isProfessional = currentUser?.role === 'PROFESSIONAL';

  // 1. MENÚ HORIZONTAL PRINCIPAL (ARRIBA DE TODO)
  // Requerimiento explícito: No todo junto. Solo INICIO, PROYECTOS, INFORMACIÓN
  // SIFFA y PROFESIONALES están agrupados dentro de INFORMACIÓN.
  // CREDENCIAL NO aparece en este menú horizontal.
  const horizontalNavItems: {
    id: TabType;
    label: string;
    icon: string;
    badge?: string;
  }[] = [
    {
      id: 'home',
      label: 'INICIO',
      icon: 'fa-house',
    },
    {
      id: 'proyectos',
      label: 'PROYECTOS',
      icon: 'fa-futbol',
    },
    {
      id: 'informacion',
      label: 'INFORMACIÓN',
      icon: 'fa-circle-info',
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'gestion-admin' as TabType,
            label: 'GESTIÓN SIFFA',
            icon: 'fa-users-gear',
            badge: 'Admin',
          },
        ]
      : []),
  ];

  // 2. MENÚ COMPLETO AL APRETAR EL BOTÓN "MENÚ"
  // Requerimiento explícito: Al apretar el botón de Menú, aparecen todas las opciones
  // excepto las combinadas (SIFFA y Profesionales integradas en INFORMACIÓN):
  // - INICIO
  // - PROYECTOS
  // - INFORMACIÓN (solo dice INFORMACIÓN)
  // - CREDENCIAL (donde aparece la credencial de la persona registrada)
  // - INGRESOS (donde el de la garita corrobora los datos del personal de SIFFA)
  // + Historial, Gestión Admin y Cuenta si corresponde
  interface DrawerMenuItem {
    id: TabType;
    label: string;
    description: string;
    icon: string;
    remixIcon: string;
    badge?: string;
    badgeColor?: string;
    highlight?: boolean;
    onClickOverride?: () => void;
  }

  const drawerMenuItems: DrawerMenuItem[] = [
    {
      id: 'home',
      label: 'INICIO',
      description: 'Portada institucional, novedades y pilares de acción SIFFA',
      icon: 'fa-house',
      remixIcon: 'ri-home-5-line',
    },
    {
      id: 'proyectos',
      label: 'PROYECTOS',
      description: 'Fútbol en cárceles, escuelas formativas y capacitación laboral',
      icon: 'fa-futbol',
      remixIcon: 'ri-football-line',
    },
    {
      id: 'informacion',
      label: 'INFORMACIÓN',
      description: 'Institucional SIFFA, cuerpo de integrantes/profesionales y convenios SPB',
      icon: 'fa-circle-info',
      remixIcon: 'ri-information-line',
    },
    {
      id: 'credencial',
      label: 'CREDENCIAL',
      description: 'Credencial digital con token QR dinámico Ed25519 y estado del profesional',
      icon: 'fa-id-card-clip',
      remixIcon: 'ri-qr-code-line',
      badge: 'Pase Digital',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      highlight: true,
      onClickOverride: () => {
        if (!currentUser) {
          setActiveTab('credencial');
        } else {
          setActiveTab('mi-credencial');
        }
      },
    },
    {
      id: 'ingresos',
      label: 'INGRESOS',
      description: 'Control de garita penitenciaria: escáner QR y verificación de personal SIFFA',
      icon: 'fa-shield-halved',
      remixIcon: 'ri-scan-2-line',
      badge: 'Garita SPB',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      highlight: true,
      onClickOverride: () => {
        setActiveTab('validar');
      },
    },
  ];

  // Si tiene sesión de validador o admin, agregar HISTORIAL DE INGRESOS
  if (isValidator || isSuperAdmin) {
    drawerMenuItems.push({
      id: 'historial-ingresos',
      label: 'HISTORIAL DE INGRESOS',
      description: 'Libro de guardia oficial y auditoría de accesos registrados',
      icon: 'fa-clipboard-list',
      remixIcon: 'ri-history-line',
      badge: 'Auditoría',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    });
  }

  // Si es Administrador SIFFA, agregar GESTIÓN ADMINISTRATIVA
  if (isSuperAdmin) {
    drawerMenuItems.push({
      id: 'gestion-admin',
      label: 'GESTIÓN SIFFA',
      description: 'Padrón central, emisión/revocación de credenciales, roles y establecimientos',
      icon: 'fa-users-gear',
      remixIcon: 'ri-admin-line',
      badge: 'Admin',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    });
  }

  // Si es un profesional logueado, agregar opción directa a su perfil / asignaciones
  if (isProfessional) {
    drawerMenuItems.push({
      id: 'mi-perfil',
      label: 'MI PERFIL DOCENTE',
      description: 'Legajo personal, matrícula y asignación en unidad penitenciaria',
      icon: 'fa-user-check',
      remixIcon: 'ri-user-settings-line',
    });
  }

  const handleDrawerItemClick = (item: DrawerMenuItem) => {
    if (item.onClickOverride) {
      item.onClickOverride();
    } else {
      setActiveTab(item.id);
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="w-full bg-[#001738] text-white sticky top-0 z-40 shadow-md border-b border-slate-800">
        
        {/* FRANJA SUPERIOR INSTITUCIONAL (Estilo FIFA.com) */}
        <div className="bg-[#001026] text-slate-300 text-[11px] border-b border-slate-800/80 py-1.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BanderaArgentina size="xs" />
              <span className="font-extrabold text-white tracking-wider">SIFFA</span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-slate-300 hidden sm:inline font-medium">
                Sindicato Internacional de Fútbol Femenino y Afines
              </span>
              <span className="text-slate-600 hidden md:inline">·</span>
              <span className="text-emerald-400 font-semibold hidden md:inline text-[10px]">
                Convenio Oficial PBA / Servicio Penitenciario Bonaerense
              </span>
            </div>

            {/* Selector Rápido de Perfiles para Pruebas Institucionales (Solo en Entorno de Desarrollo) */}
            {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_PROFILES === 'true') && (
              <div className="flex items-center gap-2 relative">
                <button
                  onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                  className="px-2.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 cursor-pointer border border-white/10 transition-colors"
                  title="Cambiar perfil para pruebas (Entorno de desarrollo)"
                >
                <i className="fa-solid fa-users-viewfinder text-xs"></i>
                <span className="hidden sm:inline">Perfil:</span>
                <span>{currentUser ? currentUser.role : 'PÚBLICO'}</span>
                <i className="fa-solid fa-chevron-down text-[8px] ml-0.5"></i>
              </button>

              {/* Dropdown de perfiles rápidos */}
              {showPersonaMenu && (
                <div className="absolute right-0 top-7 z-50 w-68 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-2 text-xs animate-scaleUp">
                  <span className="block px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                    Cambiar Perfil Institucional:
                  </span>
                  
                  <button
                    onClick={() => {
                      setShowPersonaMenu(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full px-3 py-2 text-left rounded-xl hover:bg-white/10 text-slate-200 font-bold flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-globe"></i>
                    </div>
                    <div>
                      <span className="block text-xs">1. Acceso Público</span>
                      <span className="block text-[10px] text-slate-400 font-normal">Sin credencial iniciada</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowPersonaMenu(false);
                      if (onQuickLogin) {
                        onQuickLogin('marcela.gimenez@siffa.org', 'PROFESSIONAL');
                      } else {
                        onOpenGoogleAuth();
                      }
                    }}
                    className="w-full px-3 py-2 text-left rounded-xl hover:bg-white/10 text-slate-200 font-bold flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-user-tie"></i>
                    </div>
                    <div>
                      <span className="block text-xs">2. Docente SIFFA</span>
                      <span className="block text-[10px] text-emerald-400 font-normal">Lic. Marcela Giménez (UP33)</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowPersonaMenu(false);
                      if (onQuickLogin) {
                        onQuickLogin('guardia.u33@spb.gba.gob.ar', 'VALIDATOR');
                      } else {
                        onOpenGoogleAuth();
                      }
                    }}
                    className="w-full px-3 py-2 text-left rounded-xl hover:bg-white/10 text-slate-200 font-bold flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-shield-halved"></i>
                    </div>
                    <div>
                      <span className="block text-xs">3. Garita / Control</span>
                      <span className="block text-[10px] text-sky-400 font-normal">Guardia SPB (UP33)</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowPersonaMenu(false);
                      if (onQuickLogin) {
                        onQuickLogin('matiasmedina.n@gmail.com', 'SUPER_ADMIN');
                      } else {
                        onOpenGoogleAuth();
                      }
                    }}
                    className="w-full px-3 py-2 text-left rounded-xl hover:bg-white/10 text-slate-200 font-bold flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-crown"></i>
                    </div>
                    <div>
                      <span className="block text-xs">4. Administrador</span>
                      <span className="block text-[10px] text-amber-400 font-normal">Matías Medina (Super Admin)</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

        {/* BARRA PRINCIPAL INSTITUCIONAL */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 gap-4">
            
            {/* Zona 1: Logo e Identidad SIFFA */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  setActiveTab('home');
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 text-left group cursor-pointer focus:outline-hidden"
                title="SIFFA - Inicio"
              >
                <SiffaLogo size="sm" rounded="rounded-xl" />
                <div>
                  <span className="text-xl sm:text-2xl font-black tracking-wider text-white group-hover:text-emerald-400 transition-colors leading-none block">
                    SIFFA
                  </span>
                  <span className="hidden sm:block text-[10px] text-emerald-400 font-bold uppercase tracking-wider leading-none mt-0.5">
                    Sindicato Internacional de Fútbol Femenino y Afines
                  </span>
                </div>
              </button>
            </div>

            {/* MENÚ HORIZONTAL DE ARRIBA:
                Requerimiento del usuario:
                "solo INICIO-SIFFA QUE QUIERO QUE ESTE TODO ESO CUANDO ACCEDEN A LA SECCION DE INFORMACION
                ASIQUE ESA LA PONEMOS EN INFORMACION, DESPUES QUE SIGA PROYECTOS, Y PROFESIONALES QUE SERÍAN
                LOS INTEGRANTES DE LA SIFFA QUE TAMBIEN esté en información y credencial que no aparezca en ese menu"
                => Por lo tanto, el menú horizontal contiene:
                1. INICIO
                2. PROYECTOS
                3. INFORMACIÓN (que agrupa SIFFA e Integrantes/Profesionales)
            */}
            <nav className="hidden lg:flex items-center gap-2">
              {horizontalNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                      isActive
                        ? 'bg-white/10 text-emerald-400 shadow-xs border border-white/10'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <i className={`fa-solid ${item.icon} text-xs ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}></i>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Zona Derecha: Usuario / Mi Cuenta + Botón Menú Destacado */}
            <div className="flex items-center gap-3 shrink-0">
              
              {currentUser ? (
                /* Usuario Conectado */
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('mi-perfil')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors cursor-pointer"
                    title={`Conectado como ${currentUser.name}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center">
                      {currentUser.name.charAt(0)}
                    </div>
                    <span className="text-slate-200 font-bold text-xs truncate max-w-[120px] hidden sm:inline">
                      {currentUser.name.split(' ')[0]}
                    </span>
                  </button>

                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                      title="Cerrar sesión"
                    >
                      <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i>
                    </button>
                  )}
                </div>
              ) : (
                /* Botón MI CUENTA / ACCESO INSTITUCIONAL (Sin Google) */
                <button
                  onClick={onOpenGoogleAuth}
                  className="px-3.5 sm:px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-700 cursor-pointer flex items-center gap-2"
                >
                  <i className="fa-solid fa-user-lock text-emerald-400 text-xs"></i>
                  <span>Mi Cuenta</span>
                </button>
              )}

              {/* Botón de Menú Destacado:
                  Al apretar este botón, se abre el panel con TODAS las opciones:
                  INICIO, PROYECTOS, INFORMACIÓN, CREDENCIAL e INGRESOS
              */}
              <button
                id="topbar-btn-menu-principal"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer select-none ${
                  isMenuOpen
                    ? 'bg-slate-800 text-emerald-400 border-2 border-emerald-400 shadow-emerald-950/60'
                    : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border-2 border-emerald-400/60 shadow-emerald-950/40 hover:scale-[1.02]'
                }`}
                aria-expanded={isMenuOpen}
                aria-label="Abrir Menú Principal"
              >
                <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'} text-sm`}></i>
                <span>{isMenuOpen ? 'Cerrar' : 'Menú'}</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* MENÚ FLOTANTE MINIMALISTA, COMPACTO Y CON ESTILO (TÍTULO + ÍCONO CON EFECTOS HOVER) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 pointer-events-auto">
          {/* Fondo traslúcido para cerrar al hacer clic afuera */}
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Dock / Panel Flotante Minimalista Compacto */}
          <aside
            className="fixed z-50 right-4 sm:right-6 top-16 sm:top-20 w-64 sm:w-72 bg-[#001738]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl shadow-black/80 p-3 sm:p-3.5 flex flex-col gap-1.5 animate-slideLeft select-none"
            aria-label="Menú minimalista SIFFA"
          >
            {/* Cabecera Minimalista */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10 mb-1">
              <div className="flex items-center gap-2">
                <SiffaLogo size="xs" />
                <span className="font-black text-xs tracking-wider uppercase text-white">
                  Menú SIFFA
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group"
                aria-label="Cerrar Menú"
                title="Cerrar (Esc)"
              >
                <i className="fa-solid fa-xmark text-xs group-hover:rotate-90 transition-transform duration-200"></i>
              </button>
            </div>

            {/* Lista Compacta de Opciones: TÍTULO + ÍCONO con Efectos Hover */}
            <nav className="flex flex-col gap-1" aria-label="Navegación principal">
              {drawerMenuItems.map((item, idx) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={`${item.id}-${idx}`}
                    onClick={() => handleDrawerItemClick(item)}
                    className={`group relative w-full px-3 py-2 rounded-2xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer border text-left ${
                      isActive
                        ? 'bg-emerald-500/20 border-emerald-400/80 text-white shadow-md shadow-emerald-950/40 translate-x-1'
                        : 'bg-white/5 hover:bg-white/10 border-transparent hover:border-emerald-400/40 text-slate-300 hover:text-white hover:translate-x-1.5 hover:shadow-md hover:shadow-emerald-950/30'
                    }`}
                  >
                    {/* Indicador de activo a la izquierda */}
                    {isActive && (
                      <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-emerald-400 rounded-full shadow-xs shadow-emerald-400" />
                    )}

                    {/* Ícono estilizado con efecto hover */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                        isActive
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-white/10 text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 group-hover:scale-115'
                      }`}
                    >
                      <i className={`fa-solid ${item.icon} text-xs`}></i>
                    </div>

                    {/* Título Compacto */}
                    <span className="font-extrabold text-xs tracking-wider uppercase flex-1 truncate transition-colors group-hover:text-emerald-300">
                      {item.label}
                    </span>

                    {/* Badge opcional compacto */}
                    {item.badge && (
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border transition-all ${
                          item.badgeColor || 'bg-white/10 text-slate-300 border-white/10'
                        } group-hover:border-emerald-400/60`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Flecha sutil al pasar el mouse */}
                    <i className="fa-solid fa-chevron-right text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0"></i>
                  </button>
                );
              })}
            </nav>

            {/* Separador */}
            <div className="w-full h-[1px] bg-white/10 my-1" role="separator" />

            {/* Estado de Cuenta / Sesión Compacto */}
            {currentUser ? (
              <div className="p-2 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setActiveTab('mi-perfil');
                  }}
                  className="flex items-center gap-2 min-w-0 flex-1 hover:text-emerald-300 text-left transition-colors cursor-pointer"
                  title="Ver Mi Perfil"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold text-white truncate">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className="block text-[9px] text-emerald-400 font-semibold truncate">
                      {currentUser.role}
                    </span>
                  </div>
                </button>

                {onLogout && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                    }}
                    className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs transition-colors cursor-pointer"
                    title="Cerrar sesión"
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket text-[10px]"></i>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenGoogleAuth();
                }}
                className="w-full py-2 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <i className="fa-solid fa-user-lock text-xs"></i>
                <span>Identificación</span>
              </button>
            )}

          </aside>
        </div>
      )}
    </>
  );
};
