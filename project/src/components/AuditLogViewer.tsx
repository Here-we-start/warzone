import React, { useState } from 'react';
import { Eye, Filter, Search, Calendar, User, Activity, Trash2, AlertTriangle } from 'lucide-react';
import GlassPanel from './GlassPanel';
import { AuditLog } from '../types';

interface AuditLogViewerProps {
  auditLogs: AuditLog[];
  setAuditLogs?: (logs: AuditLog[] | ((prev: AuditLog[]) => AuditLog[])) => void;
  isAdmin?: boolean;
}

export default function AuditLogViewer({ auditLogs, setAuditLogs, isAdmin = false }: AuditLogViewerProps) {
  const [filterType, setFilterType] = useState<'all' | 'admin' | 'manager' | 'team'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearPassword, setClearPassword] = useState('');

  const filteredLogs = auditLogs.filter(log => {
    const matchesType = filterType === 'all' || log.performedByType === filterType;
    const matchesSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    
    return matchesType && matchesSearch && matchesAction;
  });

  const uniqueActions = [...new Set(auditLogs.map(log => log.action))].sort();

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('APPROVED')) return 'text-green-400';
    if (action.includes('DELETED') || action.includes('REJECTED') || action.includes('RESET')) return 'text-red-400';
    if (action.includes('PENALTY')) return 'text-red-400';
    if (action.includes('REWARD')) return 'text-green-400';
    if (action.includes('EXPORT')) return 'text-blue-400';
    return 'text-ice-blue';
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'admin': return 'text-ice-blue bg-ice-blue/10 border-ice-blue/30';
      case 'manager': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'team': return 'text-green-400 bg-green-500/10 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const handleClearLogs = () => {
    if (clearPassword === 'MISOKIETI8' && setAuditLogs) {
      // Simply clear all logs without adding any record
      setAuditLogs([]);
      setShowClearConfirm(false);
      setClearPassword('');
    } else {
      alert('Codice non valido');
      setClearPassword('');
    }
  };

  return (
    <>
      <GlassPanel className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
            <Eye className="w-5 h-5 text-ice-blue" />
            <span>AUDIT LOG ({filteredLogs.length})</span>
          </h2>
          
          {isAdmin && setAuditLogs && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-mono text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>CANCELLA LOG</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-ice-blue mb-2 font-mono text-sm">Tipo Utente</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono text-sm"
            >
              <option value="all">Tutti</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="team">Team</option>
            </select>
          </div>

          <div>
            <label className="block text-ice-blue mb-2 font-mono text-sm">Azione</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono text-sm"
            >
              <option value="all">Tutte</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-ice-blue mb-2 font-mono text-sm">Ricerca</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ice-blue/60" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca in azioni, dettagli, utenti..."
                className="w-full pl-10 pr-4 py-2 bg-black/30 border border-ice-blue/40 rounded-xl text-white placeholder-ice-blue/60 focus:outline-none focus:border-ice-blue font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 bg-black/20 border border-ice-blue/20 rounded-lg hover:bg-ice-blue/5 transition-all duration-300 animate-fade-in"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 rounded text-xs font-mono border ${getUserTypeColor(log.performedByType)}`}>
                    {log.performedByType.toUpperCase()}
                  </div>
                  <div className={`font-mono font-bold ${getActionColor(log.action)}`}>
                    {log.action}
                  </div>
                </div>
                <div className="text-ice-blue/60 text-xs font-mono">
                  {formatTime(log.timestamp)}
                </div>
              </div>
              
              <div className="text-white font-mono text-sm mb-2">
                {log.details}
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-ice-blue/60 font-mono">
                  <User className="w-3 h-3" />
                  <span>Eseguito da: {log.performedBy}</span>
                </div>
                {log.tournamentId && (
                  <div className="flex items-center space-x-1 text-ice-blue/60 font-mono">
                    <Activity className="w-3 h-3" />
                    <span>Torneo: {log.tournamentId}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {filteredLogs.length === 0 && (
            <div className="text-center text-ice-blue/60 font-mono py-12">
              <Eye className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Nessun log trovato</p>
              <p className="text-sm">Modifica i filtri per vedere più risultati</p>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-black/20 border border-ice-blue/20 rounded-lg text-center">
            <div className="text-lg font-bold text-ice-blue font-mono">
              {auditLogs.filter(l => l.performedByType === 'admin').length}
            </div>
            <div className="text-ice-blue/60 font-mono text-xs">AZIONI ADMIN</div>
          </div>
          <div className="p-3 bg-black/20 border border-purple-400/20 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-400 font-mono">
              {auditLogs.filter(l => l.performedByType === 'manager').length}
            </div>
            <div className="text-purple-400/60 font-mono text-xs">AZIONI MANAGER</div>
          </div>
          <div className="p-3 bg-black/20 border border-green-400/20 rounded-lg text-center">
            <div className="text-lg font-bold text-green-400 font-mono">
              {auditLogs.filter(l => l.performedByType === 'team').length}
            </div>
            <div className="text-green-400/60 font-mono text-xs">AZIONI TEAM</div>
          </div>
          <div className="p-3 bg-black/20 border border-ice-blue/20 rounded-lg text-center">
            <div className="text-lg font-bold text-ice-blue font-mono">
              {auditLogs.length}
            </div>
            <div className="text-ice-blue/60 font-mono text-xs">TOTALE AZIONI</div>
          </div>
        </div>
      </GlassPanel>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassPanel className="w-full max-w-md p-6 animate-fade-in-up">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 mb-4 relative">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                <div className="absolute inset-0 rounded-full bg-red-400/10 animate-ping" />
              </div>
              <h2 className="text-2xl font-bold text-white font-mono">ATTENZIONE</h2>
              <p className="text-red-400/80 font-mono text-sm mt-2">
                Questa azione cancellerà TUTTI i log di audit
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="text-red-400 font-mono text-sm mb-2">⚠️ OPERAZIONE IRREVERSIBILE</div>
                <div className="text-red-400/80 font-mono text-xs">
                  • Tutti i {auditLogs.length} log verranno eliminati
                  <br />
                  • Non sarà possibile recuperare i dati
                  <br />
                  • Nessuna traccia rimarrà nel sistema
                </div>
              </div>

              <div>
                <label className="block text-ice-blue mb-2 font-mono text-sm">
                  Inserisci il codice di conferma:
                </label>
                <input
                  type="password"
                  value={clearPassword}
                  onChange={(e) => setClearPassword(e.target.value)}
                  placeholder="Codice amministratore"
                  className="w-full px-4 py-3 bg-black/30 border border-red-500/40 rounded-xl text-white placeholder-red-400/60 focus:outline-none focus:border-red-500 font-mono text-center"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowClearConfirm(false);
                    setClearPassword('');
                  }}
                  className="flex-1 py-3 bg-gray-500/20 border border-gray-500/50 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-colors font-mono"
                >
                  ANNULLA
                </button>
                <button
                  onClick={handleClearLogs}
                  disabled={!clearPassword.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none font-mono"
                >
                  CANCELLA TUTTO
                </button>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}
    </>
  );
}