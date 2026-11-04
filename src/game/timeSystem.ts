/**
 * Dynamic Time & Calendar System for MelonQuest.
 * Handles in-game clock, days of the week, time scaling (1x to 6x),
 * day/night ambient lighting, sleep fast-forward, stamina, and crop growth/spoilage ticks.
 * Strict zero-emoji policy applied.
 */

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type DayNightPhase = 'dawn' | 'day' | 'dusk' | 'night';

export type MelonGrowthStage = 'seed' | 'sprout' | 'vine' | 'flowering' | 'fruiting' | 'mature' | 'spoiled';

export interface GameTimeState {
  totalMinutes: number; // In-game minutes elapsed since game start
  day: number;          // Day count (starts at Day 1)
  dayOfWeek: DayOfWeek;
  hour: number;         // 0 - 23
  minute: number;       // 0 - 59
  timeSpeed: 1 | 2 | 3 | 4 | 5 | 6; // Time acceleration multiplier
  phase: DayNightPhase;
  ambientLight: {
    color: string;
    alpha: number;
  };
  stamina: number;      // 0 - 100
  maxStamina: number;
}

export interface CropGrowthCalculation {
  stage: MelonGrowthStage;
  stageIndex: number;
  isSpoiled: boolean;
  isHarvestable: boolean;
  progressPercent: number;
  timeRemainingToNextStageMinutes: number;
}

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// Cumulative minutes required to complete each growth stage
export const CROP_STAGE_THRESHOLDS = {
  seed: 180,       // 0 - 3 in-game hours
  sprout: 480,     // 3 - 8 in-game hours
  vine: 960,       // 8 - 16 in-game hours
  flowering: 1440, // 16 - 24 in-game hours (1 day)
  fruiting: 2160,  // 24 - 36 in-game hours (1.5 days)
  mature: 2160,    // Reaches harvest maturity at 36 in-game hours
  spoilageWindow: 1440, // 24 hours of maturity before spoiling if unharvested
};

/**
 * Pure calculation function for melon growth stages and spoilage.
 */
