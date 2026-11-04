/**
 * Integrated Pest Management (IPM) optical scouting mini-game for MelonQuest.
 * Unified 16-Bit Wood, Brass & Forest-Green RPG HUD Theme.
 * Strict zero-emoji policy applied.
 */

import React, { useState } from 'react';
import { PestType, IPMIntervention, evaluatePestIntervention, PEST_REGISTRY } from '../game/agronomyRules';
import { audio } from '../game/soundEffects';

interface PestScoutMiniGameProps {
  onComplete: () => void;
  onClose: () => void;
}

interface SpecimenData {
  id: PestType;
  title: string;
  visualDescription: string;
  fieldLocation: string;
  damageSymptoms: string;
}

const SPECIMENS: SpecimenData[] = [
  {
    id: 'cucumber_beetle',
    title: 'Specimen 1: Yellow/Black Striped Beetle',
    visualDescription: 'Elongate beetle (~6 mm) with yellow elytra and three black stripes.',
    fieldLocation: 'Cotyledons and young runner foliage.',
    damageSymptoms: 'Skeletonized leaf margins and bacterial wilt flagging.',
  },
  {
    id: 'melon_aphid',
    title: 'Specimen 2: Small Pear-Shaped Hemipteran',
    visualDescription: 'Colony of minute (~1.5 mm) greenish-black insects along leaf veins.',
    fieldLocation: 'Underside of leaves in sheltered canopy.',
    damageSymptoms: 'Down-curling leaf margins, stunted shoots, and sticky honeydew.',
  },
  {
    id: 'powdery_mildew',
    title: 'Specimen 3: White Epiphytic Fungal Growth',
    visualDescription: 'Circular talcum-like white powdery patches on upper leaf surfaces.',
    fieldLocation: 'Crown foliage and shaded inner leaves.',
    damageSymptoms: 'Foliar yellowing, leaf drying, and fruit sunscald.',
  },
  {
    id: 'beneficial_ladybug',
    title: 'Specimen 4: Red Oval Beetle with Black Dots',
    visualDescription: 'Convex red/orange beetle with white markings and black spots.',
    fieldLocation: 'Stalking leaf margins and aphid colonies.',
    damageSymptoms: 'Zero plant injury; actively preying on pest aphid nymphs.',
  },
];

const INTERVENTIONS: { id: IPMIntervention; label: string; description: string }[] = [
  {
    id: 'kaolin_spinosad',
    label: 'Kaolin Particle Film or Targeted Spinosad',
    description: 'Suppresses chewing striped beetles to halt bacterial wilt transmission.',
  },
  {
    id: 'insecticidal_soap',
    label: 'Potassium Salts of Fatty Acids (Insecticidal Soap)',
    description: 'Controls soft-bodied piercing-sucking aphids upon direct contact.',
  },
  {
    id: 'potassium_bicarbonate',
    label: 'Potassium Bicarbonate Bio-Fungicide',
    description: 'Raises leaf surface pH to collapse powdery mildew fungal spores.',
  },
  {
    id: 'protect_beneficial',
    label: 'Protect Predator: Do Not Apply Insecticide',
    description: 'Preserve beneficial ladybug predators for natural aphid control.',
  },
];

