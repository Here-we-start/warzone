import React, { useState } from 'react';
import { AlertTriangle, Upload, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import GlassPanel from './GlassPanel';
import PhotoUpload from './PhotoUpload';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { CrashReport } from '../types';

interface CrashReportUploadProps {
  teamCode: string;
  teamName: string;
  tournamentId: string;
}

export default function CrashReportUpload({ teamCode, teamName, tournamentId }: CrashReportUploadProps) {
  const [crashReports, setCrashReports] = useRealTimeData<CrashReport[]>('crashReports', []);
  const [photo, setPhoto] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const teamCrashReports = crashReports.filter(report => 
    report.teamCode === teamCode && report.tournamentId === tournamentId
  );

  const submitCrashReport = async () => {
    if (photo.length === 0 || !description.trim()) return;

    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));

    const newReport: CrashReport = {
      id: `crash-${teamCode}-${Date.now()}`,
      teamCode,
      teamName,
      photo: photo[0],
      description: description.trim(),
      submittedAt: Date.now(),
      status: 'pending',
      tournamentId
    };

    setCrashReports(prev => [...prev, newReport]);
    setPhoto([]);
    setDescription('');
    setIsSubmitting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'approved':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'rejected':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
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
      {/* Submit New Crash Report */}
      <GlassPanel className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 font-mono flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
          <span>SEGNALA CRASH</span>
        </h3>

        <div className="space-y-3 sm:space-y-4">
          <PhotoUpload
            photos={photo}
            onPhotosChange={setPhoto}
            maxPhotos={1}
            required={true}
          />

          <div>
            <label className="block text-ice-blue mb-2 font-mono text-sm">Descrizione Crash</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi cosa è successo durante il crash..."
              rows={3}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white placeholder-ice-blue/60 focus:outline-none focus:border-ice-blue font-mono text-sm sm:text-base resize-none"
              disabled={isSubmitting}
            />
          </div>

          <button
            onClick={submitCrashReport}
            disabled={photo.length === 0 || !description.trim() || isSubmitting}
            className="w-full py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none font-mono relative overflow-hidden text-sm sm:text-base"
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

      {/* Crash Reports History */}
      {teamCrashReports.length > 0 && (
        <GlassPanel className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 font-mono">
            CRONOLOGIA CRASH ({teamCrashReports.length})
          </h3>
          
          <div className="space-y-3">
            {teamCrashReports
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
                         report.status === 'approved' ? 'APPROVATO' : 'RIFIUTATO'}
                      </span>
                    </div>
                    <div className="text-xs font-mono opacity-60">
                      {formatTime(report.submittedAt)}
                    </div>
                  </div>
                  
                  <div className="text-sm font-mono mb-2 bg-black/20 rounded p-2">
                    "{report.description}"
                  </div>
                  
                  {report.compensation && (
                    <div className="text-green-400 font-mono text-sm">
                      Compenso: +{report.compensation} punti
                    </div>
                  )}
                </div>
              ))}
          </div>
        </GlassPanel>
      )}
    </div>
  );
}