export function calculateMelonGrowth(
  growthMinutes: number,
  matureMinutes: number,
  spoilageThreshold: number = CROP_STAGE_THRESHOLDS.spoilageWindow
): CropGrowthCalculation {
  if (matureMinutes >= spoilageThreshold) {
    return {
      stage: 'spoiled',
      stageIndex: 6,
      isSpoiled: true,
      isHarvestable: false,
      progressPercent: 100,
      timeRemainingToNextStageMinutes: 0,
    };
  }

  if (growthMinutes >= CROP_STAGE_THRESHOLDS.fruiting) {
    return {
      stage: 'mature',
      stageIndex: 5,
      isSpoiled: false,
      isHarvestable: true,
      progressPercent: 100,
      timeRemainingToNextStageMinutes: Math.max(0, spoilageThreshold - matureMinutes),
    };
  }

  if (growthMinutes >= CROP_STAGE_THRESHOLDS.flowering) {
    const stageSpan = CROP_STAGE_THRESHOLDS.fruiting - CROP_STAGE_THRESHOLDS.flowering;
    const progress = (growthMinutes - CROP_STAGE_THRESHOLDS.flowering) / stageSpan;
    return {
      stage: 'fruiting',
      stageIndex: 4,
      isSpoiled: false,
      isHarvestable: false,
      progressPercent: Math.min(100, Math.floor(progress * 100)),
      timeRemainingToNextStageMinutes: CROP_STAGE_THRESHOLDS.fruiting - growthMinutes,
    };
  }

  if (growthMinutes >= CROP_STAGE_THRESHOLDS.vine) {
    const stageSpan = CROP_STAGE_THRESHOLDS.flowering - CROP_STAGE_THRESHOLDS.vine;
    const progress = (growthMinutes - CROP_STAGE_THRESHOLDS.vine) / stageSpan;
    return {
      stage: 'flowering',
      stageIndex: 3,
      isSpoiled: false,
      isHarvestable: false,
      progressPercent: Math.min(100, Math.floor(progress * 100)),
      timeRemainingToNextStageMinutes: CROP_STAGE_THRESHOLDS.flowering - growthMinutes,
    };
  }

  if (growthMinutes >= CROP_STAGE_THRESHOLDS.sprout) {
    const stageSpan = CROP_STAGE_THRESHOLDS.vine - CROP_STAGE_THRESHOLDS.sprout;
    const progress = (growthMinutes - CROP_STAGE_THRESHOLDS.sprout) / stageSpan;
    return {
      stage: 'vine',
      stageIndex: 2,
      isSpoiled: false,
      isHarvestable: false,
      progressPercent: Math.min(100, Math.floor(progress * 100)),
      timeRemainingToNextStageMinutes: CROP_STAGE_THRESHOLDS.vine - growthMinutes,
    };
  }

  if (growthMinutes >= CROP_STAGE_THRESHOLDS.seed) {
    const stageSpan = CROP_STAGE_THRESHOLDS.sprout - CROP_STAGE_THRESHOLDS.seed;
    const progress = (growthMinutes - CROP_STAGE_THRESHOLDS.seed) / stageSpan;
    return {
      stage: 'sprout',
      stageIndex: 1,
      isSpoiled: false,
      isHarvestable: false,
      progressPercent: Math.min(100, Math.floor(progress * 100)),
      timeRemainingToNextStageMinutes: CROP_STAGE_THRESHOLDS.sprout - growthMinutes,
    };
  }

  const progress = growthMinutes / CROP_STAGE_THRESHOLDS.seed;
  return {
    stage: 'seed',
    stageIndex: 0,
    isSpoiled: false,
    isHarvestable: false,
    progressPercent: Math.min(100, Math.floor(progress * 100)),
    timeRemainingToNextStageMinutes: CROP_STAGE_THRESHOLDS.seed - growthMinutes,
  };
}

export class TimeAndCalendarSystem {
  // In-game starting time: 09:30 AM on Monday, Day 15 (Clear daylight)
  private totalMinutes = 14 * 24 * 60 + 9 * 60 + 30;
  private timeSpeed: 1 | 2 | 3 | 4 | 5 | 6 = 1;
  private accumulatorSeconds = 0;
  public stamina = 100;
  public maxStamina = 100;

  // Real-world seconds per in-game minute at 1x speed (1 real second = 1 in-game minute)
  private readonly realSecondsPerInGameMinute = 1.0;

  // Callbacks
  public onDayPass?: (newDay: number, dayOfWeek: DayOfWeek) => void;
  public onHourPass?: (hour: number) => void;

  constructor(initialMinutes = 14 * 24 * 60 + 9 * 60 + 30) {
    this.totalMinutes = initialMinutes;
  }

  /**
   * Update in-game clock based on delta time and active time speed multiplier.
   * @param deltaSeconds Frame elapsed real time in seconds.
   * @returns Number of in-game minutes elapsed during this update tick.
   */
  public update(deltaSeconds: number): number {
    this.accumulatorSeconds += deltaSeconds * this.timeSpeed;
    let minutesAdvanced = 0;

    while (this.accumulatorSeconds >= this.realSecondsPerInGameMinute) {
      this.accumulatorSeconds -= this.realSecondsPerInGameMinute;
      this.totalMinutes += 1;
      minutesAdvanced += 1;

      // Drain minor stamina when active (roughly 1 pt per 25 in-game minutes)
      if (this.totalMinutes % 25 === 0 && this.stamina > 5) {
        this.stamina = Math.max(5, this.stamina - 1);
      }

      const currentMinute = this.totalMinutes % 60;
      if (currentMinute === 0) {
        const hour = Math.floor((this.totalMinutes % (24 * 60)) / 60);
        this.onHourPass?.(hour);
        if (hour === 0) {
          const day = Math.floor(this.totalMinutes / (24 * 60)) + 1;
          const dayOfWeek = DAYS[(day - 1) % 7];
          this.onDayPass?.(day, dayOfWeek);
        }
      }
    }

    return minutesAdvanced;
  }

