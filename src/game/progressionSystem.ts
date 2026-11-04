/**
 * Progression Reward System (Player Rankings & Collectible Achievement Badges)
 * and System Usability Scale (SUS) Evaluation Module for MelonQuest.
 * Strict zero-emoji policy applied.
 */

export type BadgeId =
  | 'badge_clear'
  | 'badge_sow'
  | 'badge_soil_ph'
  | 'badge_ipm'
  | 'badge_weather'
  | 'badge_emergency'
  | 'badge_brix'
  | 'badge_scholar'
  | 'badge_master';

export interface AchievementBadge {
  id: BadgeId;
  title: string;
  shortDesc: string;
  xpReward: number;
  iconColor: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface PlayerRankTier {
  level: number;
  title: string;
  minXp: number;
  badgeColor: string;
}

export interface LeaderboardEntry {
  name: string;
  institution: string;
  xp: number;
  badges: number;
  isPlayer?: boolean;
}

export interface SusSubmission {
  id: string;
  respondentCode: string;
  timestamp: string;
  ratings: number[]; // 10 SUS items (1..5)
  eduRatings: number[]; // 2 Educational items (1..5)
  susScore: number;
  eduScorePct: number;
  grade: string;
  adjective: string;
}

export const RANK_TIERS: PlayerRankTier[] = [
  { level: 1, title: 'Rank I: Farm Trainee', minXp: 0, badgeColor: '#95a5a6' },
  { level: 2, title: 'Rank II: Soil Technician', minXp: 150, badgeColor: '#3498db' },
  { level: 3, title: 'Rank III: IPM Specialist', minXp: 350, badgeColor: '#2ecc71' },
  { level: 4, title: 'Rank IV: Senior Grower', minXp: 600, badgeColor: '#e67e22' },
  { level: 5, title: 'Rank V: Master Agronomist', minXp: 850, badgeColor: '#f1c40f' },
];

export const INITIAL_BADGES: AchievementBadge[] = [
  {
    id: 'badge_clear',
    title: 'First Furrow',
    shortDesc: 'Clear rocks & weeds in the central garden.',
    xpReward: 50,
    iconColor: '#8d6e63',
    unlocked: false,
  },
  {
    id: 'badge_sow',
    title: 'Precision Seeder',
    shortDesc: 'Sow watermelon seeds into 5 fertilized rows.',
    xpReward: 75,
    iconColor: '#f0c54d',
    unlocked: false,
  },
  {
    id: 'badge_soil_ph',
    title: 'pH 6.5 Titration',
    shortDesc: 'Calibrate soil pH 6.5 & 1-2-2 NPK in lab.',
    xpReward: 125,
    iconColor: '#3498db',
    unlocked: false,
  },
  {
    id: 'badge_ipm',
    title: 'IPM Guardian',
    shortDesc: 'Complete pest scouting & protect pollinators.',
    xpReward: 125,
    iconColor: '#2ecc71',
    unlocked: false,
  },
  {
    id: 'badge_weather',
    title: 'Climate Responder',
    shortDesc: 'Mitigate drought or high-humidity hazard.',
    xpReward: 100,
    iconColor: '#5dade2',
    unlocked: false,
  },
  {
    id: 'badge_emergency',
    title: 'Emergency Exterminator',
    shortDesc: 'Protect growing crops from an emergency pest attack.',
    xpReward: 125,
    iconColor: '#e67e22',
    unlocked: false,
  },
  {
    id: 'badge_brix',
    title: 'Brix Certifier',
    shortDesc: 'Verify 4-point harvest & >= 10 Brix sugar.',
    xpReward: 150,
    iconColor: '#e74c3c',
    unlocked: false,
  },
  {
    id: 'badge_scholar',
    title: 'Agronomy Scholar',
    shortDesc: 'Pass an agronomy phase certification quiz.',
    xpReward: 150,
    iconColor: '#9b59b6',
    unlocked: false,
  },
  {
    id: 'badge_master',
    title: 'DA-BPI Master',
    shortDesc: 'Complete all 4 phases & earn the Diploma.',
    xpReward: 250,
    iconColor: '#f1c40f',
    unlocked: false,
  },
];

export const SUS_QUESTIONS: string[] = [
  '1. I would like to use MelonQuest frequently for learning farming.',
  '2. I found the game unnecessarily complex.',
  '3. I thought the game controls & HUD were easy to use.',
  '4. I would need technical support to be able to play this game.',
  '5. The farming stages, mini-games & quizzes were well integrated.',
  '6. I thought there was too much inconsistency in the game.',
  '7. Most agriculture students would learn to play very quickly.',
  '8. I found the interface cumbersome or awkward to use.',
  '9. I felt confident performing the watermelon farming tasks.',
  '10. I needed to learn many things before I could get going.',
];

export const EDU_QUESTIONS: string[] = [
  'E1. MelonQuest improved my understanding of watermelon soil pH, IPM & harvest Brix.',
  'E2. The 2D RPG simulation is more engaging than static printed handouts.',
];

const PROGRESSION_STORAGE_KEY = 'melonquest_progression_v1';
const SUS_STORAGE_KEY = 'melonquest_sus_evaluations_v1';

export interface ProgressionState {
  xp: number;
  harvestCount: number;
  quizzesPassed: number;
  badges: AchievementBadge[];
}

export function loadProgressionState(): ProgressionState {
  try {
    const raw = localStorage.getItem(PROGRESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const mergedBadges = INITIAL_BADGES.map(initB => {
        const savedB = parsed.badges?.find((b: AchievementBadge) => b.id === initB.id);
        return savedB ? { ...initB, unlocked: Boolean(savedB.unlocked), unlockedAt: savedB.unlockedAt } : { ...initB };
      });
      return {
        xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
        harvestCount: typeof parsed.harvestCount === 'number' ? parsed.harvestCount : 0,
        quizzesPassed: typeof parsed.quizzesPassed === 'number' ? parsed.quizzesPassed : 0,
        badges: mergedBadges,
      };
    }
  } catch {
    // Ignore storage errors
  }
  return {
    xp: 0,
    harvestCount: 0,
    quizzesPassed: 0,
    badges: INITIAL_BADGES.map(b => ({ ...b })),
  };
}

export function saveProgressionState(state: ProgressionState): void {
  try {
    localStorage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function getPlayerRank(xp: number): {
  current: PlayerRankTier;
  next: PlayerRankTier | null;
  progressPct: number;
} {
  let current = RANK_TIERS[0];
  let next: PlayerRankTier | null = RANK_TIERS[1];

  for (let i = 0; i < RANK_TIERS.length; i++) {
    if (xp >= RANK_TIERS[i].minXp) {
      current = RANK_TIERS[i];
      next = RANK_TIERS[i + 1] || null;
    }
  }

  if (!next) {
    return { current, next: null, progressPct: 100 };
  }

  const span = next.minXp - current.minXp;
  const into = xp - current.minXp;
  const progressPct = Math.max(0, Math.min(100, Math.round((into / span) * 100)));
  return { current, next, progressPct };
}

export function getLeaderboard(playerXp: number, playerBadgesCount: number): LeaderboardEntry[] {
  const peers: LeaderboardEntry[] = [
    { name: 'J. Dela Cruz', institution: 'CLSU Agri. Sci.', xp: 780, badges: 7 },
    { name: 'M. Santos', institution: 'UPLB Agronomy', xp: 560, badges: 5 },
    { name: 'A. Reyes', institution: 'BSU Crop Sci.', xp: 340, badges: 3 },
    { name: 'K. Bautista', institution: 'VSU Horti.', xp: 140, badges: 2 },
    {
      name: 'YOU (Research Asst.)',
      institution: 'MelonQuest Station',
      xp: playerXp,
      badges: playerBadgesCount,
      isPlayer: true,
    },
  ];

  return peers.sort((a, b) => b.xp - a.xp);
}

/**
 * Standard Brooke (1996) System Usability Scale (SUS) Calculation:
 * Odd items (indices 0,2,4,6,8): score - 1
 * Even items (indices 1,3,5,7,9): 5 - score
 * Sum * 2.5 => 0 to 100 scale
 */
export function calculateSusScore(ratings: number[]): {
  score: number;
  grade: string;
  adjective: string;
} {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const val = ratings[i] ?? 3;
    if (i % 2 === 0) {
      sum += val - 1;
    } else {
      sum += 5 - val;
    }
  }
  const score = Math.round(sum * 2.5 * 10) / 10;

  if (score >= 85) return { score, grade: 'A+', adjective: 'EXCELLENT (ACCEPTABLE)' };
  if (score >= 72.5) return { score, grade: 'A', adjective: 'GOOD (ACCEPTABLE)' };
  if (score >= 68) return { score, grade: 'B', adjective: 'ABOVE AVERAGE' };
  if (score >= 52) return { score, grade: 'C', adjective: 'MARGINAL' };
  return { score, grade: 'D', adjective: 'NEEDS IMPROVEMENT' };
}

export function loadSusSubmissions(): SusSubmission[] {
  try {
    const raw = localStorage.getItem(SUS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore storage errors
  }
  return [];
}

export function saveSusSubmission(sub: SusSubmission): SusSubmission[] {
  const existing = loadSusSubmissions();
  const next = [sub, ...existing];
  try {
    localStorage.setItem(SUS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors
  }
  return next;
}
