/**
 * Periodic Agronomy Examination Modal for MelonQuest.
 * 16-Bit Redesign:
 * - Ornate parchment-colored board with a heavily textured dark wooden outer border studded with metallic rivets
 * - Wrapped in leafy green pixelated vines
 * - Dynamic gold and red 3D pixel typography header with book-and-quill icon
 * - Embossed red/wood [X] Close button
 * - Crisp, dark brown 16-bit question text on aged parchment
 * - Embossed wooden/stone-textured option bars [A], [B], [C], [D] with glowing yellow, orange, and brown borders
 * - Chunky, brightly glowing 3D red/orange adventure-style "NEXT / FINISH QUIZ >" button
 * Strict zero-emoji policy applied.
 */

import React, { useState } from 'react';
import { Quiz } from '../game/farmingData';
import { audio } from '../game/soundEffects';

interface QuizModalProps {
  quiz: Quiz;
  onPass: () => void;
  onClose: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ quiz, onPass, onClose }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const question = quiz.questions[currentIdx];
  const isAnswered = selectedOption !== null;
  const isCurrentCorrect = selectedOption === question.correctIndex;
  const correctCount = answers.filter(Boolean).length + (isCurrentCorrect ? 1 : 0);

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    const correct = idx === question.correctIndex;
    if (correct) {
      audio.playSuccessFanfare();
    } else {
      audio.playErrorBuzz();
    }
  };

  const handleNext = () => {
    audio.playMenuClick();
    const updatedAnswers = [...answers, isCurrentCorrect];
    setAnswers(updatedAnswers);
    setSelectedOption(null);

    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleFinish = () => {
    audio.playQuestComplete();
    onPass();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 font-retro select-none animate-odyssey-fade">
      {/* Outer Textured Dark Wooden Border Studded with Rivets & Leafy Green Vines */}
      <div className="relative w-full max-w-2xl pixel-wood-frame p-3 sm:p-5 max-h-[94vh] overflow-y-auto shadow-2xl">
        {/* Metallic Corner Rivets */}
        <div className="absolute top-2 left-2 w-3.5 h-3.5 bg-[#d4af37] border-2 border-[#4a2e13] flex items-center justify-center shadow-md z-20">
          <div className="w-1 h-1 bg-[#1a0e05]" />
        </div>
        <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-[#d4af37] border-2 border-[#4a2e13] flex items-center justify-center shadow-md z-20">
          <div className="w-1 h-1 bg-[#1a0e05]" />
        </div>
        <div className="absolute bottom-2 left-2 w-3.5 h-3.5 bg-[#d4af37] border-2 border-[#4a2e13] flex items-center justify-center shadow-md z-20">
          <div className="w-1 h-1 bg-[#1a0e05]" />
        </div>
        <div className="absolute bottom-2 right-2 w-3.5 h-3.5 bg-[#d4af37] border-2 border-[#4a2e13] flex items-center justify-center shadow-md z-20">
          <div className="w-1 h-1 bg-[#1a0e05]" />
        </div>

        {/* Wrapped Leafy Green Pixelated Vines */}
        {/* Top-Left Vine */}
        <div className="absolute top-1 left-1 pointer-events-none z-10">
          <svg width="40" height="40" viewBox="0 0 20 20" shapeRendering="crispEdges">
            <rect x="2" y="2" width="4" height="3" fill="#2d7d32" />
            <rect x="6" y="2" width="6" height="2" fill="#388e3c" />
            <rect x="12" y="2" width="3" height="2" fill="#81c784" />
            <rect x="2" y="5" width="2" height="6" fill="#1b5e20" />
            <rect x="2" y="11" width="2" height="4" fill="#81c784" />
            <rect x="5" y="4" width="3" height="3" fill="#4caf50" />
          </svg>
        </div>
        {/* Top-Right Vine */}
        <div className="absolute top-1 right-1 pointer-events-none z-10">
          <svg width="40" height="40" viewBox="0 0 20 20" shapeRendering="crispEdges">
            <rect x="14" y="2" width="4" height="3" fill="#2d7d32" />
            <rect x="8" y="2" width="6" height="2" fill="#388e3c" />
            <rect x="17" y="5" width="2" height="6" fill="#1b5e20" />
            <rect x="12" y="4" width="3" height="3" fill="#4caf50" />
          </svg>
        </div>

        {/* Header: Dynamic Gold and Red 3D Pixel Typography with Book-and-Quill Icon */}
        <div className="flex items-center justify-between border-b-3 border-[#7a4d28] bg-gradient-to-r from-[#3e2411] via-[#543217] to-[#3e2411] p-3 mb-4 shadow-md">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Pixel Book-and-Quill Icon */}
            <div className="w-8 h-8 bg-[#2a1708] border-2 border-[#f1c40f] p-1 flex items-center justify-center shadow-inner shrink-0">
              <svg className="w-full h-full" viewBox="0 0 16 16" shapeRendering="crispEdges">
                <rect x="2" y="4" width="8" height="10" fill="#fcf3cf" />
                <rect x="2" y="3" width="9" height="1" fill="#784212" />
                <rect x="1" y="4" width="1" height="10" fill="#784212" />
                <rect x="10" y="4" width="1" height="10" fill="#784212" />
                <rect x="2" y="14" width="9" height="1" fill="#784212" />
                <rect x="4" y="6" width="4" height="1" fill="#784212" />
                <rect x="4" y="8" width="4" height="1" fill="#784212" />
                <rect x="4" y="10" width="4" height="1" fill="#784212" />
                {/* White / Gold Quill feather */}
                <rect x="10" y="1" width="2" height="3" fill="#ffffff" />
                <rect x="9" y="3" width="2" height="3" fill="#f1c40f" />
                <rect x="8" y="6" width="2" height="2" fill="#d4ac0d" />
                <rect x="7" y="8" width="1" height="2" fill="#111111" /> {/* Quill tip */}
              </svg>
            </div>

            <div>
              <h2 className="font-pixel text-xs sm:text-sm text-[#f1c40f] tracking-wider drop-shadow-[2px_2px_0px_#962d22] uppercase">
                {quiz.title.toUpperCase()}
              </h2>
              <p className="text-[11px] sm:text-xs text-[#f9e79f] font-bold mt-0.5">
                Agronomy Certification Evaluation: Question {currentIdx + 1} of {quiz.questions.length}
              </p>
            </div>
          </div>

          {/* Embossed Red/Wood Box [X] Close Button */}
          <button
            onClick={() => {
              audio.playMenuClick();
              onClose();
            }}
            className="pixel-hanging-sign bg-gradient-to-b from-[#b03a2e] to-[#78281f] hover:from-[#cb4335] hover:to-[#922b21] border-2 border-[#f5b7b1] px-2.5 py-1 text-xs font-pixel text-white shadow-md font-bold shrink-0"
            aria-label="Exit examination"
          >
            [X] CLOSE
          </button>
        </div>

        {!isFinished ? (
          <div>
            {/* Question Text on Warm Aged Parchment Background */}
            <div className="pixel-parchment p-3.5 sm:p-4 mb-4 shadow-md border-3 border-[#8a5d3b]">
              <div className="font-pixel text-xs sm:text-sm text-[#2c1a0a] leading-relaxed font-bold">
                {question.question}
              </div>
            </div>

            {/* Answer Options: Embossed Wooden/Stone-Textured Selection Buttons with Glowing Yellow, Orange, and Brown Borders */}
            <div className="space-y-2.5 mb-4">
              {question.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === question.correctIndex;

                let btnBorder = 'border-2 border-[#b8860b] hover:border-[#f1c40f] hover:shadow-[0_0_12px_rgba(241,196,15,0.45)]';
                let btnBackground = 'bg-gradient-to-r from-[#4d2d13] via-[#5a3617] to-[#42260f] text-[#fff8ec]';
                let badgeStyle = 'bg-[#f1c40f] text-[#3d2606]';

                if (isAnswered) {
                  if (isCorrect) {
                    btnBorder = 'border-3 border-[#a5d6a7] shadow-[0_0_16px_rgba(46,204,113,0.6)]';
                    btnBackground = 'bg-gradient-to-r from-[#1b5e20] to-[#2e7d32] text-white';
                    badgeStyle = 'bg-[#2ecc71] text-white';
                  } else if (isSelected) {
                    btnBorder = 'border-3 border-[#f5b7b1] shadow-[0_0_16px_rgba(231,76,60,0.6)]';
                    btnBackground = 'bg-gradient-to-r from-[#78281f] to-[#922b21] text-white';
                    badgeStyle = 'bg-[#e74c3c] text-white';
                  } else {
                    btnBorder = 'border-2 border-[#4a2e13] opacity-60';
                    btnBackground = 'bg-[#2e1a0b] text-[#bdc3c7]';
                    badgeStyle = 'bg-[#5d4037] text-[#d7ccc8]';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-3 ${btnBorder} ${btnBackground} transition-all duration-150 flex items-start gap-3 cursor-pointer shadow-md rounded-none`}
                  >
                    <span className={`font-pixel text-xs px-2 py-0.5 shrink-0 font-bold ${badgeStyle}`}>
                      [{String.fromCharCode(65 + idx)}]
                    </span>
                    <span className="text-xs sm:text-sm font-bold leading-snug drop-shadow-[1px_1px_0px_#000000]">
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Explanation Box on Parchment */}
            {isAnswered && (
              <div
                className={`p-3.5 mb-4 text-xs font-bold shadow-md border-3 ${
                  isCurrentCorrect
                    ? 'bg-[#1b4324] border-[#2ecc71] text-[#e8f8f5]'
                    : 'bg-[#4a1c1c] border-[#e74c3c] text-[#fbeee6]'
                }`}
              >
                <div className="font-pixel text-[10px] mb-1 tracking-wider uppercase">
                  {isCurrentCorrect ? '[CORRECT SCIENTIFIC ASSESSMENT]' : '[INCORRECT ASSESSMENT]'}
                </div>
                <p className="leading-relaxed">{question.explanation}</p>
              </div>
            )}

            {/* Controls Bar */}
            <div className="flex items-center justify-between pt-3 border-t-2 border-[#7a4d28]">
              <div className="text-xs text-[#f9e79f] font-bold">
                Select the scientifically accurate response.
              </div>
              {/* Chunky, Brightly Glowing 3D Red/Orange Adventure-Style Button with Thick Pixelated Drop Shadows */}
              <button
                disabled={!isAnswered}
                onClick={handleNext}
                className={`pixel-hanging-sign bg-gradient-to-b from-[#e74c3c] via-[#d35400] to-[#a04000] hover:from-[#f39c12] hover:to-[#d35400] border-3 border-[#ffffff] px-5 sm:px-6 py-2.5 font-pixel text-xs sm:text-sm text-white font-bold tracking-wider shadow-[0_4px_0_0_#4a1508,0_0_18px_rgba(231,76,60,0.65)] cursor-pointer transition-transform active:translate-y-1 ${
                  !isAnswered ? 'opacity-40 cursor-not-allowed shadow-none' : ''
                }`}
              >
                {currentIdx < quiz.questions.length - 1 ? 'NEXT QUESTION >' : 'FINISH QUIZ >'}
              </button>
            </div>
          </div>
        ) : (
          /* Quiz Results View on Parchment Board */
          <div className="pixel-parchment p-6 text-center shadow-2xl border-4 border-[#8e6822]">
            <div className="font-pixel text-base text-[#7a4115] mb-2 uppercase tracking-wide">
              EXAMINATION COMPLETE
            </div>
            <div className="font-pixel text-3xl text-[#1b5e20] drop-shadow-[2px_2px_0px_#a5d6a7] my-3">
              SCORE: {correctCount} / {quiz.questions.length}
            </div>
            <p className="text-xs sm:text-sm text-[#4a2e13] font-bold max-w-md mx-auto mb-6 leading-relaxed">
              {correctCount >= 2
                ? 'Certification criteria satisfied! Field observations and theoretical agronomic principles validated.'
                : 'Review the Farming Guidebook and retry the module examination.'}
            </p>
            <div className="flex justify-center gap-4">
              {correctCount >= 2 ? (
                <button
                  onClick={handleFinish}
                  className="pixel-hanging-sign bg-gradient-to-b from-[#27ae60] to-[#1e8449] hover:from-[#2ecc71] hover:to-[#27ae60] border-3 border-[#ffffff] px-6 py-3 font-pixel text-xs sm:text-sm text-white font-bold tracking-wider shadow-[0_4px_0_0_#145a32,0_0_18px_rgba(46,204,113,0.65)]"
                >
                  ADVANCE AGRICULTURAL DEGREE &gt;
                </button>
              ) : (
                <button
                  onClick={() => {
                    audio.playMenuClick();
                    setCurrentIdx(0);
                    setSelectedOption(null);
                    setAnswers([]);
                    setIsFinished(false);
                  }}
                  className="pixel-hanging-sign bg-gradient-to-b from-[#e67e22] to-[#d35400] hover:from-[#f39c12] hover:to-[#e67e22] border-3 border-[#ffffff] px-6 py-2.5 font-pixel text-xs text-white font-bold shadow-lg"
                >
                  RETAKE EXAMINATION
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