  /**
   * Fast forward time to 06:00 AM the following morning and restore stamina to 100%.
   * Used when interacting with the residential cabin bed.
   * @returns In-game minutes elapsed during the sleep transition.
   */
  public sleepUntilMorning(): number {
    const currentDay = Math.floor(this.totalMinutes / (24 * 60));
    const nextDayMorning = (currentDay + 1) * 24 * 60 + 6 * 60;
    const elapsed = nextDayMorning - this.totalMinutes;
    this.totalMinutes = nextDayMorning;
    this.stamina = this.maxStamina;
    this.accumulatorSeconds = 0;

    const day = Math.floor(this.totalMinutes / (24 * 60)) + 1;
    const dayOfWeek = DAYS[(day - 1) % 7];
    this.onDayPass?.(day, dayOfWeek);
    this.onHourPass?.(6);

    return elapsed;
  }

  /**
   * Set time scaling speed (1x to 6x).
   */
  public setTimeSpeed(speed: 1 | 2 | 3 | 4 | 5 | 6) {
    this.timeSpeed = speed;
  }

  public getTimeSpeed(): 1 | 2 | 3 | 4 | 5 | 6 {
    return this.timeSpeed;
  }

  public consumeStamina(amount: number): boolean {
    if (this.stamina >= amount) {
      this.stamina -= amount;
      return true;
    }
    return false;
  }

  public restoreStamina(amount: number) {
    this.stamina = Math.min(this.maxStamina, this.stamina + amount);
  }

  /**
   * Extract comprehensive state snapshot for UI render and engine lighting.
   */
  public getState(): GameTimeState {
    const day = Math.floor(this.totalMinutes / (24 * 60)) + 1;
    const dayOfWeek = DAYS[(day - 1) % 7];
    const minutesInDay = this.totalMinutes % (24 * 60);
    const hour = Math.floor(minutesInDay / 60);
    const minute = minutesInDay % 60;

    // Day/Night Phase and Ambient Tinting Calculation:
    // Dawn: 05:00 - 07:59 (Golden warm tint)
    // Day:  08:00 - 18:59 (Clear daylight)
    // Dusk: 19:00 - 20:59 (Amber/Reddish twilight)
    // Night: 21:00 - 04:59 (Deep navy moonlight)
    let phase: DayNightPhase = 'day';
    let ambientColor = 'rgba(0, 0, 0, 0)';
    let ambientAlpha = 0;

    if (hour >= 5 && hour < 8) {
      phase = 'dawn';
      ambientColor = '#e67e22';
      const progress = (hour - 5 + minute / 60) / 3;
      ambientAlpha = 0.3 * (1 - progress);
    } else if (hour >= 8 && hour < 19) {
      phase = 'day';
      ambientColor = '#000000';
      ambientAlpha = 0;
    } else if (hour >= 19 && hour < 21) {
      phase = 'dusk';
      ambientColor = '#8e44ad';
      const progress = (hour - 19 + minute / 60) / 2;
      ambientAlpha = 0.12 + 0.22 * progress;
    } else {
      phase = 'night';
      ambientColor = '#0b162c';
      ambientAlpha = 0.52;
    }

    return {
      totalMinutes: this.totalMinutes,
      day,
      dayOfWeek,
      hour,
      minute,
      timeSpeed: this.timeSpeed,
      phase,
      ambientLight: {
        color: ambientColor,
        alpha: ambientAlpha,
      },
      stamina: this.stamina,
      maxStamina: this.maxStamina,
    };
  }

  /**
   * Formatted digital time string (e.g., "08:45 AM").
   */
  public getFormattedTime(): string {
    const { hour, minute } = this.getState();
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const formattedMinute = minute < 10 ? `0${minute}` : minute;
    return `${displayHour}:${formattedMinute} ${period}`;
  }
}
