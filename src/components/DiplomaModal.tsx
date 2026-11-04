/**
 * Capstone Agronomy Diploma & Certification Modal for MelonQuest.
 * Strict zero-emoji policy applied.
 */

import React from 'react';
import { audio } from '../game/soundEffects';

interface DiplomaModalProps {
  onRestart: () => void;
  onContinue: () => void;
  onOpenSusEvaluation?: () => void;
}

export const DiplomaModal: React.FC<DiplomaModalProps> = ({
  onRestart,
  onContinue,
  onOpenSusEvaluation,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-retro select-none animate-odyssey-fade">
      <div className="relative w-full max-w-2xl pixel-wood-frame bg-[#241306] text-[#fff8e7] p-6 text-center max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Brass Corner Rivets */}
        <div className="absolute top-1.5 left-1.5 w-3 h-3 bg-[#f0c54d] border border-[#241306] pointer-events-none" />
        <div className="absolute top-1.5 right-1.5 w-3 h-3 bg-[#f0c54d] border border-[#241306] pointer-events-none" />
        <div className="absolute bottom-1.5 left-1.5 w-3 h-3 bg-[#f0c54d] border border-[#241306] pointer-events-none" />
        <div className="absolute bottom-1.5 right-1.5 w-3 h-3 bg-[#f0c54d] border border-[#241306] pointer-events-none" />

        <div className="border-2 border-[#8e6822] p-5 sm:p-6 bg-[#2b1809] shadow-[inset_0_0_12px_rgba(0,0,0,0.6)]">
          <div className="font-pixel text-[10px] sm:text-xs text-[#f0c54d] tracking-widest uppercase mb-1">
            DA-BPI &amp; DEPARTMENT OF AGRONOMY SCIENCES
          </div>
          <h2 className="font-pixel text-base sm:text-lg text-[#fff8e7] mb-3">
            CERTIFICATE OF AGRONOMIC COMPETENCE
          </h2>
          <div className="h-0.5 bg-[#f0c54d] w-28 mx-auto mb-4" />

          <p className="text-xs sm:text-sm text-[#d8c29d] max-w-lg mx-auto mb-5 leading-relaxed">
            This diploma certifies that the Research Assistant has mastered
            <span className="text-[#f0c54d] font-bold"> Citrullus lanatus (Watermelon) </span>
            cultivation: land preparation, pH 6.5 titration, Integrated Pest Management (IPM), and 4-point post-harvest Brix grading.
          </p>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 text-xs">
            <div className="bg-[#1c0f05] border border-[#6c4722] p-2.5">
              <div className="text-[10px] text-[#d8c29d] font-bold">SOIL REACTION</div>
              <div className="font-pixel text-xs text-[#f0c54d] mt-0.5">pH 6.5</div>
            </div>
            <div className="bg-[#1c0f05] border border-[#6c4722] p-2.5">
              <div className="text-[10px] text-[#d8c29d] font-bold">IPM COMPLIANCE</div>
              <div className="font-pixel text-xs text-[#88d46c] mt-0.5">100%</div>
            </div>
            <div className="bg-[#1c0f05] border border-[#6c4722] p-2.5">
              <div className="text-[10px] text-[#d8c29d] font-bold">SOLUBLE SOLIDS</div>
              <div className="font-pixel text-xs text-[#f0c54d] mt-0.5">12.4° Brix</div>
            </div>
            <div className="bg-[#1c0f05] border border-[#6c4722] p-2.5">
              <div className="text-[10px] text-[#d8c29d] font-bold">RANK EARNED</div>
              <div className="font-pixel text-xs text-[#f0c54d] mt-0.5">MASTER V</div>
            </div>
          </div>

          <div className="text-xs text-[#a88c68] italic mb-6">
            Conferred by Professor Citrullus · Philippine Agronomy Extension Seal
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {onOpenSusEvaluation && (
              <button
                onClick={() => {
                  audio.playMenuClick();
                  onOpenSusEvaluation();
                }}
                className="pixel-btn bg-[#d35400] hover:bg-[#e67e22] border-[#f39c12] px-5 py-2.5 font-pixel text-xs text-white cursor-pointer shadow-md"
              >
                TAKE SUS USABILITY SURVEY
              </button>
            )}
            <button
              onClick={() => {
                audio.playMenuClick();
                onContinue();
              }}
              className="pixel-btn bg-[#2b521e] hover:bg-[#386b28] border-[#53a038] px-5 py-2.5 font-pixel text-xs text-white cursor-pointer shadow-md"
            >
              CONTINUE FIELD RESEARCH
            </button>
            <button
              onClick={() => {
                audio.playMenuClick();
                onRestart();
              }}
              className="pixel-btn bg-[#3a200d] hover:bg-[#4a2b13] border-[#8e6822] px-5 py-2.5 font-pixel text-xs text-[#f0c54d] cursor-pointer shadow-md"
            >
              PLAY NEW TRIAL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
