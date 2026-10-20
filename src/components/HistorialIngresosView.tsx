import React, { useState, useEffect } from 'react';
import { CheckInRecord, Establishment } from '../types';
import { api } from '../services/api';

export const HistorialIngresosView: React.FC = () => {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [filterEst, setFilterEst] = useState<string>('ALL');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cList, eList] = await Promise.all([
          api.getCheckIns(),
          api.getEstablishments(),
        ]);
        setCheckIns(cList);
        setEstablishments(eList);
      } catch (err) {
        console.error('Error al cargar historial', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = checkIns.filter((c) => {
    if (filterEst !== 'ALL' && c.establishmentId !== filterEst) return false;
    if (filterMethod !== 'ALL' && c.method !== filterMethod) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.professionalName.toLowerCase().includes(q);
      const matchDoc = c.documentNumber.includes(q);
      const matchCred = c.credentialId.toLowerCase().includes(q);
      const matchId = c.validationId.toLowerCase().includes(q);
      if (!matchName && !matchDoc && !matchCred && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-[#001738] rounded-3xl p-8 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider inline-block mb-2">
            Registro Oficial de Guardia Penitenciaria
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Historial de Ingresos y Check-in
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Registro inmutable de validaciones autorizadas en puestos de control de Unidades del SPB.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filtered, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute('href', dataStr);
              downloadAnchor.setAttribute('download', `auditoria_ingresos_siffa_${Date.now()}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors cursor-pointer flex items-center gap-2"
          >
            <i className="fa-solid fa-download"></i>
            <span>Exportar Auditoría</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, DNI o credencial..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500">Unidad:</span>
            <select
              value={filterEst}
              onChange={(e) => setFilterEst(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
            >
              <option value="ALL">Todas las Unidades</option>
              {establishments.map((e) => (
                <option key={e.id} value={e.id}>{e.code} - {e.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500">Método:</span>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
            >
              <option value="ALL">Todos los métodos</option>
              <option value="QR">Código QR Dinámico</option>
              <option value="MANUAL">Ingreso Manual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">ID Check-in</th>
                <th className="py-3 px-4">Profesional</th>
                <th className="py-3 px-4">DNI</th>
                <th className="py-3 px-4">Credencial</th>
                <th className="py-3 px-4">Establecimiento</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Operador Guardia</th>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.validationId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">{item.validationId}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{item.professionalName}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{item.documentNumber}</td>
                  <td className="py-3 px-4 font-mono text-emerald-700 font-bold">{item.credentialId}</td>
                  <td className="py-3 px-4 text-slate-800">{item.establishmentName}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.method === 'QR' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {item.method}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{item.guardName}</td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                    {new Date(item.timestamp).toLocaleString('es-AR')}
                  </td>
                  <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">{item.notes || '-'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-semibold">
                    No se encontraron registros con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
