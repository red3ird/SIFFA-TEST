import React, { useState, useEffect } from 'react';
import { UserProfile, Professional, Credential, Authorization, Activity, TabType } from '../types';
import { api } from '../services/api';
import { SiffaLogo } from './SiffaLogo';
import { BanderaArgentina } from './BanderaArgentina';

interface PerfilProfesionalViewProps {
  currentUser: UserProfile | null;
  setActiveTab: (tab: TabType) => void;
  onOpenQR: () => void;
}

export const PerfilProfesionalView: React.FC<PerfilProfesionalViewProps> = ({
  currentUser,
  setActiveTab,
  onOpenQR,
}) => {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [credential, setCredential] = useState<Credential | null>(null);
  const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfData() {
      try {
        const [pros, creds, auths, acts] = await Promise.all([
          api.getProfessionals(),
          api.getCredentials(),
          api.getAuthorizations(),
          api.getActivities(),
        ]);

        if (currentUser?.email) {
          const matched = pros.find(
            (p) => p.email.toLowerCase() === currentUser.email.toLowerCase()
          );
          if (matched) {
            setProfessional(matched);
            const myCred = creds.find((c) => c.professionalId === matched.id && c.status === 'ACTIVE') ||
              creds.find((c) => c.professionalId === matched.id);
            setCredential(myCred || null);
            const myAuths = auths.filter((a) => a.professionalId === matched.id);
            setAuthorizations(myAuths);
            const myActs = acts.filter((a) => a.professionalId === matched.id);
            setActivities(myActs);
          } else {
            // Default to first professional for demo if user is admin
            setProfessional(pros[0] || null);
            setCredential(creds[0] || null);
            setAuthorizations(auths.slice(0, 1));
            setActivities(acts.slice(0, 2));
          }
        }
      } catch (e) {
        console.error('Error al cargar datos del perfil profesional', e);
      } finally {
        setLoading(false);
      }
    }
    loadProfData();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
        <i className="fa-solid fa-user-lock text-4xl text-amber-500"></i>
        <h2 className="text-xl font-bold text-slate-900">Identificación Requerida</h2>
        <p className="text-xs text-slate-600">Debes identificarte con tu cuenta oficial para ver tu legajo profesional.</p>
      </div>
    );
  }

  const primaryAuth = authorizations[0];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Perfil */}
      <div className="bg-[#001738] rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={professional?.profilePhotoUrl || currentUser.picture || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'}
            alt={currentUser.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                {professional?.professionalRole || currentUser.role}
              </span>
              <BanderaArgentina size="xs" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {currentUser.name}
            </h1>
            <p className="text-slate-400 text-xs font-mono">
              Legajo: {professional?.id || 'SIFFA-PRO-01'} · {currentUser.email}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenQR}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer flex items-center gap-2 whitespace-nowrap"
        >
          <i className="fa-solid fa-qrcode text-amber-300 text-sm"></i>
          <span>Abrir Mi Credencial QR</span>
        </button>
      </div>

      {/* Grid de Estado & Asignaciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarjeta 1: Estado de Credencial */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-slate-400">Estado de Credencial</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
              credential?.status === 'ACTIVE'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              {credential?.status === 'ACTIVE' ? 'ACTIVA · HABILITADA' : credential?.status || 'PENDIENTE'}
            </span>
          </div>

          <div>
            <span className="text-2xl font-black text-slate-900 block">
              {credential?.id || 'CRED-001'}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Firma asimétrica Ed25519 con token rotativo cada 90 segundos.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
            <p><strong>Vigencia:</strong> {credential?.expiresAt ? credential.expiresAt.slice(0, 10) : '2026-12-31'}</p>
            <p><strong>Versión:</strong> v{credential?.credentialVersion || 1}</p>
          </div>
        </div>

        {/* Tarjeta 2: Unidad Penitenciaria Asignada */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-slate-400">Establecimiento Homologado</span>
            <i className="fa-solid fa-building-shield text-emerald-600"></i>
          </div>

          <div>
            <span className="text-lg font-black text-slate-900 block leading-tight">
              {primaryAuth?.establishmentName || 'Unidad Penitenciaria N° 33 Los Hornos'}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              {primaryAuth?.purpose || 'Taller de Fútbol Femenino y Formación'}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
            <p><strong>Horario:</strong> {primaryAuth ? `${primaryAuth.startTime} a ${primaryAuth.endTime} hs` : '08:00 a 18:00 hs'}</p>
            <p><strong>Vigencia:</strong> Hasta {primaryAuth?.validUntil || '2026-12-31'}</p>
          </div>
        </div>

        {/* Tarjeta 3: Matrícula y Especialidad */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-slate-400">Matrícula & Homologación</span>
            <i className="fa-solid fa-certificate text-amber-500"></i>
          </div>

          <div>
            <span className="text-lg font-black text-slate-900 block font-mono">
              {professional?.matricula || 'ATFA-4821 / SIFFA-0089'}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              {professional?.specialty || 'Táctica de Fútbol 11 y Gestión Grupal'}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
            <p><strong>DNI:</strong> {professional?.documentNumber || '32849120'}</p>
            <p><strong>Teléfono:</strong> {professional?.phone || '+54 11 4829-1920'}</p>
          </div>
        </div>
      </div>

      {/* Próximas Actividades Asignadas */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
              Agenda Penitenciaria
            </span>
            <h3 className="text-xl font-black text-slate-900">
              Próximas Actividades y Talleres Programados
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {activities.length} Asignaciones
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activities.map((act) => (
            <div key={act.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {act.category}
                </span>
                <span className="text-[11px] font-mono text-slate-500">{act.pabellon}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{act.title}</h4>
              <p className="text-xs text-slate-600">
                <i className="fa-solid fa-clock text-slate-400 mr-1.5"></i>
                {act.schedule}
              </p>
              <p className="text-xs text-slate-500 truncate">
                <i className="fa-solid fa-building text-slate-400 mr-1.5"></i>
                {act.establishmentName}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
