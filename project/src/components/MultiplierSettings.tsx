import React, { useState } from 'react';
import { Settings, Save, RotateCcw } from 'lucide-react';
import GlassPanel from './GlassPanel';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface MultiplierSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_MULTIPLIERS = {
  1: 2.0, 2: 1.8, 3: 1.8, 4: 1.6, 5: 1.6, 6: 1.6,
  7: 1.4, 8: 1.4, 9: 1.4, 10: 1.4, 11: 1.0, 12: 1.0,
  13: 1.0, 14: 1.0, 15: 1.0, 16: 1.0, 17: 1.0, 18: 1.0,
  19: 1.0, 20: 1.0
};

export default function MultiplierSettings({ isOpen, onClose }: MultiplierSettingsProps) {
  const [multipliers, setMultipliers] = useLocalStorage('multipliers', DEFAULT_MULTIPLIERS);
  const [tempMultipliers, setTempMultipliers] = useState(multipliers);

  const handleSave = () => {
    setMultipliers(tempMultipliers);
    onClose();
  };

  const handleReset = () => {
    setTempMultipliers(DEFAULT_MULTIPLIERS);
  };

  const updateMultiplier = (position: number, value: number) => {
    setTempMultipliers(prev => ({
      ...prev,
      [position]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassPanel className="w-full max-w-4xl max-h-[80vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white font-mono flex items-center space-x-2">
            <Settings className="w-6 h-6 text-ice-blue" />
            <span>MOLTIPLICATORI PUNTEGGIO</span>
          </h2>
          <button
            onClick={onClose}
            className="text-ice-blue/60 hover:text-ice-blue transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Object.entries(tempMultipliers).map(([position, multiplier]) => (
            <div key={position} className="p-4 bg-black/20 border border-ice-blue/20 rounded-lg">
              <label className="block text-ice-blue mb-2 font-mono text-sm">
                {position}° POSTO
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={multiplier}
                onChange={(e) => updateMultiplier(Number(position), Number(e.target.value))}
                className="w-full px-3 py-2 bg-black/30 border border-ice-blue/40 rounded-lg text-white font-mono text-center focus:outline-none focus:border-ice-blue"
              />
              <div className="text-center text-ice-blue/60 text-xs mt-1 font-mono">
                x{multiplier}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between space-x-4">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-6 py-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors font-mono"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET DEFAULT</span>
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-500/20 border border-gray-500/50 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-colors font-mono"
            >
              ANNULLA
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(161,224,255,0.5)] hover:scale-105 transition-all duration-300 font-mono"
            >
              <Save className="w-4 h-4" />
              <span>SALVA</span>
            </button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}