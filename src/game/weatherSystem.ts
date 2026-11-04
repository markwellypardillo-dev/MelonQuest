/**
 * Dynamic Weather System and Crop Stress Engine for MelonQuest.
 * Strict zero-emoji policy applied.
 */

export type WeatherType = 'optimal' | 'high_humidity' | 'drought';

export interface WeatherMetrics {
  current: WeatherType;
  label: string;
  humidityPct: number;
  temperatureF: number;
  hazardDescription: string;
  remediationHint: string;
  cropStressActive: boolean;
  timeRemainingSeconds: number;
  hazardDurationSeconds: number;
}

export interface WeatherConfig {
  minCycleDuration: number; // default 45 seconds
  maxCycleDuration: number; // default 60 seconds
  stressThresholdSeconds: number; // default 20 seconds
}

export class WeatherSystem {
  private current: WeatherType = 'optimal';
  private timeRemaining: number = 50;
  private hazardDuration: number = 0;
  private cropStressActive: boolean = false;
  private config: WeatherConfig;

  // Callbacks
  public onWeatherChange?: (weather: WeatherType, prev: WeatherType) => void;
  public onCropStressChange?: (isStressed: boolean) => void;

  constructor(config?: Partial<WeatherConfig>) {
    this.config = {
      minCycleDuration: config?.minCycleDuration ?? 45,
      maxCycleDuration: config?.maxCycleDuration ?? 60,
      stressThresholdSeconds: config?.stressThresholdSeconds ?? 20,
    };
    this.timeRemaining = this.getRandomDuration();
  }

  private getRandomDuration(): number {
    return Math.floor(
      this.config.minCycleDuration +
        Math.random() * (this.config.maxCycleDuration - this.config.minCycleDuration)
    );
  }

  public getWeather(): WeatherType {
    return this.current;
  }

  public isCropStressed(): boolean {
    return this.cropStressActive;
  }

  public setWeather(newWeather: WeatherType) {
    const prev = this.current;
    if (prev === newWeather) return;

    this.current = newWeather;
    this.timeRemaining = this.getRandomDuration();
    this.hazardDuration = 0;

    const previouslyStressed = this.cropStressActive;
    this.cropStressActive = false;

    if (previouslyStressed && this.onCropStressChange) {
      this.onCropStressChange(false);
    }

    if (this.onWeatherChange) {
      this.onWeatherChange(newWeather, prev);
    }
  }

  public update(dt: number) {
    this.timeRemaining -= dt;

    if (this.current !== 'optimal') {
      this.hazardDuration += dt;
      if (this.hazardDuration >= this.config.stressThresholdSeconds && !this.cropStressActive) {
        this.cropStressActive = true;
        if (this.onCropStressChange) {
          this.onCropStressChange(true);
        }
      }
    } else {
      this.hazardDuration = 0;
      if (this.cropStressActive) {
        this.cropStressActive = false;
        if (this.onCropStressChange) {
          this.onCropStressChange(false);
        }
      }
    }

    // Cycle to next weather when time expires
    if (this.timeRemaining <= 0) {
      this.cycleWeather();
    }
  }

  private cycleWeather() {
    let next: WeatherType = 'optimal';
    if (this.current === 'optimal') {
      // 50% chance of high humidity, 50% chance of drought
      next = Math.random() < 0.5 ? 'high_humidity' : 'drought';
    } else {
      // Return to optimal after resolving or timing out
      next = 'optimal';
    }
    this.setWeather(next);
  }

  /**
   * Player field remediation interaction.
   */
  public remediate(action: 'irrigation' | 'bio_spray'): { success: boolean; message: string } {
    if (this.current === 'drought' && action === 'irrigation') {
      this.setWeather('optimal');
      return {
        success: true,
        message: 'Drip irrigation engaged. Root zone moisture restored to 60% field capacity.',
      };
    }

    if (this.current === 'high_humidity' && action === 'bio_spray') {
      this.setWeather('optimal');
      return {
        success: true,
        message: 'Protective potassium bicarbonate bio-barrier applied. Fungal spore germination suppressed.',
      };
    }

    return {
      success: false,
      message: 'Active field conditions do not require this intervention.',
    };
  }

  public getMetrics(): WeatherMetrics {
    let label = 'OPTIMAL FIELD CONDITIONS';
    let humidityPct = 52;
    let temperatureF = 78;
    let hazardDescription = 'Photosynthetically active radiation and ambient transpiration rates are balanced.';
    let remediationHint = 'No active field weather hazards.';

    if (this.current === 'high_humidity') {
      label = 'HIGH HUMIDITY & RAINFALL';
      humidityPct = 94;
      temperatureF = 67;
      hazardDescription = 'Elevated leaf moisture dwell time promotes fungal spore germination (Podosphaera xanthii).';
      remediationHint = 'Approach the Bio-Spray Rig at the shed and apply protective bio-barrier [E].';
    } else if (this.current === 'drought') {
      label = 'DROUGHT & HEAT STRESS';
      humidityPct = 21;
      temperatureF = 99;
      hazardDescription = 'Extreme evapotranspiration deficit. Risk of xylem cavitation and blossom-end rot.';
      remediationHint = 'Approach the Southern Canal Valve and engage drip irrigation [E].';
    }

    return {
      current: this.current,
      label,
      humidityPct,
      temperatureF,
      hazardDescription,
      remediationHint,
      cropStressActive: this.cropStressActive,
      timeRemainingSeconds: Math.max(0, Math.ceil(this.timeRemaining)),
      hazardDurationSeconds: Math.floor(this.hazardDuration),
    };
  }

  public reset() {
    this.setWeather('optimal');
    this.cropStressActive = false;
    this.hazardDuration = 0;
  }
}