export const PestScoutMiniGame: React.FC<PestScoutMiniGameProps> = ({ onComplete, onClose }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [diagnoses, setDiagnoses] = useState<Record<string, { intervention: IPMIntervention; isCorrect: boolean }>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const specimen = SPECIMENS[currentIdx];
  const isAnswered = !!diagnoses[specimen.id];
  const totalCorrect = Object.values(diagnoses).filter(d => d.isCorrect).length;
  const isFinished = Object.keys(diagnoses).length === SPECIMENS.length;

  const handleSelectIntervention = (intervention: IPMIntervention) => {
    if (isAnswered) return;

    const isCorrect = evaluatePestIntervention(specimen.id, intervention);
    const registryInfo = PEST_REGISTRY[specimen.id];

    if (isCorrect) {
      audio.playSuccessFanfare();
      setFeedback(`CORRECT DIAGNOSIS: ${registryInfo.scientificPathogen}. ${registryInfo.agronomicConsequence}`);
    } else {
      audio.playErrorBuzz();
      setFeedback(`INCORRECT INTERVENTION: ${registryInfo.agronomicConsequence}`);
    }

    setDiagnoses(prev => ({
      ...prev,
      [specimen.id]: { intervention, isCorrect },
    }));
  };

  const handleNext = () => {
    audio.playMenuClick();
    setFeedback(null);
    if (currentIdx < SPECIMENS.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 font-retro select-none animate-odyssey-fade">
      {/* Unified 16-Bit Wood & Brass RPG Frame */}
      <div className="relative w-full max-w-2xl pixel-wood-frame bg-[#241306] text-[#fff8e7] flex flex-col max-h-[92vh] shadow-2xl overflow-hidden">
        {/* Brass Corner Rivets */}
        <div className="absolute top-1.5 left-1.5 w-3 h-3 bg-[#f0c54d] border border-[#140a03] pointer-events-none" />
        <div className="absolute top-1.5 right-1.5 w-3 h-3 bg-[#f0c54d] border border-[#140a03] pointer-events-none" />
        <div className="absolute bottom-1.5 left-1.5 w-3 h-3 bg-[#f0c54d] border border-[#140a03] pointer-events-none" />
        <div className="absolute bottom-1.5 right-1.5 w-3 h-3 bg-[#f0c54d] border border-[#140a03] pointer-events-none" />

        {/* Header */}
        <div className="pixel-wood-bar border-b-4 border-[#6c4722] px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-pixel text-xs sm:text-sm text-[#f0c54d] tracking-wider">
              FIELD SCOUTING &amp; IPM DIAGNOSTIC BENCH
            </h2>
            <p className="text-xs text-[#d8c29d] font-bold">
              Specimen {currentIdx + 1} of {SPECIMENS.length} · Pollinator-Safe Pest Control
            </p>
          </div>
          <button
            onClick={() => {
              audio.playMenuClick();
              onClose();
            }}
            className="px-3 py-1 bg-[#8f2419] hover:bg-[#a82b1e] text-[#fff8e7] border-2 border-[#3c0c0c] shadow-[inset_1px_1px_0px_#d84c37] font-pixel text-[10px] cursor-pointer"
            aria-label="Close pest scouting station"
          >
            [X] CLOSE
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto pixel-dark-scroll space-y-3.5 bg-[#1f1207]">
          {/* Specimen Magnification View */}
          <div className="bg-[#2b1809] border-2 border-[#8e6822] p-3.5 shadow-md">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Retro Loupe Reticle */}
              <div className="w-24 h-24 bg-[#180d05] border-4 border-[#8e6822] flex flex-col items-center justify-center relative shrink-0">
                <div className="font-pixel text-[8px] text-[#d8c29d] tracking-widest text-center">
                  10x LOUPE
                </div>
                <div className="mt-1.5 font-pixel text-[9px] text-[#f0c54d] text-center px-1">
                  {specimen.id === 'cucumber_beetle' && '[BEETLE]'}
                  {specimen.id === 'melon_aphid' && '[APHIDS]'}
                  {specimen.id === 'powdery_mildew' && '[MILDEW]'}
                  {specimen.id === 'beneficial_ladybug' && '[PREDATOR]'}
                </div>
              </div>

              {/* Specimen Observation Log */}
              <div className="flex-1 space-y-1 text-xs">
                <div className="font-pixel text-xs text-[#f0c54d]">{specimen.title}</div>
                <div>
                  <span className="text-[#d8c29d] font-bold">Morphology:</span> {specimen.visualDescription}
                </div>
                <div>
                  <span className="text-[#d8c29d] font-bold">Canopy Zone:</span> {specimen.fieldLocation}
                </div>
                <div>
                  <span className="text-[#d8c29d] font-bold">Crop Impact:</span> {specimen.damageSymptoms}
                </div>
              </div>
            </div>
          </div>

          {/* Treatment Option Selection */}
          <div className="space-y-2">
            <div className="font-pixel text-[10px] text-[#f0c54d]">
              SELECT TARGETED IPM INTERVENTION:
            </div>
            {INTERVENTIONS.map(option => {
              const isSelected = diagnoses[specimen.id]?.intervention === option.id;
              return (
                <button
                  key={option.id}
                  disabled={isAnswered}
                  onClick={() => handleSelectIntervention(option.id)}
                  className={`w-full text-left p-2.5 border-2 transition-none flex flex-col gap-0.5 cursor-pointer ${
                    isSelected
                      ? diagnoses[specimen.id]?.isCorrect
                        ? 'bg-[#1f3a1e] border-[#2ecc71] text-white shadow-[0_0_10px_rgba(46,204,113,0.35)]'
                        : 'bg-[#401a1a] border-[#e74c3c] text-white shadow-[0_0_10px_rgba(231,76,60,0.35)]'
                      : isAnswered
                      ? 'bg-[#1a0f06] border-[#3b210f] text-[#8c6b4e] cursor-not-allowed'
                      : 'bg-[#2b1809] border-[#53331b] hover:border-[#f0c54d] text-[#fff8e7]'
                  }`}
                >
                  <div className="font-pixel text-[10px] text-[#fff8e7]">{option.label}</div>
                  <div className="text-xs text-[#d8c29d]">{option.description}</div>
                </button>
              );
            })}
          </div>

          {/* Diagnostic Feedback */}
          {feedback && (
            <div
              className={`border-2 p-2.5 text-xs font-bold ${
                diagnoses[specimen.id]?.isCorrect
                  ? 'bg-[#1f3a1e] border-[#2ecc71] text-[#d4f8d9]'
                  : 'bg-[#3d1c1c] border-[#e74c3c] text-[#f8d4d4]'
              }`}
            >
              {feedback}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="pixel-wood-bar border-t-4 border-[#6c4722] px-4 py-2.5 flex items-center justify-between">
          <div className="text-xs text-[#d8c29d] font-bold">
            Evaluated: {Object.keys(diagnoses).length}/{SPECIMENS.length} · Score: {totalCorrect}/{SPECIMENS.length}
          </div>
          <div>
            {!isFinished ? (
              <button
                disabled={!isAnswered}
                onClick={handleNext}
                className={`pixel-wood-btn px-4 py-1.5 font-pixel text-[10px] text-[#f0c54d] ${
                  !isAnswered ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                NEXT SPECIMEN &gt;
              </button>
            ) : (
              <button
                onClick={() => {
                  audio.playSuccessFanfare();
                  onComplete();
                }}
                className="px-4 py-1.5 bg-[#27ae60] hover:bg-[#2ecc71] border-2 border-[#fff8e7] font-pixel text-[10px] text-[#09140a] font-bold cursor-pointer shadow-lg"
              >
                SUBMIT IPM REPORT &gt;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
