/**
 * Application Settings and Hardware Performance Configuration for MelonQuest.
 * Persists user configuration to localStorage.
 * Strict zero-emoji policy applied.
 */

export type DetailLevel = 'high' | 'balanced' | 'performance';
export type ParticleQuality = 'ultra' | 'reduced' | 'off';
export type TouchControlMode = 'auto' | 'always' | 'hidden';

export interface GameSettings {
  detailLevel: DetailLevel;
  particleQuality: ParticleQuality;
  isAudioMuted: boolean;
  volume: number; // 0 to 100
  crtScanlines: boolean;
  touchControls: TouchControlMode;
}

const STORAGE_KEY = 'melonquest_engine_settings';

const DEFAULT_SETTINGS: GameSettings = {
  detailLevel: 'high',
  particleQuality: 'ultra',
  isAudioMuted: false,
  volume: 75,
  crtScanlines: true,
  touchControls: 'auto',
};

type SettingsListener = (settings: GameSettings) => void;
const listeners = new Set<SettingsListener>();

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      detailLevel: ['high', 'balanced', 'performance'].includes(parsed.detailLevel)
        ? parsed.detailLevel
        : DEFAULT_SETTINGS.detailLevel,
      particleQuality: ['ultra', 'reduced', 'off'].includes(parsed.particleQuality)
        ? parsed.particleQuality
        : DEFAULT_SETTINGS.particleQuality,
      isAudioMuted: typeof parsed.isAudioMuted === 'boolean'
        ? parsed.isAudioMuted
        : DEFAULT_SETTINGS.isAudioMuted,
      volume: typeof parsed.volume === 'number' && parsed.volume >= 0 && parsed.volume <= 100
        ? parsed.volume
        : DEFAULT_SETTINGS.volume,
      crtScanlines: typeof parsed.crtScanlines === 'boolean'
        ? parsed.crtScanlines
        : DEFAULT_SETTINGS.crtScanlines,
      touchControls: ['auto', 'always', 'hidden'].includes(parsed.touchControls)
        ? parsed.touchControls
        : DEFAULT_SETTINGS.touchControls,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    listeners.forEach(fn => fn(settings));
  } catch {
    // Non-blocking storage fallback
  }
}

export function updateSetting<K extends keyof GameSettings>(
  key: K,
  val: GameSettings[K]
): GameSettings {
  const current = loadSettings();
  const updated = { ...current, [key]: val };
  saveSettings(updated);
  return updated;
}

export function subscribeToSettings(listener: SettingsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
