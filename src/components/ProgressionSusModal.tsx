/**
 * Progression Reward System (Collectible Badges & Player Rankings)
 * + System Usability Scale (SUS) Evaluation Modal for MelonQuest.
 * Unified 16-Bit Wood, Brass & Forest-Green RPG HUD Theme.
 * Strict zero-emoji policy applied.
 */

import React, { useState } from 'react';
import {
  AchievementBadge,
  BadgeId,
  ProgressionState,
  SUS_QUESTIONS,
  EDU_QUESTIONS,
  getPlayerRank,
  getLeaderboard,
  calculateSusScore,
  loadSusSubmissions,
  saveSusSubmission,
  SusSubmission,
} from '../game/progressionSystem';
import { audio } from '../game/soundEffects';

interface ProgressionSusModalProps {
  progression: ProgressionState;
  initialTab?: 'badges' | 'rankings' | 'sus';
  onClose: () => void;
}

export const ProgressionSusModal: React.FC<ProgressionSusModalProps> = ({
  progression,
  initialTab = 'badges',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'badges' | 'rankings' | 'sus'>(initialTab);
  const [respondentCode, setRespondentCode] = useState('AGRI-STUDENT-01');
  const [susRatings, setSusRatings] = useState<number[]>([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]);
  const [eduRatings, setEduRatings] = useState<number[]>([5, 5]);
  const [submissions, setSubmissions] = useState<SusSubmission[]>(() => loadSusSubmissions());
  const [savedNotice, setSavedNotice] = useState(false);

  const unlockedCount = progression.badges.filter(b => b.unlocked).length;
  const rankInfo = getPlayerRank(progression.xp);
  const leaderboard = getLeaderboard(progression.xp, unlockedCount);
  const susResult = calculateSusScore(susRatings);
  const eduPct = Math.round(((eduRatings[0] + eduRatings[1]) / 10) * 100);

  const renderBadgePixelIcon = (id: BadgeId, unlocked: boolean) => {
    const dim = unlocked ? '' : 'opacity-55 saturate-50';
    switch (id) {
      case 'badge_clear':
        return (
          <svg className={`w-8 h-8 ${dim}`} viewBox="0 0 16 16" shapeRendering="crispEdges">
            <rect x="2" y="2" width="12" height="12" fill="#4e342e" />
            <rect x="4" y="4" width="8" height="8" fill="#8d6e63" />
            <rect x="6" y="3" width="4" height="2" fill="#88d46c" />
            <rect x="5" y="7" width="6" height="3" fill="#d7ccc8" />
          </svg>
        );
      case 'badge_sow':
        return (
          <svg className={`w-8 h-8 ${dim}`} viewBox="0 0 16 16" shapeRendering="crispEdges">
            <rect x="2" y="2" width="12" height="12" fill="#3e2723" />
            <rect x="5" y="5" width="2" height="2" fill="#f0c54d" />
            <rect x="9" y="5" width="2" height="2" fill="#f0c54d" />
            <rect x="7" y="8" width="2" height="2" fill="#f0c54d" />
            <rect x="5" y="11" width="6" height="2" fill="#68b54e" />
          </svg>
        );
      case 'badge_soil_ph':
        return (
          <svg className={`w-8 h-8 ${dim}`} viewBox="0 0 16 16" shapeRendering="crispEdges">
            <rect x="2" y="2" width="12" height="12" fill="#1b3a4b" />
            <rect x="6" y="3" width="4" height="3" fill="#d8c29d" />
            <rect x="5" y="6" width="6" height="7" fill="#3498db" />
            <rect x="6" y="9" width="4" height="3" fill="#2ecc71" />
          </svg>
        );
      case 'badge_ipm':
        return (
          <svg className={`w-8 h-8 ${dim}`} viewBox="0 0 16 16" shapeRendering="crispEdges">
            <rect x="2" y="2" width="12" height="12" fill="#145a32" />
            <rect x="5" y="5" width="6" height="6" fill="#e74c3c" />
            <rect x="7" y="4" width="2" height="2" fill="#111111" />
            <rect x="6" y="7" width="1" height="1" fill="#111111" />
            <rect x="9" y="7" width="1" height="1" fill="#111111" />
          </svg>
        );
      case 'badge_weather':
        return (
          <svg className={`w-8 h-8 ${dim}`} viewBox="0 0 16 16" shapeRendering="crispEdges">
            <rect x="2" y="2" width="12" height="12" fill="#1b4f72" />
            <rect x="4" y="5" width="8" height="4" fill="#fff8e7" />
            <rect x="5" y="10" width="2" height="3" fill="#5dade2" />
            <rect x="9" y="10" width="2" height="3" fill="#5dade2" />
          </svg>
        );
      case 'badge_brix':
        return (
          <svg className={`w-8 h-8 ${dim}`} viewBox="0 0 16 16" shapeRendering="crispEdges">
            <rect x="2" y="2" width="12" height="12" fill="#1b5e20" />
            <rect x="4" y="5" width="8" height="6" fill="#2e7d32" />
            <rect x="5" y="6" width="6" height="4" fill="#e74c3c" />
            <rect x="7" y="7" width="2" height="2" fill="#111111" />
          </svg>
        );
      case 'badge_scholar':
        return (
          <svg className={`w-8 h-8 ${dim}`} viewBox="0 0 16 16" shapeRendering="crispEdges">
            <rect x="2" y="2" width="12" height="12" fill="#4a2c14" />
            <rect x="4" y="5" width="8" height="3" fill="#f0c54d" />
            <rect x="5" y="8" width="6" height="4" fill="#fff8e7" />
          </svg>
        );
      case 'badge_master':
      default:
        return (
          <svg className={`w-8 h-8 ${dim}`} viewBox="0 0 16 16" shapeRendering="crispEdges">
            <rect x="2" y="2" width="12" height="12" fill="#7d6608" />
            <rect x="4" y="4" width="8" height="8" fill="#f0c54d" />
            <rect x="6" y="6" width="4" height="4" fill="#fff8e7" />
          </svg>
        );
    }
  };

  const handleSaveEvaluation = () => {
    audio.playSuccessFanfare();
    const newSub: SusSubmission = {
      id: `SUS-${Date.now()}`,
      respondentCode: respondentCode.trim() || `AGRI-${submissions.length + 1}`,
      timestamp: new Date().toLocaleString(),
      ratings: [...susRatings],
      eduRatings: [...eduRatings],
      susScore: susResult.score,
      eduScorePct: eduPct,
      grade: susResult.grade,
      adjective: susResult.adjective,
    };
    const updated = saveSusSubmission(newSub);
    setSubmissions(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleExportCsv = () => {
    audio.playMenuClick();
    const rows = [
      [
        'Respondent',
        'Timestamp',
        'Q1',
        'Q2',
        'Q3',
        'Q4',
        'Q5',
        'Q6',
        'Q7',
        'Q8',
        'Q9',
        'Q10',
        'E1_Learning',
        'E2_Engagement',
        'SUS_Score_100',
        'Edu_Score_Pct',
        'Grade',
        'Rating',
      ].join(','),
      ...submissions.map(s =>
        [
          `"${s.respondentCode}"`,
          `"${s.timestamp}"`,
          ...s.ratings,
          ...s.eduRatings,
          s.susScore,
          s.eduScorePct,
          `"${s.grade}"`,
          `"${s.adjective}"`,
        ].join(',')
      ),
    ];

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MelonQuest_SUS_Evaluation_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 font-retro select-none animate-odyssey-fade">
      {/* Unified 16-Bit Wood & Brass RPG Frame */}
      <div className="relative w-full max-w-3xl pixel-wood-frame bg-[#241306] text-[#fff8e7] flex flex-col max-h-[92vh] shadow-2xl">
        {/* Brass Corner Rivets */}
        <div className="absolute top-1.5 left-1.5 w-3 h-3 bg-[#f0c54d] border border-[#241306] pointer-events-none" />
        <div className="absolute top-1.5 right-1.5 w-3 h-3 bg-[#f0c54d] border border-[#241306] pointer-events-none" />
        <div className="absolute bottom-1.5 left-1.5 w-3 h-3 bg-[#f0c54d] border border-[#241306] pointer-events-none" />
        <div className="absolute bottom-1.5 right-1.5 w-3 h-3 bg-[#f0c54d] border border-[#241306] pointer-events-none" />

        {/* Top Wood & Brass HUD Header */}
        <div className="pixel-wood-bar border-b-4 border-[#6c4722] px-4 py-3 flex items-center justify-between bg-[#1a0f06]">
          <div>
            <h2 className="font-pixel text-xs sm:text-sm text-[#f0c54d] tracking-wider">
              PROGRESSION, RANKINGS &amp; SUS EVALUATION
            </h2>
            <p className="text-xs text-[#d8c29d] font-bold">
              {rankInfo.current.title} · {progression.xp} XP · {unlockedCount}/8 Badges
            </p>
          </div>
          <button
            onClick={() => {
              audio.playMenuClick();
              onClose();
            }}
            className="px-3 py-1 bg-[#8f2419] hover:bg-[#a82b1e] text-[#fff8e7] border-2 border-[#3c0c0c] shadow-[inset_1px_1px_0px_#d84c37] font-pixel text-[10px] cursor-pointer"
          >
            [X] CLOSE
          </button>
        </div>

        {/* Wood & Brass Navigation Tabs */}
        <div className="flex border-b-2 border-[#6c4722] bg-[#140b04] px-4 pt-2 gap-2">
          <button
            onClick={() => {
              audio.playMenuClick();
              setActiveTab('badges');
            }}
            className={`px-3 py-1.5 font-pixel text-[9px] sm:text-[10px] border-t-2 border-x-2 cursor-pointer transition-colors ${
              activeTab === 'badges'
                ? 'bg-[#241306] text-[#f0c54d] border-[#f0c54d]'
                : 'bg-[#180d05] text-[#d8c29d] border-[#3b210f] hover:text-[#fff8e7] hover:bg-[#201207]'
            }`}
          >
            BADGES ({unlockedCount}/8)
          </button>
          <button
            onClick={() => {
              audio.playMenuClick();
              setActiveTab('rankings');
            }}
            className={`px-3 py-1.5 font-pixel text-[9px] sm:text-[10px] border-t-2 border-x-2 cursor-pointer transition-colors ${
              activeTab === 'rankings'
                ? 'bg-[#241306] text-[#f0c54d] border-[#f0c54d]'
                : 'bg-[#180d05] text-[#d8c29d] border-[#3b210f] hover:text-[#fff8e7] hover:bg-[#201207]'
            }`}
          >
            PLAYER RANKINGS
          </button>
          <button
            onClick={() => {
              audio.playMenuClick();
              setActiveTab('sus');
            }}
            className={`px-3 py-1.5 font-pixel text-[9px] sm:text-[10px] border-t-2 border-x-2 cursor-pointer transition-colors ${
              activeTab === 'sus'
                ? 'bg-[#241306] text-[#88d46c] border-[#88d46c]'
                : 'bg-[#180d05] text-[#d8c29d] border-[#3b210f] hover:text-[#fff8e7] hover:bg-[#201207]'
            }`}
          >
            SUS EVALUATION
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 overflow-y-auto pixel-dark-scroll flex-1 bg-[#1f1207]">
          {/* TAB 1: COLLECTIBLE BADGES */}
          {activeTab === 'badges' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {progression.badges.map((badge: AchievementBadge) => (
                <div
                  key={badge.id}
                  className={`p-3 border-2 flex items-center gap-3 ${
                    badge.unlocked
                      ? 'bg-[#2b1809] border-[#f0c54d]'
                      : 'bg-[#1a0f06] border-[#53331b]'
                  }`}
                >
                  <div
                    className={`p-1.5 border shrink-0 ${
                      badge.unlocked
                        ? 'bg-[#241306] border-[#f0c54d]'
                        : 'bg-[#120a04] border-[#53331b]'
                    }`}
                  >
                    {renderBadgePixelIcon(badge.id, badge.unlocked)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`font-pixel text-[10px] truncate ${
                          badge.unlocked ? 'text-[#fff8e7]' : 'text-[#d8c29d]'
                        }`}
                      >
                        {badge.title}
                      </span>
                      <span
                        className={`font-pixel text-[8px] px-1.5 py-0.5 shrink-0 ${
                          badge.unlocked
                            ? 'bg-[#2ecc71] text-[#09140a] font-bold'
                            : 'bg-[#241306] text-[#f0c54d] border border-[#6c4722]'
                        }`}
                      >
                        {badge.unlocked ? 'UNLOCKED' : `+${badge.xpReward} XP`}
                      </span>
                    </div>
                    <p className="text-xs text-[#c0a480] mt-1 leading-snug">
                      {badge.shortDesc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: PLAYER RANKINGS */}
          {activeTab === 'rankings' && (
            <div className="space-y-3.5">
              {/* Current Player Rank Banner */}
              <div className="bg-[#2b1809] border-2 border-[#f0c54d] p-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-pixel text-[9px] text-[#d8c29d]">CURRENT AGRONOMY RANK</div>
                  <div className="font-pixel text-sm text-[#f0c54d] mt-0.5">
                    {rankInfo.current.title}
                  </div>
                </div>
                <div className="w-full sm:w-64">
                  <div className="flex justify-between font-pixel text-[8px] text-[#fff8e7] mb-1">
                    <span>{progression.xp} XP</span>
                    <span>
                      {rankInfo.next ? `NEXT: ${rankInfo.next.minXp} XP` : 'MAX RANK'}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#140b04] border border-[#6c4722]">
                    <div
                      className="h-full bg-[#88d46c] transition-all"
                      style={{ width: `${rankInfo.progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Leaderboard Table */}
              <div className="border-2 border-[#6c4722] bg-[#1a0f06]">
                <div className="grid grid-cols-12 px-3 py-2 bg-[#241306] border-b-2 border-[#6c4722] font-pixel text-[8px] text-[#f0c54d]">
                  <div className="col-span-2">RANK</div>
                  <div className="col-span-5">RESEARCHER</div>
                  <div className="col-span-3">BADGES</div>
                  <div className="col-span-2 text-right">XP</div>
                </div>
                {leaderboard.map((row, idx) => (
                  <div
                    key={row.name}
                    className={`grid grid-cols-12 px-3 py-2.5 items-center border-b border-[#2b1809] text-xs font-bold ${
                      row.isPlayer
                        ? 'bg-[#3a200d] text-[#f0c54d]'
                        : 'bg-[#1c0f05] text-[#d8c29d]'
                    }`}
                  >
                    <div className="col-span-2 font-pixel text-[10px]">#{idx + 1}</div>
                    <div className="col-span-5 truncate">
                      {row.name}{' '}
                      <span className="text-[10px] text-[#a88c68] block sm:inline">
                        ({row.institution})
                      </span>
                    </div>
                    <div className="col-span-3 font-pixel text-[9px] text-[#88d46c]">
                      {row.badges}/8 BADGES
                    </div>
                    <div className="col-span-2 text-right font-pixel text-[10px]">
                      {row.xp}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM USABILITY SCALE (SUS) SURVEY */}
          {activeTab === 'sus' && (
            <div className="space-y-2.5">
              {/* Top Live Score & Respondent Bar */}
              <div className="bg-[#2b1809] border-2 border-[#6c4722] p-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[9px] text-[#d8c29d]">RESPONDENT:</span>
                  <input
                    type="text"
                    value={respondentCode}
                    onChange={e => setRespondentCode(e.target.value)}
                    className="bg-[#1a0f06] border-2 border-[#6c4722] px-2.5 py-1 text-[10px] font-pixel text-[#f0c54d] w-48 sm:w-52 focus:outline-none focus:border-[#f0c54d]"
                  />
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <span className="font-pixel text-[8px] text-[#d8c29d] block">
                      SUS SCORE · {susResult.adjective}
                    </span>
                    <span className="font-pixel text-xs sm:text-sm text-[#f0c54d]">
                      {susResult.score}/100 · GRADE {susResult.grade}
                    </span>
                  </div>
                  <button
                    onClick={handleSaveEvaluation}
                    className="px-3 py-1.5 bg-[#27ae60] hover:bg-[#2ecc71] text-[#09140a] font-pixel text-[9px] font-bold border-2 border-[#a9dfbf] cursor-pointer"
                  >
                    {savedNotice ? 'SAVED [OK]' : 'SAVE SCORE'}
                  </button>
                  {submissions.length > 0 && (
                    <button
                      onClick={handleExportCsv}
                      className="pixel-wood-btn px-2.5 py-1.5 font-pixel text-[9px] text-[#f0c54d]"
                    >
                      CSV ({submissions.length})
                    </button>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-[#d8c29d] font-bold flex justify-between px-1">
                <span>SCALE: [1] Strongly Disagree — [5] Strongly Agree</span>
                <span className="text-[#88d46c]">EDU SCORE: {eduPct}%</span>
              </div>

              {/* 2-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {SUS_QUESTIONS.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="bg-[#2b1809] border border-[#53331b] px-2.5 py-1.5 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-bold text-[#fff8e7] leading-tight">{q}</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map(val => (
                        <button
                          key={val}
                          onClick={() => {
                            audio.playMenuClick();
                            setSusRatings(prev => {
                              const copy = [...prev];
                              copy[qIdx] = val;
                              return copy;
                            });
                          }}
                          className={`w-6 h-5 font-pixel text-[8px] border cursor-pointer ${
                            susRatings[qIdx] === val
                              ? 'bg-[#f0c54d] text-[#241306] border-[#fff8e7] font-bold'
                              : 'bg-[#1a0f06] text-[#d8c29d] border-[#53331b] hover:text-white'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Educational Effectiveness Items */}
                {EDU_QUESTIONS.map((eq, eIdx) => (
                  <div
                    key={`edu-${eIdx}`}
                    className="bg-[#341d0b] border border-[#8e6822] px-2.5 py-1.5 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-bold text-[#f0c54d] leading-tight">{eq}</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map(val => (
                        <button
                          key={val}
                          onClick={() => {
                            audio.playMenuClick();
                            setEduRatings(prev => {
                              const copy = [...prev];
                              copy[eIdx] = val;
                              return copy;
                            });
                          }}
                          className={`w-6 h-5 font-pixel text-[8px] border cursor-pointer ${
                            eduRatings[eIdx] === val
                              ? 'bg-[#2ecc71] text-[#09140a] border-[#fff8e7] font-bold'
                              : 'bg-[#1a0f06] text-[#d8c29d] border-[#53331b] hover:text-white'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Wood & Brass HUD Bar */}
        <div className="pixel-wood-bar border-t-4 border-[#6c4722] px-4 py-2.5 flex items-center justify-between text-xs">
          <span className="text-[#d8c29d] font-bold">
            DA-BPI Philippine Lowland Watermelon Agronomy Standard
          </span>
          <button
            onClick={() => {
              audio.playMenuClick();
              onClose();
            }}
            className="pixel-wood-btn px-4 py-1.5 font-pixel text-[9px] text-[#f0c54d]"
          >
            RETURN TO FARM
          </button>
        </div>
      </div>
    </div>
  );
};
