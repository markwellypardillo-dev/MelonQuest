/**
 * Retro Pixel Art Title Screen for MelonQuest.
 * Inspired by the layout, composition, and presentation of the Super Mario Odyssey menu,
 * completely reimagined with a 16-bit/8-bit pixel art aesthetic.
 * Strict zero-emoji policy applied.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { audio } from '../game/soundEffects';

import { GameSettings } from '../game/settings';

interface TitleScreenProps {
  onStart: () => void;
  onOpenGuidebook: () => void;
  onInstallClick: () => void;
  onOpenSettings?: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  settings?: GameSettings;
  onUpdateSetting?: <K extends keyof GameSettings>(key: K, val: GameSettings[K]) => void;
  isOverlayOpen?: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenGuidebook,
  onInstallClick,
  onOpenSettings,
  isInstallable: _isInstallable,
  isInstalled,
  settings: _settings,
  onUpdateSetting: _onUpdateSetting,
  isOverlayOpen = false,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showInMenuSettings, setShowInMenuSettings] = useState(false);
  const [showExitNotice, setShowExitNotice] = useState(false);
  const [isMuted, setIsMuted] = useState(audio.getIsMuted());

  const handleToggleMute = useCallback(() => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
    audio.playMenuClick();
  }, []);

  const menuOptions = [
    {
      id: 'start',
      label: 'START RESEARCH',
      action: () => {
        audio.playSuccessFanfare();
        onStart();
      },
    },
    {
      id: 'guidebook',
      label: 'Farming Guidebook',
      action: () => {
        audio.playMenuClick();
        onOpenGuidebook();
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      action: () => {
        audio.playMenuClick();
        if (onOpenSettings) {
          onOpenSettings();
        } else {
          setShowInMenuSettings(true);
        }
      },
    },
    {
      id: 'install',
      label: isInstalled ? 'Game Installed' : 'Install Game',
      action: () => {
        audio.playMenuClick();
        onInstallClick();
      },
    },
    {
      id: 'exit',
      label: 'Exit',
      action: () => {
        audio.playMenuClick();
        setShowExitNotice(true);
      },
    },
  ];

  // Keyboard navigation
  useEffect(() => {
    if (isOverlayOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showInMenuSettings || showExitNotice) {
        if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          setShowInMenuSettings(false);
          setShowExitNotice(false);
          audio.playMenuClick();
        }
        return;
      }

      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev <= 0 ? menuOptions.length - 1 : prev - 1;
          audio.playMenuClick();
          return next;
        });
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev >= menuOptions.length - 1 ? 0 : prev + 1;
          audio.playMenuClick();
          return next;
        });
      } else if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        menuOptions[selectedIndex].action();
      } else if (e.code === 'KeyG') {
        e.preventDefault();
        audio.playMenuClick();
        onOpenGuidebook();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOverlayOpen, selectedIndex, showInMenuSettings, showExitNotice, menuOptions, onOpenGuidebook, handleToggleMute]);

  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-[#0d160e] text-[#e3f0d8] font-retro select-none pointer-events-auto flex flex-col justify-between">
      {/* 1. Crisp Pixelated Outdoor Virtual Farm Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <svg
          className="w-full h-full"
          viewBox="0 0 800 450"
          preserveAspectRatio="xMidYMid slice"
          shapeRendering="crispEdges"
        >
          {/* Hazy sky gradient blocks */}
          <rect x="0" y="0" width="800" height="90" fill="#93c3e6" />
          <rect x="0" y="90" width="800" height="70" fill="#a9d2ec" />
          <rect x="0" y="160" width="800" height="50" fill="#c4e2f0" />
          <rect x="0" y="210" width="800" height="40" fill="#e7f0d6" />

          {/* Distant mountains and treeline */}
          <polygon points="0,220 80,190 190,225 320,185 460,225 610,195 730,220 800,205 800,250 0,250" fill="#4d784a" />
          <polygon points="40,230 140,205 240,235 390,200 520,230 680,210 800,225 800,260 0,260" fill="#366034" />

          {/* Rich Dark-Brown Cultivated Soil Ground & Furrow Rows */}
          <rect x="0" y="250" width="800" height="200" fill="#3d2411" />

          {/* Row 1 (Stage 1: Seedling Row) */}
          <rect x="20" y="262" width="760" height="4" fill="#6b4423" />
          <rect x="20" y="266" width="760" height="16" fill="#462b15" />
          <rect x="20" y="270" width="760" height="8" fill="#2b180b" />
          <rect x="20" y="282" width="760" height="4" fill="#1a0e05" />
          {[90, 170, 250, 330, 410, 490, 570, 650, 720].map(sx => (
            <g key={`s1-${sx}`}>
              <rect x={sx - 4} y="274" width="10" height="3" fill="#140b04" />
              <rect x={sx} y="268" width="2" height="6" fill="#4ea33b" />
              <rect x={sx - 6} y="265" width="6" height="4" fill="#4ea33b" />
              <rect x={sx - 5} y="264" width="4" height="2" fill="#82d66b" />
              <rect x={sx + 2} y="265" width="6" height="4" fill="#4ea33b" />
              <rect x={sx + 3} y="264" width="4" height="2" fill="#82d66b" />
            </g>
          ))}

          {/* Row 2 (Stage 2: Vining & Bright Yellow Monoecious Flowers) */}
          <rect x="20" y="298" width="760" height="4" fill="#6b4423" />
          <rect x="20" y="302" width="760" height="20" fill="#462b15" />
          <rect x="20" y="307" width="760" height="10" fill="#2b180b" />
          <rect x="20" y="322" width="760" height="4" fill="#1a0e05" />
          <rect x="40" y="310" width="720" height="4" fill="#2b5e22" />
          <rect x="40" y="309" width="720" height="2" fill="#4f9142" />
          {[110, 220, 340, 450, 560, 680].map(vx => (
            <g key={`s2-${vx}`}>
              <rect x={vx - 14} y="301" width="12" height="8" fill="#1c4515" />
              <rect x={vx - 12} y="302" width="8" height="6" fill="#3c7a30" />
              <rect x={vx + 4} y="312" width="12" height="8" fill="#1c4515" />
              <rect x={vx + 6} y="313" width="8" height="6" fill="#3c7a30" />
              {/* Monoecious yellow flower */}
              <rect x={vx} y="303" width="6" height="6" fill="#ffe135" />
              <rect x={vx + 2} y="305" width="2" height="2" fill="#cc6600" />
            </g>
          ))}

          {/* Row 3 (Stage 3: Fruiting - Pale-green immature melons beneath large leaves) */}
          <rect x="20" y="340" width="760" height="4" fill="#6b4423" />
          <rect x="20" y="344" width="760" height="24" fill="#462b15" />
          <rect x="20" y="350" width="760" height="12" fill="#2b180b" />
          <rect x="20" y="368" width="760" height="4" fill="#1a0e05" />
          <rect x="35" y="354" width="730" height="4" fill="#234f1b" />
          {[130, 260, 390, 520, 650].map(fx => (
            <g key={`s3-${fx}`}>
              {/* Pale-green immature melon */}
              <rect x={fx} y="355" width="14" height="10" fill="#120903" />
              <rect x={fx} y="351" width="14" height="10" fill="#689e3c" />
              <rect x={fx + 2} y="352" width="10" height="8" fill="#8cc45a" />
              <rect x={fx + 3} y="352" width="5" height="3" fill="#c8f09b" />
              {/* Large textured overarching leaf */}
              <rect x={fx - 10} y="343" width="18" height="12" fill="#183d12" />
              <rect x={fx - 8} y="344" width="14" height="9" fill="#2d6323" />
              <rect x={fx - 5} y="346" width="8" height="3" fill="#5ca34e" />
            </g>
          ))}

          {/* Row 4 (Stage 4: Maturity - Large plump dark-and-light-green striped mature watermelons) */}
          <rect x="20" y="388" width="760" height="4" fill="#6b4423" />
          <rect x="20" y="392" width="760" height="28" fill="#462b15" />
          <rect x="20" y="398" width="760" height="14" fill="#2b180b" />
          <rect x="20" y="420" width="760" height="5" fill="#1a0e05" />
          <rect x="30" y="404" width="740" height="5" fill="#1b3d15" />
          {[100, 240, 380, 520, 660].map(mx => (
            <g key={`s4-${mx}`}>
              {/* Heavy shadow */}
              <rect x={mx - 2} y="410" width="28" height="8" fill="#100803" />
              {/* Plump mature striped melon */}
              <rect x={mx} y="392" width="24" height="20" fill="#113615" />
              <rect x={mx - 2} y="395" width="28" height="14" fill="#113615" />
              {/* Light-green longitudinal stripes */}
              <rect x={mx + 2} y="394" width="20" height="3" fill="#68b54e" />
              <rect x={mx} y="400" width="24" height="4" fill="#7ec962" />
              <rect x={mx + 2} y="407" width="20" height="3" fill="#5ca644" />
              {/* Specular highlight */}
              <rect x={mx + 4} y="394" width="6" height="2" fill="#c4f5ad" />
            </g>
          ))}
        </svg>
      </div>

      {/* Retro CRT overlay & subtle scanline grid */}
      <div className="absolute inset-0 crt-overlay pointer-events-none z-10" />

      {/* Main Foreground Container */}
      <div className="relative z-20 w-full flex-1 min-h-0 flex flex-col justify-center p-4 sm:p-8 md:p-10">
        {/* Top/Left Section: 3D Pixel Logo and Menu Options */}
        <div className="flex flex-col justify-center max-w-xl z-20">
          {/* Large Retro-style "MELONQUEST" Logo */}
          <div className="mb-6 sm:mb-8 animate-odyssey-slide">
            <div className="relative inline-block">
              {/* 3D Extrusion Shadow (Dark Red/Green) */}
              <div className="absolute top-1.5 left-1.5 font-pixel text-3xl sm:text-5xl md:text-6xl text-[#0e2413] tracking-widest flex items-center select-none">
                MEL<span className="inline-block w-8 sm:w-12 md:w-14 h-8 sm:h-12 md:h-14 mx-1"></span>NQUEST
              </div>
              <div className="absolute top-1 left-1 font-pixel text-3xl sm:text-5xl md:text-6xl text-[#962d22] tracking-widest flex items-center select-none">
                MEL<span className="inline-block w-8 sm:w-12 md:w-14 h-8 sm:h-12 md:h-14 mx-1"></span>NQUEST
              </div>

              {/* Foreground Logo with tiny pixel watermelon icon in place of "O" */}
              <div className="relative font-pixel text-3xl sm:text-5xl md:text-6xl text-[#ffffff] tracking-widest flex items-center drop-shadow-[0_4px_0_#1b4d24]">
                <span>MEL</span>
                {/* Tiny Pixel Watermelon Icon in place of "O" */}
                <span className="inline-flex items-center justify-center w-8 sm:w-12 md:w-14 h-8 sm:h-12 md:h-14 mx-1.5 align-middle">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 32 32"
                    shapeRendering="crispEdges"
                  >
                    {/* Dark green rind outline */}
                    <rect x="4" y="6" width="24" height="20" fill="#1b4d24" />
                    <rect x="6" y="4" width="20" height="24" fill="#1b4d24" />
                    <rect x="8" y="2" width="16" height="28" fill="#1b4d24" />
                    <rect x="2" y="8" width="28" height="16" fill="#1b4d24" />
                    {/* Light green rind stripes */}
                    <rect x="8" y="4" width="4" height="24" fill="#78b159" />
                    <rect x="16" y="4" width="4" height="24" fill="#78b159" />
                    <rect x="24" y="8" width="3" height="16" fill="#78b159" />
                    {/* Red sweet center core */}
                    <rect x="8" y="8" width="16" height="16" fill="#e74c3c" />
                    <rect x="10" y="6" width="12" height="20" fill="#ea4c4c" />
                    {/* Black seeds */}
                    <rect x="11" y="11" width="2" height="2" fill="#111111" />
                    <rect x="19" y="11" width="2" height="2" fill="#111111" />
                    <rect x="15" y="15" width="2" height="2" fill="#111111" />
                    <rect x="11" y="19" width="2" height="2" fill="#111111" />
                    <rect x="19" y="19" width="2" height="2" fill="#111111" />
                    {/* White highlight gleam */}
                    <rect x="9" y="7" width="2" height="2" fill="#ffffff" />
                  </svg>
                </span>
                <span>NQUEST</span>
              </div>
            </div>

            {/* Subtitle Bar */}
            <div className="mt-2 flex items-center gap-2">
              <span className="font-pixel text-[8px] sm:text-[10px] text-[#f1c40f] bg-[#1a2f1c]/90 px-2.5 py-1 border border-[#2d5a32] tracking-wider uppercase shadow-md">
                COMMERCIAL WATERMELON AGRONOMY · CITRULLUS LANATUS
              </span>
            </div>
          </div>

          {/* Vertical, Left-Aligned Menu of Interactive Options */}
          <div className="space-y-3 sm:space-y-4 max-w-sm sm:max-w-md">
            {menuOptions.map((opt, idx) => {
              const isSelected = selectedIndex === idx;

              if (isSelected) {
                // Primary/Selected option: Prominent, slanted white pixel banner with dark red/black text & red cap icon
                return (
                  <div
                    key={opt.id}
                    className="relative animate-odyssey-slide"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <button
                      onClick={opt.action}
                      className="w-full pixel-slant-banner bg-[#f5f6fa] hover:bg-[#ffffff] px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between cursor-pointer transition-all duration-100 group shadow-2xl"
                    >
                      <div className="flex items-center gap-3">
                        {/* Tiny Red Research Assistant Cap Icon with Animated Eyes */}
                        <span className="inline-block w-6 sm:w-7 h-5 sm:h-6 shrink-0">
                          <svg
                            viewBox="0 0 24 20"
                            className="w-full h-full"
                            shapeRendering="crispEdges"
                          >
                            {/* Red Cap Crown */}
                            <rect x="4" y="6" width="16" height="8" fill="#d63031" />
                            <rect x="2" y="12" width="20" height="4" fill="#c0392b" />
                            <rect x="0" y="14" width="12" height="3" fill="#962d22" /> {/* Visor */}
                            {/* Gold Assistant Cap Emblem */}
                            <rect x="10" y="10" width="4" height="3" fill="#f1c40f" />
                            {/* Two Animated Eyes on Top of Cap (Cappy style) */}
                            <g className="animate-cap-blink">
                              {/* Left eye */}
                              <rect x="6" y="2" width="5" height="5" fill="#ffffff" />
                              <rect x="7" y="3" width="3" height="3" fill="#2980b9" />
                              <rect x="8" y="4" width="2" height="2" fill="#111111" />
                              <rect x="7" y="3" width="1" height="1" fill="#ffffff" />
                              {/* Right eye */}
                              <rect x="13" y="2" width="5" height="5" fill="#ffffff" />
                              <rect x="14" y="3" width="3" height="3" fill="#2980b9" />
                              <rect x="15" y="4" width="2" height="2" fill="#111111" />
                              <rect x="14" y="3" width="1" height="1" fill="#ffffff" />
                            </g>
                          </svg>
                        </span>

                        <span className="font-pixel text-xs sm:text-sm md:text-base font-bold text-[#801515] tracking-wider uppercase">
                          {opt.label}
                        </span>
                      </div>

                      <span className="font-pixel text-[10px] text-[#b83b2e] tracking-tight group-hover:translate-x-1 transition-transform">
                        [SELECT]
                      </span>
                    </button>
                  </div>
                );
              }

              // Unselected menu options cascading downward in white with dark outlines
              return (
                <div
                  key={opt.id}
                  className="relative pl-6 sm:pl-8 animate-odyssey-slide"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <button
                    onClick={opt.action}
                    onMouseEnter={() => {
                      if (selectedIndex !== idx) {
                        setSelectedIndex(idx);
                        audio.playMenuClick();
                      }
                    }}
                    className="pixel-slant-unselected font-pixel text-xs sm:text-sm md:text-base text-white hover:text-[#f0c54d] tracking-wider cursor-pointer text-left transition-colors duration-100 flex items-center gap-3 py-1"
                  >
                    <span className="opacity-0 group-hover:opacity-100 text-[#f0c54d]">►</span>
                    <span>{opt.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* In-Menu Settings Modal Overlay (Heavy Dark-Metallic Frame Studded with Rivets) */}
      {showInMenuSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-retro select-none animate-odyssey-fade">
          <div className="w-full max-w-lg pixel-metal-frame p-5 sm:p-6 relative shadow-2xl animate-odyssey-slide">
            {/* Silver/Steel Corner Rivets */}
            <div className="absolute top-2 left-2 w-3.5 h-3.5 bg-[#bdc3c7] border-2 border-[#2c3e50] flex items-center justify-center shadow-sm">
              <div className="w-1 h-1 bg-[#1a252f]" />
            </div>
            <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-[#bdc3c7] border-2 border-[#2c3e50] flex items-center justify-center shadow-sm">
              <div className="w-1 h-1 bg-[#1a252f]" />
            </div>
            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 bg-[#bdc3c7] border-2 border-[#2c3e50] flex items-center justify-center shadow-sm">
              <div className="w-1 h-1 bg-[#1a252f]" />
            </div>
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 bg-[#bdc3c7] border-2 border-[#2c3e50] flex items-center justify-center shadow-sm">
              <div className="w-1 h-1 bg-[#1a252f]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b-3 border-[#34495e] pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#1b2631] border-2 border-[#5dade2] flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" shapeRendering="crispEdges">
                    <rect x="2" y="7" width="20" height="11" rx="2" fill="#34495e" />
                    <rect x="4" y="9" width="6" height="3" fill="#ecf0f1" />
                    <rect x="5.5" y="7.5" width="3" height="6" fill="#ecf0f1" />
                    <circle cx="16" cy="10" r="1.5" fill="#e74c3c" />
                    <circle cx="19" cy="12" r="1.5" fill="#f1c40f" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-pixel text-xs sm:text-sm text-[#f1c40f] tracking-wide drop-shadow-[2px_2px_0px_#000000]">
                    STATION HARDWARE SETTINGS
                  </h2>
                  <p className="text-[11px] text-[#bdc3c7] font-bold">
                    16-Bit Audio Synthesizer &amp; Control Mapping
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  audio.playMenuClick();
                  setShowInMenuSettings(false);
                }}
                className="pixel-btn px-2.5 py-0.5 font-pixel text-xs text-white bg-[#7f1d1d] hover:bg-[#991b1b] border-2 border-[#ef4444]"
              >
                [X]
              </button>
            </div>

            {/* Animated Equalizer Waveform Visualizer */}
            <div className="bg-[#0f1418] border-3 border-[#2c3e50] p-2.5 mb-4 shadow-inner">
              <div className="flex items-center justify-between font-pixel text-[8px] text-[#5dade2] mb-1.5 border-b border-[#1b2631] pb-1">
                <span>PROCEDURAL WEB AUDIO SYNTHESIZER</span>
                <span className={isMuted ? 'text-[#e74c3c]' : 'text-[#2ecc71]'}>
                  {isMuted ? 'MUTED' : 'ACTIVE'}
                </span>
              </div>
              <div className="h-8 flex items-end justify-between gap-1.5 px-2">
                {[5, 8, 4, 9, 7, 3, 10, 6, 8, 4].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      height: isMuted ? '3px' : `${h * 2.8}px`,
                      animation: isMuted ? 'none' : `characterBob ${0.5 + (i % 3) * 0.2}s infinite ease-in-out`,
                    }}
                    className={`w-full ${
                      isMuted ? 'bg-[#374151]' : i % 2 === 0 ? 'bg-[#e67e22]' : 'bg-[#f1c40f]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 3D Chunky Buttons */}
            <div className="space-y-2.5 mb-4">
              <button
                onClick={handleToggleMute}
                className="w-full pixel-hanging-sign bg-gradient-to-b from-[#e67e22] to-[#d35400] hover:from-[#f39c12] hover:to-[#e67e22] border-3 border-[#7e2d00] p-2.5 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <span className="font-pixel text-[8px] text-[#ffe6cc] block uppercase">TOGGLE AUDIO [M]</span>
                  <span className="font-pixel text-xs text-white font-bold drop-shadow-[1px_1px_0px_#000000]">
                    AUDIO SYNTHESIZER
                  </span>
                </div>
                <span className="font-pixel text-[9px] bg-black/40 px-2 py-1 text-white border border-white/20">
                  {isMuted ? 'MUTED' : 'ACTIVE'}
                </span>
              </button>

              <button
                onClick={() => audio.playSuccessFanfare()}
                className="w-full pixel-hanging-sign bg-gradient-to-b from-[#2980b9] to-[#1f618d] hover:from-[#3498db] hover:to-[#2980b9] border-3 border-[#154360] py-2 px-3 font-pixel text-xs text-white font-bold text-center cursor-pointer"
              >
                TEST AUDIO SYNTHESIZER FANFARE
              </button>
            </div>

            {/* Yellow-and-White Pixel Fonts Shortcuts */}
            <div className="bg-[#151c22] border-3 border-[#2c3e50] p-3 text-xs shadow-md mb-4">
              <div className="font-pixel text-[9px] text-[#f1c40f] border-b border-[#2c3e50] pb-1 mb-2">
                KEYBOARD &amp; GAMEPAD MAPPINGS:
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
                <div><span className="font-pixel text-[9px] text-[#f1c40f]">WASD / ARROWS:</span> <span className="font-bold text-white">Move</span></div>
                <div><span className="font-pixel text-[9px] text-[#f1c40f]">SPACE / [E]:</span> <span className="font-bold text-white">Interact</span></div>
                <div><span className="font-pixel text-[9px] text-[#f1c40f]">[G] KEY:</span> <span className="font-bold text-white">Guidebook</span></div>
                <div><span className="font-pixel text-[9px] text-[#f1c40f]">[M] KEY:</span> <span className="font-bold text-white">Sound</span></div>
              </div>
            </div>

            {/* Bright Green Chunky Button */}
            <button
              onClick={() => {
                audio.playMenuClick();
                setShowInMenuSettings(false);
              }}
              className="w-full pixel-hanging-sign bg-gradient-to-b from-[#27ae60] to-[#1e8449] hover:from-[#2ecc71] hover:to-[#27ae60] border-3 border-[#145a32] py-2.5 font-pixel text-xs text-white font-bold text-center cursor-pointer"
            >
              RETURN TO TITLE [ESC]
            </button>
          </div>
        </div>
      )}

      {/* Exit Simulation Confirmation Notice */}
      {showExitNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-retro select-none animate-odyssey-fade">
          <div className="w-full max-w-md bg-[#1a0f0f] text-[#f2d7d5] pixel-border p-6 border-4 border-[#e74c3c] text-center">
            <h2 className="font-pixel text-base text-[#f0c54d] tracking-wide mb-3">
              STANDBY MODE
            </h2>
            <p className="text-xs sm:text-sm text-[#e0cfcf] mb-5 leading-relaxed">
              Research field simulation is in standby. You may close your browser tab or click below to return to the research station.
            </p>
            <button
              onClick={() => {
                audio.playMenuClick();
                setShowExitNotice(false);
              }}
              className="pixel-btn pixel-btn-action px-6 py-2.5 font-pixel text-xs text-white"
            >
              RETURN TO MENU
            </button>
          </div>
        </div>
      )}

      {/* Thick, Pixelated Yellow and Brown Border/Bar Running Along the Very Bottom */}
      <div className="relative z-30 w-full border-t-4 border-[#8e6822] bg-[#f0c54d] text-[#3d2606] shadow-2xl py-2 px-4 sm:px-8 flex flex-wrap items-center justify-between font-pixel text-[8px] sm:text-[9px] tracking-wider select-none">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="bg-[#3d2606] text-[#f0c54d] px-1 py-0.5">[▲/▼ or W/S]</span> SELECT
          </span>
          <span className="flex items-center gap-1.5 font-bold">
            <span className="bg-[#3d2606] text-[#f0c54d] px-1 py-0.5">[ENTER/SPACE]</span> CONFIRM
          </span>
          <span className="flex items-center gap-1.5 font-bold">
            <span className="bg-[#3d2606] text-[#f0c54d] px-1 py-0.5">[G]</span> GUIDEBOOK
          </span>
          <span className="flex items-center gap-1.5 font-bold">
            <span className="bg-[#3d2606] text-[#f0c54d] px-1 py-0.5">[M]</span> AUDIO
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3 font-bold text-[#4a2c0c]">
          <span>CITRULLUS LANATUS AGRONOMY</span>
        </div>
      </div>
    </div>
  );
};
