/**
 * Pause Menu and Settings Modal for MelonQuest.
 * 16-Bit Professional RPG Redesign:
 * - Grand Red-and-Gold "PAUSE" banner
 * - Large, embossed brown and gold pixel blocks with hover highlights (glowing gold arrows ► ... ◄)
 * - Separate colorful pixel-art icon button faces for each choice (controller, book, speaker, gamepad, install arrow)
 * - Heavy dark-metallic Settings Menu studded with rivets, chunky colored buttons (deep orange, bright green),
 *   yellow-and-white pixel shortcut fonts, animated audio waveform, and pixel controller icon.
 * Strict zero-emoji policy applied.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { audio } from '../game/soundEffects';

import { GameSettings } from '../game/settings';

interface PauseSettingsModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenGuidebook: () => void;
  onOpenProgression?: () => void;
  onInstallClick: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  settings?: GameSettings;
  onUpdateSetting?: <K extends keyof GameSettings>(key: K, val: GameSettings[K]) => void;
}

interface MenuOption {
  id: string;
  label: string;
  secondaryLabel?: string;
  description: string;
  action: () => void;
  iconType: 'play' | 'book' | 'speaker' | 'gamepad' | 'install' | 'hazard';
  isDestructive?: boolean;
}

export const PauseSettingsModal: React.FC<PauseSettingsModalProps> = ({
  onResume,
  onRestart,
  onOpenGuidebook,
  onOpenProgression,
  onInstallClick,
  isInstallable: _isInstallable,
  isInstalled,
  settings: _settings,
  onUpdateSetting: _onUpdateSetting,
}) => {
  const [isMuted, setIsMuted] = useState(audio.getIsMuted());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSettingsView, setShowSettingsView] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleToggleMute = useCallback(() => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
    audio.playMenuClick();
  }, []);

  // Assemble menu options list
  const options: MenuOption[] = useMemo(() => {
    const list: MenuOption[] = [
      {
        id: 'resume',
        label: 'RESUME SIMULATION',
        secondaryLabel: '[ESC]',
        description: 'Return directly to active agronomic fieldwork without delay.',
        action: () => {
          audio.playMenuClick();
          onResume();
        },
        iconType: 'play',
      },
      {
        id: 'guidebook',
        label: 'FARMING GUIDEBOOK',
        secondaryLabel: '[G]',
        description: 'Examine illustrated field manuals on botany, soil pH, irrigation, IPM, and harvest Brix.',
        action: () => {
          audio.playMenuClick();
          onOpenGuidebook();
        },
        iconType: 'book',
      },
      ...(onOpenProgression
        ? [
            {
              id: 'progression',
              label: 'BADGES, RANKS & SUS SURVEY',
              secondaryLabel: '[B]',
              description: 'Inspect collectible achievement badges, researcher rankings, and System Usability Scale (SUS).',
              action: () => {
                audio.playMenuClick();
                onOpenProgression();
              },
              iconType: 'book' as const,
            },
          ]
        : []),
      {
        id: 'audio',
        label: 'AUDIO SYNTHESIZER',
        secondaryLabel: isMuted ? '[MUTED]' : '[ACTIVE]',
        description: 'Toggle procedural Web Audio sound synthesis and acoustic thump tests.',
        action: handleToggleMute,
        iconType: 'speaker',
      },
      {
        id: 'settings',
        label: 'SETTINGS & CONTROLS',
        secondaryLabel: '[VIEW]',
        description: 'Open the heavy metallic hardware panel to inspect gamepad shortcuts and sound equalizer.',
        action: () => {
          audio.playMenuClick();
          setShowSettingsView(true);
        },
        iconType: 'gamepad',
      },
    ];

    if (!isInstalled) {
      list.push({
        id: 'install',
        label: 'INSTALL GAME TO DEVICE',
        secondaryLabel: '[PWA]',
        description: 'Install MelonQuest as a native Progressive Web App for offline field trials.',
        action: () => {
          audio.playMenuClick();
          onInstallClick();
        },
        iconType: 'install',
      });
    }

    list.push({
      id: 'restart',
      label: 'RESET PROGRESS TO PHASE 1',
      secondaryLabel: '[RESET]',
      description: 'Reset all plot preparation, soil core samples, and quest data to initial state.',
      action: () => {
        audio.playMenuClick();
        setShowConfirmReset(true);
      },
      iconType: 'hazard',
      isDestructive: true,
    });

    return list;
  }, [isMuted, isInstalled, handleToggleMute, onResume, onOpenGuidebook, onOpenProgression, onInstallClick]);

  // Keyboard navigation within the menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showConfirmReset) {
        if (e.code === 'Escape' || e.code === 'KeyN') {
          e.preventDefault();
          setShowConfirmReset(false);
          audio.playMenuClick();
        } else if (e.code === 'Enter' || e.code === 'KeyY') {
          e.preventDefault();
          setShowConfirmReset(false);
          audio.playToolSound();
          onRestart();
        }
        return;
      }

      if (showSettingsView) {
        if (e.code === 'Escape' || e.code === 'Backspace') {
          e.preventDefault();
          setShowSettingsView(false);
          audio.playMenuClick();
        } else if (e.code === 'KeyM') {
          e.preventDefault();
          handleToggleMute();
        }
        return;
      }

      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev <= 0 ? options.length - 1 : prev - 1;
          audio.playMenuClick();
          return next;
        });
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev >= options.length - 1 ? 0 : prev + 1;
          audio.playMenuClick();
          return next;
        });
      } else if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        const active = options[selectedIndex];
        if (active) {
          active.action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [options, selectedIndex, showConfirmReset, showSettingsView, onRestart, handleToggleMute]);

  const activeOption = options[selectedIndex] || options[0];

  // Helper to render small colorful pixel-art icons on separate button faces
  const renderOptionIcon = (type: MenuOption['iconType']) => {
    switch (type) {
      case 'play':
        return (
          <div className="w-8 h-8 bg-[#27ae60] border-2 border-[#a9dfbf] flex items-center justify-center shadow-inner shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 16 16" shapeRendering="crispEdges">
              <polygon points="4,2 14,8 4,14" fill="#ffffff" />
            </svg>
          </div>
        );
      case 'book':
        return (
          <div className="w-8 h-8 bg-[#d4ac0d] border-2 border-[#f9e79f] flex items-center justify-center shadow-inner shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 16 16" shapeRendering="crispEdges">
              <rect x="2" y="2" width="12" height="12" fill="#784212" />
              <rect x="4" y="3" width="8" height="10" fill="#fcf3cf" />
              <rect x="8" y="2" width="1" height="12" fill="#5b2c6f" /> {/* Ribbon */}
            </svg>
          </div>
        );
      case 'speaker':
        return (
          <div className="w-8 h-8 bg-[#d35400] border-2 border-[#f8c471] flex items-center justify-center shadow-inner shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 16 16" shapeRendering="crispEdges">
              <rect x="2" y="5" width="4" height="6" fill="#ffffff" />
              <polygon points="6,5 11,2 11,14 6,11" fill="#ffffff" />
              <rect x="13" y="4" width="1" height="8" fill="#f8c471" />
              <rect x="15" y="2" width="1" height="12" fill="#f8c471" />
            </svg>
          </div>
        );
      case 'gamepad':
        return (
          <div className="w-8 h-8 bg-[#2980b9] border-2 border-[#aed6f1] flex items-center justify-center shadow-inner shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 16 16" shapeRendering="crispEdges">
              <rect x="2" y="5" width="12" height="7" rx="1" fill="#1b4f72" />
              <rect x="4" y="7" width="4" height="3" fill="#ecf0f1" /> {/* D-Pad */}
              <rect x="11" y="7" width="2" height="2" fill="#e74c3c" /> {/* Button */}
            </svg>
          </div>
        );
      case 'install':
        return (
          <div className="w-8 h-8 bg-[#8e44ad] border-2 border-[#d2b4de] flex items-center justify-center shadow-inner shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 16 16" shapeRendering="crispEdges">
              <rect x="7" y="2" width="2" height="7" fill="#ffffff" />
              <polygon points="5,8 11,8 8,11" fill="#ffffff" />
              <rect x="3" y="12" width="10" height="2" fill="#ffffff" />
            </svg>
          </div>
        );
      case 'hazard':
      default:
        return (
          <div className="w-8 h-8 bg-[#c0392b] border-2 border-[#f5b7b1] flex items-center justify-center shadow-inner shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 16 16" shapeRendering="crispEdges">
              <polygon points="8,2 15,14 1,14" fill="#f1c40f" />
              <rect x="7" y="6" width="2" height="4" fill="#111111" />
              <rect x="7" y="11" width="2" height="2" fill="#111111" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-retro select-none animate-odyssey-fade">
      {/* SCREEN 3: The Settings Menu (Heavy dark-metallic frame studded with rivets) */}
      {showSettingsView ? (
        <div className="w-full max-w-xl pixel-metal-frame p-5 sm:p-7 relative shadow-2xl animate-odyssey-slide">
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
          <div className="flex items-center justify-between border-b-3 border-[#34495e] pb-3 mb-5">
            <div className="flex items-center gap-3">
              {/* Controller Icon */}
              <div className="w-9 h-9 bg-[#1b2631] border-2 border-[#5dade2] flex items-center justify-center shadow-md">
                <svg className="w-6 h-6" viewBox="0 0 24 24" shapeRendering="crispEdges">
                  <rect x="2" y="7" width="20" height="11" rx="2" fill="#34495e" />
                  <rect x="4" y="9" width="6" height="3" fill="#ecf0f1" />
                  <rect x="5.5" y="7.5" width="3" height="6" fill="#ecf0f1" />
                  <circle cx="16" cy="10" r="1.5" fill="#e74c3c" />
                  <circle cx="19" cy="12" r="1.5" fill="#f1c40f" />
                  <circle cx="14" cy="13" r="1.5" fill="#2ecc71" />
                </svg>
              </div>
              <div>
                <h2 className="font-pixel text-sm sm:text-base text-[#f1c40f] tracking-wide drop-shadow-[2px_2px_0px_#000000]">
                  STATION HARDWARE SETTINGS
                </h2>
                <p className="text-xs text-[#bdc3c7] font-bold">
                  Agronomic Simulator Audio &amp; Input Console
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                audio.playMenuClick();
                setShowSettingsView(false);
              }}
              className="pixel-btn px-3 py-1 font-pixel text-xs text-white bg-[#7f1d1d] hover:bg-[#991b1b] border-2 border-[#ef4444]"
            >
              [X] BACK
            </button>
          </div>

          {/* Animated Pixelated Audio Waveform Visualizer */}
          <div className="bg-[#0f1418] border-3 border-[#2c3e50] p-3 mb-5 shadow-inner">
            <div className="flex items-center justify-between font-pixel text-[9px] text-[#5dade2] mb-2 border-b border-[#1b2631] pb-1">
              <span>PROCEDURAL WEB AUDIO SYNTHESIZER</span>
              <span className={isMuted ? 'text-[#e74c3c]' : 'text-[#2ecc71]'}>
                {isMuted ? 'OUTPUT: MUTED' : 'OUTPUT: ACTIVE (44.1 kHz)'}
              </span>
            </div>
            {/* Animated Equalizer Waveform Bars */}
            <div className="h-10 flex items-end justify-between gap-1.5 px-2">
              {[4, 9, 6, 8, 3, 7, 10, 5, 8, 6, 4, 7].map((height, idx) => (
                <div
                  key={idx}
                  style={{
                    height: isMuted ? '4px' : `${(height * 3.5)}px`,
                    animation: isMuted ? 'none' : `characterBob ${0.5 + (idx % 4) * 0.2}s infinite ease-in-out`,
                  }}
                  className={`w-full transition-all ${
                    isMuted
                      ? 'bg-[#374151]'
                      : idx % 3 === 0
                      ? 'bg-[#e67e22]'
                      : idx % 2 === 0
                      ? 'bg-[#f1c40f]'
                      : 'bg-[#2ecc71]'
                  } shadow-sm`}
                />
              ))}
            </div>
          </div>

          {/* 3D Chunky Colored Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {/* Deep Orange Button for Audio Synthesizer */}
            <button
              onClick={handleToggleMute}
              className="pixel-hanging-sign bg-gradient-to-b from-[#e67e22] to-[#d35400] hover:from-[#f39c12] hover:to-[#e67e22] border-3 border-[#7e2d00] p-3 text-left shadow-lg cursor-pointer flex items-center justify-between"
            >
              <div>
                <span className="font-pixel text-[8px] text-[#ffe6cc] block uppercase">TOGGLE AUDIO [M]</span>
                <span className="font-pixel text-xs text-white font-bold drop-shadow-[1px_1px_0px_#000000]">
                  AUDIO SYNTHESIZER
                </span>
              </div>
              <span className="font-pixel text-[10px] bg-black/40 px-2 py-1 text-white border border-white/20">
                {isMuted ? 'MUTED' : 'ACTIVE'}
              </span>
            </button>

            {/* Test Fanfare Audio Button */}
            <button
              onClick={() => audio.playSuccessFanfare()}
              className="pixel-hanging-sign bg-gradient-to-b from-[#2980b9] to-[#1f618d] hover:from-[#3498db] hover:to-[#2980b9] border-3 border-[#154360] p-3 text-left shadow-lg cursor-pointer"
            >
              <span className="font-pixel text-[8px] text-[#d4e6f1] block uppercase">AUDIO TEST</span>
              <span className="font-pixel text-xs text-white font-bold drop-shadow-[1px_1px_0px_#000000]">
                TEST SYNTHESIZER FANFARE
              </span>
            </button>
          </div>

          {/* Controller Shortcut Information in Highly Legible Yellow-and-White Pixel Fonts */}
          <div className="bg-[#151c22] border-3 border-[#2c3e50] p-4 shadow-md mb-5">
            <div className="font-pixel text-[10px] text-[#f1c40f] border-b border-[#2c3e50] pb-1.5 mb-2.5 flex items-center justify-between">
              <span>CONTROLLER &amp; KEYBOARD BINDINGS</span>
              <span className="text-[#ecf0f1]">STANDARD 16-BIT MAP</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="flex items-center justify-between bg-[#0f1418] p-2 border border-[#2c3e50]">
                <span className="font-pixel text-[9px] text-[#f1c40f]">WASD / ARROWS:</span>
                <span className="font-bold text-white">MOVE PLAYER</span>
              </div>
              <div className="flex items-center justify-between bg-[#0f1418] p-2 border border-[#2c3e50]">
                <span className="font-pixel text-[9px] text-[#f1c40f]">SPACE / [E]:</span>
                <span className="font-bold text-white">INTERACT / WORK</span>
              </div>
              <div className="flex items-center justify-between bg-[#0f1418] p-2 border border-[#2c3e50]">
                <span className="font-pixel text-[9px] text-[#f1c40f]">[G] KEY:</span>
                <span className="font-bold text-white">FIELD GUIDEBOOK</span>
              </div>
              <div className="flex items-center justify-between bg-[#0f1418] p-2 border border-[#2c3e50]">
                <span className="font-pixel text-[9px] text-[#f1c40f]">[M] KEY:</span>
                <span className="font-bold text-white">AUDIO SYNTH</span>
              </div>
              <div className="flex items-center justify-between bg-[#0f1418] p-2 border border-[#2c3e50]">
                <span className="font-pixel text-[9px] text-[#f1c40f]">[ESC] / [P]:</span>
                <span className="font-bold text-white">PAUSE MENU</span>
              </div>
              <div className="flex items-center justify-between bg-[#0f1418] p-2 border border-[#2c3e50]">
                <span className="font-pixel text-[9px] text-[#f1c40f]">TOUCH PAD:</span>
                <span className="font-bold text-white">VIRTUAL STICK</span>
              </div>
            </div>
          </div>

          {/* Bright Green Chunky Button for "Return to Title / Resume Simulation" */}
          <button
            onClick={() => {
              audio.playMenuClick();
              setShowSettingsView(false);
            }}
            className="w-full pixel-hanging-sign bg-gradient-to-b from-[#27ae60] to-[#1e8449] hover:from-[#2ecc71] hover:to-[#27ae60] border-3 border-[#145a32] py-3 text-center shadow-xl cursor-pointer font-pixel text-xs sm:text-sm text-white font-bold tracking-wider"
          >
            RETURN TO SIMULATION [ESC]
          </button>
        </div>
      ) : showConfirmReset ? (
        /* Reset Confirmation Screen */
        <div className="w-full max-w-md bg-[#2c1313] border-4 border-[#e74c3c] p-6 shadow-2xl animate-odyssey-slide text-center">
          <div className="font-pixel text-base text-[#f1c40f] tracking-wider mb-2">
            CONFIRM SIMULATION RESET?
          </div>
          <p className="text-sm text-[#f5cba7] mb-6 leading-relaxed max-w-md mx-auto font-bold">
            Resetting will clear all tilled ridges, soil tests, and active IPM data, returning to Phase 1: Land Preparation.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setShowConfirmReset(false);
                audio.playToolSound();
                onRestart();
              }}
              className="pixel-btn pixel-btn-action px-6 py-2.5 font-pixel text-xs tracking-wider text-white"
            >
              [Y] CONFIRM RESET
            </button>
            <button
              onClick={() => {
                setShowConfirmReset(false);
                audio.playMenuClick();
              }}
              className="pixel-btn px-6 py-2.5 font-pixel text-xs tracking-wider text-[#e3f0d8]"
            >
              [N] CANCEL
            </button>
          </div>
        </div>
      ) : (
        /* SCREEN 4: The Pause Menu Overlay Crowned with Grand Red-and-Gold PAUSE Banner */
        <div className="flex flex-col items-center max-w-xl w-full mx-auto my-auto animate-odyssey-slide">
          {/* Grand Red-and-Gold "PAUSE" Banner */}
          <div className="w-full relative mb-6">
            <div className="w-full bg-gradient-to-r from-[#962d22] via-[#c0392b] to-[#962d22] border-4 border-[#f1c40f] py-3.5 px-6 shadow-2xl text-center relative overflow-hidden">
              {/* Heraldic Gold Trim Lines */}
              <div className="absolute top-1 left-2 right-2 h-0.5 bg-[#f9e79f]" />
              <div className="absolute bottom-1 left-2 right-2 h-0.5 bg-[#f9e79f]" />
              <h1 className="font-pixel text-2xl sm:text-3xl text-white tracking-widest uppercase drop-shadow-[3px_3px_0px_#4a120e]">
                PAUSE
              </h1>
              <p className="font-pixel text-[8px] sm:text-[9px] text-[#f9e79f] tracking-wider uppercase mt-1">
                MELONQUEST AGRONOMY EXPERIMENT STATION
              </p>
            </div>
          </div>

          {/* Large, Embossed Brown and Gold Pixel Blocks with Hover Highlights & Indicator Arrows */}
          <div className="w-full space-y-3">
            {options.map((opt, idx) => {
              const isSelected = selectedIndex === idx;

              return (
                <div
                  key={opt.id}
                  style={{ animationDelay: `${idx * 45}ms` }}
                  className="animate-odyssey-slide"
                >
                  <button
                    onClick={opt.action}
                    onMouseEnter={() => {
                      if (selectedIndex !== idx) {
                        setSelectedIndex(idx);
                        audio.playMenuClick();
                      }
                    }}
                    className={`w-full pixel-embossed-gold p-2 sm:p-2.5 flex items-center justify-between cursor-pointer transition-all duration-100 ${
                      isSelected
                        ? 'translate-x-1 shadow-[0_0_18px_rgba(241,196,15,0.6)] border-[#ffffff]'
                        : 'opacity-90 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Left Glowing Gold Indicator Arrow */}
                      <span
                        className={`font-pixel text-xs sm:text-sm text-[#f1c40f] transition-opacity duration-150 ${
                          isSelected ? 'opacity-100 animate-pulse' : 'opacity-0'
                        }`}
                      >
                        ►
                      </span>

                      {/* Small colorful pixel-art icon on separate button face */}
                      {renderOptionIcon(opt.iconType)}

                      {/* Option Label */}
                      <span className="font-pixel text-xs sm:text-sm text-white font-bold tracking-wider drop-shadow-[2px_2px_0px_#000000]">
                        {opt.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {opt.secondaryLabel && (
                        <span className="font-pixel text-[9px] sm:text-[10px] text-[#ffe699] tracking-normal">
                          {opt.secondaryLabel}
                        </span>
                      )}

                      {/* Right Glowing Gold Indicator Arrow */}
                      <span
                        className={`font-pixel text-xs sm:text-sm text-[#f1c40f] transition-opacity duration-150 ${
                          isSelected ? 'opacity-100 animate-pulse' : 'opacity-0'
                        }`}
                      >
                        ◄
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Contextual Information Panel */}
          <div className="w-full mt-4 bg-[#1b1007]/90 border-3 border-[#7a4d28] p-3 text-xs text-[#f5cba7] font-bold shadow-lg text-center">
            <span className="font-pixel text-[9px] text-[#f1c40f] block mb-0.5 uppercase">
              {activeOption.label}
            </span>
            <span>{activeOption.description}</span>
          </div>
        </div>
      )}
    </div>
  );
};
