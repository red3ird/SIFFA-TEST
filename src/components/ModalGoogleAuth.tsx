import React, { useState } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { SiffaLogo } from './SiffaLogo';

interface ModalLoginInstitucionalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  intendedActionNotice?: string | null;
}

export const ModalGoogleAuth: React.FC<ModalLoginInstitucionalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
  onLogout,
  intendedActionNotice,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Acceso mediante Correo Electrónico y Contraseña institucional
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setAuthError('Por favor ingresa tu correo electrónico institucional o matrícula.');
      return;
    }
    if (!passwordInput) {
      setAuthError('Por favor ingresa tu contraseña institucional.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      const siffaAuth = await api.loginWithSiffa({
        email: emailInput.trim().toLowerCase(),
        password: passwordInput,
        method: 'password',
      });

      const userProfile: UserProfile = {
        id: siffaAuth.user.uid,
        name: siffaAuth.user.displayName,
        email: siffaAuth.user.email,
        picture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
        role: siffaAuth.user.role,
        fechaRegistro: new Date().toLocaleDateString('es-AR'),
        clasesCompletadas: 2,
      };

      onLoginSuccess(userProfile);
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      setAuthError(
        err.message ||
          'Usuario no autorizado o credenciales inválidas. Por motivos de seguridad penitenciaria, el registro es de padrón cerrado gestionado exclusivamente por el administrador de SIFFA.'
      );
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await api.logout();
    } catch {}
    onLogout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
        
        {/* Header Modal Institucional */}
        <div className="bg-[#001738] text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <SiffaLogo size="xs" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                SIFFA · Acceso Institucional
              </span>
              <h2 className="text-base font-extrabold text-white leading-tight">
                {currentUser ? 'Cuenta Conectada' : 'Identificación de Integrante'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* Aviso contextual cuando se requiere identificación */}
          {intendedActionNotice && !currentUser && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-300/80 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
              <i className="fa-solid fa-lock text-amber-600 text-base mt-0.5 shrink-0"></i>
              <div>
                <strong className="block font-bold">Identificación Obligatoria:</strong>
                <span>{intendedActionNotice}</span>
              </div>
            </div>
          )}

          {authError && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-2xl flex items-start gap-3">
              <i className="fa-solid fa-circle-exclamation text-rose-600 text-base mt-0.5 shrink-0"></i>
              <div className="flex-1 font-semibold leading-relaxed">{authError}</div>
            </div>
          )}

          {currentUser ? (
            /* Usuario autenticado */
            <div className="space-y-6 text-center">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-2xl mx-auto bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center text-3xl font-extrabold shadow-md border-2 border-emerald-400">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs">
                  <i className="fa-solid fa-check"></i>
                </div>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-lg">{currentUser.name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{currentUser.email}</p>
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
                  <i className="fa-solid fa-shield text-[10px]"></i>
                  <span>Rol: {currentUser.role}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Padrón Institucional:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                    AUTORIZADO · ACTIVO
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">ID de Sistema:</span>
                  <span className="font-mono text-slate-700 text-[11px] truncate max-w-[200px]">
                    {currentUser.id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Credencial Digital:</span>
                  <span className="font-semibold text-slate-800">Token Dinámico Ed25519</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-id-card"></i>
                  <span>Continuar a Mi Cuenta</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="py-3 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          ) : (
            /* Formulario de Login Institucional */
            <div className="space-y-5">
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Correo
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                      <i className="fa-solid fa-envelope"></i>
                    </span>
                    <input
                      type="text"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Ingresa tu correo"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contraseña Institucional
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                      <i className="fa-solid fa-lock"></i>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-900/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <i className="fa-solid fa-arrow-right-to-bracket text-xs"></i>
                      <span>INGRESAR</span>
                    </>
                  )}
                </button>
              </form>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
