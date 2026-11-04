/**
 * PWA Install Prompt Modal and Reminder System for MelonQuest.
 * Strict zero-emoji policy applied.
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { audio } from '../game/soundEffects';

interface PWAInstallModalProps {
  hook: ReturnType<typeof usePWAInstall>;
  forceOpen?: boolean;
  onClose?: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  hook,
  forceOpen = false,
  onClose,
}) => {
  const { isInstallable, isInstalled, isIOS, showInstallPrompt, isReminder, install, dismissPrompt } = hook;
  const [showIOSManual, setShowIOSManual] = useState(false);

  // If already installed, hide prompt
  if (isInstalled) return null;

  const shouldRender = forceOpen || showInstallPrompt;
  if (!shouldRender) return null;

  const handleInstallClick = async () => {
    audio.playMenuClick();
    if (isInstallable) {
      await install();
      if (onClose) onClose();
    } else if (isIOS) {
      setShowIOSManual(true);
    }
  };

  const handleDismiss = () => {
    audio.playMenuClick();
    dismissPrompt();
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 font-retro select-none">
      <div className="w-full max-w-md bg-[#121c13] text-[#e3f0d8] pixel-border p-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#2b4c2d] pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#f0c54d] inline-block" />
            <h3 className="font-pixel text-xs text-[#f0c54d] tracking-wide">
              {isReminder ? 'INSTALL REMINDER' : 'INSTALL MELONQUEST'}
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-xs text-[#9bb896] hover:text-white px-2 py-0.5"
            aria-label="Dismiss installation modal"
          >
            [X]
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-3 text-xs leading-relaxed mb-4">
          <p>
            {isReminder
              ? 'You have spent valuable time conducting agronomic research. Install MelonQuest on your home screen for instant offline access and responsive full-screen gameplay.'
              : 'Would you like to install MelonQuest as a dedicated Progressive Web App (PWA) on your device?'}
          </p>

          <div className="bg-[#18271a] border border-[#2d4d2f] p-3 text-[11px] text-[#9bb896] space-y-1">
            <div className="font-pixel text-[10px] text-[#ffffff] mb-1">PWA SPECIFICATIONS:</div>
            <div>- Full-screen offline agronomy simulation</div>
            <div>- Zero app store downloads or background telemetry</div>
            <div>- High-performance 60 FPS hardware-accelerated canvas engine</div>
          </div>

          {/* iOS Specific Instructions Guide */}
          {(isIOS || showIOSManual) && (
            <div className="bg-[#1b2b1d] border border-[#f0c54d]/40 p-3 text-xs text-[#cadbc6] space-y-1">
              <div className="font-pixel text-[10px] text-[#f0c54d] mb-1">
                IOS INSTALLATION INSTRUCTIONS:
              </div>
              <div>1. Tap the Share button in Safari toolbar.</div>
              <div>2. Scroll down and select Add to Home Screen.</div>
              <div>3. Launch MelonQuest directly from your device home screen.</div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#233d26]">
          <button
            onClick={handleDismiss}
            className="pixel-btn px-3 py-1.5 text-xs text-[#9bb896]"
          >
            Not for now
          </button>
          <button
            onClick={handleInstallClick}
            className="pixel-btn pixel-btn-action px-4 py-1.5 font-pixel text-xs tracking-wider"
          >
            INSTALL GAME
          </button>
        </div>
      </div>
    </div>
  );
};
