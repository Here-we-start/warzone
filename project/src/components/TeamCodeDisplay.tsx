import React, { useState } from 'react';
import { Copy, Check, Key } from 'lucide-react';
import GlassPanel from './GlassPanel';

interface TeamCodeDisplayProps {
  teamName: string;
  teamCode: string;
  onClose: () => void;
}

export default function TeamCodeDisplay({ teamName, teamCode, onClose }: TeamCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(teamCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassPanel className="w-full max-w-md p-8 text-center animate-fade-in-up">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-ice-blue/20 to-ice-blue-dark/20 mb-4 relative">
            <Key className="w-8 h-8 text-ice-blue" />
            <div className="absolute inset-0 rounded-full bg-ice-blue/10 animate-ping" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 font-mono">
            TEAM REGISTRATO 
          </h2>
          <p className="text-ice-blue/80 font-mono">
            Codice generato per: <span className="text-white font-bold">{teamName}</span>
          </p>
        </div>

        <div className="mb-6">
          <div className="p-6 bg-black/30 border-2 border-ice-blue/50 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-ice-blue/5 to-transparent animate-shimmer" /> 
            <div className="text-3xl font-bold text-ice-blue font-mono tracking-wider mb-2">
              {teamCode}
            </div>
            <div className="text-ice-blue/60 text-sm font-mono">
              CODICE ACCESSO TEAM
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <button
            onClick={copyToClipboard}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(161,224,255,0.5)] hover:scale-105 transition-all duration-300 font-mono"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                <span>COPIATO!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>COPIA CODICE</span>
              </>
            )}
          </button>

          <div className="text-sm text-ice-blue/60 font-mono bg-black/20 rounded-lg p-4">
            <div className="mb-2 text-ice-blue font-bold">ISTRUZIONI:</div>
            <div>1. Condividi questo codice con il team</div>
            <div>2. Il team userà questo codice per accedere</div>
            <div>3. Il codice è valido fino alla fine del torneo</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-500/20 border border-gray-500/50 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-colors font-mono"
        >
          CHIUDI
        </button>
      </GlassPanel>
    </div>
  );
}