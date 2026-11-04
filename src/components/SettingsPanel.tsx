/**
 * Odyssey-styled Hardware and Performance Settings Component.
 * Strict zero-emoji policy applied.
 */

import React from 'react';
import { GameSettings, DetailLevel, ParticleQuality, TouchControlMode } from '../game/settings';
import { audio } from '../game/soundEffects';

interface SettingsPanelProps {
  settings: GameSettings;
  onUpdate: <K extends keyof GameSettings>(key: K, val: GameSettings[K]) => void;
  onClose?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdate,
}) => {
  const handleDetail = (lvl: DetailLevel) => {
    audio.playMenuClick();
    onUpdate('detailLevel', lvl);
  };

  const handleParticles = (q: ParticleQuality) => {
    audio.playMenuClick();
    onUpdate('particleQuality', q);
  };

  const handleScanlines = (enabled: boolean) => {
    audio.playMenuClick();
    onUpdate('crtScanlines', enabled);
  };

  const handleVolume = (vol: number) => {
    audio.playMenuClick();
    onUpdate('volume', vol);
    audio.setVolume(vol);
    if (vol === 0) {
      onUpdate('isAudioMuted', true);
      audio.setMuted(true);
    } else if (settings.isAudioMuted) {
      onUpdate('isAudioMuted', false);
      audio.setMuted(false);
    }
  };

  const handleTouch = (mode: TouchControlMode) => {
    audio.playMenuClick();
    onUpdate('touchControls', mode);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/70 rounded-xl p-4 sm:p-5 text-sm space-y-4 font-sans text-slate-200 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E52521]" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-100">
            HARDWARE & RENDERING CALIBRATION
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 uppercase">
          PERFORMANCE TUNING
        </span>
      </div>

      {/* 1. Rendering Detail Level */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-300">GPU Rendering Detail:</span>
          <span className="font-mono text-[11px] text-[#E52521] uppercase font-bold">
            [{settings.detailLevel}]
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['high', 'balanced', 'performance'] as DetailLevel[]).map((lvl) => {
            const isActive = settings.detailLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => handleDetail(lvl)}
                className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E52521] text-white shadow-md shadow-red-500/20 ring-1 ring-red-400/50'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50'
                }`}
              >
                {lvl === 'performance' ? 'PERF (FAST)' : lvl}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400">
          {settings.detailLevel === 'high' && 'Full 60 FPS, pre-rendered GPU blit, high-fidelity overlays.'}
          {settings.detailLevel === 'balanced' && 'Optimized pre-rendered tilemap, balanced particle budget.'}
          {settings.detailLevel === 'performance' && 'Max frame stability on lower-spec mobile devices.'}
        </p>
      </div>

      {/* 2. Weather Particle System */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-300">Atmospheric Weather Particles:</span>
          <span className="font-mono text-[11px] text-[#E52521] uppercase font-bold">
            [{settings.particleQuality}]
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['ultra', 'reduced', 'off'] as ParticleQuality[]).map((q) => {
            const isActive = settings.particleQuality === q;
            return (
              <button
                key={q}
                onClick={() => handleParticles(q)}
                className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E52521] text-white shadow-md shadow-red-500/20 ring-1 ring-red-400/50'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50'
                }`}
              >
                {q}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. CRT Scanline Filter */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-300">CRT Retro Display Filter:</span>
          <span className="font-mono text-[11px] text-[#E52521] uppercase font-bold">
            {settings.crtScanlines ? '[ON]' : '[OFF]'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleScanlines(true)}
            className={`py-2 px-3 rounded-lg text-xs font-bold tracking-wider transition-all cursor-pointer ${
              settings.crtScanlines
                ? 'bg-[#E52521] text-white shadow-md shadow-red-500/20 ring-1 ring-red-400/50'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50'
            }`}
          >
            ENABLED
          </button>
          <button
            onClick={() => handleScanlines(false)}
            className={`py-2 px-3 rounded-lg text-xs font-bold tracking-wider transition-all cursor-pointer ${
              !settings.crtScanlines
                ? 'bg-[#E52521] text-white shadow-md shadow-red-500/20 ring-1 ring-red-400/50'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50'
            }`}
          >
            DISABLED
          </button>
        </div>
      </div>

      {/* 4. Synthesizer Master Volume */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-300">Synthesizer Master Volume:</span>
          <span className="font-mono text-[11px] text-[#E52521] uppercase font-bold">
            {settings.isAudioMuted ? '[MUTED]' : `[${settings.volume}%]`}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[100, 75, 50, 0].map((vol) => {
            const isMatch = (!settings.isAudioMuted && settings.volume === vol) || (vol === 0 && settings.isAudioMuted);
            return (
              <button
                key={vol}
                onClick={() => handleVolume(vol)}
                className={`py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all cursor-pointer ${
                  isMatch
                    ? 'bg-[#E52521] text-white shadow-md shadow-red-500/20 ring-1 ring-red-400/50'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50'
                }`}
              >
                {vol === 0 ? 'MUTE' : `${vol}%`}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Virtual On-Screen Controls */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-300">Virtual Touch D-Pad:</span>
          <span className="font-mono text-[11px] text-[#E52521] uppercase font-bold">
            [{settings.touchControls}]
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['auto', 'always', 'hidden'] as TouchControlMode[]).map((mode) => {
            const isActive = settings.touchControls === mode;
            return (
              <button
                key={mode}
                onClick={() => handleTouch(mode)}
                className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E52521] text-white shadow-md shadow-red-500/20 ring-1 ring-red-400/50'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50'
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
