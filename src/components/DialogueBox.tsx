/**
 * Retro RPG Dialogue Box for MelonQuest.
 * 16-Bit Decorated Wood-Texture Dialogue Frame:
 * - Rich wood-grain border with brass corner studs and shadow
 * - High-contrast, expressive pixel portrait of Professor Citrullus in a straw hat (and other speakers)
 * - Rich warm interior with high-contrast readable text
 * - Authentic typewriter sound and skipping support
 * Strict zero-emoji policy applied.
 */

import React, { useEffect, useState } from 'react';
import { audio } from '../game/soundEffects';

interface DialogueBoxProps {
  speakerName: string;
  speakerRole: string;
  text: string;
  onAdvance: () => void;
  onClose?: () => void;
  actionLabel?: string;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  speakerName,
  speakerRole,
  text,
  onAdvance,
  onClose,
  actionLabel = 'CONTINUE [E]',
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let currentIdx = 0;
    setDisplayedText('');
    setIsTyping(true);

    const interval = setInterval(() => {
      if (currentIdx < text.length) {
        setDisplayedText(text.slice(0, currentIdx + 1));
        if (currentIdx % 2 === 0) {
          audio.playDialogueTick();
        }
        currentIdx++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [text]);

  const handleBoxClick = () => {
    if (isTyping) {
      setDisplayedText(text);
      setIsTyping(false);
    } else {
      audio.playMenuClick();
      onAdvance();
    }
  };

  // Render high-contrast expressive pixel portrait based on speaker
  const renderSpeakerPortrait = () => {
    const nameLower = speakerName.toLowerCase();

    if (nameLower.includes('citrullus') || nameLower.includes('professor')) {
      // High-contrast, expressive pixel portrait of Professor Citrullus in a straw hat
      return (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 shrink-0" viewBox="0 0 32 32" shapeRendering="crispEdges">
          {/* Straw Hat Crown & Ribbon */}
          <rect x="10" y="2" width="12" height="6" fill="#f1c40f" />
          <rect x="12" y="2" width="8" height="2" fill="#f39c12" />
          <rect x="10" y="6" width="12" height="2" fill="#1b5e20" /> {/* Green ribbon */}
          {/* Wide Straw Hat Brim */}
          <rect x="4" y="8" width="24" height="4" fill="#f1c40f" />
          <rect x="2" y="9" width="28" height="2" fill="#d4ac0d" />
          <rect x="6" y="11" width="20" height="1" fill="#b7950b" /> {/* Brim shadow */}

          {/* Face & Hair */}
          <rect x="9" y="11" width="14" height="12" fill="#f5cba7" />
          <rect x="7" y="11" width="2" height="6" fill="#bdc3c7" /> {/* Gray sideburns */}
          <rect x="23" y="11" width="2" height="6" fill="#bdc3c7" />

          {/* Wire-Rim Spectacles */}
          <rect x="10" y="13" width="5" height="4" fill="none" stroke="#2c3e50" strokeWidth="1" />
          <rect x="17" y="13" width="5" height="4" fill="none" stroke="#2c3e50" strokeWidth="1" />
          <rect x="15" y="14" width="2" height="1" fill="#2c3e50" /> {/* Bridge */}
          <rect x="11" y="14" width="2" height="2" fill="#ffffff" /> {/* Lens gleam */}
          <rect x="18" y="14" width="2" height="2" fill="#ffffff" />

          {/* Eyes behind spectacles */}
          <rect x="12" y="15" width="2" height="2" fill="#111111" />
          <rect x="19" y="15" width="2" height="2" fill="#111111" />

          {/* Nose */}
          <rect x="15" y="16" width="2" height="3" fill="#e59866" />

          {/* Bushy Gray Mustache */}
          <rect x="11" y="19" width="10" height="3" fill="#ecf0f1" />
          <rect x="10" y="20" width="12" height="2" fill="#bdc3c7" />

          {/* Animated Talking Mouth */}
          {isTyping ? (
            <rect x="14" y="22" width="4" height="2" fill="#78281f" />
          ) : (
            <rect x="15" y="22" width="2" height="1" fill="#78281f" />
          )}

          {/* Collar & Field Jacket */}
          <rect x="7" y="24" width="18" height="8" fill="#27ae60" />
          <rect x="12" y="24" width="8" height="8" fill="#e8f8f5" />
          <rect x="15" y="25" width="2" height="7" fill="#c0392b" /> {/* Researcher tie */}
        </svg>
      );
    } else if (nameLower.includes('rosa')) {
      // Dr. Rosa: Sun hat and soil sampling loupe
      return (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 shrink-0" viewBox="0 0 32 32" shapeRendering="crispEdges">
          <rect x="8" y="4" width="16" height="6" fill="#8d6e63" />
          <rect x="4" y="8" width="24" height="3" fill="#a1887f" />
          <rect x="9" y="10" width="14" height="12" fill="#f5cba7" />
          <rect x="8" y="11" width="3" height="8" fill="#4e342e" />
          <rect x="21" y="11" width="3" height="8" fill="#4e342e" />
          <rect x="11" y="14" width="3" height="3" fill="#111111" />
          <rect x="18" y="14" width="3" height="3" fill="#111111" />
          <rect x="13" y="20" width="6" height="2" fill="#c0392b" />
          <rect x="6" y="24" width="20" height="8" fill="#e67e22" />
        </svg>
      );
    } else if (nameLower.includes('maya')) {
      // Dr. Maya: Safety goggles & lab coat
      return (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 shrink-0" viewBox="0 0 32 32" shapeRendering="crispEdges">
          <rect x="9" y="4" width="14" height="7" fill="#1b1b1b" />
          <rect x="9" y="10" width="14" height="12" fill="#f5cba7" />
          <rect x="8" y="12" width="16" height="5" fill="#26a69a" />
          <rect x="11" y="13" width="4" height="3" fill="#ffffff" />
          <rect x="17" y="13" width="4" height="3" fill="#ffffff" />
          <rect x="13" y="19" width="6" height="2" fill="#c2185b" />
          <rect x="6" y="24" width="20" height="8" fill="#ffffff" />
        </svg>
      );
    } else if (nameLower.includes('valve') || nameLower.includes('canal')) {
      // Southern Canal Valve
      return (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 shrink-0" viewBox="0 0 32 32" shapeRendering="crispEdges">
          <rect x="10" y="4" width="12" height="4" fill="#c0392b" /> {/* Handwheel */}
          <rect x="14" y="8" width="4" height="8" fill="#b7950b" /> {/* Stem */}
          <rect x="8" y="16" width="16" height="10" fill="#f39c12" /> {/* Brass body */}
          <circle cx="16" cy="21" r="4" fill="#ffffff" /> {/* Gauge */}
          <rect x="15" y="19" width="2" height="3" fill="#c0392b" /> {/* Needle */}
          <rect x="4" y="20" width="24" height="6" fill="#7f8c8d" /> {/* Pipe */}
        </svg>
      );
    } else {
      // Field Bio-Spray Rig
      return (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 shrink-0" viewBox="0 0 32 32" shapeRendering="crispEdges">
          <rect x="8" y="6" width="16" height="18" fill="#27ae60" /> {/* Tank */}
          <rect x="12" y="3" width="8" height="4" fill="#95a5a6" /> {/* Cap */}
          <rect x="22" y="8" width="4" height="14" fill="#7f8c8d" /> {/* Spray wand */}
          <rect x="24" y="4" width="2" height="4" fill="#f1c40f" /> {/* Nozzle */}
          <rect x="6" y="22" width="6" height="6" fill="#34495e" /> {/* Wheels */}
          <rect x="20" y="22" width="6" height="6" fill="#34495e" />
        </svg>
      );
    }
  };

  return (
    <div className="fixed bottom-3 sm:bottom-5 left-3 sm:left-6 right-3 sm:right-6 z-40 flex justify-center pointer-events-auto font-retro select-none animate-odyssey-fade">
      {/* Decorated Wood-Texture Dialogue Frame with Corner Brass Studs */}
      <div
        onClick={handleBoxClick}
        className="relative w-full max-w-4xl pixel-wood-frame p-3 sm:p-5 shadow-2xl cursor-pointer"
      >
        {/* Brass Corner Studs */}
        <div className="absolute top-1.5 left-1.5 w-3 h-3 bg-[#f1c40f] border border-[#7a4d28] shadow-sm flex items-center justify-center">
          <div className="w-1 h-1 bg-[#4a2e13]" />
        </div>
        <div className="absolute top-1.5 right-1.5 w-3 h-3 bg-[#f1c40f] border border-[#7a4d28] shadow-sm flex items-center justify-center">
          <div className="w-1 h-1 bg-[#4a2e13]" />
        </div>
        <div className="absolute bottom-1.5 left-1.5 w-3 h-3 bg-[#f1c40f] border border-[#7a4d28] shadow-sm flex items-center justify-center">
          <div className="w-1 h-1 bg-[#4a2e13]" />
        </div>
        <div className="absolute bottom-1.5 right-1.5 w-3 h-3 bg-[#f1c40f] border border-[#7a4d28] shadow-sm flex items-center justify-center">
          <div className="w-1 h-1 bg-[#4a2e13]" />
        </div>

        <div className="flex gap-3 sm:gap-4 items-start">
          {/* Portrait Inset Panel */}
          <div className="bg-[#1b1007] border-3 border-[#d49b28] p-1 shadow-inner shrink-0">
            {renderSpeakerPortrait()}
          </div>

          {/* Dialogue Body & Speaker Details */}
          <div className="flex-1 min-w-0">
            {/* Speaker Name Banner */}
            <div className="flex items-center justify-between border-b-2 border-[#7a4d28] pb-1 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-pixel text-xs sm:text-sm text-[#f1c40f] tracking-wide drop-shadow-[1px_1px_0px_#000000]">
                  {speakerName.toUpperCase()}
                </span>
                <span className="text-xs text-[#d7be9f] font-bold">| {speakerRole}</span>
              </div>
              {onClose && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    audio.playMenuClick();
                    onClose();
                  }}
                  className="font-pixel text-[9px] text-[#f1948a] hover:text-white px-2 py-0.5"
                >
                  [X] DISMISS
                </button>
              )}
            </div>

            {/* High-Contrast Dialogue Text */}
            <div className="min-h-[58px] sm:min-h-[66px] text-sm sm:text-base leading-relaxed tracking-wide text-[#ffffff] font-bold drop-shadow-[1px_1px_0px_#000000]">
              {displayedText}
              {isTyping && <span className="inline-block w-2.5 h-4 bg-[#f1c40f] ml-1 animate-pulse" />}
            </div>

            {/* Action Prompt */}
            <div className="flex justify-end pt-1">
              <span className="font-pixel text-[9px] sm:text-[10px] text-[#3d2606] bg-[#f0c54d] hover:bg-[#ffe599] border-2 border-[#7a4d28] px-3 py-1 shadow-md font-bold">
                {isTyping ? 'CLICK TO SKIP ►' : `${actionLabel} ►`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
