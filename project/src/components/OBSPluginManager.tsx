import React, { useState, useEffect } from 'react';
import { Monitor, Copy, Eye, Settings, Tv, Link, QrCode, Download, Palette, RefreshCw, ExternalLink } from 'lucide-react';
import GlassPanel from './GlassPanel';
import StreamingOverlay from './StreamingOverlay';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { Tournament } from '../types';

interface OBSPluginManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OBSPluginManager({ isOpen, onClose }: OBSPluginManagerProps) {
  const [tournaments] = useRealTimeData<Record<string, Tournament>>('tournaments', {});
  const [selectedTournament, setSelectedTournament] = useState('');
  const [overlayType, setOverlayType] = useState<'leaderboard' | 'compact' | 'minimal' | 'full'>('leaderboard');
  const [theme, setTheme] = useState<'dark' | 'light' | 'transparent'>('dark');
  const [showLogos, setShowLogos] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [refreshRate, setRefreshRate] = useState(5000);
  const [generatedUrls, setGeneratedUrls] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const activeTournaments = Object.values(tournaments).filter(t => t.status === 'active');

  const generateStreamingUrl = (tournamentId: string, config: any) => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      tournament: tournamentId,
      overlay: config.overlayType,
      theme: config.theme,
      logos: config.showLogos.toString(),
      stats: config.showStats.toString(),
      refresh: config.refreshRate.toString()
    });
    
    return `${baseUrl}/stream?${params.toString()}`;
  };

  const generateOBSUrl = () => {
    if (!selectedTournament) return;

    const config = {
      overlayType,
      theme,
      showLogos,
      showStats,
      refreshRate
    };

    const url = generateStreamingUrl(selectedTournament, config);
    setGeneratedUrls(prev => ({
      ...prev,
      [selectedTournament]: url
    }));
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadOBSConfig = () => {
    if (!selectedTournament) return;

    const tournament = tournaments[selectedTournament];
    const url = generatedUrls[selectedTournament];
    
    const obsConfig = {
      obs_websocket_version: "5.0.0",
      scene_collection: {
        name: `Warzone_${tournament.name}`,
        scenes: [
          {
            name: "Tournament_Stream",
            sources: [
              {
                name: "Tournament_Overlay",
                type: "browser_source",
                settings: {
                  url: url,
                  width: overlayType === 'minimal' ? 250 : overlayType === 'compact' ? 350 : 600,
                  height: overlayType === 'minimal' ? 100 : overlayType === 'compact' ? 400 : 500,
                  fps: 30,
                  shutdown: false,
                  restart_when_active: false,
                  css: `
                    body { 
                      margin: 0; 
                      background-color: transparent; 
                      overflow: hidden;
                    }
                  `
                }
              }
            ]
          }
        ]
      }
    };

    const blob = new Blob([JSON.stringify(obsConfig, null, 2)], { type: 'application/json' });
    const url_download = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url_download;
    a.download = `warzone_${tournament.name.toLowerCase().replace(/\s+/g, '_')}_obs_config.json`;
    a.click();
    URL.revokeObjectURL(url_download);
  };

  const generateQRCode = (url: string) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    return qrUrl;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <GlassPanel className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white font-mono flex items-center space-x-2">
              <Tv className="w-6 h-6 text-ice-blue" />
              <span>OBS STREAMING PLUGIN</span>
            </h2>
            <button
              onClick={onClose}
              className="text-ice-blue/60 hover:text-ice-blue transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-4 font-mono">CONFIGURAZIONE OVERLAY</h3>
                
                {/* Tournament Selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-ice-blue mb-2 font-mono text-sm">Seleziona Torneo</label>
                    <select
                      value={selectedTournament}
                      onChange={(e) => setSelectedTournament(e.target.value)}
                      className="w-full px-4 py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono"
                    >
                      <option value="">-- Scegli un torneo --</option>
                      {activeTournaments.map((tournament) => (
                        <option key={tournament.id} value={tournament.id}>
                          {tournament.name} ({tournament.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Overlay Type */}
                  <div>
                    <label className="block text-ice-blue mb-2 font-mono text-sm">Tipo Overlay</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'minimal', label: 'Minimale', desc: '200x100px' },
                        { value: 'compact', label: 'Compatto', desc: '350x400px' },
                        { value: 'leaderboard', label: 'Classifica', desc: '500x600px' },
                        { value: 'full', label: 'Completo', desc: '600x500px' }
                      ].map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setOverlayType(type.value as any)}
                          className={`p-3 rounded-lg border font-mono text-sm transition-all ${
                            overlayType === type.value
                              ? 'bg-ice-blue/20 border-ice-blue/50 text-ice-blue'
                              : 'bg-black/20 border-ice-blue/20 text-ice-blue/60 hover:bg-ice-blue/10'
                          }`}
                        >
                          <div className="font-bold">{type.label}</div>
                          <div className="text-xs opacity-60">{type.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme */}
                  <div>
                    <label className="block text-ice-blue mb-2 font-mono text-sm">Tema</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'dark', label: 'Scuro', color: 'bg-black' },
                        { value: 'light', label: 'Chiaro', color: 'bg-white' },
                        { value: 'transparent', label: 'Trasparente', color: 'bg-transparent border-2 border-dashed' }
                      ].map((themeOption) => (
                        <button
                          key={themeOption.value}
                          onClick={() => setTheme(themeOption.value as any)}
                          className={`p-3 rounded-lg border font-mono text-sm transition-all ${
                            theme === themeOption.value
                              ? 'bg-ice-blue/20 border-ice-blue/50 text-ice-blue'
                              : 'bg-black/20 border-ice-blue/20 text-ice-blue/60 hover:bg-ice-blue/10'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded mx-auto mb-1 ${themeOption.color}`}></div>
                          <div className="text-xs">{themeOption.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-ice-blue font-mono text-sm">Mostra Loghi</span>
                      <button
                        onClick={() => setShowLogos(!showLogos)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          showLogos ? 'bg-ice-blue' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          showLogos ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-ice-blue font-mono text-sm">Mostra Statistiche</span>
                      <button
                        onClick={() => setShowStats(!showStats)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          showStats ? 'bg-ice-blue' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          showStats ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </button>
                    </div>

                    <div>
                      <label className="block text-ice-blue mb-2 font-mono text-sm">
                        Frequenza Aggiornamento: {refreshRate/1000}s
                      </label>
                      <input
                        type="range"
                        min="1000"
                        max="30000"
                        step="1000"
                        value={refreshRate}
                        onChange={(e) => setRefreshRate(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <button
                    onClick={generateOBSUrl}
                    disabled={!selectedTournament}
                    className="w-full py-3 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(161,224,255,0.5)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Link className="w-4 h-4" />
                      <span>GENERA URL STREAMING</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Generated URLs */}
              {selectedTournament && generatedUrls[selectedTournament] && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 font-mono">URL GENERATI</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-black/20 border border-ice-blue/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-ice-blue font-mono text-sm">URL Browser Source</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => copyToClipboard(generatedUrls[selectedTournament], 'url')}
                            className="flex items-center space-x-1 px-3 py-1 bg-ice-blue/20 border border-ice-blue/50 text-ice-blue rounded text-sm font-mono hover:bg-ice-blue/30 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copied === 'url' ? 'COPIATO!' : 'COPIA'}</span>
                          </button>
                          <button
                            onClick={() => window.open(generatedUrls[selectedTournament], '_blank')}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded text-sm font-mono hover:bg-blue-500/30 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>APRI</span>
                          </button>
                        </div>
                      </div>
                      <div className="text-white font-mono text-xs break-all bg-black/30 p-2 rounded">
                        {generatedUrls[selectedTournament]}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={downloadOBSConfig}
                        className="flex items-center justify-center space-x-2 py-3 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-mono"
                      >
                        <Download className="w-4 h-4" />
                        <span>SCARICA CONFIG OBS</span>
                      </button>
                      
                      <div className="text-center">
                        <div className="text-ice-blue font-mono text-sm mb-2">QR Code</div>
                        <img 
                          src={generateQRCode(generatedUrls[selectedTournament])} 
                          alt="QR Code"
                          className="mx-auto rounded border border-ice-blue/30"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 font-mono">ANTEPRIMA OVERLAY</h3>
              
              <div className="border border-ice-blue/30 rounded-lg p-4 bg-black/10 min-h-[400px] flex items-center justify-center">
                {selectedTournament ? (
                  <div className="transform scale-75 origin-top-left">
                    <StreamingOverlay
                      tournamentId={selectedTournament}
                      overlayType={overlayType}
                      theme={theme}
                      showLogos={showLogos}
                      showStats={showStats}
                      refreshRate={refreshRate}
                    />
                  </div>
                ) : (
                  <div className="text-center text-ice-blue/60">
                    <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Seleziona un torneo per vedere l'anteprima</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-6 bg-black/20 border border-ice-blue/20 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-4 font-mono">ISTRUZIONI OBS</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-ice-blue font-mono font-bold mb-2">Setup Manuale:</h4>
                <ol className="text-sm text-ice-blue/80 font-mono space-y-1">
                  <li>1. Apri OBS Studio</li>
                  <li>2. Aggiungi "Browser Source"</li>
                  <li>3. Incolla l'URL generato</li>
                  <li>4. Imposta dimensioni consigliate</li>
                  <li>5. Abilita "Shutdown source when not visible"</li>
                  <li>6. Abilita "Refresh browser when scene becomes active"</li>
                </ol>
              </div>
              
              <div>
                <h4 className="text-ice-blue font-mono font-bold mb-2">Setup Automatico:</h4>
                <ol className="text-sm text-ice-blue/80 font-mono space-y-1">
                  <li>1. Scarica il file di configurazione</li>
                  <li>2. Apri OBS Studio</li>
                  <li>3. Scene Collection → Import</li>
                  <li>4. Seleziona il file scaricato</li>
                  <li>5. Attiva la scena "Tournament_Stream"</li>
                </ol>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start space-x-2">
                <Settings className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-yellow-400 font-mono text-sm">
                  <div className="font-bold mb-1">Dimensioni Consigliate:</div>
                  <div>• Minimale: 250x100px (angolo schermo)</div>
                  <div>• Compatto: 350x400px (pannello laterale)</div>
                  <div>• Classifica: 500x600px (overlay centrale)</div>
                  <div>• Completo: 600x500px (schermo intero)</div>
                </div>
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}