import React, { useState, useEffect } from 'react';
import { Shield, Zap, AlertTriangle, Eye, EyeOff, ArrowLeft, Globe } from 'lucide-react';
import GlassPanel from './GlassPanel';
import { useRealTimeData } from '../hooks/useRealTimeData'; 
import { Team, Manager, Tournament, UserType } from '../types';
import { isGlobalSystemActive } from '../utils/globalSync'; 

interface LoginScreenProps {
  onLogin: (type: 'admin' | 'manager' | 'team', identifier: string, tournamentId?: string) => void;
  onBackToPublic: () => void;
}

export default function LoginScreen({ onLogin, onBackToPublic }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [teams] = useRealTimeData<Record<string, Team>>('teams', {});
  const [managers] = useRealTimeData<Record<string, Manager>>('managers', {});
  const [tournaments] = useRealTimeData<Record<string, Tournament>>('tournaments', {});
  const [globalStatus, setGlobalStatus] = useState(false);

  useEffect(() => {
    setGlobalStatus(isGlobalSystemActive());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setError('');

    // Simula autenticazione
    await new Promise(resolve => setTimeout(resolve, 1000));

    const trimmedPassword = password.trim();

    try {
      // Codici admin
      if (['MISOKIETI', 'MISOKIETI8'].includes(trimmedPassword.toUpperCase())) {
        console.log('✅ Login admin riuscito');
        onLogin('admin', 'admin');
        return;
      }

      // Verifica manager
      const manager = Object.values(managers).find(
        m => m.code.toLowerCase() === trimmedPassword.toLowerCase() && m.isActive
      );

      if (manager) {
        console.log('✅ Login manager riuscito:', manager.code);
        const tournament = Object.values(tournaments).find(
          t => t.assignedManagers.includes(manager.code) && t.status === 'active'
        );
        onLogin('manager', manager.code, tournament?.id);
        return;
      }

      // Verifica team
      const team = Object.values(teams).find(
        t => t.code.toLowerCase() === trimmedPassword.toLowerCase()
      );

      if (team) {
        const tournament = tournaments[team.tournamentId];
        if (tournament && tournament.status === 'active') {
          console.log('✅ Login team riuscito:', team.code);
          onLogin('team', team.code, team.tournamentId);
          return;
        } else {
          setError('TORNEO NON ATTIVO');
          setIsLoading(false);
          return;
        }
      }

      // Login fallito
      setError('CODICE NON VALIDO');
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Errore login:', error);
      setError('ERRORE DI SISTEMA');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-md">
        <button
          onClick={onBackToPublic}
          className="mb-4 flex items-center space-x-2 text-ice-blue/60 hover:text-ice-blue transition-colors font-mono text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Torna ai Tornei</span>
        </button>

        <GlassPanel className="p-6 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-ice-blue/20 to-ice-blue-dark/20 mb-4 relative">
              <Shield className="w-8 h-8 text-ice-blue" />
              <div className="absolute inset-0 rounded-full bg-ice-blue/10 animate-ping" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 font-mono">
              ACCESSO
            </h1>
            <p className="text-ice-blue/80 text-sm font-mono">
              Sistema Globale
            </p>
            
            {/* Status sistema globale */}
            <div className={`mt-3 flex items-center justify-center space-x-2 text-xs font-mono ${
              globalStatus ? 'text-green-400' : 'text-red-400'
            }`}>
              <Globe className="w-4 h-4" />
              <span>{globalStatus ? 'SISTEMA GLOBALE ATTIVO' : 'SISTEMA GLOBALE OFFLINE'}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Inserisci codice"
                className="w-full px-4 py-3 bg-black/40 border border-ice-blue/40 rounded-xl text-white placeholder-ice-blue/60 focus:outline-none focus:border-ice-blue font-mono text-center"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ice-blue/60 hover:text-ice-blue transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3 font-mono">
                <div className="flex items-center justify-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full py-3 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(161,224,255,0.5)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
            >
              <div className="flex items-center justify-center space-x-2">
                <Zap className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'ACCESSO...' : 'ACCEDI'}</span>
              </div>
            </button>
          </form>

          <div className="mt-6 text-xs text-ice-blue/50 font-mono">
            <div>Inserisci il codice di accesso fornito</div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}