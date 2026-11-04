/**
 * Watermelon 4-Point Harvest Readiness Inspection Mini-Game for MelonQuest.
 * 16-Bit Harvest Maturity Inspection Bench Redesign:
 * - Heavy dark steel and wood-grained frame decorated with tiny pixel watermelon details
 * - 3D raised wooden crate toggle tabs for "MELON A", "MELON B", "MELON C"
 * - 4 diagnostic test quadrants in wooden panel divisions with unique pixel illustrations:
 *   1. Tendril Desiccation Index: mini pixel illustration of curling, drying vine
 *   2. Ground Belly Spot Color: pixel-art illustration of watermelon's yellow/white underside
 *   3. Acoustic Resonance Test: glowing green [THUMP MELON] button next to pixel audio/vibration waves
 *   4. Optical Refractometer: glowing green [MEASURE BRIX] button next to pixel refractometer device icon
 * - Thick 3D embossed red/orange "HARVEST SELECTED MELON" button with heavy shadow layers
 * Strict zero-emoji policy applied.
 */

import React, { useState } from 'react';
import { HarvestInspection, evaluateHarvestReadiness, HarvestEvaluation } from '../game/agronomyRules';
import { audio } from '../game/soundEffects';

interface HarvestInspectMiniGameProps {
  onComplete: () => void;
  onClose: () => void;
}

interface CandidateMelon {
  id: number;
  label: string;
  fieldNote: string;
  inspection: HarvestInspection;
}

const CANDIDATES: CandidateMelon[] = [
  {
    id: 1,
    label: 'Candidate Melon A (Bed 1)',
    fieldNote: 'Vigorous vine runner. Smooth striped rind with high gloss.',
    inspection: {
      tendrilDryingPct: 20, // Green, immature
      groundSpotColor: 'white', // Unripe
      thumpFrequencyHz: 220, // High-pitch metallic ping
      refractometerBrix: 8.3,
    },
  },
  {
    id: 2,
    label: 'Candidate Melon B (Bed 2)',
    fieldNote: 'Older vine with yellowing crown foliage. Large oblong fruit.',
    inspection: {
      tendrilDryingPct: 100, // Dry
      groundSpotColor: 'deep_yellow',
      thumpFrequencyHz: 65, // Dead dull thud (internal cavity breakdown)
      refractometerBrix: 10.8,
    },
  },
  {
    id: 3,
    label: 'Candidate Melon C (Bed 3)',
    fieldNote: 'Healthy mature vine canopy. Matte finish on striped rind.',
    inspection: {
      tendrilDryingPct: 100, // 100% dry & brown curled spoon leaf
      groundSpotColor: 'butter_yellow', // Creamy golden butter yellow
      thumpFrequencyHz: 115, // Optimal resonant hollow thud
      refractometerBrix: 12.4, // U.S. No. 1 premium sweetness
    },
  },
];

