import React, { useState, useRef } from 'react';
import { Flag, Upload, X, Clock, CheckCircle, XCircle, Video } from 'lucide-react';
import GlassPanel from './GlassPanel';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { Report } from '../types';

interface ReportUploadProps {
  teamCode: string;
  teamName: string;
  tournamentId: string;
}

export default function ReportUpload({ teamCode, teamName, tournamentId }: ReportUploadProps) {
  const [reports, setReports] = useRealTimeData<Report[]>('reports', []);
  const [video, setVideo] = useState<string>('');
  const [reportedPlayer, setReportedPlayer] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const teamReports = reports.filter(report => 
    report.teamCode === teamCode && report.tournamentId === tournamentId
  );

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 40MB for ~40 seconds of video)
    if (file.size > 40 * 1024 * 1024) {
      alert('Il video deve essere massimo 40MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('video/')) {
      alert('Seleziona un file video valido');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setVideo(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const submitReport = async () => {
    if (!video || !reportedPlayer.trim() || !description.trim()) return;

    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));

    const newReport: Report = {
      id: `report-${teamCode}-${Date.now()}`,
      teamCode,
      teamName,
      reportedPlayer: reportedPlayer.trim(),
      video,
      description: description.trim(),
      submittedAt: Date.now(),
      status: 'pending',
      tournamentId
    };

    setReports(prev => [...prev, newReport]);
    setVideo('');
    setReportedPlayer('');
    setDescription('');
    setIsSubmitting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'reviewed':
        return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'reviewed':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'resolved':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      default:
        return 'text-ice-blue bg-ice-blue/10 border-ice-blue/30';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Submit New Report */}
      <GlassPanel className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 font-mono flex items-center space-x-2">
          <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
          <span>SEGNALA GIOCATORE</span>
        </h3>

        <div className="space-y-3 sm:space-y-4">
          {/* Video Upload */}
          <div>
            <label className="block text-ice-blue mb-2 font-mono text-sm">Video Prova (Max 40 sec)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
              disabled={isSubmitting}
            />
            
            {!video ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="w-full p-4 sm:p-6 border-2 border-dashed border-ice-blue/40 rounded-xl hover:border-ice-blue hover:bg-ice-blue/5 transition-all duration-300 text-center"
              >
                <Video className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 text-ice-blue" />
                <div className="text-ice-blue font-mono text-sm sm:text-base">
                  CARICA VIDEO PROVA
                </div>
                <div className="text-ice-blue/60 text-xs sm:text-sm font-mono mt-1">
                  Max 40MB • Formati: MP4, MOV, AVI
                </div>
              </button>
            ) : (
              <div className="relative">
                <video
                  src={video}
                  controls
                  className="w-full h-32 sm:h-48 object-cover rounded-lg border border-ice-blue/30"
                />
                <button
                  onClick={() => setVideo('')}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Reported Player */}
          <div>
            <label className="block text-ice-blue mb-2 font-mono text-sm">Nome Giocatore Segnalato</label>
            <input
              type="text"
              value={reportedPlayer}
              onChange={(e) => setReportedPlayer(e.target.value)}
              placeholder="Inserisci il nome del giocatore"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white placeholder-ice-blue/60 focus:outline-none focus:border-ice-blue font-mono text-sm sm:text-base"
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-ice-blue mb-2 font-mono text-sm">Descrizione Violazione</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi cosa ha fatto il giocatore segnalato..."
              rows={3}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white placeholder-ice-blue/60 focus:outline-none focus:border-ice-blue font-mono text-sm sm:text-base resize-none"
              disabled={isSubmitting}
            />
          </div>

          <button
            onClick={submitReport}
            disabled={!video || !reportedPlayer.trim() || !description.trim() || isSubmitting}
            className="w-full py-2 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none font-mono relative overflow-hidden text-sm sm:text-base"
          >
            {isSubmitting && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}
            <div className="flex items-center justify-center space-x-2">
              <Upload className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'INVIO IN CORSO...' : 'INVIA SEGNALAZIONE'}</span>
            </div>
          </button>
        </div>
      </GlassPanel>

      {/* Reports History */}
      {teamReports.length > 0 && (
        <GlassPanel className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 font-mono">
            CRONOLOGIA SEGNALAZIONI ({teamReports.length})
          </h3>
          
          <div className="space-y-3">
            {teamReports
              .sort((a, b) => b.submittedAt - a.submittedAt)
              .map((report) => (
                <div
                  key={report.id}
                  className={`p-3 sm:p-4 rounded-lg border animate-fade-in ${getStatusColor(report.status)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(report.status)}
                      <span className="font-mono font-bold text-sm sm:text-base">
                        {report.status === 'pending' ? 'IN ATTESA' :
                         report.status === 'reviewed' ? 'IN REVISIONE' : 'RISOLTO'}
                      </span>
                    </div>
                    <div className="text-xs font-mono opacity-60">
                      {formatTime(report.submittedAt)}
                    </div>
                  </div>
                  
                  <div className="text-sm font-mono mb-2">
                    <div className="text-ice-blue/80">Giocatore: <span className="text-white font-bold">{report.reportedPlayer}</span></div>
                  </div>
                  
                  <div className="text-sm font-mono bg-black/20 rounded p-2">
                    "{report.description}"
                  </div>
                </div>
              ))}
          </div>
        </GlassPanel>
      )}
    </div>
  );
}