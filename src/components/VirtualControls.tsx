/**
 * Retro Pixel Virtual Controls for Mobile and Tablet viewports in MelonQuest.
 * Strict zero-emoji policy applied.
 */

import React from 'react';
import { audio } from '../game/soundEffects';

interface VirtualControlsProps {
  onDirectionChange: (x: number, y: number) => void;
  onActionA: () => void;
  onActionB: () => void;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  onDirectionChange,
  onActionA,
  onActionB,
}) => {
  const setDirection = (x: number, y: number) => {
    onDirectionChange(x, y);
  };

  const clearDirection = () => {
    onDirectionChange(0, 0);
  };

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-30 flex justify-between items-end pointer-events-none select-none font-retro">
      {/* Retro D-Pad */}
      <div className="w-36 h-36 relative pointer-events-auto bg-[#0a120b]/80 border-2 border-[#2b4c2e] p-1">
        {/* Up */}
        <button
          onTouchStart={() => setDirection(0, -1)}
          onTouchEnd={clearDirection}
          onMouseDown={() => setDirection(0, -1)}
          onMouseUp={clearDirection}
          className="absolute top-1 left-12 w-12 h-11 bg-[#1a301e] active:bg-[#2e5935] border border-[#3b663f] flex items-center justify-center font-pixel text-xs text-[#ffffff]"
          aria-label="Move Up"
        >
          UP
        </button>

        {/* Down */}
        <button
          onTouchStart={() => setDirection(0, 1)}
          onTouchEnd={clearDirection}
          onMouseDown={() => setDirection(0, 1)}
          onMouseUp={clearDirection}
          className="absolute bottom-1 left-12 w-12 h-11 bg-[#1a301e] active:bg-[#2e5935] border border-[#3b663f] flex items-center justify-center font-pixel text-xs text-[#ffffff]"
          aria-label="Move Down"
        >
          DN
        </button>

        {/* Left */}
        <button
          onTouchStart={() => setDirection(-1, 0)}
          onTouchEnd={clearDirection}
          onMouseDown={() => setDirection(-1, 0)}
          onMouseUp={clearDirection}
          className="absolute left-1 top-12 w-11 h-12 bg-[#1a301e] active:bg-[#2e5935] border border-[#3b663f] flex items-center justify-center font-pixel text-xs text-[#ffffff]"
          aria-label="Move Left"
        >
          LT
        </button>

        {/* Right */}
        <button
          onTouchStart={() => setDirection(1, 0)}
          onTouchEnd={clearDirection}
          onMouseDown={() => setDirection(1, 0)}
          onMouseUp={clearDirection}
          className="absolute right-1 top-12 w-11 h-12 bg-[#1a301e] active:bg-[#2e5935] border border-[#3b663f] flex items-center justify-center font-pixel text-xs text-[#ffffff]"
          aria-label="Move Right"
        >
          RT
        </button>

        {/* Center pivot */}
        <div className="absolute top-12 left-12 w-12 h-12 bg-[#0e1c10] border border-[#233d26]" />
      </div>

      {/* Action Buttons A & B */}
      <div className="flex gap-3 pointer-events-auto items-end pb-2">
        {/* Button B: Guidebook */}
        <div className="flex flex-col items-center gap-1">
          <button
            onTouchStart={() => {
              audio.playMenuClick();
              onActionB();
            }}
            onClick={() => {
              audio.playMenuClick();
              onActionB();
            }}
            className="w-14 h-14 bg-[#1b3d22] active:bg-[#285731] border-2 border-[#3c7845] rounded-none flex items-center justify-center font-pixel text-sm text-[#f0c54d] shadow-lg"
            aria-label="Guidebook"
          >
            B
          </button>
          <span className="font-pixel text-[9px] text-[#86b582]">GUIDE</span>
        </div>

        {/* Button A: Action / Interact */}
        <div className="flex flex-col items-center gap-1">
          <button
            onTouchStart={() => {
              audio.playMenuClick();
              onActionA();
            }}
            onClick={() => {
              audio.playMenuClick();
              onActionA();
            }}
            className="w-16 h-16 bg-[#a83828] active:bg-[#c44331] border-2 border-[#d84c37] rounded-none flex items-center justify-center font-pixel text-base text-white shadow-xl"
            aria-label="Action"
          >
            A
          </button>
          <span className="font-pixel text-[9px] text-[#f0c54d]">ACTION</span>
        </div>
      </div>
    </div>
  );
};
