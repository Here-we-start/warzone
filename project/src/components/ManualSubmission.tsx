import React, { useState } from 'react';
import { Upload, Users, Target, X, Zap, AlertTriangle } from 'lucide-react';
import GlassPanel from './GlassPanel';
import PhotoUpload from './PhotoUpload';
import { Team, Tournament, PendingSubmission } from '../types';

interface ManualSubmissionProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  tournament: Tournament;
  onSubmit: (submission: Omit<PendingSubmission, 'id' | 'submittedAt'>) => Promise<void>;
  submitterName: string;
  submitterType: 'admin' | 'manager';
}

export default function ManualSubmission({
  isOpen,
  onClose,
  teams,
  tournament,
  onSubmit,
  submitterName,
  submitterType
}: ManualSubmissionProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [position, setPosition] = useState<number>(1);
  const [kills, setKills] = useState<number>(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedTeamData = teams.find(team => team.code === selectedTeam);

  const handleSubmit = async () => {
    if (!selectedTeam || !selectedTeamData) {
      setError('Seleziona una squadra');
      return;
    }

    if (position < 1 || position > 20) {
      setError('Posizione non valida');
      return;
    }

    if (kills < 0) {
      setError('Numero di kills non valido');
      return;
    }

    if (photos.length < 2) {
      setError('Carica almeno 2 screenshot');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        teamCode: selectedTeam,
        teamName: selectedTeamData.name,
        position,
        kills,
        photos,
        tournamentId: tournament.id
      });

      // Reset form
      setSelectedTeam('');
      setPosition(1);
      setKills(0);
      setPhotos([]);
      onClose();
    } catch (err) {
      setError('Errore durante l\'invio. Riprova.');
      console.error('Manual submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassPanel className="w-full max-w-2xl p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
            <Target className="w-5 h-5 text-ice-blue" />
            <span>INSERIMENTO MANUALE RISULTATI</span>
          </h2>
          <button
            onClick={onClose}
            className="text-ice-blue/60 hover:text-ice-blue transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-400 font-mono text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Questa funzione permette di inserire manualmente i risultati per conto di un team. L'inserimento sarà tracciato e richiederà approvazione.</span>
            </div>
          </div>

          <div>
            <label className="block text-ice-blue mb-2 font-mono text-sm">Seleziona Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-4 py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono"
              disabled={isSubmitting}
            >
              <option value="">-- Seleziona una squadra --</option>
              {teams.map((team) => (
                <option key={team.code} value={team.code}>
                  {team.name} ({team.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-ice-blue mb-2 font-mono text-sm">Posizione</label>
              <select
                value={position}
                onChange={(e) => setPosition(Number(e.target.value))}
                className="w-full px-4 py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono"
                disabled={isSubmitting}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num}° posto</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-ice-blue mb-2 font-mono text-sm">Kills</label>
              <input
                type="number"
                value={kills}
                onChange={(e) => setKills(Number(e.target.value))}
                min="0"
                className="w-full px-4 py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <PhotoUpload
            photos={photos}
            onPhotosChange={setPhotos}
            maxPhotos={2}
            required={true}
          />

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center space-x-2 text-red-400 font-mono text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="p-3 bg-ice-blue/10 border border-ice-blue/30 rounded-lg">
            <div className="text-ice-blue font-mono text-sm">
              <div className="font-bold mb-1">Dettagli inserimento:</div>
              <div>• Inserito da: {submitterName} ({submitterType === 'admin' ? 'Admin' : 'Manager'})</div>
              <div>• Torneo: {tournament.name}</div>
              <div>• Data: {new Date().toLocaleString('it-IT')}</div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-500/20 border border-gray-500/50 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-colors font-mono"
              disabled={isSubmitting}
            >
              ANNULLA
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedTeam || position < 1 || kills < 0 || photos.length < 2 || isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(161,224,255,0.5)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none font-mono relative overflow-hidden"
            >
              {isSubmitting && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              )}
              <div className="flex items-center justify-center space-x-2">
                <Upload className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>{isSubmitting ? 'INVIO IN CORSO...' : 'INVIA PER APPROVAZIONE'}</span>
              </div>
            </button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}