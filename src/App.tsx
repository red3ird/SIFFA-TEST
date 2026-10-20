import React, { useState, useEffect } from 'react';
import { TabType, DocenteAcreditado, UserProfile, DynamicQRPayload } from './types';
import { DOCENTES_DATA } from './data/initialData';
import { Topbar } from './components/Topbar';
import { HomeInstitucional } from './components/HomeInstitucional';
import { SiffaInstitucionalView } from './components/SiffaInstitucionalView';
import { ProyectosView } from './components/ProyectosView';
import { ProfesionalesPublicView } from './components/ProfesionalesPublicView';
import { InformacionView } from './components/InformacionView';
import { IngresosOperativoView } from './components/IngresosOperativoView';
import { PerfilProfesionalView } from './components/PerfilProfesionalView';
import { HistorialIngresosView } from './components/HistorialIngresosView';
import { CredencialDigitalView } from './components/CredencialDigitalView';
import { MiCredencialView } from './components/MiCredencialView';
import { PublicVerifyView } from './components/PublicVerifyView';
import { GestionAdminView } from './components/GestionAdminView';
import { ProgramaEducativo } from './components/ProgramaEducativo';
import { ModalCredencialQR } from './components/ModalCredencialQR';
import { ModalGoogleAuth } from './components/ModalGoogleAuth';
import { SiffaLogo } from './components/SiffaLogo';
import { ImageManagerProvider } from './context/ImageManagerContext';
import { ImageEditModal } from './components/ImageEditModal';
import { ImageCatalogModal } from './components/ImageCatalogModal';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Google Auth user state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('siffa_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState(false);

  // Credencial QR modal state
  const [selectedDocenteForQR, setSelectedDocenteForQR] = useState<DocenteAcreditado | null>(DOCENTES_DATA[0]);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Shared payload for testing in validator
  const [validatorPayload, setValidatorPayload] = useState<{
    payload: DynamicQRPayload | null;
    establishmentId: string;
  }>({ payload: null, establishmentId: 'EST-U33' });

  // Authentication requirement context notice
  const [intendedAuthNotice, setIntendedAuthNotice] = useState<string | null>(null);
  const [pendingTabAfterLogin, setPendingTabAfterLogin] = useState<TabType | null>(null);

  // Detection of public verification route /v/:qrToken
  const [publicQrToken, setPublicQrToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/v/')) {
      return window.location.pathname.replace(/^\/v\//, '').trim() || null;
    }
    return null;
  });

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/v/')) {
        setPublicQrToken(window.location.pathname.replace(/^\/v\//, '').trim() || null);
      } else {
        setPublicQrToken(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    if (currentUser?.email) {
      api.setActorEmail(currentUser.email);
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    api.setActorEmail(user.email);
    try {
      localStorage.setItem('siffa_current_user', JSON.stringify(user));
    } catch {}
    showToast(`Bienvenido/a, ${user.name}. Sesión autenticada en padrón cerrado.`);
    if (pendingTabAfterLogin) {
      setActiveTab(pendingTabAfterLogin);
      setPendingTabAfterLogin(null);
    }
    setIntendedAuthNotice(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('siffa_current_user');
    } catch {}
    showToast('Has cerrado sesión exitosamente.');
    setActiveTab('home');
  };

  // Quick Persona Login for seamless evaluator testing
  const handleQuickLogin = (email: string, role: string) => {
    let name = 'Integrante SIFFA';
    if (email === 'marcela.gimenez@siffa.org') name = 'Lic. Marcela Giménez';
    if (email === 'guardia.u33@spb.gba.gob.ar') name = 'Garita UP33 Los Hornos';
    if (email === 'matiasmedina.n@gmail.com') name = 'Matías Medina';

    const sampleProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      picture: email === 'matiasmedina.n@gmail.com'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    };
    handleLoginSuccess(sampleProfile);
    if (role === 'VALIDATOR') {
      setActiveTab('validar');
    } else if (role === 'PROFESSIONAL') {
      setActiveTab('mi-credencial');
    } else if (role === 'SUPER_ADMIN') {
      setActiveTab('gestion-admin');
    }
  };

  const handleOpenDefaultQR = () => {
    if (!currentUser) {
      setIntendedAuthNotice('Para visualizar tu credencial digital con código QR dinámico de seguridad penitenciaria, debes identificarte con tu cuenta autorizada de la SIFFA.');
      setPendingTabAfterLogin('mi-credencial');
      setIsGoogleAuthOpen(true);
      showToast('Acceso Restringido: Identificación obligatoria para Credencial QR.');
      return;
    }
    setActiveTab('mi-credencial');
  };

  const handleSelectTab = (tabId: TabType) => {
    // Restricted area check
    if (tabId === 'mi-credencial' || tabId === 'mi-perfil' || tabId === 'acreditaciones') {
      if (!currentUser) {
        setIntendedAuthNotice('Para acceder a tu credencial o perfil personal de integrante SIFFA, debes identificarte con tu cuenta autorizada.');
        setPendingTabAfterLogin(tabId);
        setIsGoogleAuthOpen(true);
        showToast('Acceso Restringido: Identificación de integrante obligatoria.');
        return;
      }
    }

    if (tabId === 'validar' || tabId === 'historial-ingresos' || tabId === 'ingresos') {
      const isGuardOrAdmin = currentUser && (
        currentUser.role === 'VALIDATOR' ||
        currentUser.role === 'SUPER_ADMIN' ||
        currentUser.role === 'ADMIN_CREDENTIALS' ||
        currentUser.role === 'INSTITUTIONAL_MANAGER'
      );
      if (!isGuardOrAdmin) {
        setIntendedAuthNotice('El módulo de Control de Ingresos y Garita está reservado para personal de guardia de unidades penitenciarias y administradores.');
        setPendingTabAfterLogin('validar');
        setIsGoogleAuthOpen(true);
        showToast('Acceso Restringido a Guardia Penitenciaria.');
        return;
      }
    }

    if (tabId === 'gestion-admin' || tabId === 'establecimientos' || tabId === 'roles-permisos' || tabId === 'auditoria') {
      const isAdmin = currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN_CREDENTIALS');
      if (!isAdmin) {
        setIntendedAuthNotice('El panel de administración y auditoría requiere credenciales de Administrador SIFFA.');
        setPendingTabAfterLogin(tabId);
        setIsGoogleAuthOpen(true);
        showToast('Acceso Restringido a Administradores.');
        return;
      }
    }

    setActiveTab(tabId);
  };

  const handleSendToValidator = (payload: DynamicQRPayload, establishmentId: string) => {
    setValidatorPayload({ payload, establishmentId });
    setActiveTab('validar');
    showToast('Código QR dinámico transferido a la pantalla del Validador en Garita.');
  };

  // Si la URL es /v/:qrToken, mostrar directamente la vista pública de verificación (sin login)
  if (publicQrToken) {
    return (
      <PublicVerifyView
        qrToken={publicQrToken}
        onGoHome={() => {
          window.history.pushState({}, '', '/');
          setPublicQrToken(null);
          setActiveTab('home');
        }}
        currentUser={currentUser}
        onOpenLogin={() => setIsGoogleAuthOpen(true)}
      />
    );
  }

  return (
    <ImageManagerProvider currentUser={currentUser} showToast={showToast}>
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#001738] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 text-xs font-semibold animate-slideDown">
          <i className="fa-solid fa-circle-check text-emerald-400 text-lg"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Topbar Institucional Estilo FIFA.com */}
      <Topbar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        onOpenQR={handleOpenDefaultQR}
        onOpenGoogleAuth={() => {
          setIntendedAuthNotice(null);
          setIsGoogleAuthOpen(true);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        onQuickLogin={handleQuickLogin}
      />

      {/* Main Content por Pestaña */}
      <main className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${activeTab === 'credencial' || activeTab === 'mi-credencial' ? 'py-2 sm:py-3' : 'py-6 sm:py-10'}`}>
        
        {/* 1. Portada Institucional */}
        {activeTab === 'home' && (
          <HomeInstitucional
            setActiveTab={handleSelectTab}
            onOpenQR={handleOpenDefaultQR}
            onOpenGoogleAuth={() => {
              setIntendedAuthNotice(null);
              setIsGoogleAuthOpen(true);
            }}
            currentUser={currentUser}
          />
        )}

        {/* 2. SIFFA Institucional (Integrado en Información) */}
        {activeTab === 'siffa' && (
          <InformacionView
            initialSubSection="institucional"
            setActiveTab={handleSelectTab}
            onOpenAuth={() => {
              setIntendedAuthNotice(null);
              setIsGoogleAuthOpen(true);
            }}
          />
        )}

        {/* 3. Proyectos Deportivos & Formativos */}
        {activeTab === 'proyectos' && (
          <ProyectosView setActiveTab={handleSelectTab} />
        )}

        {/* 4. Cuerpo de Profesionales (Integrado en Información) */}
        {activeTab === 'profesionales' && (
          <InformacionView
            initialSubSection="integrantes"
            setActiveTab={handleSelectTab}
            onOpenAuth={() => {
              setIntendedAuthNotice(null);
              setIsGoogleAuthOpen(true);
            }}
          />
        )}

        {/* 5 & 6. Mi Credencial SIFFA (Personal, con QR Fijo, offline cache y Autorizaciones) */}
        {(activeTab === 'credencial' || activeTab === 'mi-credencial' || activeTab === 'acreditaciones') && (
          <MiCredencialView
            currentUser={currentUser}
            onRequireLogin={() => {
              setIntendedAuthNotice('Para visualizar tu credencial oficial con código QR y autorizaciones, debes identificarte con tu cuenta autorizada de la SIFFA.');
              setPendingTabAfterLogin('mi-credencial');
              setIsGoogleAuthOpen(true);
            }}
          />
        )}

        {/* 7. Mi Perfil Profesional */}
        {activeTab === 'mi-perfil' && (
          <PerfilProfesionalView
            currentUser={currentUser}
            setActiveTab={handleSelectTab}
            onOpenQR={handleOpenDefaultQR}
          />
        )}

        {/* 8. Actividades Asignadas */}
        {activeTab === 'actividades' && (
          <PerfilProfesionalView
            currentUser={currentUser}
            setActiveTab={handleSelectTab}
            onOpenQR={handleOpenDefaultQR}
          />
        )}

        {/* 9. Módulo Operativo de Control de Ingresos (Garita SPB) */}
        {(activeTab === 'validar' || activeTab === 'ingresos') && (
          <IngresosOperativoView
            currentUser={currentUser}
            initialPayload={validatorPayload.payload}
            initialEstablishmentId={validatorPayload.establishmentId}
            onOpenGoogleAuth={() => {
              setIntendedAuthNotice('El módulo de Control de Ingresos requiere credenciales de guardia o administrador.');
              setPendingTabAfterLogin('validar');
              setIsGoogleAuthOpen(true);
            }}
          />
        )}

        {/* 10. Historial Inmutable de Ingresos */}
        {activeTab === 'historial-ingresos' && (
          <HistorialIngresosView />
        )}

        {/* 11. Información Institucional & Marco Legal */}
        {activeTab === 'informacion' && (
          <InformacionView
            setActiveTab={handleSelectTab}
            onOpenAuth={() => {
              setIntendedAuthNotice(null);
              setIsGoogleAuthOpen(true);
            }}
          />
        )}

        {/* 12. Panel Administrativo SIFFA (Exclusivo Administrador) */}
        {activeTab === 'gestion-admin' && (
          currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN_CREDENTIALS') ? (
            <GestionAdminView
              initialSubTab="perfiles"
              onQuickLogin={handleQuickLogin}
            />
          ) : (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center max-w-lg mx-auto space-y-4 my-12 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mx-auto border border-rose-200">
                <i className="fa-solid fa-lock"></i>
              </div>
              <h3 className="text-xl font-black text-slate-900">Acceso Exclusivo para Administradores</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                El módulo de <strong>Gestión SIFFA</strong> y la administración de perfiles está reservado únicamente para el perfil de Administrador Institucional. Identifícate con tu cuenta autorizada.
              </p>
              <button
                onClick={() => handleSelectTab('home')}
                className="px-5 py-2.5 rounded-xl bg-[#001738] text-white font-bold text-xs hover:bg-[#002b66] transition-colors cursor-pointer"
              >
                Volver al Inicio
              </button>
            </div>
          )
        )}

        {activeTab === 'establecimientos' && (
          <GestionAdminView initialSubTab="establecimientos" onQuickLogin={handleQuickLogin} />
        )}

        {activeTab === 'roles-permisos' && (
          <GestionAdminView initialSubTab="roles" onQuickLogin={handleQuickLogin} />
        )}

        {activeTab === 'auditoria' && (
          <GestionAdminView initialSubTab="auditoria" onQuickLogin={handleQuickLogin} />
        )}

        {/* 13. Programa Educativo */}
        {activeTab === 'programa' && (
          <ProgramaEducativo
            setActiveTab={handleSelectTab}
            onOpenGoogleAuth={() => {
              setIntendedAuthNotice(null);
              setIsGoogleAuthOpen(true);
            }}
          />
        )}
      </main>

      {/* Footer Institucional SIFFA */}
      <footer className="w-full bg-[#001128] text-slate-400 border-t border-slate-800 text-xs py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <SiffaLogo size="sm" />
            <div>
              <p className="text-white font-bold text-sm">
                SIFFA · Sindicato Internacional de Fútbol Femenino y Afines
              </p>
              <p className="text-[11px] text-slate-400">
                Plataforma de Identidad Institucional, Credenciales Digitales Asimétricas (Ed25519) y Acceso Penitenciario
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <button
              id="footer-btn-google-auth"
              onClick={() => {
                setIntendedAuthNotice(null);
                setIsGoogleAuthOpen(true);
              }}
              className="text-emerald-400 hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-id-card-clip"></i>
              <span>{currentUser ? `Sesión Activa: ${currentUser.name} (${currentUser.role})` : 'Identificación de Integrante'}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modales Interactivos */}
      <ModalCredencialQR
        docente={selectedDocenteForQR}
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onSimulateGuardScan={() => {}}
      />

      <ModalGoogleAuth
        isOpen={isGoogleAuthOpen}
        onClose={() => {
          setIsGoogleAuthOpen(false);
          setIntendedAuthNotice(null);
        }}
        onLoginSuccess={handleLoginSuccess}
        currentUser={currentUser}
        onLogout={handleLogout}
        intendedActionNotice={intendedAuthNotice}
      />

      {/* Gestor y Reemplazo de Imágenes para el Administrador */}
      <ImageEditModal />
      <ImageCatalogModal />

    </div>
  </ImageManagerProvider>
  );
}
