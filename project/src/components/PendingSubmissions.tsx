import React from 'react';
import { Check, X, Clock, Eye, Image as ImageIcon, Filter, Search, Upload, Users } from 'lucide-react';
import GlassPanel from './GlassPanel';
import { PendingSubmission } from '../types';

interface PendingSubmissionsProps {
  submissions: PendingSubmission[];
  isAdmin: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onManualSubmit: () => void;
}

export default function PendingSubmissions({ 
  submissions, 
  isAdmin,
  onApprove, 
  onReject,
  onManualSubmit
}: PendingSubmissionsProps) {
  const [selectedPhotos, setSelectedPhotos] = React.useState<string[]>([]);
  const [showPhotoModal, setShowPhotoModal] = React.useState(false);
  const [filterTeam, setFilterTeam] = React.useState<string>('');
  const [searchTerm, setSearchTerm] = React.useState<string>('');

  const viewPhotos = (photos: string[]) => {
    setSelectedPhotos(photos);
    setShowPhotoModal(true);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtra le submission in base ai criteri
  const filteredSubmissions = submissions.filter(submission => {
    const matchesTeam = !filterTeam || submission.teamCode === filterTeam;
    const matchesSearch = !searchTerm || 
      submission.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.teamCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTeam && matchesSearch;
  });

  // Estrai team unici per il filtro
  const uniqueTeams = Array.from(new Set(submissions.map(s => s.teamCode)))
    .map(code => {
      const submission = submissions.find(s => s.teamCode === code);
      return { code, name: submission?.teamName || code };
    });

  if (submissions.length === 0) {
    return (
      <GlassPanel className="p-6 text-center">
        <div className="text-ice-blue/60 font-mono">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>NESSUNA SOTTOMISSIONE IN ATTESA</p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <>
      <GlassPanel className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white mb-6 font-mono flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-ice-blue" />
              <span>SOTTOMISSIONI IN ATTESA ({filteredSubmissions.length}/{submissions.length})</span>
            </div>
          </h3>
          
          <button
            onClick={onManualSubmit}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors font-mono text-sm"
          >
            <Upload className="w-4 h-4" />
            <span>INSERIMENTO MANUALE</span>
          </button>
        </div>

        {/* Filtri */}
        {submissions.length > 5 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-ice-blue mb-2 font-mono text-sm">Filtra per Team</label>
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="w-full px-3 py-2 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono text-sm"
              >
                <option value="">Tutti i team</option>
                {uniqueTeams.map(team => (
                  <option key={team.code} value={team.code}>
                    {team.name} ({team.code})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-ice-blue mb-2 font-mono text-sm">Cerca</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ice-blue/60" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cerca per nome o codice..."
                  className="w-full pl-10 pr-4 py-2 bg-black/30 border border-ice-blue/40 rounded-xl text-white placeholder-ice-blue/60 focus:outline-none focus:border-ice-blue font-mono text-sm"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              className="p-4 bg-black/20 border border-ice-blue/20 rounded-lg animate-fade-in hover:bg-ice-blue/5 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-white font-bold font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm">{submission.teamName}</span>
                      <div className="text-xs opacity-60">({submission.teamCode})</div>
                      {submission.id.startsWith('manual-') && (
                        <div className="px-2 py-1 bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded text-xs">
                          Manuale
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-ice-blue/60 text-sm font-mono">
                    {submission.teamCode} • {submission.section}
                    {submission.lobby && ` • ${submission.lobby}`}
                  </div>
                </div>
                <div className="text-ice-blue/60 text-sm font-mono">
                  {formatTime(submission.submittedAt)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm font-mono">
                <div className="bg-black/30 p-3 rounded-lg">
                  <div className="text-ice-blue/60">POSIZIONE</div>
                  <div className="text-white font-bold text-lg">
                    {submission.position}°
                  </div>
                </div>
                <div className="bg-black/30 p-3 rounded-lg">
                  <div className="text-ice-blue/60">KILLS</div>
                  <div className="text-white font-bold text-lg">
                    {submission.kills}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => viewPhotos(submission.photos)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors font-mono text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>VEDI FOTO ({submission.photos.length})</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    onClick={() => onReject(submission.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-300 hover:scale-105 font-mono"
                  >
                    <X className="w-4 h-4" />
                    <span>RIFIUTA</span>
                  </button>
                  <button
                    onClick={() => onApprove(submission.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-all duration-300 hover:scale-105 font-mono"
                  >
                    <Check className="w-4 h-4" />
                    <span>APPROVA</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredSubmissions.length === 0 && (
            <div className="text-center text-ice-blue/60 font-mono py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna sottomissione in attesa</p>
              <button 
                onClick={onManualSubmit}
                className="mt-4 px-4 py-2 bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors font-mono text-sm"
              >
                <div className="flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>INSERIMENTO MANUALE</span>
                </div>
              </button>
            </div>
          )}
          
          {filteredSubmissions.length === 0 && submissions.length > 0 && (
            <div className="text-center text-ice-blue/60 font-mono py-8">
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Nessun risultato per i filtri selezionati</p>
              <button 
                onClick={() => {setFilterTeam(''); setSearchTerm('');}}
                className="mt-4 px-4 py-2 bg-ice-blue/20 border border-ice-blue/50 text-ice-blue rounded-lg hover:bg-ice-blue/30 transition-colors font-mono text-sm"
              >
                Cancella filtri
              </button>
            </div>
          )}
        </div>
      </GlassPanel>

      {/* Photo Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <GlassPanel className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-ice-blue" />
                  <span>FOTO SOTTOMISSIONE</span>
                </h3>
                <button
                  onClick={() => setShowPhotoModal(false)}
                  className="text-ice-blue/60 hover:text-ice-blue transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPhotos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg border border-ice-blue/30"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-sm px-3 py-1 rounded font-mono">
                      FOTO {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>
      )}
    </>
  );
}