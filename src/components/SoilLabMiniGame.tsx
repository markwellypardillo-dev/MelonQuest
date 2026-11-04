/**
 * Interactive Soil Science Laboratory Mini-Game for MelonQuest.
 * Unified 16-Bit Wood, Brass & Forest-Green RPG HUD Theme:
 * - Warm carved wood frame (.pixel-wood-frame) with brass corner rivets
 * - Top HUD wood beam header (.pixel-wood-bar) with gold typography (#f0c54d)
 * - Forest-green & earth-toned agronomy panels (#142016 / #1b2c1e / #6c4722)
 * - Digital pH readout (target 6.0 - 6.8) and N-P-K calibration bars
 * Strict zero-emoji policy applied.
 */

import React, { useState } from 'react';
import { assessWatermelonSoil, SoilSample, SoilAssessment } from '../game/agronomyRules';
import { audio } from '../game/soundEffects';

interface SoilLabMiniGameProps {
  onComplete: () => void;
  onClose: () => void;
}

export const SoilLabMiniGame: React.FC<SoilLabMiniGameProps> = ({ onComplete, onClose }) => {
  // Initial acidic, nutrient-deficient soil state
  const [sample, setSample] = useState<SoilSample>({
    pH: 5.3,
    nitrogen: 24,
    phosphorus: 18,
    potassium: 130,
    moisture: 55,
  });

  const [assessment, setAssessment] = useState<SoilAssessment | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Add Agricultural Lime (+0.2 pH)
  const handleAddLime = () => {
    audio.playToolSound();
    setSample(prev => ({
      ...prev,
      pH: Number(Math.min(8.5, prev.pH + 0.2).toFixed(1)),
    }));
    setAssessment(null);
  };

  // Add Elemental Sulfur (-0.2 pH)
  const handleAddSulfur = () => {
    audio.playToolSound();
    setSample(prev => ({
      ...prev,
      pH: Number(Math.max(4.0, prev.pH - 0.2).toFixed(1)),
    }));
    setAssessment(null);
  };

  // Adjust N-P-K
  const handleNutrientChange = (nutrient: 'nitrogen' | 'phosphorus' | 'potassium', delta: number) => {
    audio.playMenuClick();
    setSample(prev => ({
      ...prev,
      [nutrient]: Math.max(10, Math.min(250, prev[nutrient] + delta)),
    }));
    setAssessment(null);
  };

  // Run Titration & Laboratory Assay
  const handleRunAssay = () => {
    const result = assessWatermelonSoil(sample);
    setAssessment(result);

    if (result.isReadyForPlanting) {
      audio.playSuccessFanfare();
      setHasCompleted(true);
    } else {
      audio.playErrorBuzz();
    }
  };

  const isPhOptimal = sample.pH >= 6.0 && sample.pH <= 6.8;
  const isNOptimal = sample.nitrogen >= 30 && sample.nitrogen <= 70;
  const isPOptimal = sample.phosphorus >= 25 && sample.phosphorus <= 60;
  const isKOptimal = sample.potassium >= 120 && sample.potassium <= 220;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 font-retro select-none animate-odyssey-fade">
      {/* Unified 16-Bit Wood & Brass RPG Frame */}
      <div className="relative w-full max-w-3xl pixel-wood-frame bg-[#142016] text-[#e3f0d8] flex flex-col max-h-[92vh] shadow-2xl">
        {/* Brass Corner Rivets */}
        <div className="absolute top-1.5 left-1.5 w-3 h-3 bg-[#f0c54d] border border-[#241306] pointer-events-none" />
        <div className="absolute top-1.5 right-1.5 w-3 h-3 bg-[#f0c54d] border border-[#241306] pointer-events-none" />
        <div className="absolute bottom-1.5 left-1.5 w-3 h-3 bg-[#f0c54d] border border-[#241306] pointer-events-none" />
        <div className="absolute bottom-1.5 right-1.5 w-3 h-3 bg-[#f0c54d] border border-[#241306] pointer-events-none" />

        {/* Top Wood & Brass HUD Header */}
        <div className="pixel-wood-bar px-4 py-3 flex items-center justify-between border-b-4 border-[#6c4722]">
          <div className="flex items-center gap-3">
            {/* Lab Beaker Pixel Icon in Wood/Brass Frame */}
            <div className="w-9 h-9 bg-[#241306] border-2 border-[#f0c54d] flex items-center justify-center shadow-inner shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 20 20" shapeRendering="crispEdges">
                <rect x="7" y="2" width="6" height="2" fill="#d8c29d" />
                <rect x="8" y="4" width="4" height="6" fill="#fff8e7" />
                <polygon points="5,16 15,16 12,10 8,10" fill="#68b54e" />
                <rect x="7" y="12" width="6" height="2" fill="#88d46c" />
                <rect x="6" y="14" width="8" height="2" fill="#2ecc71" />
              </svg>
            </div>
            <div>
              <h2 className="font-pixel text-xs sm:text-sm md:text-base text-[#f0c54d] tracking-wider uppercase">
                SOIL SCIENCE &amp; pH CALIBRATION BENCH
              </h2>
              <p className="text-xs text-[#d8c29d] font-bold">
                DA-BPI Watermelon Assay · Target pH 6.0–6.8 &amp; Balanced N-P-K
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audio.playMenuClick();
              onClose();
            }}
            className="px-3 py-1.5 bg-[#8f2419] hover:bg-[#a82b1e] text-[#fff8e7] border-2 border-[#3c0c0c] shadow-[inset_1px_1px_0px_#d84c37] font-pixel text-[10px] cursor-pointer"
            aria-label="Close soil laboratory"
          >
            [X] CLOSE
          </button>
        </div>

        {/* Main Content Body */}
        <div className="p-4 overflow-y-auto pixel-dark-scroll space-y-3.5">
          {/* Benchmark Standards Bar */}
          <div className="bg-[#1b2c1e] border-2 border-[#6c4722] p-3">
            <div className="font-pixel text-[9px] text-[#f0c54d] mb-2 flex items-center justify-between border-b border-[#345438] pb-1">
              <span>TARGET AGRONOMY BENCHMARKS (CITRULLUS LANATUS)</span>
              <span className="text-[#86b582]">SANDY LOAM STANDARD</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className={`p-2 text-center border-2 ${isPhOptimal ? 'bg-[#1f3b24] border-[#2ecc71]' : 'bg-[#2b1809] border-[#8d5b2d]'}`}>
                <span className="text-[10px] text-[#d8c29d] font-bold block">Target pH</span>
                <span className="font-pixel text-xs text-[#f0c54d] font-bold">6.0 - 6.8</span>
              </div>
              <div className={`p-2 text-center border-2 ${isNOptimal ? 'bg-[#1f3b24] border-[#2ecc71]' : 'bg-[#132620] border-[#345438]'}`}>
                <span className="text-[10px] text-[#a9d6e5] font-bold block">Nitrogen (N)</span>
                <span className="font-pixel text-xs text-[#90e0ef] font-bold">30 - 70 ppm</span>
              </div>
              <div className={`p-2 text-center border-2 ${isPOptimal ? 'bg-[#1f3b24] border-[#2ecc71]' : 'bg-[#2b1809] border-[#8d5b2d]'}`}>
                <span className="text-[10px] text-[#fde2cb] font-bold block">Phosphorus (P)</span>
                <span className="font-pixel text-xs text-[#f39c12] font-bold">25 - 60 ppm</span>
              </div>
              <div className={`p-2 text-center border-2 ${isKOptimal ? 'bg-[#1f3b24] border-[#2ecc71]' : 'bg-[#132620] border-[#345438]'}`}>
                <span className="text-[10px] text-[#b7e4c7] font-bold block">Potassium (K)</span>
                <span className="font-pixel text-xs text-[#88d46c] font-bold">120 - 220 ppm</span>
              </div>
            </div>
          </div>

          {/* Interactive Calibration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Panel 1: Soil pH Titration */}
            <div className="bg-[#0e1710] border-2 border-[#6c4722] p-3.5 flex flex-col justify-between">
              <div>
                <h3 className="font-pixel text-[10px] text-[#f0c54d] mb-2.5 flex items-center justify-between border-b border-[#263e29] pb-1">
                  <span>1. SOIL REACTION (pH)</span>
                  <span className="text-[8px] text-[#86b582]">LIME / SULFUR</span>
                </h3>

                {/* pH Readout Box */}
                <div className="flex items-center gap-3 bg-[#142016] p-2.5 border-2 border-[#345438] mb-3">
                  <div
                    className={`w-14 h-14 border-2 flex flex-col items-center justify-center font-pixel shrink-0 ${
                      sample.pH < 6.0
                        ? 'bg-[#8f2419] border-[#f0c54d] text-white'
                        : sample.pH > 6.8
                        ? 'bg-[#1b4f72] border-[#90e0ef] text-white'
                        : 'bg-[#1e8449] border-[#a9dfbf] text-white'
                    }`}
                  >
                    <span className="text-[8px] opacity-80">pH</span>
                    <span className="text-base font-bold">{sample.pH.toFixed(1)}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="text-xs text-[#d8c29d] font-bold">Status:</span>
                      <span
                        className={`font-pixel text-[10px] font-bold ${
                          sample.pH < 6.0
                            ? 'text-[#e74c3c]'
                            : sample.pH > 6.8
                            ? 'text-[#5dade2]'
                            : 'text-[#2ecc71]'
                        }`}
                      >
                        {sample.pH < 6.0 ? '[ACIDIC]' : sample.pH > 6.8 ? '[ALKALINE]' : '[OPTIMAL]'}
                      </span>
                    </div>
                    <div className="text-xs text-[#c8e2c4] leading-snug font-bold">
                      {sample.pH < 6.0
                        ? 'Acidic soil locks out nutrients. Add Agricultural Lime.'
                        : sample.pH > 6.8
                        ? 'Alkaline soil limits iron uptake. Add Elemental Sulfur.'
                        : 'Optimal root zone pH achieved (6.0 - 6.8).'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Wood & Forest Amendment Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleAddLime}
                  className="w-full pixel-wood-btn p-2 text-xs flex justify-between items-center font-bold"
                >
                  <span>[+] Add Calcitic Lime (CaCO3)</span>
                  <span className="font-pixel text-[9px] text-[#2ecc71] bg-[#142016] px-2 py-0.5 border border-[#345438]">
                    +0.2 pH
                  </span>
                </button>

                <button
                  onClick={handleAddSulfur}
                  className="w-full pixel-wood-btn p-2 text-xs flex justify-between items-center font-bold"
                >
                  <span>[-] Add Elemental Sulfur (S)</span>
                  <span className="font-pixel text-[9px] text-[#f0c54d] bg-[#142016] px-2 py-0.5 border border-[#6c4722]">
                    -0.2 pH
                  </span>
                </button>
              </div>
            </div>

            {/* Panel 2: Macro-Nutrients (N-P-K) */}
            <div className="bg-[#0e1710] border-2 border-[#6c4722] p-3.5 flex flex-col justify-between">
              <h3 className="font-pixel text-[10px] text-[#f0c54d] mb-2.5 flex items-center justify-between border-b border-[#263e29] pb-1">
                <span>2. MACRO-NUTRIENTS (N-P-K)</span>
                <span className="text-[8px] text-[#86b582]">FERTILIZER RATIO</span>
              </h3>

              <div className="space-y-3">
                {/* Nitrogen */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-bold">
                    <span className="text-[#90e0ef]">Nitrogen (N) [30-70]:</span>
                    <span className={`font-pixel text-[10px] ${isNOptimal ? 'text-[#2ecc71]' : 'text-[#fff8e7]'}`}>
                      {sample.nitrogen} ppm
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleNutrientChange('nitrogen', -10)}
                      className="pixel-wood-btn px-2.5 py-1 font-pixel text-xs"
                    >
                      -
                    </button>
                    <div className="flex-1 bg-[#1c0f05] h-4 border border-[#6c4722] p-0.5">
                      <div
                        className={`h-full transition-all ${isNOptimal ? 'bg-[#2ecc71]' : 'bg-[#3498db]'}`}
                        style={{ width: `${Math.min(100, (sample.nitrogen / 100) * 100)}%` }}
                      />
                    </div>
                    <button
                      onClick={() => handleNutrientChange('nitrogen', 10)}
                      className="pixel-wood-btn px-2.5 py-1 font-pixel text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Phosphorus */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-bold">
                    <span className="text-[#f8c471]">Phosphorus (P) [25-60]:</span>
                    <span className={`font-pixel text-[10px] ${isPOptimal ? 'text-[#2ecc71]' : 'text-[#fff8e7]'}`}>
                      {sample.phosphorus} ppm
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleNutrientChange('phosphorus', -5)}
                      className="pixel-wood-btn px-2.5 py-1 font-pixel text-xs"
                    >
                      -
                    </button>
                    <div className="flex-1 bg-[#1c0f05] h-4 border border-[#6c4722] p-0.5">
                      <div
                        className={`h-full transition-all ${isPOptimal ? 'bg-[#2ecc71]' : 'bg-[#e67e22]'}`}
                        style={{ width: `${Math.min(100, (sample.phosphorus / 80) * 100)}%` }}
                      />
                    </div>
                    <button
                      onClick={() => handleNutrientChange('phosphorus', 5)}
                      className="pixel-wood-btn px-2.5 py-1 font-pixel text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Potassium */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-bold">
                    <span className="text-[#a9dfbf]">Potassium (K) [120-220]:</span>
                    <span className={`font-pixel text-[10px] ${isKOptimal ? 'text-[#2ecc71]' : 'text-[#fff8e7]'}`}>
                      {sample.potassium} ppm
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleNutrientChange('potassium', -15)}
                      className="pixel-wood-btn px-2.5 py-1 font-pixel text-xs"
                    >
                      -
                    </button>
                    <div className="flex-1 bg-[#1c0f05] h-4 border border-[#6c4722] p-0.5">
                      <div
                        className={`h-full transition-all ${isKOptimal ? 'bg-[#2ecc71]' : 'bg-[#68b54e]'}`}
                        style={{ width: `${Math.min(100, (sample.potassium / 250) * 100)}%` }}
                      />
                    </div>
                    <button
                      onClick={() => handleNutrientChange('potassium', 15)}
                      className="pixel-wood-btn px-2.5 py-1 font-pixel text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Feedback Result Box */}
          {assessment && (
            <div
              className={`border-2 p-3 text-xs font-bold ${
                assessment.isReadyForPlanting
                  ? 'bg-[#1b4324] border-[#2ecc71] text-[#e8f8f5]'
                  : 'bg-[#4a1c1c] border-[#e74c3c] text-[#fbeee6]'
              }`}
            >
              <div className="font-pixel text-[10px] mb-1 tracking-wider text-[#f0c54d]">
                {assessment.isReadyForPlanting
                  ? '[ASSAY CERTIFIED: SOIL OPTIMAL FOR PLANTING]'
                  : '[ASSAY RESULT: CALIBRATION NEEDED]'}
              </div>
              <p className="leading-snug">{assessment.notes}</p>
            </div>
          )}
        </div>

        {/* Bottom Wood HUD Bar */}
        <div className="pixel-wood-bar px-4 py-2.5 border-t-4 border-[#6c4722] flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-[#d8c29d] font-bold">
            Match all 4 green target ranges, then run the chemical assay.
          </span>
          <div>
            {!hasCompleted ? (
              <button
                onClick={handleRunAssay}
                className="pixel-embossed-gold px-5 py-2 font-pixel text-[10px] sm:text-xs text-[#fff8e7] font-bold cursor-pointer"
              >
                RUN CHEMICAL ASSAY
              </button>
            ) : (
              <button
                onClick={() => {
                  audio.playSuccessFanfare();
                  onComplete();
                }}
                className="px-5 py-2 bg-[#27ae60] hover:bg-[#2ecc71] border-2 border-[#fff8e7] font-pixel text-[10px] sm:text-xs text-[#09140a] font-bold cursor-pointer"
              >
                SUBMIT &amp; ADVANCE QUEST &gt;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