export const HarvestInspectMiniGame: React.FC<HarvestInspectMiniGameProps> = ({ onComplete, onClose }) => {
  const [selectedMelonIdx, setSelectedMelonIdx] = useState(0);
  const [evaluation, setEvaluation] = useState<HarvestEvaluation | null>(null);
  const [testedThump, setTestedThump] = useState<Record<number, boolean>>({});
  const [testedBrix, setTestedBrix] = useState<Record<number, boolean>>({});
  const [harvestSuccess, setHarvestSuccess] = useState(false);

  const candidate = CANDIDATES[selectedMelonIdx];

  const handleThumpTest = () => {
    audio.playAcousticThump(candidate.inspection.thumpFrequencyHz);
    setTestedThump(prev => ({ ...prev, [candidate.id]: true }));
  };

  const handleBrixTest = () => {
    audio.playToolSound();
    setTestedBrix(prev => ({ ...prev, [candidate.id]: true }));
  };

  const handleEvaluateHarvest = () => {
    const result = evaluateHarvestReadiness(candidate.inspection);
    setEvaluation(result);

    if (result.isFullyRipe) {
      audio.playQuestComplete();
      setHarvestSuccess(true);
    } else {
      audio.playErrorBuzz();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 font-retro select-none animate-odyssey-fade">
      {/* Heavy Dark Steel and Wood-Grained Frame Decorated with Tiny Pixel Watermelons */}
      <div className="relative w-full max-w-3xl pixel-wood-frame p-4 sm:p-6 max-h-[94vh] overflow-y-auto pixel-dark-scroll shadow-2xl bg-[#3d2311]">
        {/* Steel Corner Brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 bg-[#4a5568] border-2 border-[#1a202c] flex items-center justify-center shadow-md">
          <div className="w-1.5 h-1.5 bg-[#cbd5e0]" />
        </div>
        <div className="absolute top-2 right-2 w-4 h-4 bg-[#4a5568] border-2 border-[#1a202c] flex items-center justify-center shadow-md">
          <div className="w-1.5 h-1.5 bg-[#cbd5e0]" />
        </div>
        <div className="absolute bottom-2 left-2 w-4 h-4 bg-[#4a5568] border-2 border-[#1a202c] flex items-center justify-center shadow-md">
          <div className="w-1.5 h-1.5 bg-[#cbd5e0]" />
        </div>
        <div className="absolute bottom-2 right-2 w-4 h-4 bg-[#4a5568] border-2 border-[#1a202c] flex items-center justify-center shadow-md">
          <div className="w-1.5 h-1.5 bg-[#cbd5e0]" />
        </div>

        {/* Tiny Pixel Watermelon Border Accents */}
        <div className="absolute top-3 left-8 pointer-events-none">
          <svg width="20" height="12" viewBox="0 0 20 12" shapeRendering="crispEdges">
            <rect x="2" y="2" width="16" height="8" fill="#1b5e20" />
            <rect x="4" y="3" width="12" height="6" fill="#2e7d32" />
            <rect x="5" y="4" width="2" height="4" fill="#a5d6a7" />
            <rect x="10" y="4" width="2" height="4" fill="#a5d6a7" />
            <rect x="15" y="4" width="2" height="4" fill="#a5d6a7" />
          </svg>
        </div>
        <div className="absolute top-3 right-28 pointer-events-none">
          <svg width="20" height="12" viewBox="0 0 20 12" shapeRendering="crispEdges">
            <rect x="2" y="2" width="16" height="8" fill="#1b5e20" />
            <rect x="4" y="3" width="12" height="6" fill="#2e7d32" />
            <rect x="5" y="4" width="2" height="4" fill="#a5d6a7" />
            <rect x="10" y="4" width="2" height="4" fill="#a5d6a7" />
            <rect x="15" y="4" width="2" height="4" fill="#a5d6a7" />
          </svg>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-[#7a4d28] bg-gradient-to-r from-[#2c170a] via-[#4d2d14] to-[#2c170a] p-3 mb-4 shadow-md">
          <div className="flex items-center gap-3">
            {/* Watermelon Slice Pixel Icon */}
            <div className="w-9 h-9 bg-[#1a0e05] border-2 border-[#f1c40f] flex items-center justify-center shadow-inner shrink-0">
              <svg className="w-7 h-7" viewBox="0 0 24 24" shapeRendering="crispEdges">
                <rect x="4" y="16" width="16" height="4" fill="#1b5e20" />
                <rect x="6" y="14" width="12" height="2" fill="#78b159" />
                <rect x="6" y="6" width="12" height="8" fill="#e74c3c" />
                <rect x="8" y="4" width="8" height="2" fill="#e74c3c" />
                <rect x="8" y="8" width="2" height="2" fill="#111111" />
                <rect x="14" y="8" width="2" height="2" fill="#111111" />
                <rect x="11" y="11" width="2" height="2" fill="#111111" />
              </svg>
            </div>
            <div>
              <h2 className="font-pixel text-xs sm:text-sm md:text-base text-[#f1c40f] tracking-wide drop-shadow-[2px_2px_0px_#962d22] uppercase">
                POST-HARVEST MATURITY INSPECTION BENCH
              </h2>
              <p className="text-[11px] sm:text-xs text-[#f9e79f] font-bold mt-0.5">
                Empirical 4-Point Non-Destructive Harvest Certification Protocol
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audio.playMenuClick();
              onClose();
            }}
            className="pixel-hanging-sign bg-gradient-to-b from-[#801515] to-[#4a0b0b] hover:from-[#a81c1c] hover:to-[#5e0e0e] border-2 border-[#f5b7b1] px-3 py-1 text-xs font-pixel text-white shadow-md font-bold"
            aria-label="Close maturity bench"
          >
            [X] CLOSE
          </button>
        </div>

        {/* 3D Raised Wooden Crate Toggle Tabs for MELON A, MELON B, MELON C */}
        <div className="flex gap-2.5 mb-4 border-b-2 border-[#7a4d28] pb-3">
          {CANDIDATES.map((c, idx) => {
            const isSelected = selectedMelonIdx === idx;
            return (
              <button
                key={c.id}
                onClick={() => {
                  audio.playMenuClick();
                  setSelectedMelonIdx(idx);
                  setEvaluation(null);
                }}
                className={`flex-1 py-2 px-3 font-pixel text-xs sm:text-sm tracking-wider cursor-pointer transition-all shadow-md flex items-center justify-center gap-2 ${
                  isSelected
                    ? 'pixel-hanging-sign bg-gradient-to-b from-[#f39c12] to-[#d68910] border-3 border-[#ffffff] text-[#3d2606] font-bold -translate-y-1 shadow-[0_4px_12px_rgba(243,156,18,0.5)]'
                    : 'bg-gradient-to-b from-[#5c3a1e] to-[#3e2411] border-2 border-[#8d5b2d] text-[#e8d5bf] opacity-80 hover:opacity-100 hover:border-[#f1c40f]'
                }`}
              >
                {/* Mini Crate Icon */}
                <span className="w-3.5 h-3.5 bg-[#4a2e13] border border-[#a06836] flex items-center justify-center text-[8px] font-bold text-white">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>MELON {String.fromCharCode(65 + idx)}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Melon Profile Card */}
        <div className="bg-[#241307] border-3 border-[#7a4d28] p-3 mb-4 shadow-inner flex items-center justify-between">
          <div>
            <div className="font-pixel text-xs text-[#f1c40f] mb-0.5">{candidate.label}</div>
            <p className="text-xs text-[#f2dac2] font-bold">{candidate.fieldNote}</p>
          </div>
          <span className="font-pixel text-[9px] bg-[#5c3a1e] text-[#f9e79f] border border-[#a06836] px-2 py-1 shrink-0">
            TEST SPECIMEN #{candidate.id}
          </span>
        </div>

        {/* 4 Diagnostic Test Quadrants in Wooden Panel Divisions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
          {/* Quadrant 1: Tendril Desiccation Index */}
          <div className="bg-gradient-to-b from-[#2e190a] to-[#1e1006] border-3 border-[#7a4d28] p-3.5 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2 border-b border-[#5a3315] pb-1.5">
                {/* Mini Pixel Illustration of Curling, Drying Vine */}
                <div className="w-8 h-8 bg-[#150b03] border-2 border-[#8d5b2d] flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 16 16" shapeRendering="crispEdges">
                    <rect x="2" y="8" width="8" height="2" fill="#5d4037" />
                    <rect x="9" y="6" width="2" height="4" fill="#795548" />
                    <rect x="11" y="4" width="3" height="2" fill="#8d6e63" />
                    <rect x="13" y="6" width="2" height="3" fill="#8d6e63" />
                    <rect x="11" y="8" width="2" height="2" fill="#5d4037" />
                    <rect x="7" y="10" width="3" height="2" fill="#4e342e" />
                  </svg>
                </div>
                <div>
                  <span className="font-pixel text-[10px] text-[#f1c40f] block">1. TENDRIL DESICCATION INDEX</span>
                  <span className="text-[10px] text-[#bdc3c7]">PHYSIOLOGICAL STEM SPOON</span>
                </div>
              </div>

              <div className="text-xs mb-2">
                <span className="text-[#d7be9f] font-bold">Status: </span>
                <span
                  className={`font-pixel text-xs font-bold ${
                    candidate.inspection.tendrilDryingPct >= 90 ? 'text-[#2ecc71]' : 'text-[#e74c3c]'
                  }`}
                >
                  {candidate.inspection.tendrilDryingPct}% Desiccated ({candidate.inspection.tendrilDryingPct >= 90 ? 'Fully Dried/Brown' : 'Green / Immature'})
                </span>
              </div>
            </div>
            <div className="text-[11px] text-[#e8d5bf] font-bold bg-[#170c04] p-1.5 border border-[#4a2810]">
              Standard: Curled stem tendril must be completely brown and dry before harvest.
            </div>
          </div>

          {/* Quadrant 2: Ground Belly Spot Color */}
          <div className="bg-gradient-to-b from-[#2e190a] to-[#1e1006] border-3 border-[#7a4d28] p-3.5 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2 border-b border-[#5a3315] pb-1.5">
                {/* Pixel-Art Illustration of Watermelon Underside with Belly Spot */}
                <div className="w-8 h-8 bg-[#150b03] border-2 border-[#8d5b2d] flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 16 16" shapeRendering="crispEdges">
                    <rect x="2" y="3" width="12" height="10" rx="3" fill="#1b5e20" />
                    <rect x="4" y="7" width="8" height="5" fill="#fdd835" /> {/* Belly spot */}
                    <rect x="5" y="8" width="6" height="3" fill="#fff59d" />
                  </svg>
                </div>
                <div>
                  <span className="font-pixel text-[10px] text-[#f1c40f] block">2. GROUND BELLY SPOT COLOR</span>
                  <span className="text-[10px] text-[#bdc3c7]">VENTRAL CAROTENOID COLOR</span>
                </div>
              </div>

              <div className="text-xs mb-2 flex items-center gap-2">
                <span className="text-[#d7be9f] font-bold">Hue:</span>
                <span
                  className={`px-2.5 py-0.5 font-pixel text-xs font-bold border ${
                    candidate.inspection.groundSpotColor === 'butter_yellow'
                      ? 'bg-[#f1c40f] border-white text-[#2c170a]'
                      : candidate.inspection.groundSpotColor === 'deep_yellow'
                      ? 'bg-[#d68910] border-white text-white'
                      : 'bg-[#ecf0f1] border-gray-400 text-black'
                  }`}
                >
                  {candidate.inspection.groundSpotColor.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-[#e8d5bf] font-bold bg-[#170c04] p-1.5 border border-[#4a2810]">
              Standard: Must shift from greenish-white to creamy butter-yellow.
            </div>
          </div>

          {/* Quadrant 3: Acoustic Resonance Test with Glowing Green [THUMP MELON] Button & Vibration Waves */}
          <div className="bg-gradient-to-b from-[#2e190a] to-[#1e1006] border-3 border-[#7a4d28] p-3.5 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2 border-b border-[#5a3315] pb-1.5">
                {/* Pixel-Art Audio/Vibration Waveform Icon */}
                <div className="w-8 h-8 bg-[#150b03] border-2 border-[#8d5b2d] flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 16 16" shapeRendering="crispEdges">
                    <rect x="2" y="7" width="2" height="2" fill="#2ecc71" />
                    <rect x="5" y="4" width="2" height="8" fill="#2ecc71" />
                    <rect x="8" y="2" width="2" height="12" fill="#2ecc71" />
                    <rect x="11" y="5" width="2" height="6" fill="#2ecc71" />
                    <rect x="14" y="7" width="2" height="2" fill="#2ecc71" />
                  </svg>
                </div>
                <div>
                  <span className="font-pixel text-[10px] text-[#f1c40f] block">3. ACOUSTIC RESONANCE TEST</span>
                  <span className="text-[10px] text-[#bdc3c7]">INTERNAL CAVITY SONICS</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mb-2">
                {/* Glowing Green Interactive [THUMP MELON] Button */}
                <button
                  onClick={handleThumpTest}
                  className="pixel-hanging-sign bg-gradient-to-b from-[#27ae60] to-[#1e8449] hover:from-[#2ecc71] hover:to-[#27ae60] border-2 border-[#a9dfbf] px-3 py-1.5 text-xs font-pixel text-white shadow-[0_0_12px_rgba(46,204,113,0.6)] cursor-pointer font-bold active:translate-y-0.5"
                >
                  [THUMP MELON]
                </button>
                <span className="text-xs font-bold text-white font-pixel">
                  {testedThump[candidate.id]
                    ? `${candidate.inspection.thumpFrequencyHz} Hz (${
                        candidate.inspection.thumpFrequencyHz > 180
                          ? 'Metallic Ping'
                          : candidate.inspection.thumpFrequencyHz < 80
                          ? 'Dull Flat Thud'
                          : 'Hollow Resonant Thud'
                      })`
                    : 'Awaiting tap...'}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-[#e8d5bf] font-bold bg-[#170c04] p-1.5 border border-[#4a2810]">
              Standard: 90 - 145 Hz hollow resonance confirms ripe cellular air structure.
            </div>
          </div>

          {/* Quadrant 4: Optical Refractometer with Glowing Green [MEASURE BRIX] Button & Device Icon */}
          <div className="bg-gradient-to-b from-[#2e190a] to-[#1e1006] border-3 border-[#7a4d28] p-3.5 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2 border-b border-[#5a3315] pb-1.5">
                {/* Pixel Refractometer Device Icon */}
                <div className="w-8 h-8 bg-[#150b03] border-2 border-[#8d5b2d] flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 16 16" shapeRendering="crispEdges">
                    <rect x="2" y="6" width="7" height="4" fill="#34495e" />
                    <rect x="9" y="5" width="4" height="6" fill="#bdc3c7" /> {/* Prism */}
                    <rect x="13" y="7" width="2" height="2" fill="#3498db" /> {/* Daylight flap */}
                    <rect x="4" y="7" width="3" height="2" fill="#1abc9c" />
                  </svg>
                </div>
                <div>
                  <span className="font-pixel text-[10px] text-[#f1c40f] block">4. OPTICAL REFRACTOMETER</span>
                  <span className="text-[10px] text-[#bdc3c7]">TOTAL SOLUBLE SOLIDS</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mb-2">
                {/* Glowing Green Interactive [MEASURE BRIX] Button */}
                <button
                  onClick={handleBrixTest}
                  className="pixel-hanging-sign bg-gradient-to-b from-[#27ae60] to-[#1e8449] hover:from-[#2ecc71] hover:to-[#27ae60] border-2 border-[#a9dfbf] px-3 py-1.5 text-xs font-pixel text-white shadow-[0_0_12px_rgba(46,204,113,0.6)] cursor-pointer font-bold active:translate-y-0.5"
                >
                  [MEASURE BRIX]
                </button>
                <span className="text-xs font-bold text-white font-pixel">
                  {testedBrix[candidate.id]
                    ? `${candidate.inspection.refractometerBrix.toFixed(1)}° Brix`
                    : 'Awaiting juice...'}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-[#e8d5bf] font-bold bg-[#170c04] p-1.5 border border-[#4a2810]">
              Standard: USDA U.S. No. 1 requires &gt;= 10.0° Brix sugar content.
            </div>
          </div>
        </div>

        {/* Evaluation Output Result */}
        {evaluation && (
          <div
            className={`border-3 p-3.5 mb-4 text-xs font-bold shadow-lg ${
              evaluation.isFullyRipe
                ? 'bg-[#1b4324] border-[#2ecc71] text-[#e8f8f5]'
                : 'bg-[#4a1c1c] border-[#e74c3c] text-[#fbeee6]'
            }`}
          >
            <div className="font-pixel text-xs mb-1 tracking-wider uppercase">
              GRADE OUTCOME: {evaluation.usdaGrade}
            </div>
            <p className="leading-relaxed">{evaluation.feedback}</p>
          </div>
        )}

        {/* Action Controls Bar with Thick 3D Embossed Red/Orange Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t-2 border-[#7a4d28]">
          <div className="text-xs text-[#f9e79f] font-bold">
            Perform assays on candidates and harvest the certified ripe specimen.
          </div>
          <div className="flex gap-2">
            {!harvestSuccess ? (
              <button
                onClick={handleEvaluateHarvest}
                className="pixel-hanging-sign bg-gradient-to-b from-[#e67e22] via-[#d35400] to-[#962d22] hover:from-[#f39c12] hover:to-[#d35400] border-3 border-[#ffffff] px-6 py-3 font-pixel text-xs sm:text-sm text-white font-bold tracking-wider shadow-[0_5px_0_0_#4a1508,0_0_20px_rgba(230,126,34,0.65)] cursor-pointer active:translate-y-1 transition-transform"
              >
                HARVEST SELECTED MELON
              </button>
            ) : (
              <button
                onClick={() => {
                  audio.playSuccessFanfare();
                  onComplete();
                }}
                className="pixel-hanging-sign bg-gradient-to-b from-[#27ae60] to-[#1e8449] hover:from-[#2ecc71] hover:to-[#27ae60] border-3 border-[#ffffff] px-6 py-3 font-pixel text-xs sm:text-sm text-white font-bold tracking-wider shadow-[0_5px_0_0_#145a32,0_0_20px_rgba(46,204,113,0.7)] cursor-pointer"
              >
                SUBMIT FINAL HARVEST REPORT &gt;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
