/**
 * Core 2D Canvas Tilemap and Entity Engine for MelonQuest.
 * Features:
 * 1. Single central garden plot inside the fenced farm field where the entire chronological staging
 *    and in-game time growing animation take place ("Clear [E]" -> "Sow [E]" -> In-Game Time Growth -> "[E] Harvest").
 * 2. Functional Agronomy Laboratory Building:
 *    - Approaching the exterior Lab door displays "Open Door: Enter Lab [E]".
 *    - Entering switches to the dedicated Laboratory Interior scene (only the lab interior is visible),
 *      housing Professor Citrullus, Lab Tech Maya, the Soil Science Assay Bench, and the Brix Station.
 *    - Approaching the interior door displays "Open Door: Exit Lab [E]" to return outside to the farm.
 * Strict zero-emoji policy applied.
 */

import { getSpriteAtlas, type SpriteAtlas, refreshPlayerSprites } from './spriteGenerator.ts';
import { audio } from './soundEffects.ts';
import { WeatherSystem, type WeatherMetrics } from './weatherSystem.ts';
import { WeatherParticleSystem } from './weatherParticles.ts';
import { type DetailLevel } from './settings.ts';
import {
  TimeAndCalendarSystem,
  type GameTimeState,
  CROP_STAGE_THRESHOLDS,
  calculateMelonGrowth,
} from './timeSystem.ts';
import { PetFollowerSystem } from './petSystem.ts';
import { type PlayerCustomizationState } from './characterCustomization.ts';

export type SingleGardenPhase =
  | 'locked_forest'
  | 'forest_trees'
  | 'forest_stumps'
  | 'clear'
  | 'sow'
  | 'growing'
  | 'harvest';
export type SceneLocation = 'outdoor' | 'lab_interior' | 'cabin_interior';

export interface GardenPlotSlotStatus {
  plotId: number;
  plotNumber: 1 | 2 | 3 | 4;
  plotTitle: string;
  phase: SingleGardenPhase;
  stageLabel: string;
  stagePercent: number;
  overallPercent: number;
  timeRemainingText: string;
  isNearest: boolean;
  hasEmergency: boolean;
}

export interface GardenHudStatus {
  phase: SingleGardenPhase;
  stageLabel: string;
  stagePercent: number;
  overallPercent: number;
  timeRemainingText: string;
  plotNumber?: 1 | 2 | 3 | 4;
  plotTitle?: string;
  unlockedCount?: number;
  totalPlots?: number;
  unlockedPlots?: GardenPlotSlotStatus[];
}

export interface ActiveGardenAction {
  type: 'chop_trees' | 'clear_stumps' | 'clear' | 'sow' | 'harvest';
  targetPlotId: number;
  totalDurationMs: number;
  elapsedMs: number;
  progress: number;
  currentCycle: number;
  lastStrikeCycle: number;
  label: string;
}

export interface ActiveSleepAction {
  phase: 'getting_in' | 'sleeping' | 'blinking' | 'waking_up';
  elapsedMs: number;
  totalDurationMs: number;
  progress: number;
  originX: number;
  originY: number;
  timeAdvanced: boolean;
  lullabyPlayed: boolean;
  wakeChimePlayed: boolean;
  onComplete?: (nextTime: GameTimeState) => void;
}

export interface ActiveJumpState {
  elapsedMs: number;
  durationMs: number;
  heightPx: number;
  jumpZ: number;
  poseIndex: 0 | 1 | 2;
}

export interface PlotData {
  id: number;
  lifecycleNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  plotNumber: 1 | 2 | 3 | 4;
  title: string;
  actionTag?: string;
  phase: SingleGardenPhase;
  isUnlocked: boolean;
  deedPrice: number;
  growthProgress: number; // 0.0 to 1.0 continuous animation progress
  x: number;
  y: number;
  width: number;
  height: number;
  tileX: number;
  tileY: number;
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  showcaseStage: 1 | 2 | 3 | 4;
  isCleared: boolean;
  isTilled: boolean;
  isMulched: boolean;
  cropStage: number;
  growthMinutes: number;
  matureMinutes: number;
  isSpoiled: boolean;
  pestDiagnosed: boolean;
  pestTreated: boolean;
  pestType?: 'cucumber_beetle' | 'melon_aphid' | 'powdery_mildew' | 'beneficial_ladybug';
}

export interface NpcEntity {
  id: 'professor' | 'rosa' | 'maya' | 'merchant';
  name: string;
  role: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ActiveEmergency {
  type: 'cucumber_beetle' | 'melon_aphid' | 'weed_incursion';
  title: string;
  targetPlotId: number;
  targetPlotTitle: string;
  pestsRemaining: number;
  totalPests: number;
  pestPositions: Array<{ x: number; y: number; offset: number }>;
}

export interface EngineCallbacks {
  onInteractNpc: (npcId: 'professor' | 'rosa' | 'maya' | 'merchant') => void;
  onInteractPlot: (plot: PlotData) => void;
  onInteractSoilLab: () => void;
  onInteractHarvestBench: () => void;
  onRemediateIrrigation: () => void;
  onRemediateBioSpray: () => void;
  onInteractBed: () => void;
  onInteractWardrobe: () => void;
  onInteractMarketplace: () => void;
  onInteractFishing: () => void;
  onInteractFishBucket?: () => void;
  onPurchasePlotDeed?: (plot: PlotData) => { success: boolean; message: string };
  onTimberSalvaged?: (plot: PlotData, bonusCoins: number) => void;
  onWeatherShift?: (metrics: WeatherMetrics) => void;
  onCropStressChange?: (isStressed: boolean) => void;
  onTimeUpdate?: (timeState: GameTimeState) => void;
  onGardenStatusChange?: (status: GardenHudStatus) => void;
  onPlotSpoiled?: (plotId: number) => void;
  onEmergencyQuestStart?: (emergency: ActiveEmergency) => void;
  onEmergencyQuestProgress?: (pestsRemaining: number, totalPests: number) => void;
  onEmergencyQuestResolved?: () => void;
  onStepChange: () => void;
}

const STORAGE_PLOTS_STATE_KEY = 'melonquest_plots_state_v2';

export class MelonEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private atlas: SpriteAtlas;
  private callbacks: EngineCallbacks;

  // 16-bit viewport dimensions
  private viewWidth = 640;
  private viewHeight = 360;
  private cameraX = 160;
  private cameraY = 200;

  // Active Scene Location ('outdoor' farm or 'lab_interior' building)
  public currentLocation: SceneLocation = 'outdoor';

  // Expanded World dimensions in tiles (44x32 tiles = 1408x1024 px)
  public readonly mapWidth = 44;
  public readonly mapHeight = 32;
  public readonly tileSize = 32;

  // Small pixelated farmer character stationed at the central 2x2 garden crossroads
  public playerX = 468;
  public playerY = 368;
  public playerDirection: 'down' | 'up' | 'left' | 'right' = 'down';
  public playerSpeed = 145;
  private isMoving = false;
  private hasPlayerWalked = false;
  private walkTimer = 0;
  private currentFrame = 0;
  private stepSoundTimer = 0;
  private animClock = 0;
  private lastGardenStatusKey = '';

  // Input states
  public keysHeld: Record<string, boolean> = {};
  public joystickVector = { x: 0, y: 0 };

  // Systems
  public timeSystem: TimeAndCalendarSystem;
  public petSystem: PetFollowerSystem;
  public weatherSystem: WeatherSystem;
  public weatherParticles: WeatherParticleSystem;

  // Outdoor NPCs (Farmer Rosa & Broker Silas)
  public outdoorNpcs: NpcEntity[] = [
    {
      id: 'rosa',
      name: 'Farmer Rosa',
      role: 'Senior Cultivator',
      x: 2 * 32,
      y: 6 * 32,
      width: 32,
      height: 32,
    },
    {
      id: 'merchant',
      name: 'Broker Silas',
      role: 'Marketplace Buyer',
      x: 1120,
      y: 364,
      width: 32,
      height: 32,
    },
  ];

  // Laboratory Interior NPCs (Stationed in their dedicated Left Wet-Lab & Right Office bays)
  public labInteriorNpcs: NpcEntity[] = [
    {
      id: 'maya',
      name: 'Lab Tech Maya',
      role: 'Soil Specialist',
      x: 162,
      y: 112,
      width: 32,
      height: 32,
    },
    {
      id: 'professor',
      name: 'Professor Citrullus',
      role: 'Lead Agronomist',
      x: 442,
      y: 112,
      width: 32,
      height: 32,
    },
  ];

  // Legacy accessor for compatibility
  public get npcs(): NpcEntity[] {
    if (this.currentLocation === 'lab_interior') return this.labInteriorNpcs;
    if (this.currentLocation === 'cabin_interior') return [];
    return this.outdoorNpcs;
  }

  // Laboratory Interior Room Bounds (centered in 640x360 viewport)
  public readonly labRoom = {
    x: 88,
    y: 24,
    width: 464,
    height: 304,
    floorMinX: 106,
    floorMaxX: 534,
    floorMinY: 98,
    floorMaxY: 304,
  };

  // Farmer House (Cabin) Interior Room Bounds (centered in 640x360 viewport)
  public readonly cabinRoom = {
    x: 96,
    y: 24,
    width: 448,
    height: 304,
    floorMinX: 114,
    floorMaxX: 526,
    floorMinY: 98,
    floorMaxY: 304,
  };

  // Doors for Entering & Exiting the Laboratory
  public labExteriorDoor = { x: 8 * 32, y: 5 * 32, width: 32, height: 32 };
  public labExitDoor = { x: 296, y: 294, width: 48, height: 30 };

  // Doors for Entering & Exiting the Farmer's House (Cabin) at (35, 5)
  public cabinExteriorDoor = { x: 35 * 32, y: 5 * 32, width: 32, height: 32 };
  public cabinExitDoor = { x: 296, y: 294, width: 48, height: 30 };

  // Laboratory Interior Workstations & Collidable Furniture
  public labSoilBench = { x: 124, y: 148, width: 108, height: 36 };
  public labHarvestBench = { x: 408, y: 148, width: 108, height: 36 };
  public labBookshelf = { x: 464, y: 68, width: 56, height: 34 };
  public labSinkCounter = { x: 116, y: 72, width: 96, height: 30 };
  public labSeedlingRack = { x: 114, y: 242, width: 92, height: 36 };
  public labSpecimenTable = { x: 434, y: 242, width: 92, height: 36 };

  // Farmer House (Cabin) Interior Realistic Furniture & Collidable Fixtures
  public cabinInteriorWardrobe = { x: 124, y: 112, width: 88, height: 42 };
  public cabinInteriorBed = { x: 420, y: 114, width: 86, height: 66 };
  public cabinNightstand = { x: 386, y: 104, width: 28, height: 30 };
  public cabinFireplace = { x: 276, y: 68, width: 88, height: 30 };
  public cabinDiningTable = { x: 126, y: 228, width: 88, height: 42 };
  public cabinStudyDesk = { x: 424, y: 232, width: 84, height: 38 };

  // 2x2 Grid of 4 Agricultural Plots (Plot #1 unlocked by default, Plots #2-#4 purchasable forested lots)
  public plots: PlotData[] = [
    {
      id: 0,
      plotNumber: 1,
      lifecycleNumber: 1,
      title: 'Plot #1: Starter Field',
      actionTag: 'Clear [E]',
      phase: 'clear',
      isUnlocked: true,
      deedPrice: 0,
      growthProgress: 0,
      x: 204,
      y: 312,
      width: 216,
      height: 140,
      tileX: 9,
      tileY: 11,
      startX: 6,
      endX: 13,
      startY: 9,
      endY: 14,
      showcaseStage: 1,
      isCleared: false,
      isTilled: false,
      isMulched: false,
      cropStage: 0,
      growthMinutes: 0,
      matureMinutes: 0,
      isSpoiled: false,
      pestDiagnosed: false,
      pestTreated: false,
      pestType: 'cucumber_beetle',
    },
    {
      id: 1,
      plotNumber: 2,
      lifecycleNumber: 1,
      title: 'Plot #2: East Timberland',
      actionTag: 'Buy Plot #2 (120G) [E]',
      phase: 'locked_forest',
      isUnlocked: false,
      deedPrice: 120,
      growthProgress: 0,
      x: 548,
      y: 312,
      width: 216,
      height: 140,
      tileX: 20,
      tileY: 11,
      startX: 17,
      endX: 24,
      startY: 9,
      endY: 14,
      showcaseStage: 2,
      isCleared: false,
      isTilled: false,
      isMulched: false,
      cropStage: 0,
      growthMinutes: 0,
      matureMinutes: 0,
      isSpoiled: false,
      pestDiagnosed: false,
      pestTreated: false,
      pestType: 'melon_aphid',
    },
    {
      id: 2,
      plotNumber: 3,
      lifecycleNumber: 1,
      title: 'Plot #3: South Grove',
      actionTag: 'Buy Plot #3 (220G) [E]',
      phase: 'locked_forest',
      isUnlocked: false,
      deedPrice: 220,
      growthProgress: 0,
      x: 204,
      y: 520,
      width: 216,
      height: 140,
      tileX: 9,
      tileY: 18,
      startX: 6,
      endX: 13,
      startY: 16,
      endY: 21,
      showcaseStage: 3,
      isCleared: false,
      isTilled: false,
      isMulched: false,
      cropStage: 0,
      growthMinutes: 0,
      matureMinutes: 0,
      isSpoiled: false,
      pestDiagnosed: false,
      pestTreated: false,
      pestType: 'cucumber_beetle',
    },
    {
      id: 3,
      plotNumber: 4,
      lifecycleNumber: 1,
      title: 'Plot #4: Southeast Woodland',
      actionTag: 'Buy Plot #4 (350G) [E]',
      phase: 'locked_forest',
      isUnlocked: false,
      deedPrice: 350,
      growthProgress: 0,
      x: 548,
      y: 520,
      width: 216,
      height: 140,
      tileX: 20,
      tileY: 18,
      startX: 17,
      endX: 24,
      startY: 16,
      endY: 21,
      showcaseStage: 4,
      isCleared: false,
      isTilled: false,
      isMulched: false,
      cropStage: 0,
      growthMinutes: 0,
      matureMinutes: 0,
      isSpoiled: false,
      pestDiagnosed: false,
      pestTreated: false,
      pestType: 'melon_aphid',
    },
  ];

  // Outdoor Perimeter Stations & Fixtures (positioned for expanded 44x32 map)
  public harvestBench = { x: 1016, y: 528, width: 76, height: 38 };
  public irrigationValve = { x: 15 * 32 - 6, y: 25 * 32 - 2, width: 44, height: 34 };
  public bioSprayRig = { x: 3 * 32 + 2, y: 6 * 32 - 4, width: 52, height: 36 };

  // Legacy references pointed to interior cabin fixtures
  public cabinBed = { x: 420, y: 114, width: 86, height: 66 };
  public cabinWardrobe = { x: 124, y: 112, width: 88, height: 42 };

  // Marketplace Plaza Stalls & River Pier Fixtures
  public marketStall = { x: 1016, y: 350, width: 84, height: 44 };
  public fruitMarketStall = { x: 1200, y: 350, width: 96, height: 44 };
  public produceCrateStall = { x: 1200, y: 520, width: 96, height: 44 };
  public fishingPier = { x: 22 * 32, y: 29 * 32, width: 32, height: 32 };
  public fishBucket = { x: 23 * 32 + 4, y: 28 * 32 + 2, width: 30, height: 28 };
  public pierBucketCount = 1;
  public activeGardenAction: ActiveGardenAction | null = null;
  public activeSleepAction: ActiveSleepAction | null = null;
  public activeEmergency: ActiveEmergency | null = null;
  public activeJump: ActiveJumpState | null = null;

  // Tilemap Grid & Solid collision mask
  private tileGrid: number[][] = [];
  private solidMask: boolean[][] = [];

  // Particle pool
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
    maxLife: number;
    size: number;
  }> = [];

  // Loop control
  private animFrameId: number | null = null;
  private lastTime = 0;
  private isPaused = false;
  private baselineCropStage = 0;
  private staticMapCanvas: HTMLCanvasElement | null = null;
  private detailLevel: DetailLevel = 'high';
  private handleCanvasClick: ((e: MouseEvent) => void) | null = null;

  public setPierBucketCount(count: number) {
    this.pierBucketCount = Math.max(0, count);
  }

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks, customState?: PlayerCustomizationState) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.atlas = getSpriteAtlas(customState);
    this.callbacks = callbacks;

    this.timeSystem = new TimeAndCalendarSystem();
    this.petSystem = new PetFollowerSystem();
    this.weatherSystem = new WeatherSystem();
    this.weatherParticles = new WeatherParticleSystem();
    this.weatherParticles.setViewSize(this.viewWidth, this.viewHeight);

    this.weatherSystem.onWeatherChange = () => {
      audio.playWeatherWarningSound();
      this.callbacks.onWeatherShift?.(this.weatherSystem.getMetrics());
    };

    this.weatherSystem.onCropStressChange = (st) => {
      this.callbacks.onCropStressChange?.(st);
    };

    this.loadPersistedPlotsState();
    this.initMap();
    this.initParticlePool();
    this.setupCanvasClickInteraction();
  }

  private loadPersistedPlotsState() {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_PLOTS_STATE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Array<{
        plotNumber: number;
        phase: SingleGardenPhase;
        isUnlocked: boolean;
        growthProgress: number;
        growthMinutes: number;
        cropStage: number;
        isCleared: boolean;
        isTilled: boolean;
        isMulched: boolean;
      }>;
      if (!Array.isArray(saved)) return;
      for (const s of saved) {
        const target = this.plots.find(p => p.plotNumber === s.plotNumber);
        if (target && s.phase) {
          target.phase = s.phase;
          target.isUnlocked = Boolean(s.isUnlocked || s.plotNumber === 1);
          target.growthProgress = Number(s.growthProgress) || 0;
          target.growthMinutes = Number(s.growthMinutes) || 0;
          target.cropStage = Number(s.cropStage) || 0;
          target.isCleared = Boolean(s.isCleared);
          target.isTilled = Boolean(s.isTilled);
          target.isMulched = Boolean(s.isMulched);
          this.refreshPlotActionTag(target);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  public persistPlotsState() {
    try {
      if (typeof localStorage === 'undefined') return;
      const snapshot = this.plots.map(p => ({
        plotNumber: p.plotNumber,
        phase: p.phase,
        isUnlocked: p.isUnlocked,
        growthProgress: p.growthProgress,
        growthMinutes: p.growthMinutes,
        cropStage: p.cropStage,
        isCleared: p.isCleared,
        isTilled: p.isTilled,
        isMulched: p.isMulched,
      }));
      localStorage.setItem(STORAGE_PLOTS_STATE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore storage errors
    }
  }

  private refreshPlotActionTag(plot: PlotData) {
    if (plot.phase === 'locked_forest') {
      plot.actionTag = `Buy Plot #${plot.plotNumber} (${plot.deedPrice}G) [E]`;
    } else if (plot.phase === 'forest_trees') {
      plot.actionTag = 'Chop Trees [E]';
    } else if (plot.phase === 'forest_stumps') {
      plot.actionTag = 'Pull Stumps [E]';
    } else if (plot.phase === 'clear') {
      plot.actionTag = 'Clear [E]';
    } else if (plot.phase === 'sow') {
      plot.actionTag = 'Sow [E]';
    } else if (plot.phase === 'growing') {
      plot.actionTag = '';
    } else if (plot.phase === 'harvest') {
      plot.actionTag = '[E] Harvest';
    }
  }

  /**
   * Synchronizes unlocked plot deeds from EconomySystem into the live 4-plot engine.
   */
  public syncUnlockedPlots(unlockedPlotNumbers: number[]) {
    let changed = false;
    for (const plotNum of unlockedPlotNumbers) {
      const plot = this.plots.find(p => p.plotNumber === plotNum);
      if (plot && (!plot.isUnlocked || plot.phase === 'locked_forest')) {
        plot.isUnlocked = true;
        if (plot.phase === 'locked_forest') {
          plot.phase = 'forest_trees';
          plot.actionTag = 'Chop Trees [E]';
        }
        changed = true;
      }
    }
    if (changed) {
      this.persistPlotsState();
      this.notifyGardenStatusIfChanged();
    }
  }

  /**
   * Unlocks a specific plot when its Land Deed is purchased from Broker Silas or an on-plot signboard.
   */
  public unlockPlotFromDeed(plotNumber: number): PlotData | null {
    const plot = this.plots.find(p => p.plotNumber === plotNumber);
    if (!plot) return null;
    plot.isUnlocked = true;
    if (plot.phase === 'locked_forest') {
      plot.phase = 'forest_trees';
      plot.actionTag = 'Chop Trees [E]';
      this.spawnParticles(plot.x + plot.width / 2, plot.y + plot.height / 2, '#f0c54d', 18);
    }
    this.persistPlotsState();
    this.notifyGardenStatusIfChanged();
    return plot;
  }

  /**
   * Finds the plot closest to the player's current world position.
   */
  public getNearestPlot(): PlotData {
    const px = this.playerX + 16;
    const py = this.playerY + 20;
    let bestPlot = this.plots[0];
    let bestDist = Infinity;

    for (const plot of this.plots) {
      const clampedX = Math.max(plot.x, Math.min(plot.x + plot.width, px));
      const clampedY = Math.max(plot.y, Math.min(plot.y + plot.height, py));
      const dist = Math.hypot(px - clampedX, py - clampedY);
      if (dist < bestDist) {
        bestDist = dist;
        bestPlot = plot;
      }
    }
    return bestPlot;
  }

  private setupCanvasClickInteraction() {
    this.handleCanvasClick = (e: MouseEvent) => {
      if (this.isPaused) return;
      const rect = this.canvas.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width;
      const normY = (e.clientY - rect.top) / rect.height;

      const isInterior =
        this.currentLocation === 'lab_interior' || this.currentLocation === 'cabin_interior';
      const camX = isInterior ? 0 : this.cameraX;
      const camY = isInterior ? 0 : this.cameraY;
      const worldX = camX + normX * this.viewWidth;
      const worldY = camY + normY * this.viewHeight;

      if (this.currentLocation === 'lab_interior') {
        // Click interior exit door
        if (
          worldX >= this.labExitDoor.x - 16 &&
          worldX <= this.labExitDoor.x + this.labExitDoor.width + 16 &&
          worldY >= this.labExitDoor.y - 24 &&
          worldY <= this.labExitDoor.y + this.labExitDoor.height + 16
        ) {
          this.exitLaboratory();
          return;
        }
        // Click Soil Assay Bench inside lab
        if (
          worldX >= this.labSoilBench.x - 10 &&
          worldX <= this.labSoilBench.x + this.labSoilBench.width + 10 &&
          worldY >= this.labSoilBench.y - 16 &&
          worldY <= this.labSoilBench.y + this.labSoilBench.height + 16
        ) {
          audio.playMenuClick();
          this.callbacks.onInteractSoilLab();
          return;
        }
        // Click Harvest/Brix Bench inside lab
        if (
          worldX >= this.labHarvestBench.x - 10 &&
          worldX <= this.labHarvestBench.x + this.labHarvestBench.width + 10 &&
          worldY >= this.labHarvestBench.y - 16 &&
          worldY <= this.labHarvestBench.y + this.labHarvestBench.height + 16
        ) {
          audio.playMenuClick();
          this.callbacks.onInteractHarvestBench();
          return;
        }
        // Click Professor Citrullus or Maya inside lab
        for (const npc of this.labInteriorNpcs) {
          if (
            worldX >= npc.x - 10 &&
            worldX <= npc.x + npc.width + 10 &&
            worldY >= npc.y - 10 &&
            worldY <= npc.y + npc.height + 10
          ) {
            audio.playMenuClick();
            this.callbacks.onInteractNpc(npc.id);
            return;
          }
        }
        return;
      }

      if (this.currentLocation === 'cabin_interior') {
        if (this.activeSleepAction) return;
        // Click interior cabin exit door
        if (
          worldX >= this.cabinExitDoor.x - 16 &&
          worldX <= this.cabinExitDoor.x + this.cabinExitDoor.width + 16 &&
          worldY >= this.cabinExitDoor.y - 24 &&
          worldY <= this.cabinExitDoor.y + this.cabinExitDoor.height + 16
        ) {
          this.exitCabin();
          return;
        }
        // Click Wardrobe Cabinet inside house
        if (
          worldX >= this.cabinInteriorWardrobe.x - 10 &&
          worldX <= this.cabinInteriorWardrobe.x + this.cabinInteriorWardrobe.width + 10 &&
          worldY >= this.cabinInteriorWardrobe.y - 28 &&
          worldY <= this.cabinInteriorWardrobe.y + this.cabinInteriorWardrobe.height + 16
        ) {
          audio.playMenuClick();
          this.callbacks.onInteractWardrobe();
          return;
        }
        // Click Farmhouse Bed inside house
        if (
          worldX >= this.cabinInteriorBed.x - 10 &&
          worldX <= this.cabinInteriorBed.x + this.cabinInteriorBed.width + 10 &&
          worldY >= this.cabinInteriorBed.y - 16 &&
          worldY <= this.cabinInteriorBed.y + this.cabinInteriorBed.height + 16
        ) {
          audio.playMenuClick();
          this.callbacks.onInteractBed();
          return;
        }
        return;
      }

      // Outdoor: Click exterior Laboratory door to enter if nearby
      if (
        worldX >= this.labExteriorDoor.x - 16 &&
        worldX <= this.labExteriorDoor.x + this.labExteriorDoor.width + 16 &&
        worldY >= this.labExteriorDoor.y - 16 &&
        worldY <= this.labExteriorDoor.y + this.labExteriorDoor.height + 24
      ) {
        const dist = Math.hypot(
          this.playerX + 16 - (this.labExteriorDoor.x + 16),
          this.playerY + 20 - (this.labExteriorDoor.y + 24)
        );
        if (dist < 72) {
          this.enterLaboratory();
          return;
        }
      }

      // Outdoor: Click exterior Farmer House door to enter if nearby
      if (
        worldX >= this.cabinExteriorDoor.x - 16 &&
        worldX <= this.cabinExteriorDoor.x + this.cabinExteriorDoor.width + 16 &&
        worldY >= this.cabinExteriorDoor.y - 16 &&
        worldY <= this.cabinExteriorDoor.y + this.cabinExteriorDoor.height + 24
      ) {
        const dist = Math.hypot(
          this.playerX + 16 - (this.cabinExteriorDoor.x + 16),
          this.playerY + 20 - (this.cabinExteriorDoor.y + 24)
        );
        if (dist < 72) {
          this.enterCabin();
          return;
        }
      }

      // Outdoor: Click any Marketplace Stall or Broker Silas to open Market if nearby
      const marketStalls = [this.marketStall, this.fruitMarketStall, this.produceCrateStall];
      for (const stall of marketStalls) {
        if (
          worldX >= stall.x - 10 &&
          worldX <= stall.x + stall.width + 10 &&
          worldY >= stall.y - 24 &&
          worldY <= stall.y + stall.height + 12
        ) {
          audio.playMenuClick();
          this.callbacks.onInteractMarketplace();
          return;
        }
      }

      // Outdoor: Click Bio-Spray Station
      if (
        worldX >= this.bioSprayRig.x - 8 &&
        worldX <= this.bioSprayRig.x + this.bioSprayRig.width + 8 &&
        worldY >= this.bioSprayRig.y - 18 &&
        worldY <= this.bioSprayRig.y + this.bioSprayRig.height + 10
      ) {
        audio.playMenuClick();
        this.callbacks.onRemediateBioSpray();
        return;
      }

      // Outdoor: Click Drip Irrigation Valve Station
      if (
        worldX >= this.irrigationValve.x - 8 &&
        worldX <= this.irrigationValve.x + this.irrigationValve.width + 8 &&
        worldY >= this.irrigationValve.y - 14 &&
        worldY <= this.irrigationValve.y + this.irrigationValve.height + 10
      ) {
        audio.playMenuClick();
        this.callbacks.onRemediateIrrigation();
        return;
      }

      // Outdoor: Click Lakeside Pier Fish Bucket beside the River Pier
      if (
        worldX >= this.fishBucket.x - 8 &&
        worldX <= this.fishBucket.x + this.fishBucket.width + 8 &&
        worldY >= this.fishBucket.y - 12 &&
        worldY <= this.fishBucket.y + this.fishBucket.height + 8
      ) {
        audio.playMenuClick();
        if (this.callbacks.onInteractFishBucket) {
          this.callbacks.onInteractFishBucket();
        } else {
          this.callbacks.onInteractFishing();
        }
        return;
      }

      // Outdoor: Click Southern River Pier to open Fishing Mini-Game
      if (
        worldX >= this.fishingPier.x - 8 &&
        worldX <= this.fishingPier.x + this.fishingPier.width + 8 &&
        worldY >= this.fishingPier.y - 16 &&
        worldY <= this.fishingPier.y + this.fishingPier.height + 16
      ) {
        audio.playMenuClick();
        this.callbacks.onInteractFishing();
        return;
      }

      // Outdoor: Click any of the 4 garden plots
      for (const plot of this.plots) {
        if (
          worldX >= plot.x - 16 &&
          worldX <= plot.x + plot.width + 16 &&
          worldY >= plot.y - 32 &&
          worldY <= plot.y + plot.height + 24
        ) {
          this.advanceSingleGardenStage(true, plot);
          return;
        }
      }
    };
    this.canvas.addEventListener('click', this.handleCanvasClick);
  }

  /**
   * Transitions player from outside the Laboratory door into the dedicated Laboratory Interior scene.
   */
  public enterLaboratory() {
    audio.playMenuClick();
    audio.playFootstepSound();
    this.currentLocation = 'lab_interior';
    this.hasPlayerWalked = true;
    // Place player just inside the Laboratory entrance door facing up
    this.playerX = 304;
    this.playerY = 244;
    this.playerDirection = 'up';
    this.cameraX = 0;
    this.cameraY = 0;
  }

  /**
   * Transitions player from inside the Laboratory exit door back outside in front of the Laboratory building.
   */
  public exitLaboratory() {
    audio.playMenuClick();
    audio.playFootstepSound();
    this.currentLocation = 'outdoor';
    this.hasPlayerWalked = true;
    // Place player right outside the Laboratory door facing down
    this.playerX = 8 * 32;
    this.playerY = 6 * 32 + 4;
    this.playerDirection = 'down';
  }

  /**
   * Transitions player from outside the Farmer House door into the dedicated House Interior scene.
   */
  public enterCabin() {
    audio.playMenuClick();
    audio.playFootstepSound();
    this.currentLocation = 'cabin_interior';
    this.hasPlayerWalked = true;
    // Place player just inside the Farmer House entrance door facing up
    this.playerX = 304;
    this.playerY = 244;
    this.playerDirection = 'up';
    this.cameraX = 0;
    this.cameraY = 0;
  }

  /**
   * Transitions player from inside the Farmer House exit door back outside in front of the House door.
   */
  public exitCabin() {
    audio.playMenuClick();
    audio.playFootstepSound();
    this.currentLocation = 'outdoor';
    this.hasPlayerWalked = true;
    // Place player right outside the Farmer House door at (35, 6) facing down
    this.playerX = 35 * 32;
    this.playerY = 6 * 32 + 4;
    this.playerDirection = 'down';
  }

  /**
   * Triggers a realistic biomechanical character jump (takeoff crouch -> mid-air apex tuck -> landing cushion flex).
   */
  public triggerJump() {
    if (this.activeJump || this.activeGardenAction || this.activeSleepAction) return;
    this.hasPlayerWalked = true;
    this.activeJump = {
      elapsedMs: 0,
      durationMs: 460,
      heightPx: 16,
      jumpZ: 0,
      poseIndex: 0,
    };
    audio.playJumpSound();
    // Spawn subtle takeoff dust puffs under boots
    this.spawnParticles(this.playerX + 16, this.playerY + 29, '#c2a67d', 5);
  }

  /**
   * Draws the player sprite with either the 3-pose parabolic jump animation + dynamic shrinking ground shadow
   * or the 4-frame biomechanical walking cycle.
   */
  private drawPlayerWithJumpAndWalk(ctx: CanvasRenderingContext2D, frameOverride?: number) {
    if (this.activeJump) {
      const jmp = this.activeJump;
      const heightRatio = Math.min(1, jmp.jumpZ / Math.max(1, jmp.heightPx));
      // Dynamic shrinking ground shadow on the turf directly below the airborne character
      const shadowW = Math.max(6, Math.round(14 * (1 - heightRatio * 0.45)));
      const shadowH = Math.max(2, Math.round(4 * (1 - heightRatio * 0.45)));
      const shadowX = Math.floor(this.playerX + 16 - shadowW / 2);
      const shadowY = Math.floor(this.playerY + 28);
      ctx.fillStyle = 'rgba(10, 6, 2, 0.42)';
      ctx.fillRect(shadowX, shadowY, shadowW, shadowH);
      ctx.fillStyle = 'rgba(10, 6, 2, 0.24)';
      ctx.fillRect(shadowX - 1, shadowY + 1, shadowW + 2, Math.max(1, shadowH - 2));

      const jumpFrames = this.atlas.playerJump[this.playerDirection];
      const jumpSprite = jumpFrames[jmp.poseIndex] || jumpFrames[0];
      ctx.drawImage(jumpSprite, Math.floor(this.playerX), Math.floor(this.playerY - jmp.jumpZ));
      return;
    }

    const playerFrames = this.atlas.player[this.playerDirection];
    const fIdx = frameOverride !== undefined ? frameOverride : this.currentFrame;
    const playerSprite = playerFrames[fIdx] || playerFrames[0];
    ctx.drawImage(playerSprite, Math.floor(this.playerX), Math.floor(this.playerY));
  }

  /**
   * Starts a progressive multi-frame gardening or woodland-clearing action with character animations,
   * tool sounds, particle bursts, and floating gauge feedback.
   */
  public startGardenAction(
    type: 'chop_trees' | 'clear_stumps' | 'clear' | 'sow' | 'harvest',
    targetPlot?: PlotData
  ) {
    if (this.activeGardenAction || this.currentLocation !== 'outdoor') return;
    const garden = targetPlot || this.getNearestPlot();

    // Orient player facing the target plot
    const gcx = garden.x + garden.width / 2;
    const gcy = garden.y + garden.height / 2;
    const dx = gcx - (this.playerX + 16);
    const dy = gcy - (this.playerY + 20);
    if (Math.abs(dx) > Math.abs(dy)) {
      this.playerDirection = dx > 0 ? 'right' : 'left';
    } else {
      this.playerDirection = dy > 0 ? 'down' : 'up';
    }

    this.hasPlayerWalked = true;
    const totalDurationMs =
      type === 'chop_trees'
        ? 2600
        : type === 'clear_stumps'
          ? 2300
          : type === 'clear'
            ? 2400
            : type === 'sow'
              ? 2100
              : 2600;

    const labelMap: Record<ActiveGardenAction['type'], string> = {
      chop_trees: 'CHOPPING WOODLAND TREES',
      clear_stumps: 'UPROOTING TREE STUMPS',
      clear: 'CLEARING ROCKS & WEEDS',
      sow: 'SOWING WATERMELON SEEDS',
      harvest: 'HARVESTING RIPE MELON',
    };

    this.activeGardenAction = {
      type,
      targetPlotId: garden.id,
      totalDurationMs,
      elapsedMs: 0,
      progress: 0,
      currentCycle: 0,
      lastStrikeCycle: -1,
      label: labelMap[type],
    };

    if (type === 'chop_trees') {
      audio.playAxeChopSound();
    } else {
      audio.playToolSound();
    }
  }

  /**
   * Purchases a locked forest plot deed via its on-plot For Sale signboard.
   */
  public purchasePlotDeed(plot: PlotData): { success: boolean; message: string } {
    if (plot.phase !== 'locked_forest') {
      return { success: false, message: `${plot.title} is already unlocked.` };
    }

    if (this.callbacks.onPurchasePlotDeed) {
      const res = this.callbacks.onPurchasePlotDeed(plot);
      if (!res.success) {
        audio.playErrorBuzz();
        return res;
      }
      this.unlockPlotFromDeed(plot.plotNumber);
      audio.playSuccessFanfare();
      return res;
    }

    // Fallback when running standalone (e.g. unit tests without economy callback)
    this.unlockPlotFromDeed(plot.plotNumber);
    audio.playSuccessFanfare();
    return {
      success: true,
      message: `Unlocked ${plot.title}! Chop the trees [E] to clear the woodland.`,
    };
  }

  /**
   * Triggers an emergency pest attack outbreak on an actively growing garden plot.
   */
  public triggerEmergencyOutbreak(
    type: 'cucumber_beetle' | 'melon_aphid' | 'weed_incursion' = 'cucumber_beetle',
    preferredPlot?: PlotData
  ) {
    const growingPlot =
      preferredPlot ||
      this.plots.find(p => p.phase === 'growing') ||
      this.getNearestPlot();
    const garden = growingPlot;
    const positions = [
      { x: garden.x + 38, y: garden.y + 24, offset: 0 },
      { x: garden.x + 108, y: garden.y + 28, offset: 1.2 },
      { x: garden.x + 172, y: garden.y + 22, offset: 2.4 },
      { x: garden.x + 72, y: garden.y + 68, offset: 3.6 },
      { x: garden.x + 144, y: garden.y + 86, offset: 4.8 },
    ];
    const titles = {
      cucumber_beetle: 'Cucumber Beetle Swarm',
      melon_aphid: 'Melon Aphid Outbreak',
      weed_incursion: 'Invasive Weed Incursion',
    };
    this.activeEmergency = {
      type,
      title: `${titles[type]} (Plot #${garden.plotNumber})`,
      targetPlotId: garden.id,
      targetPlotTitle: garden.title,
      pestsRemaining: 5,
      totalPests: 5,
      pestPositions: positions,
    };
    audio.playWeatherWarningSound();
    this.callbacks.onEmergencyQuestStart?.(this.activeEmergency);
  }

  /**
   * Resolves 1 pest bug by hand plucking with realistic character bending animation and particle pop.
   */
  public pickPestByHand() {
    if (!this.activeEmergency) return;
    const em = this.activeEmergency;
    const targetPlot = this.plots.find(p => p.id === em.targetPlotId) || this.plots[0];
    audio.playToolSound();

    const pIdx = em.totalPests - em.pestsRemaining;
    const pos = em.pestPositions[pIdx] || em.pestPositions[0];
    this.spawnParticles(pos.x, pos.y, '#88d46c', 16);

    // Bending picking action animation
    this.startGardenAction('clear', targetPlot);

    em.pestsRemaining = Math.max(0, em.pestsRemaining - 1);
    this.callbacks.onEmergencyQuestProgress?.(em.pestsRemaining, em.totalPests);

    if (em.pestsRemaining <= 0) {
      audio.playSuccessFanfare();
      this.activeEmergency = null;
      this.callbacks.onEmergencyQuestResolved?.();
    }
  }

  /**
   * Resolves all remaining pests across the garden using Bio-Spray mist application.
   */
  public sprayPestsByBioSpray() {
    if (!this.activeEmergency) return;
    const em = this.activeEmergency;
    audio.playSpraySound();

    for (const pos of em.pestPositions) {
      this.spawnParticles(pos.x, pos.y, '#2ecc71', 14);
    }

    em.pestsRemaining = 0;
    this.callbacks.onEmergencyQuestProgress?.(0, em.totalPests);
    audio.playSuccessFanfare();
    this.activeEmergency = null;
    this.callbacks.onEmergencyQuestResolved?.();
  }

  /**
   * Manually advances the nearest (or specified) garden plot when the player presses [E] or clicks the plot:
   * Supports buying locked forest deeds, chopping woodland trees, pulling tree stumps,
   * clearing rocks/weeds, sowing seeds, watering growing vines, and harvesting mature watermelons.
   */
  public advanceSingleGardenStage(fromUserInput = true, targetPlot?: PlotData) {
    if (!fromUserInput || this.currentLocation !== 'outdoor') return;
    if (this.activeEmergency) {
      this.pickPestByHand();
      return;
    }
    if (this.activeGardenAction) return;
    const garden = targetPlot || this.getNearestPlot();

    if (garden.phase === 'locked_forest') {
      this.purchasePlotDeed(garden);
      return;
    }

    if (garden.phase === 'forest_trees') {
      this.startGardenAction('chop_trees', garden);
      return;
    }

    if (garden.phase === 'forest_stumps') {
      this.startGardenAction('clear_stumps', garden);
      return;
    }

    if (garden.phase === 'clear') {
      this.startGardenAction('clear', garden);
      return;
    }

    if (garden.phase === 'sow') {
      this.startGardenAction('sow', garden);
      return;
    }

    if (garden.phase === 'growing') {
      audio.playWaterSound();
      this.spawnParticles(garden.x + garden.width / 2, garden.y + garden.height / 2, '#5dade2', 12);
      return;
    }

    if (garden.phase === 'harvest') {
      this.startGardenAction('harvest', garden);
      return;
    }
  }

  private enterHarvestPhase(garden: PlotData) {
    garden.phase = 'harvest';
    garden.growthProgress = 1;
    garden.cropStage = 5;
    garden.actionTag = '[E] Harvest';
    garden.lifecycleNumber = 7;
    for (let i = 0; i < 5; i++) {
      this.spawnParticles(garden.x + 40 + i * 34, garden.y + 68, '#f0c54d', 6);
    }
    this.persistPlotsState();
    this.notifyGardenStatusIfChanged();
  }

  private computePlotSlotStatus(garden: PlotData, nearestPlotId: number): GardenPlotSlotStatus {
    const baseSlot = {
      plotId: garden.id,
      plotNumber: garden.plotNumber,
      plotTitle: garden.title,
      isNearest: garden.id === nearestPlotId,
      hasEmergency: Boolean(this.activeEmergency && this.activeEmergency.targetPlotId === garden.id),
    };

    if (garden.phase === 'locked_forest') {
      return {
        ...baseSlot,
        phase: 'locked_forest',
        stageLabel: 'FORESTED LOT',
        stagePercent: 0,
        overallPercent: 0,
        timeRemainingText: `BUY ${garden.deedPrice}G [E]`,
      };
    }
    if (garden.phase === 'forest_trees') {
      return {
        ...baseSlot,
        phase: 'forest_trees',
        stageLabel: 'WOODLAND TREES',
        stagePercent: 20,
        overallPercent: 20,
        timeRemainingText: 'CHOP [E]',
      };
    }
    if (garden.phase === 'forest_stumps') {
      return {
        ...baseSlot,
        phase: 'forest_stumps',
        stageLabel: 'TREE STUMPS',
        stagePercent: 50,
        overallPercent: 50,
        timeRemainingText: 'STUMPS [E]',
      };
    }
    if (garden.phase === 'clear') {
      return {
        ...baseSlot,
        phase: 'clear',
        stageLabel: 'UNKEMPT BED',
        stagePercent: 0,
        overallPercent: 0,
        timeRemainingText: 'CLEAR [E]',
      };
    }
    if (garden.phase === 'sow') {
      return {
        ...baseSlot,
        phase: 'sow',
        stageLabel: 'TILLED SOIL',
        stagePercent: 0,
        overallPercent: 0,
        timeRemainingText: 'SOW [E]',
      };
    }
    if (garden.phase === 'harvest') {
      return {
        ...baseSlot,
        phase: 'harvest',
        stageLabel: 'MATURE MELON',
        stagePercent: 100,
        overallPercent: 100,
        timeRemainingText: 'HARVEST [E]',
      };
    }

    const gm = garden.growthMinutes;
    const calc = calculateMelonGrowth(gm, garden.matureMinutes);
    const remMins = Math.max(0, Math.ceil(calc.timeRemainingToNextStageMinutes));
    const hrs = Math.floor(remMins / 60);
    const mins = remMins % 60;
    const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

    const stageLabelMap: Record<string, string> = {
      seed: 'SEEDLING',
      sprout: 'SPROUTING',
      vine: 'VINING',
      flowering: 'FLOWERING',
      fruiting: 'FRUITING',
    };

    return {
      ...baseSlot,
      phase: 'growing',
      stageLabel: stageLabelMap[calc.stage] || 'GROWING',
      stagePercent: calc.progressPercent,
      overallPercent: Math.min(99, Math.floor(garden.growthProgress * 100)),
      timeRemainingText: timeStr,
    };
  }

  public focusPlot(plotNumber: 1 | 2 | 3 | 4) {
    const plot = this.plots.find(p => p.plotNumber === plotNumber);
    if (!plot || !plot.isUnlocked || plot.phase === 'locked_forest') return;
    if (this.currentLocation !== 'outdoor') {
      this.currentLocation = 'outdoor';
    }
    this.playerX = plot.x + plot.width / 2 - 16;
    this.playerY = plot.y + plot.height + 6;
    this.playerDirection = 'up';
    audio.playMenuClick();
    this.spawnParticles(plot.x + plot.width / 2, plot.y + plot.height / 2, '#f0c54d', 12);
    this.notifyGardenStatusIfChanged();
  }

  public getGardenStatus(targetPlot?: PlotData): GardenHudStatus {
    const nearest = this.getNearestPlot();
    const garden = targetPlot || nearest;
    const purchasedPlots = this.plots.filter(p => p.isUnlocked && p.phase !== 'locked_forest');
    const unlockedCount = purchasedPlots.length;
    const unlockedPlots = purchasedPlots.map(p => this.computePlotSlotStatus(p, nearest.id));
    const currentSlot = this.computePlotSlotStatus(garden, nearest.id);

    return {
      plotNumber: currentSlot.plotNumber,
      plotTitle: currentSlot.plotTitle,
      unlockedCount,
      totalPlots: this.plots.length,
      phase: currentSlot.phase,
      stageLabel: currentSlot.stageLabel,
      stagePercent: currentSlot.stagePercent,
      overallPercent: currentSlot.overallPercent,
      timeRemainingText: currentSlot.timeRemainingText,
      unlockedPlots,
    };
  }

  private notifyGardenStatusIfChanged() {
    const status = this.getGardenStatus();
    const slotsKey = (status.unlockedPlots || [])
      .map(
        s =>
          `${s.plotNumber}:${s.phase}:${s.stageLabel}:${s.stagePercent}:${s.overallPercent}:${s.timeRemainingText}:${s.isNearest ? 1 : 0}:${s.hasEmergency ? 1 : 0}`
      )
      .join('|');
    const key = `${status.plotNumber}:${status.unlockedCount}:${status.phase}:${status.stageLabel}:${status.stagePercent}:${status.timeRemainingText}||${slotsKey}`;
    if (key !== this.lastGardenStatusKey) {
      this.lastGardenStatusKey = key;
      this.callbacks.onGardenStatusChange?.(status);
    }
  }

  private syncGardenGrowthFromGameTime(garden: PlotData) {
    const gm = garden.growthMinutes;
    const calc = calculateMelonGrowth(gm, garden.matureMinutes);
    garden.cropStage = calc.stageIndex;

    if (calc.isHarvestable || gm >= CROP_STAGE_THRESHOLDS.fruiting) {
      this.enterHarvestPhase(garden);
      return;
    }

    if (gm < CROP_STAGE_THRESHOLDS.seed) {
      const local = gm / CROP_STAGE_THRESHOLDS.seed;
      garden.growthProgress = local * 0.15;
      garden.lifecycleNumber = 3;
    } else if (gm < CROP_STAGE_THRESHOLDS.sprout) {
      const local = (gm - CROP_STAGE_THRESHOLDS.seed) / (CROP_STAGE_THRESHOLDS.sprout - CROP_STAGE_THRESHOLDS.seed);
      garden.growthProgress = 0.15 + local * 0.20;
      garden.lifecycleNumber = 4;
    } else if (gm < CROP_STAGE_THRESHOLDS.vine) {
      const local = (gm - CROP_STAGE_THRESHOLDS.sprout) / (CROP_STAGE_THRESHOLDS.vine - CROP_STAGE_THRESHOLDS.sprout);
      garden.growthProgress = 0.35 + local * 0.23;
      garden.lifecycleNumber = 5;
    } else if (gm < CROP_STAGE_THRESHOLDS.flowering) {
      const local = (gm - CROP_STAGE_THRESHOLDS.vine) / (CROP_STAGE_THRESHOLDS.flowering - CROP_STAGE_THRESHOLDS.vine);
      garden.growthProgress = 0.58 + local * 0.18;
      garden.lifecycleNumber = 5;
    } else {
      const local = (gm - CROP_STAGE_THRESHOLDS.flowering) / (CROP_STAGE_THRESHOLDS.fruiting - CROP_STAGE_THRESHOLDS.flowering);
      garden.growthProgress = 0.76 + Math.min(1, local) * 0.24;
      garden.lifecycleNumber = 6;
    }

    garden.actionTag = '';
    this.notifyGardenStatusIfChanged();
  }

  public setCustomization(state: PlayerCustomizationState) {
    refreshPlayerSprites(this.atlas, state);
  }

  private initParticlePool() {
    this.particles = [];
    for (let i = 0; i < 80; i++) {
      this.particles.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        color: '#ffffff',
        life: 0,
        maxLife: 1,
        size: 2,
      });
    }
  }

  public spawnParticles(x: number, y: number, color: string, count = 8) {
    let spawned = 0;
    for (const p of this.particles) {
      if (p.life <= 0) {
        p.x = x;
        p.y = y;
        p.vx = (Math.random() - 0.5) * 90;
        p.vy = (Math.random() - 0.5) * 90 - 25;
        p.color = color;
        p.life = 0.45 + Math.random() * 0.35;
        p.maxLife = p.life;
        p.size = 2 + Math.floor(Math.random() * 2);
        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  private initMap() {
    this.tileGrid = [];
    this.solidMask = [];

    for (let y = 0; y < this.mapHeight; y++) {
      const row: number[] = [];
      const solidRow: boolean[] = [];

      for (let x = 0; x < this.mapWidth; x++) {
        if (y === 0 || y === this.mapHeight - 1 || x === 0 || x === this.mapWidth - 1) {
          row.push(3);
          solidRow.push(true);
        } else if (y >= this.mapHeight - 2 && !(x === 22 && y === this.mapHeight - 2)) {
          row.push(2);
          solidRow.push(true);
        } else if (x === 22 && y >= 28 && y <= 30) {
          row.push(11);
          solidRow.push(false);
        } else if (y >= 1 && y <= 2 && x >= 5 && x <= 11) {
          row.push(5); // Lab Roof
          solidRow.push(true);
        } else if (y >= 3 && y <= 5 && x >= 5 && x <= 11) {
          if (y === 5 && x === 8) {
            row.push(6); // Lab Door at (8, 5)
            solidRow.push(true); // Solid door tile; player interacts from in front of door
          } else if (y === 4 && (x === 6 || x === 10)) {
            row.push(7); // Lab Windows
            solidRow.push(true);
          } else {
            row.push(4); // Lab Wall
            solidRow.push(true);
          }
        } else if (y >= 1 && y <= 2 && x >= 32 && x <= 38) {
          row.push(13); // Farmer House Cedar Shingle Roof
          solidRow.push(true);
        } else if (y >= 3 && y <= 5 && x >= 32 && x <= 38) {
          if (y === 5 && x === 35) {
            row.push(16); // Farmer House Door at (35, 5)
            solidRow.push(true); // Solid door tile; player interacts from in front of door
          } else if (y === 4 && (x === 33 || x === 37)) {
            row.push(17); // Farmer House Shuttered Windows
            solidRow.push(true);
          } else {
            row.push(12); // Farmer House Log Wall
            solidRow.push(true);
          }
        } else if (
          (x >= 31 && x <= 41 && y >= 9 && y <= 21) ||
          (x === 35 && y >= 6 && y <= 8)
        ) {
          row.push(15); // Cobblestone Courtyard & Front Walkway up to Farmer House Door
          solidRow.push(false);
        } else if (
          (y === 8 || y === 23) &&
          x >= 4 &&
          x <= 27 &&
          !(x === 15 || x === 16)
        ) {
          row.push(3);
          solidRow.push(true);
        } else if (
          (x === 4 || x === 27) &&
          y >= 8 &&
          y <= 23 &&
          !(y === 15 || y === 16)
        ) {
          row.push(3);
          solidRow.push(true);
        } else if (
          (x >= 5 && x <= 26 && y >= 9 && y <= 22) ||
          (x === 8 && (y === 6 || y === 7)) ||
          (y === 7 && x >= 8 && x <= 16) ||
          (y === 8 && (x === 15 || x === 16))
        ) {
          row.push(1); // Cohesive Brown Dirt Field (2x2 Plots) & Walkway connecting the Lab Door to the Garden
          solidRow.push(false);
        } else {
          row.push(0); // Green Grass Edges
          solidRow.push(false);
        }
      }

      this.tileGrid.push(row);
      this.solidMask.push(solidRow);
    }

    this.prerenderStaticMap();
  }

  private prerenderStaticMap() {
    try {
      const offscreen = document.createElement('canvas');
      offscreen.width = this.mapWidth * this.tileSize;
      offscreen.height = this.mapHeight * this.tileSize;
      const octx = offscreen.getContext('2d');
      if (!octx) return;
      octx.imageSmoothingEnabled = false;

      for (let ty = 0; ty < this.mapHeight; ty++) {
        for (let tx = 0; tx < this.mapWidth; tx++) {
          const tileType = this.tileGrid[ty][tx];
          const screenTileX = tx * this.tileSize;
          const screenTileY = ty * this.tileSize;
          const variantIdx = (tx * 31 + ty * 17) % 4;

          switch (tileType) {
            case 0:
              octx.drawImage(this.atlas.tiles.grassVariants[variantIdx], screenTileX, screenTileY);
              break;
            case 1: {
              octx.drawImage(this.atlas.tiles.pathDirtVariants[variantIdx], screenTileX, screenTileY);
              if (ty === 9 && tx >= 5 && tx <= 26 && tx !== 15 && tx !== 16) {
                octx.fillStyle = '#386633';
                octx.fillRect(screenTileX, screenTileY, 32, 3);
              }
              if (ty === 22 && tx >= 5 && tx <= 26 && tx !== 15 && tx !== 16) {
                octx.fillStyle = '#386633';
                octx.fillRect(screenTileX, screenTileY + 29, 32, 3);
              }
              if (tx === 5 && ty >= 9 && ty <= 22 && ty !== 15 && ty !== 16) {
                octx.fillStyle = '#386633';
                octx.fillRect(screenTileX, screenTileY, 3, 32);
              }
              if (tx === 26 && ty >= 9 && ty <= 22 && ty !== 15 && ty !== 16) {
                octx.fillStyle = '#386633';
                octx.fillRect(screenTileX + 29, screenTileY, 3, 32);
              }
              break;
            }
            case 2:
              octx.drawImage(this.atlas.tiles.water, screenTileX, screenTileY);
              break;
            case 3:
              octx.drawImage(this.atlas.tiles.grassVariants[variantIdx], screenTileX, screenTileY);
              octx.drawImage(this.atlas.tiles.fence, screenTileX, screenTileY);
              break;
            case 4:
              octx.drawImage(this.atlas.tiles.labWall, screenTileX, screenTileY);
              break;
            case 5:
              octx.drawImage(this.atlas.tiles.labRoof, screenTileX, screenTileY);
              break;
            case 6:
              octx.drawImage(this.atlas.tiles.labDoor, screenTileX, screenTileY);
              break;
            case 7:
              octx.drawImage(this.atlas.tiles.labWindow, screenTileX, screenTileY);
              break;
            case 11:
              octx.drawImage(this.atlas.tiles.pier, screenTileX, screenTileY);
              break;
            case 12:
              octx.drawImage(this.atlas.tiles.cabinWall, screenTileX, screenTileY);
              break;
            case 13:
              octx.drawImage(this.atlas.tiles.cabinRoof, screenTileX, screenTileY);
              break;
            case 14:
              octx.drawImage(this.atlas.tiles.flooring, screenTileX, screenTileY);
              break;
            case 15:
              octx.drawImage(this.atlas.tiles.cobble, screenTileX, screenTileY);
              break;
            case 16:
              octx.drawImage(this.atlas.tiles.cabinDoor, screenTileX, screenTileY);
              break;
            case 17:
              octx.drawImage(this.atlas.tiles.cabinWindow, screenTileX, screenTileY);
              break;
          }
        }
      }

      // Subtle Dirt Walkways & Plot Dividers inside the 2x2 Agricultural Field
      octx.fillStyle = 'rgba(36, 19, 6, 0.22)';
      octx.fillRect(468, 294, 32, 412); // Central North-South Field Path
      octx.fillRect(166, 474, 636, 28); // Central East-West Field Path

      // Exterior Laboratory Signboard & Welcome Mat on Static Outdoor Map
      const signX = 6 * 32 + 12;
      const signY = 3 * 32 + 5;
      const signW = 4 * 32 - 24;
      const signH = 18;
      octx.fillStyle = '#241306';
      octx.fillRect(signX, signY, signW, signH);
      octx.fillStyle = '#f0c54d';
      octx.fillRect(signX + 1, signY + 1, signW - 2, signH - 2);
      octx.fillStyle = '#38200d';
      octx.fillRect(signX + 2, signY + 2, signW - 4, signH - 4);
      octx.font = 'bold 7px "Press Start 2P", monospace';
      octx.fillStyle = '#f0c54d';
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillText('AGRONOMY LAB', signX + signW / 2, signY + signH / 2 + 1);

      // Stone doormat outside Lab Door (8, 6)
      octx.fillStyle = '#3d2412';
      octx.fillRect(8 * 32 + 3, 6 * 32, 26, 10);
      octx.fillStyle = '#784b24';
      octx.fillRect(8 * 32 + 5, 6 * 32 + 2, 22, 6);

      // Exterior Farmer House Signboard, Brick Chimney & Welcome Mat on Static Outdoor Map (32..38)
      const cSignX = 33 * 32 + 14;
      const cSignY = 3 * 32 + 5;
      const cSignW = 4 * 32 - 28;
      const cSignH = 18;
      octx.fillStyle = '#241306';
      octx.fillRect(cSignX, cSignY, cSignW, cSignH);
      octx.fillStyle = '#f0c54d';
      octx.fillRect(cSignX + 1, cSignY + 1, cSignW - 2, cSignH - 2);
      octx.fillStyle = '#3b210f';
      octx.fillRect(cSignX + 2, cSignY + 2, cSignW - 4, cSignH - 4);
      octx.font = 'bold 7px "Press Start 2P", monospace';
      octx.fillStyle = '#f0c54d';
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillText('FARMER HOUSE', cSignX + cSignW / 2, cSignY + cSignH / 2 + 1);

      // Brick & Stone Chimney on Farmer House Roof (37, 1)
      const chimX = 37 * 32 + 8;
      const chimY = 1 * 32 - 6;
      octx.fillStyle = '#241306';
      octx.fillRect(chimX, chimY, 16, 22);
      octx.fillStyle = '#8a3b22';
      octx.fillRect(chimX + 2, chimY + 3, 12, 17);
      octx.fillStyle = '#b05530';
      octx.fillRect(chimX + 2, chimY + 5, 6, 4);
      octx.fillRect(chimX + 7, chimY + 11, 7, 4);
      octx.fillStyle = '#495057';
      octx.fillRect(chimX - 1, chimY, 18, 4);

      // Coir welcome mat outside Farmer House Door (35, 6)
      octx.fillStyle = '#241306';
      octx.fillRect(35 * 32 + 3, 6 * 32, 26, 10);
      octx.fillStyle = '#8c5828';
      octx.fillRect(35 * 32 + 5, 6 * 32 + 2, 22, 6);

      // --- Marketplace Plaza Architectural Curbing, Compass Mosaic & Welcome Banner (x: 31..41, y: 9..21) ---
      const mpX = 31 * 32;
      const mpY = 9 * 32;
      const mpW = 11 * 32;
      const mpH = 13 * 32;

      // Stone Curb Border framing the Marketplace Courtyard
      octx.fillStyle = '#2b3035';
      octx.fillRect(mpX, mpY, mpW, 4);
      octx.fillRect(mpX, mpY + mpH - 4, mpW, 4);
      octx.fillRect(mpX + mpW - 4, mpY, 4, mpH);
      // West stone curb with wide open gateway for players entering from the farm field (y: 14..16)
      octx.fillRect(mpX, mpY, 4, 5 * 32);
      octx.fillRect(mpX, mpY + 8 * 32, 4, 5 * 32);

      octx.fillStyle = '#adb5bd';
      octx.fillRect(mpX + 2, mpY + 1, mpW - 4, 2);
      octx.fillRect(mpX + 2, mpY + mpH - 3, mpW - 4, 2);

      // Decorative Sandstone & Brass Plaza Medallion in Center of Marketplace Courtyard
      const medX = 1152;
      const medY = 460;
      octx.fillStyle = '#363c42';
      octx.fillRect(medX - 28, medY - 20, 56, 40);
      octx.fillStyle = '#8c7a65';
      octx.fillRect(medX - 26, medY - 18, 52, 36);
      octx.fillStyle = '#b59d7e';
      octx.fillRect(medX - 22, medY - 14, 44, 28);
      octx.fillStyle = '#2b4c32';
      octx.fillRect(medX - 16, medY - 10, 32, 20);
      // Mini pixelated watermelon emblem in center of plaza mosaic
      octx.fillStyle = '#184a1d';
      octx.fillRect(medX - 10, medY - 6, 20, 12);
      octx.fillStyle = '#88d46c';
      octx.fillRect(medX - 8, medY - 3, 16, 2);
      octx.fillRect(medX - 8, medY + 1, 16, 2);

      // North Entrance "FARMERS MARKET" Timber & Brass Archway Sign (x: 34..37, y: 9)
      const mSignX = 34 * 32 - 4;
      const mSignY = 9 * 32 - 6;
      const mSignW = 3 * 32 + 8;
      const mSignH = 18;
      octx.fillStyle = '#241306';
      octx.fillRect(mSignX, mSignY, mSignW, mSignH);
      octx.fillStyle = '#f0c54d';
      octx.fillRect(mSignX + 1, mSignY + 1, mSignW - 2, mSignH - 2);
      octx.fillStyle = '#1b4324';
      octx.fillRect(mSignX + 2, mSignY + 2, mSignW - 4, mSignH - 4);
      octx.font = 'bold 6px "Press Start 2P", monospace';
      octx.fillStyle = '#f0c54d';
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillText('FARMERS MARKET', mSignX + mSignW / 2, mSignY + mSignH / 2 + 1);

      this.staticMapCanvas = offscreen;
    } catch {
      this.staticMapCanvas = null;
    }
  }

  public setDetailLevel(level: DetailLevel) {
    this.detailLevel = level;
    if (level === 'performance') {
      this.weatherParticles.setQuality('reduced');
    } else {
      this.weatherParticles.setQuality('ultra');
    }
  }

  public start() {
    this.isPaused = false;
    this.lastTime = performance.now();
    const loop = (time: number) => {
      const dt = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      if (!this.isPaused) {
        this.update(dt);
        this.render();
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  public stop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.handleCanvasClick) {
      this.canvas.removeEventListener('click', this.handleCanvasClick);
      this.handleCanvasClick = null;
    }
  }

  public update(dt: number) {
    this.animClock += dt;

    // 1. Advance Dynamic Time & Calendar System
    const minutesElapsed = this.timeSystem.update(dt);
    if (minutesElapsed > 0) {
      this.callbacks.onTimeUpdate?.(this.timeSystem.getState());
    }

    // 2. Update All 4 Farm Plots (continues ticking even while inside the Lab or Cabin!)
    const deltaInGameMinutes = dt * this.timeSystem.getTimeSpeed();
    for (const garden of this.plots) {
      if (garden.phase === 'locked_forest') {
        garden.actionTag = `Buy Plot #${garden.plotNumber} (${garden.deedPrice}G) [E]`;
      } else if (garden.phase === 'forest_trees') {
        garden.actionTag = 'Chop Trees [E]';
      } else if (garden.phase === 'forest_stumps') {
        garden.actionTag = 'Pull Stumps [E]';
      } else if (garden.phase === 'clear') {
        garden.actionTag = 'Clear [E]';
      } else if (garden.phase === 'sow') {
        garden.actionTag = 'Sow [E]';
      } else if (garden.phase === 'growing') {
        garden.growthMinutes += deltaInGameMinutes;
        this.syncGardenGrowthFromGameTime(garden);
      } else if (garden.phase === 'harvest') {
        garden.actionTag = '[E] Harvest';
      }
    }
    this.notifyGardenStatusIfChanged();

    // 2B. Progress Active Multi-step Garden Actions (Chopping Trees, Pulling Stumps, Clearing, Sowing, Harvesting)
    if (this.activeGardenAction && this.currentLocation === 'outdoor') {
      const act = this.activeGardenAction;
      const garden = this.plots.find(p => p.id === act.targetPlotId) || this.plots[0];
      act.elapsedMs += dt * 1000;
      act.progress = Math.min(1.0, act.elapsedMs / act.totalDurationMs);

      if (act.type === 'chop_trees') {
        const cycle = Math.floor(act.elapsedMs / 850);
        const cycleProgress = (act.elapsedMs % 850) / 850;
        if (cycleProgress >= 0.58 && act.lastStrikeCycle !== cycle && cycle < 3) {
          act.lastStrikeCycle = cycle;
          audio.playAxeChopSound();
          const treeFocusX = garden.x + 48 + cycle * 60;
          const treeFocusY = garden.y + 42 + (cycle % 2) * 36;
          this.spawnParticles(treeFocusX, treeFocusY, '#f0c54d', 10); // Golden heartwood chips
          this.spawnParticles(treeFocusX + 6, treeFocusY - 8, '#b87333', 8); // Cedar bark splinters
          this.spawnParticles(treeFocusX - 4, treeFocusY - 16, '#2d5a27', 8); // Pine needles
        }

        if (act.progress >= 1.0) {
          garden.phase = 'forest_stumps';
          garden.actionTag = 'Pull Stumps [E]';
          garden.lifecycleNumber = 1;
          audio.playTreeFallSound();
          audio.playSuccessFanfare();
          this.spawnParticles(garden.x + garden.width / 2, garden.y + garden.height / 2, '#f0c54d', 18);
          this.spawnParticles(garden.x + garden.width / 2, garden.y + garden.height / 2, '#2d5a27', 14);
          this.callbacks.onTimberSalvaged?.(garden, 15);
          this.persistPlotsState();
          this.notifyGardenStatusIfChanged();
          this.activeGardenAction = null;
        }
      } else if (act.type === 'clear_stumps') {
        const cycle = Math.floor(act.elapsedMs / 750);
        const cycleProgress = (act.elapsedMs % 750) / 750;
        if (cycleProgress >= 0.58 && act.lastStrikeCycle !== cycle && cycle < 3) {
          act.lastStrikeCycle = cycle;
          audio.playToolSound();
          const stumpX = garden.x + 45 + cycle * 62;
          const stumpY = garden.y + 52 + (cycle % 2) * 32;
          this.spawnParticles(stumpX, stumpY, '#8c5828', 10);
          this.spawnParticles(stumpX + 4, stumpY + 4, '#3d2714', 8);
        }

        if (act.progress >= 1.0) {
          garden.phase = 'clear';
          garden.actionTag = 'Clear [E]';
          garden.lifecycleNumber = 2;
          audio.playSuccessFanfare();
          this.spawnParticles(garden.x + garden.width / 2, garden.y + garden.height / 2, '#8c5828', 18);
          this.persistPlotsState();
          this.notifyGardenStatusIfChanged();
          this.activeGardenAction = null;
        }
      } else if (act.type === 'clear') {
        const cycle = Math.floor(act.elapsedMs / 800);
        const cycleProgress = (act.elapsedMs % 800) / 800;
        if (cycleProgress >= 0.62 && act.lastStrikeCycle !== cycle && cycle < 3) {
          act.lastStrikeCycle = cycle;
          audio.playToolSound();
          if (cycle === 0) {
            this.spawnParticles(garden.x + 40, garden.y + 40, '#6c757d', 8);
            this.spawnParticles(garden.x + 45, garden.y + 35, '#adb5bd', 6);
          } else if (cycle === 1) {
            this.spawnParticles(garden.x + 110, garden.y + 60, '#27ae60', 8);
            this.spawnParticles(garden.x + 115, garden.y + 55, '#5c3818', 6);
          } else {
            this.spawnParticles(garden.x + 160, garden.y + 50, '#3d2714', 8);
            this.spawnParticles(garden.x + 155, garden.y + 45, '#5c3818', 6);
          }
        }

        if (act.progress >= 1.0) {
          garden.phase = 'sow';
          garden.isCleared = true;
          garden.isTilled = true;
          garden.actionTag = 'Sow [E]';
          garden.lifecycleNumber = 3;
          audio.playSuccessFanfare();
          this.spawnParticles(garden.x + garden.width / 2, garden.y + garden.height / 2, '#88d46c', 16);
          this.persistPlotsState();
          this.notifyGardenStatusIfChanged();
          this.activeGardenAction = null;
        }
      } else if (act.type === 'sow') {
        const cycle = Math.floor(act.elapsedMs / 700);
        const cycleProgress = (act.elapsedMs % 700) / 700;
        if (cycleProgress >= 0.58 && act.lastStrikeCycle !== cycle && cycle < 3) {
          act.lastStrikeCycle = cycle;
          audio.playToolSound();
          for (let i = 0; i < 4; i++) {
            this.spawnParticles(garden.x + 30 + i * 42, garden.y + 24 + cycle * 34, '#f0c54d', 5);
          }
        }

        if (act.progress >= 1.0) {
          garden.phase = 'growing';
          garden.isMulched = true;
          garden.growthMinutes = 0;
          garden.matureMinutes = 0;
          garden.growthProgress = 0;
          garden.cropStage = 0;
          garden.actionTag = '';
          garden.lifecycleNumber = 4;
          audio.playSuccessFanfare();
          this.spawnParticles(garden.x + garden.width / 2, garden.y + garden.height / 2, '#f0c54d', 20);
          this.persistPlotsState();
          this.notifyGardenStatusIfChanged();
          this.activeGardenAction = null;
        }
      } else if (act.type === 'harvest') {
        if (act.elapsedMs >= 500 && act.lastStrikeCycle < 0) {
          act.lastStrikeCycle = 0;
          audio.playToolSound();
          this.spawnParticles(garden.x + 108, garden.y + 68, '#27ae60', 10);
        } else if (act.elapsedMs >= 1300 && act.lastStrikeCycle < 1) {
          act.lastStrikeCycle = 1;
          audio.playFootstepSound();
          this.spawnParticles(garden.x + 108, garden.y + 72, '#3d2714', 8);
        } else if (act.elapsedMs >= 1800 && act.lastStrikeCycle < 2) {
          act.lastStrikeCycle = 2;
          audio.playSuccessFanfare();
          this.spawnParticles(this.playerX + 16, this.playerY + 4, '#f1c40f', 14);
        }

        if (act.progress >= 1.0) {
          this.callbacks.onInteractPlot(garden);
          garden.phase = 'clear';
          garden.growthMinutes = 0;
          garden.matureMinutes = 0;
          garden.growthProgress = 0;
          garden.isCleared = false;
          garden.isTilled = false;
          garden.isMulched = false;
          garden.cropStage = 0;
          garden.actionTag = 'Clear [E]';
          garden.lifecycleNumber = 1;
          this.persistPlotsState();
          this.notifyGardenStatusIfChanged();
          this.activeGardenAction = null;
        }
      }
    }

    // 2C. Progress Active Bed Sleep & Wake-Up Sequence (Getting In -> Sleeping Zzz -> Eyelid Blink -> Waking Up)
    if (this.activeSleepAction) {
      const sleepAct = this.activeSleepAction;
      sleepAct.elapsedMs += dt * 1000;
      sleepAct.progress = Math.min(1.0, sleepAct.elapsedMs / sleepAct.totalDurationMs);

      const pillowX = this.cabinInteriorBed.x + 9;
      const pillowY = this.cabinInteriorBed.y + 4;

      if (sleepAct.elapsedMs < 650) {
        sleepAct.phase = 'getting_in';
        const t = Math.min(1.0, sleepAct.elapsedMs / 650);
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        this.playerX = sleepAct.originX + (pillowX - sleepAct.originX) * ease;
        this.playerY = sleepAct.originY + (pillowY - sleepAct.originY) * ease;
        this.playerDirection = 'up';
      } else if (sleepAct.elapsedMs < 2300) {
        sleepAct.phase = 'sleeping';
        this.playerX = pillowX;
        this.playerY = pillowY;
        if (!sleepAct.lullabyPlayed) {
          sleepAct.lullabyPlayed = true;
          audio.playSleepLullabyChime();
        }
      } else if (sleepAct.elapsedMs < 3350) {
        sleepAct.phase = 'blinking';
        this.playerX = pillowX;
        this.playerY = pillowY;
        // Advance clock & crops at peak of deep eyelid close (2850ms)
        if (sleepAct.elapsedMs >= 2850 && !sleepAct.timeAdvanced) {
          sleepAct.timeAdvanced = true;
          this.sleep();
        }
      } else if (sleepAct.elapsedMs < sleepAct.totalDurationMs) {
        sleepAct.phase = 'waking_up';
        if (!sleepAct.wakeChimePlayed) {
          sleepAct.wakeChimePlayed = true;
          audio.playMorningWakeFanfare();
        }
        if (sleepAct.elapsedMs < 3800) {
          this.playerX = pillowX;
          this.playerY = pillowY;
        } else {
          const outT = Math.min(1.0, (sleepAct.elapsedMs - 3800) / (sleepAct.totalDurationMs - 3800));
          this.playerX = pillowX + (sleepAct.originX - pillowX) * outT;
          this.playerY = pillowY + (sleepAct.originY - pillowY) * outT;
          this.playerDirection = 'down';
        }
      } else {
        // Sequence finished! Restore player standing in front of bed facing down
        this.playerX = sleepAct.originX;
        this.playerY = sleepAct.originY;
        this.playerDirection = 'down';
        const cb = sleepAct.onComplete;
        this.activeSleepAction = null;
        audio.playFootstepSound();
        cb?.(this.timeSystem.getState());
      }
    }

    // 2D. Progress Active Jump Sequence (Takeoff Crouch -> Mid-Air Apex -> Landing Cushion)
    if (
      this.keysHeld['Space'] &&
      !this.activeJump &&
      !this.activeGardenAction &&
      !this.activeSleepAction
    ) {
      this.triggerJump();
    }

    if (this.activeJump) {
      const jmp = this.activeJump;
      jmp.elapsedMs += dt * 1000;
      const p = Math.min(1.0, jmp.elapsedMs / jmp.durationMs);
      // Smooth parabolic arc peaking at p = 0.5
      jmp.jumpZ = Math.sin(p * Math.PI) * jmp.heightPx;
      // Biomechanical pose phases: 0 = takeoff crouch (0..16%), 1 = airborne apex tuck (16..82%), 2 = landing cushion flex (82..100%)
      jmp.poseIndex = p < 0.16 ? 0 : p < 0.82 ? 1 : 2;

      if (p >= 1.0) {
        this.activeJump = null;
        audio.playLandSound();
        this.spawnParticles(this.playerX + 16, this.playerY + 29, '#b5996e', 6);
      }
    }

    // 3. Player Input & Movement
    let vx = 0;
    let vy = 0;

    if (!this.activeGardenAction && !this.activeSleepAction) {
      if (this.keysHeld['KeyW'] || this.keysHeld['ArrowUp']) vy -= 1;
      if (this.keysHeld['KeyS'] || this.keysHeld['ArrowDown']) vy += 1;
      if (this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft']) vx -= 1;
      if (this.keysHeld['KeyD'] || this.keysHeld['ArrowRight']) vx += 1;

      if (this.joystickVector.x !== 0 || this.joystickVector.y !== 0) {
        vx = this.joystickVector.x;
        vy = this.joystickVector.y;
      }
    }

    const len = Math.hypot(vx, vy);
    if (len > 0) {
      this.isMoving = true;
      this.hasPlayerWalked = true;
      const speedMult = this.activeJump ? 1.12 : 1.0;
      const normVx = (vx / len) * this.playerSpeed * speedMult;
      const normVy = (vy / len) * this.playerSpeed * speedMult;

      if (Math.abs(normVx) > Math.abs(normVy)) {
        this.playerDirection = normVx > 0 ? 'right' : 'left';
      } else {
        this.playerDirection = normVy > 0 ? 'down' : 'up';
      }

      const newX = this.playerX + normVx * dt;
      if (!this.checkCollision(newX, this.playerY)) {
        this.playerX = newX;
      }

      const newY = this.playerY + normVy * dt;
      if (!this.checkCollision(this.playerX, newY)) {
        this.playerY = newY;
      }

      this.walkTimer += dt * 9.5;
      this.currentFrame = Math.floor(this.walkTimer) % 4;

      if (!this.activeJump) {
        this.stepSoundTimer += dt;
        if (this.stepSoundTimer >= 0.28) {
          audio.playFootstepSound();
          this.stepSoundTimer = 0;
        }
      }
    } else {
      this.isMoving = false;
      this.currentFrame = 0;
      this.walkTimer = 0;
    }

    // 4. Camera Positioning across the expanded 44x32 (1408x1024) Farm World
    if (this.currentLocation === 'lab_interior' || this.currentLocation === 'cabin_interior') {
      this.cameraX = 0;
      this.cameraY = 0;
    } else {
      const targetCamX = this.playerX + 16 - this.viewWidth / 2;
      const targetCamY = this.playerY + 16 - this.viewHeight / 2;
      const maxCamX = this.mapWidth * this.tileSize - this.viewWidth;
      const maxCamY = this.mapHeight * this.tileSize - this.viewHeight;
      this.cameraX = Math.max(0, Math.min(maxCamX, targetCamX));
      this.cameraY = Math.max(0, Math.min(maxCamY, targetCamY));
    }

    // 5. Update Particles
    for (const p of this.particles) {
      if (p.life > 0) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
      }
    }
  }

  private checkCollision(x: number, y: number): boolean {
    const px1 = x + 8;
    const px2 = x + 24;
    const py1 = y + 18;
    const py2 = y + 30;

    // --- Collision Inside Laboratory Interior ---
    if (this.currentLocation === 'lab_interior') {
      if (
        px1 < this.labRoom.floorMinX ||
        px2 > this.labRoom.floorMaxX ||
        py1 < this.labRoom.floorMinY ||
        py2 > this.labRoom.floorMaxY
      ) {
        return true;
      }

      for (const npc of this.labInteriorNpcs) {
        if (
          px1 < npc.x + npc.width - 4 &&
          px2 > npc.x + 4 &&
          py1 < npc.y + npc.height &&
          py2 > npc.y + 12
        ) {
          return true;
        }
      }

      const labFixtures = [
        this.labSoilBench,
        this.labHarvestBench,
        this.labBookshelf,
        this.labSinkCounter,
        this.labSeedlingRack,
        this.labSpecimenTable,
      ];
      for (const f of labFixtures) {
        if (
          px1 < f.x + f.width - 2 &&
          px2 > f.x + 2 &&
          py1 < f.y + f.height &&
          py2 > f.y + 8
        ) {
          return true;
        }
      }

      return false;
    }

    // --- Collision Inside Farmer House (Cabin) Interior ---
    if (this.currentLocation === 'cabin_interior') {
      if (
        px1 < this.cabinRoom.floorMinX ||
        px2 > this.cabinRoom.floorMaxX ||
        py1 < this.cabinRoom.floorMinY ||
        py2 > this.cabinRoom.floorMaxY
      ) {
        return true;
      }

      const cabinFixtures = [
        this.cabinInteriorWardrobe,
        this.cabinInteriorBed,
        this.cabinNightstand,
        this.cabinFireplace,
        this.cabinDiningTable,
        this.cabinStudyDesk,
      ];
      for (const f of cabinFixtures) {
        if (
          px1 < f.x + f.width - 2 &&
          px2 > f.x + 2 &&
          py1 < f.y + f.height &&
          py2 > f.y + 8
        ) {
          return true;
        }
      }

      return false;
    }

    // --- Collision in Outdoor Farm World ---
    const tX1 = Math.floor(px1 / this.tileSize);
    const tX2 = Math.floor(px2 / this.tileSize);
    const tY1 = Math.floor(py1 / this.tileSize);
    const tY2 = Math.floor(py2 / this.tileSize);

    for (let ty = tY1; ty <= tY2; ty++) {
      for (let tx = tX1; tx <= tX2; tx++) {
        if (ty >= 0 && ty < this.mapHeight && tx >= 0 && tx < this.mapWidth) {
          if (this.solidMask[ty][tx]) return true;
        }
      }
    }

    for (const npc of this.outdoorNpcs) {
      if (
        px1 < npc.x + npc.width - 4 &&
        px2 > npc.x + 4 &&
        py1 < npc.y + npc.height &&
        py2 > npc.y + 12
      ) {
        return true;
      }
    }

    const fixtures = [
      this.harvestBench,
      this.irrigationValve,
      this.bioSprayRig,
      this.marketStall,
      this.fruitMarketStall,
      this.produceCrateStall,
      this.fishBucket,
    ];

    for (const f of fixtures) {
      if (
        px1 < f.x + f.width - 2 &&
        px2 > f.x + 2 &&
        py1 < f.y + f.height &&
        py2 > f.y + 10
      ) {
        return true;
      }
    }

    return false;
  }

  public getNearbyInteractable(): {
    type:
      | 'npc'
      | 'plot'
      | 'soil_bench'
      | 'harvest_bench'
      | 'irrigation_valve'
      | 'bio_spray_rig'
      | 'bed'
      | 'wardrobe'
      | 'market_stall'
      | 'pier'
      | 'fish_bucket'
      | 'lab_enter_door'
      | 'lab_exit_door'
      | 'cabin_enter_door'
      | 'cabin_exit_door';
    target: any;
    label: string;
    x: number;
    y: number;
  } | null {
    const pCenterX = this.playerX + 16;
    const pCenterY = this.playerY + 20;
    const interactRadius = 48;

    if (this.activeGardenAction || this.activeSleepAction) {
      return null;
    }

    // --- 1A. Inside the Agronomy Laboratory ---
    if (this.currentLocation === 'lab_interior') {
      // Check Exit Door at bottom of Lab
      const exitDoorDist = Math.hypot(
        pCenterX - (this.labExitDoor.x + this.labExitDoor.width / 2),
        pCenterY - (this.labExitDoor.y + 4)
      );
      if (exitDoorDist < 54) {
        return {
          type: 'lab_exit_door',
          target: this.labExitDoor,
          label: 'Exit Lab [E]',
          x: this.labExitDoor.x + this.labExitDoor.width / 2,
          y: this.labExitDoor.y - 8,
        };
      }

      // Check Professor Citrullus & Lab Tech Maya inside Lab
      for (const npc of this.labInteriorNpcs) {
        const dist = Math.hypot(pCenterX - (npc.x + 16), pCenterY - (npc.y + 20));
        if (dist < interactRadius) {
          const shortName = npc.id === 'professor' ? 'Prof. Citrullus' : 'Maya';
          return {
            type: 'npc',
            target: npc,
            label: `${shortName} [E]`,
            x: npc.x + 16,
            y: npc.y,
          };
        }
      }

      // Check Soil Science Assay Bench inside Lab
      const soilDist = Math.hypot(
        pCenterX - (this.labSoilBench.x + this.labSoilBench.width / 2),
        pCenterY - (this.labSoilBench.y + this.labSoilBench.height / 2)
      );
      if (soilDist < 62) {
        return {
          type: 'soil_bench',
          target: this.labSoilBench,
          label: 'Soil Lab [E]',
          x: this.labSoilBench.x + this.labSoilBench.width / 2,
          y: this.labSoilBench.y - 4,
        };
      }

      // Check Harvest/Brix Bench inside Lab
      const brixDist = Math.hypot(
        pCenterX - (this.labHarvestBench.x + this.labHarvestBench.width / 2),
        pCenterY - (this.labHarvestBench.y + this.labHarvestBench.height / 2)
      );
      if (brixDist < 62) {
        return {
          type: 'harvest_bench',
          target: this.labHarvestBench,
          label: 'Brix Lab [E]',
          x: this.labHarvestBench.x + this.labHarvestBench.width / 2,
          y: this.labHarvestBench.y - 4,
        };
      }

      return null;
    }

    // --- 1B. Inside the Farmer's House (Cabin Interior) ---
    if (this.currentLocation === 'cabin_interior') {
      // Check Exit Door at bottom of Farmer House
      const cabinExitDist = Math.hypot(
        pCenterX - (this.cabinExitDoor.x + this.cabinExitDoor.width / 2),
        pCenterY - (this.cabinExitDoor.y + 4)
      );
      if (cabinExitDist < 54) {
        return {
          type: 'cabin_exit_door',
          target: this.cabinExitDoor,
          label: 'Exit House [E]',
          x: this.cabinExitDoor.x + this.cabinExitDoor.width / 2,
          y: this.cabinExitDoor.y - 8,
        };
      }

      // Check Realistic Wardrobe Cabinet inside Farmer House
      const wardDist = Math.hypot(
        pCenterX - (this.cabinInteriorWardrobe.x + this.cabinInteriorWardrobe.width / 2),
        pCenterY - (this.cabinInteriorWardrobe.y + this.cabinInteriorWardrobe.height / 2)
      );
      if (wardDist < 64) {
        return {
          type: 'wardrobe',
          target: this.cabinInteriorWardrobe,
          label: 'Wardrobe [E]',
          x: this.cabinInteriorWardrobe.x + this.cabinInteriorWardrobe.width / 2,
          y: this.cabinInteriorWardrobe.y - 24,
        };
      }

      // Check Realistic Farmhouse Bed inside Farmer House
      const bedDist = Math.hypot(
        pCenterX - (this.cabinInteriorBed.x + this.cabinInteriorBed.width / 2),
        pCenterY - (this.cabinInteriorBed.y + this.cabinInteriorBed.height / 2)
      );
      if (bedDist < 68) {
        return {
          type: 'bed',
          target: this.cabinInteriorBed,
          label: 'Rest [E]',
          x: this.cabinInteriorBed.x + this.cabinInteriorBed.width / 2,
          y: this.cabinInteriorBed.y - 12,
        };
      }

      return null;
    }

    // --- 2. Outdoor Farm World ---
    // Check Exterior Laboratory Door at (8, 5)
    const enterDoorDist = Math.hypot(
      pCenterX - (this.labExteriorDoor.x + 16),
      pCenterY - (this.labExteriorDoor.y + 24)
    );
    if (enterDoorDist < 54) {
      return {
        type: 'lab_enter_door',
        target: this.labExteriorDoor,
        label: 'Enter Lab [E]',
        x: this.labExteriorDoor.x + 16,
        y: this.labExteriorDoor.y,
      };
    }

    // Check Exterior Farmer House Door at (35, 5)
    const enterCabinDist = Math.hypot(
      pCenterX - (this.cabinExteriorDoor.x + 16),
      pCenterY - (this.cabinExteriorDoor.y + 24)
    );
    if (enterCabinDist < 54) {
      return {
        type: 'cabin_enter_door',
        target: this.cabinExteriorDoor,
        label: 'Enter House [E]',
        x: this.cabinExteriorDoor.x + 16,
        y: this.cabinExteriorDoor.y,
      };
    }

    for (const npc of this.outdoorNpcs) {
      const dist = Math.hypot(pCenterX - (npc.x + 16), pCenterY - (npc.y + 20));
      if (dist < interactRadius) {
        return {
          type: 'npc',
          target: npc,
          label: `${npc.name} [E]`,
          x: npc.x + 16,
          y: npc.y,
        };
      }
    }

    // Check Main Watermelon Trading Stall
    const marketDist = Math.hypot(
      pCenterX - (this.marketStall.x + this.marketStall.width / 2),
      pCenterY - (this.marketStall.y + this.marketStall.height / 2)
    );
    if (marketDist < 66) {
      return {
        type: 'market_stall',
        target: this.marketStall,
        label: 'Melon Market [E]',
        x: this.marketStall.x + this.marketStall.width / 2,
        y: this.marketStall.y - 18,
      };
    }

    // Check Tropical Fruit & Citrus Harvest Stall
    const fruitStallDist = Math.hypot(
      pCenterX - (this.fruitMarketStall.x + this.fruitMarketStall.width / 2),
      pCenterY - (this.fruitMarketStall.y + this.fruitMarketStall.height / 2)
    );
    if (fruitStallDist < 68) {
      return {
        type: 'market_stall',
        target: this.fruitMarketStall,
        label: 'Fruit Stand [E]',
        x: this.fruitMarketStall.x + this.fruitMarketStall.width / 2,
        y: this.fruitMarketStall.y - 18,
      };
    }

    // Check Farm Seed, Fertilizer & Melon Crate Stall
    const crateStallDist = Math.hypot(
      pCenterX - (this.produceCrateStall.x + this.produceCrateStall.width / 2),
      pCenterY - (this.produceCrateStall.y + this.produceCrateStall.height / 2)
    );
    if (crateStallDist < 68) {
      return {
        type: 'market_stall',
        target: this.produceCrateStall,
        label: 'Farm Supply [E]',
        x: this.produceCrateStall.x + this.produceCrateStall.width / 2,
        y: this.produceCrateStall.y - 18,
      };
    }

    const bucketDist = Math.hypot(
      pCenterX - (this.fishBucket.x + this.fishBucket.width / 2),
      pCenterY - (this.fishBucket.y + this.fishBucket.height / 2)
    );
    if (bucketDist < interactRadius + 6) {
      return {
        type: 'fish_bucket',
        target: this.fishBucket,
        label: `Fish Bucket (${this.pierBucketCount}) [E]`,
        x: this.fishBucket.x + this.fishBucket.width / 2,
        y: this.fishBucket.y - 10,
      };
    }

    const pierDist = Math.hypot(pCenterX - (this.fishingPier.x + 16), pCenterY - (this.fishingPier.y + 16));
    if (pierDist < interactRadius + 10) {
      return {
        type: 'pier',
        target: this.fishingPier,
        label: 'Go Fishing [E]',
        x: this.fishingPier.x + 16,
        y: this.fishingPier.y,
      };
    }

    const harvestDist = Math.hypot(
      pCenterX - (this.harvestBench.x + this.harvestBench.width / 2),
      pCenterY - (this.harvestBench.y + this.harvestBench.height / 2)
    );
    if (harvestDist < 62) {
      return {
        type: 'harvest_bench',
        target: this.harvestBench,
        label: 'Harvest Desk [E]',
        x: this.harvestBench.x + this.harvestBench.width / 2,
        y: this.harvestBench.y - 8,
      };
    }

    const valveDist = Math.hypot(
      pCenterX - (this.irrigationValve.x + this.irrigationValve.width / 2),
      pCenterY - (this.irrigationValve.y + this.irrigationValve.height / 2)
    );
    if (valveDist < interactRadius + 12) {
      return {
        type: 'irrigation_valve',
        target: this.irrigationValve,
        label: 'Irrigation [E]',
        x: this.irrigationValve.x + this.irrigationValve.width / 2,
        y: this.irrigationValve.y - 8,
      };
    }

    const sprayDist = Math.hypot(
      pCenterX - (this.bioSprayRig.x + this.bioSprayRig.width / 2),
      pCenterY - (this.bioSprayRig.y + this.bioSprayRig.height / 2)
    );
    if (sprayDist < interactRadius + 14) {
      return {
        type: 'bio_spray_rig',
        target: this.bioSprayRig,
        label: 'Bio-Spray [E]',
        x: this.bioSprayRig.x + this.bioSprayRig.width / 2,
        y: this.bioSprayRig.y - 14,
      };
    }

    const garden = this.getNearestPlot();
    if (
      pCenterX >= garden.x - 48 &&
      pCenterX <= garden.x + garden.width + 48 &&
      pCenterY >= garden.y - 48 &&
      pCenterY <= garden.y + garden.height + 48
    ) {
      return {
        type: 'plot',
        target: garden,
        label: garden.actionTag || `Plot #${garden.plotNumber} [E]`,
        x: garden.x + garden.width / 2,
        y: garden.y + garden.height / 2,
      };
    }

    return null;
  }

  public triggerAction() {
    const nearby = this.getNearbyInteractable();
    if (!nearby) {
      return;
    }

    if (nearby.type === 'lab_enter_door') {
      this.enterLaboratory();
      return;
    }

    if (nearby.type === 'lab_exit_door') {
      this.exitLaboratory();
      return;
    }

    if (nearby.type === 'cabin_enter_door') {
      this.enterCabin();
      return;
    }

    if (nearby.type === 'cabin_exit_door') {
      this.exitCabin();
      return;
    }

    if (nearby.type === 'plot') {
      this.advanceSingleGardenStage(true, nearby.target as PlotData);
      return;
    }

    audio.playMenuClick();

    if (nearby.type === 'npc') {
      this.callbacks.onInteractNpc(nearby.target.id);
    } else if (nearby.type === 'bed') {
      this.callbacks.onInteractBed();
    } else if (nearby.type === 'wardrobe') {
      this.callbacks.onInteractWardrobe();
    } else if (nearby.type === 'market_stall') {
      this.callbacks.onInteractMarketplace();
    } else if (nearby.type === 'pier') {
      this.callbacks.onInteractFishing();
    } else if (nearby.type === 'fish_bucket') {
      if (this.callbacks.onInteractFishBucket) {
        this.callbacks.onInteractFishBucket();
      } else {
        this.callbacks.onInteractFishing();
      }
    } else if (nearby.type === 'soil_bench') {
      this.callbacks.onInteractSoilLab();
    } else if (nearby.type === 'harvest_bench') {
      this.callbacks.onInteractHarvestBench();
    } else if (nearby.type === 'irrigation_valve') {
      this.callbacks.onRemediateIrrigation();
    } else if (nearby.type === 'bio_spray_rig') {
      this.callbacks.onRemediateBioSpray();
    }
  }

  public sleep() {
    const elapsedMinutes = this.timeSystem.sleepUntilMorning();
    for (const garden of this.plots) {
      if (garden.phase === 'growing') {
        garden.growthMinutes += elapsedMinutes;
        this.syncGardenGrowthFromGameTime(garden);
      }
    }
    this.persistPlotsState();
    this.callbacks.onTimeUpdate?.(this.timeSystem.getState());
  }

  /**
   * Starts the realistic multi-stage Bed Sleep & Wake-Up sequence:
   * 1. 'getting_in': Character steps up onto the farmhouse bed and removes their cap onto the nightstand.
   * 2. 'sleeping': Character lays down on the pillow under the patchwork quilt with breathing and floating Zzz bubbles.
   * 3. 'blinking': Realistic eyelid blink/close transition while clock advances to 06:00 AM and crops grow.
   * 4. 'waking_up': Eyelids open into morning sunbeams, character stretches, puts cap back on, and steps out of bed.
   */
  public startSleepSequence(onComplete?: (nextTime: GameTimeState) => void) {
    if (this.activeSleepAction || this.activeGardenAction) return;

    // Ensure player is inside the cabin right beside the bed if triggered via top bar REST button
    if (this.currentLocation !== 'cabin_interior') {
      this.currentLocation = 'cabin_interior';
      this.cameraX = 0;
      this.cameraY = 0;
      this.playerX = 447;
      this.playerY = 182;
    }

    const originX =
      Math.hypot(this.playerX - 447, this.playerY - 182) < 95 ? this.playerX : 447;
    const originY =
      Math.hypot(this.playerX - 447, this.playerY - 182) < 95 ? this.playerY : 182;

    audio.playFootstepSound();
    this.hasPlayerWalked = true;
    this.isMoving = false;

    this.activeSleepAction = {
      phase: 'getting_in',
      elapsedMs: 0,
      totalDurationMs: 4000,
      progress: 0,
      originX,
      originY,
      timeAdvanced: false,
      lullabyPlayed: false,
      wakeChimePlayed: false,
      onComplete,
    };
  }

  public setCropGrowthStage(stage: number, plotIndex = 0) {
    this.baselineCropStage = Math.max(0, Math.min(6, stage));
    const garden = this.plots[plotIndex] || this.plots[0];
    garden.cropStage = this.baselineCropStage;
    if (stage >= 5) {
      garden.growthMinutes = CROP_STAGE_THRESHOLDS.fruiting + 10;
      this.enterHarvestPhase(garden);
    }
  }

  public getBaselineCropStage(): number {
    return this.baselineCropStage;
  }

  /**
   * Procedurally renders each 216x140 px plot across all woodland & cultivation stages:
   * - 'locked_forest' & 'forest_trees': Woodland moss/loam bed, 8 layered pine & oak trees, axe-chopping shake/notch/felling, and For Sale signboard
   * - 'forest_stumps': 8 cut tree stumps with heartwood rings & root extraction animation
   * - 'clear', 'sow', 'growing', 'harvest': Full watermelon agronomic lifecycle
   */
  private renderSingleCentralGarden(ctx: CanvasRenderingContext2D, garden: PlotData) {
    const gx = garden.x;
    const gy = garden.y;
    const gw = garden.width;
    const gh = garden.height;
    const isTargetOfActiveAction = this.activeGardenAction?.targetPlotId === garden.id;

    const fill = (rx: number, ry: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(gx + rx), Math.floor(gy + ry), Math.floor(w), Math.floor(h));
    };

    // 1. Sunken Timber/Earth Garden Border Rim & Drop Shadow
    fill(3, 3, gw - 2, gh - 2, 'rgba(15, 8, 3, 0.55)');
    fill(0, 0, gw - 2, gh - 2, '#241307');
    fill(2, 2, gw - 6, gh - 6, '#4a2c14');
    fill(4, 4, gw - 10, gh - 10, '#331d0c');

    // Plot Corner Identification Badge (e.g. "P#1", "P#2")
    fill(6, 6, 24, 10, '#241306');
    fill(7, 7, 22, 8, garden.isUnlocked ? '#1b4324' : '#5c3416');
    ctx.save();
    ctx.font = 'bold 5px "Press Start 2P", monospace';
    ctx.fillStyle = '#f0c54d';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`P#${garden.plotNumber}`, gx + 18, gy + 11.5);
    ctx.restore();

    // --- STAGE 0A: FORESTED LOT ('locked_forest' or 'forest_trees') ---
    if (garden.phase === 'locked_forest' || garden.phase === 'forest_trees') {
      const chopP =
        isTargetOfActiveAction && this.activeGardenAction?.type === 'chop_trees'
          ? this.activeGardenAction.progress
          : 0;

      // Deep woodland moss, pine needles & dark forest loam floor
      fill(6, 6, gw - 14, gh - 14, '#233b1d');
      for (let rx = 10; rx < gw - 18; rx += 14) {
        for (let ry = 12; ry < gh - 18; ry += 12) {
          const hash = (rx * 19 + ry * 31 + garden.plotNumber * 7) % 5;
          if (hash === 0) fill(rx, ry, 8, 5, '#1a2e15');
          else if (hash === 1) fill(rx, ry, 6, 4, '#3d2714');
          else if (hash === 2) fill(rx, ry, 5, 3, '#2e4f26');
        }
      }

      // Re-draw plot badge on top of woodland floor
      fill(6, 6, 26, 11, '#241306');
      fill(7, 7, 24, 9, garden.isUnlocked ? '#1b4324' : '#5c3416');
      ctx.save();
      ctx.font = 'bold 5px "Press Start 2P", monospace';
      ctx.fillStyle = '#f0c54d';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`P#${garden.plotNumber}`, gx + 19, gy + 12);
      ctx.restore();

      const treeSites = [
        { x: 42, y: 46, kind: 'pine' },
        { x: 88, y: 40, kind: 'oak' },
        { x: 138, y: 44, kind: 'pine' },
        { x: 182, y: 42, kind: 'oak' },
        { x: 42, y: 98, kind: 'oak' },
        { x: 94, y: 94, kind: 'pine' },
        { x: 146, y: 98, kind: 'oak' },
        { x: 186, y: 94, kind: 'pine' },
      ];

      const felledCount = Math.floor(chopP * treeSites.length);

      treeSites.forEach((tree, idx) => {
        const tx = tree.x;
        const ty = tree.y;

        // If this tree has already been felled during active chopping, draw its fresh cut stump!
        if (idx < felledCount) {
          fill(tx - 8, ty + 4, 16, 5, 'rgba(10, 6, 2, 0.45)');
          fill(tx - 6, ty - 2, 12, 9, '#241306');
          fill(tx - 5, ty, 10, 6, '#5c3818');
          fill(tx - 5, ty - 2, 10, 4, '#d4a838');
          fill(tx - 3, ty - 1, 6, 2, '#f0c54d');
          return;
        }

        // Shake the active target tree when the lumberjack axe swings
        const isCurrentTarget = chopP > 0 && idx === felledCount;
        const shakeX = isCurrentTarget ? Math.round(Math.sin(this.animClock * 42) * 2.5) : 0;
        const windSway = Math.round(Math.sin(this.animClock * 2.2 + idx + garden.plotNumber) * 1);

        // Tree ground shadow
        fill(tx - 14, ty + 5, 28, 7, 'rgba(10, 6, 2, 0.5)');

        // Flared roots & sturdy cedar/oak trunk
        fill(tx - 7 + shakeX, ty + 3, 14, 5, '#241306');
        fill(tx - 5 + shakeX, ty - 12, 10, 18, '#241306');
        fill(tx - 4 + shakeX, ty - 11, 8, 16, '#5c3818');
        fill(tx - 2 + shakeX, ty - 11, 3, 15, '#7a4d28');

        // Golden heartwood axe V-notch on the tree currently being chopped
        if (isCurrentTarget) {
          fill(tx - 4 + shakeX, ty - 4, 5, 4, '#f0c54d');
          fill(tx - 3 + shakeX, ty - 3, 3, 2, '#fff380');
        }

        if (tree.kind === 'pine') {
          // Layered 3-tier 16-bit Conifer Pine Canopy
          fill(tx - 16 + shakeX + windSway, ty - 20, 32, 11, '#0d2611');
          fill(tx - 15 + shakeX + windSway, ty - 19, 30, 9, '#1b4d24');
          fill(tx - 12 + shakeX + windSway, ty - 18, 24, 4, '#2d6a36');

          fill(tx - 13 + shakeX + windSway, ty - 29, 26, 11, '#0d2611');
          fill(tx - 12 + shakeX + windSway, ty - 28, 24, 9, '#246630');
          fill(tx - 9 + shakeX + windSway, ty - 27, 18, 4, '#3b8c47');

          fill(tx - 9 + shakeX + windSway, ty - 37, 18, 10, '#0d2611');
          fill(tx - 8 + shakeX + windSway, ty - 36, 16, 8, '#2ecc71');
          fill(tx - 5 + shakeX + windSway, ty - 35, 10, 3, '#88d46c');
        } else {
          // Broadleaf Oak / Acacia Woodland Canopy
          fill(tx - 17 + shakeX + windSway, ty - 28, 34, 18, '#0f2912');
          fill(tx - 15 + shakeX + windSway, ty - 32, 30, 20, '#1e5628');
          fill(tx - 12 + shakeX + windSway, ty - 34, 24, 14, '#27ae60');
          fill(tx - 8 + shakeX + windSway, ty - 32, 14, 6, '#88d46c');
        }
      });

      // Render crisp Plot Corner Badge above tree canopy so it is never occluded
      fill(6, 6, 26, 11, '#241306');
      fill(7, 7, 24, 9, garden.isUnlocked ? '#1b4324' : '#5c3416');
      ctx.save();
      ctx.font = 'bold 5px "Press Start 2P", monospace';
      ctx.fillStyle = '#f0c54d';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`P#${garden.plotNumber}`, gx + 19, gy + 12);
      ctx.restore();

      // If plot is locked ('locked_forest'), render a wooden & brass "FOR SALE" real-estate signboard at the front
      if (garden.phase === 'locked_forest') {
        const signW = 94;
        const signH = 22;
        const sx = Math.floor(gw / 2 - signW / 2);
        const sy = gh - 30;

        // Signpost legs & drop shadow
        fill(sx + 14, sy + signH - 2, 6, 8, '#241306');
        fill(sx + 15, sy + signH - 2, 4, 7, '#6e4320');
        fill(sx + signW - 20, sy + signH - 2, 6, 8, '#241306');
        fill(sx + signW - 19, sy + signH - 2, 4, 7, '#6e4320');

        // Brass-rimmed dark timber signboard
        fill(sx - 1, sy + 2, signW + 2, signH, 'rgba(8, 4, 2, 0.7)');
        fill(sx, sy, signW, signH, '#241306');
        fill(sx + 1, sy + 1, signW - 2, signH - 2, '#f0c54d');
        fill(sx + 2, sy + 2, signW - 4, signH - 4, '#3b210f');

        ctx.save();
        ctx.font = 'bold 5px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#f0c54d';
        ctx.fillText(`PLOT #${garden.plotNumber} DEED`, gx + gw / 2, gy + sy + 7.5);
        ctx.fillStyle = '#88d46c';
        ctx.fillText(`FOR SALE: ${garden.deedPrice}G`, gx + gw / 2, gy + sy + 15.5);
        ctx.restore();
      }

      return;
    }

    // --- STAGE 0B: TREE STUMPS ('forest_stumps') ---
    if (garden.phase === 'forest_stumps') {
      const stumpP =
        isTargetOfActiveAction && this.activeGardenAction?.type === 'clear_stumps'
          ? this.activeGardenAction.progress
          : 0;

      // Woodland soil transitioning to raw clearing earth
      fill(6, 6, gw - 14, gh - 14, '#3d2816');
      for (let rx = 10; rx < gw - 16; rx += 13) {
        for (let ry = 10; ry < gh - 16; ry += 11) {
          const hash = (rx * 17 + ry * 23) % 4;
          if (hash === 0) fill(rx, ry, 7, 4, '#2c1c0f');
          else if (hash === 1) fill(rx, ry, 5, 3, '#4f351d');
        }
      }

      // Re-draw plot badge
      fill(6, 6, 26, 11, '#241306');
      fill(7, 7, 24, 9, '#1b4324');
      ctx.save();
      ctx.font = 'bold 5px "Press Start 2P", monospace';
      ctx.fillStyle = '#f0c54d';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`P#${garden.plotNumber}`, gx + 19, gy + 12);
      ctx.restore();

      const stumps = [
        [42, 46], [88, 40], [138, 44], [182, 42],
        [42, 98], [94, 94], [146, 98], [186, 94],
      ];
      const extractedCount = Math.floor(stumpP * stumps.length);

      stumps.forEach(([sx, sy], idx) => {
        if (idx < extractedCount) {
          // Freshly uprooted soil pit where stump was pulled
          fill(sx - 8, sy - 1, 16, 7, '#211106');
          fill(sx - 6, sy + 1, 12, 4, '#140a03');
          return;
        }
        const isCurrentStump = stumpP > 0 && idx === extractedCount;
        const rockShift = isCurrentStump ? Math.round(Math.sin(this.animClock * 38) * 2) : 0;

        // Stump shadow & flared lateral roots
        fill(sx - 10, sy + 5, 20, 5, 'rgba(10, 6, 2, 0.5)');
        fill(sx - 9 + rockShift, sy + 3, 18, 4, '#241306');
        fill(sx - 8 + rockShift, sy + 3, 16, 3, '#4a2c14');
        // Cylindrical bark body
        fill(sx - 7 + rockShift, sy - 4, 14, 10, '#241306');
        fill(sx - 6 + rockShift, sy - 3, 12, 8, '#5c3818');
        fill(sx - 3 + rockShift, sy - 2, 4, 7, '#7a4d28');
        // Cut heartwood top rings
        fill(sx - 6 + rockShift, sy - 4, 12, 4, '#d4a838');
        fill(sx - 4 + rockShift, sy - 3, 8, 2, '#f0c54d');
      });

      return;
    }

    if (garden.phase === 'clear') {
      const clearP =
        isTargetOfActiveAction && this.activeGardenAction?.type === 'clear'
          ? this.activeGardenAction.progress
          : 0;

      fill(6, 6, gw - 14, gh - 14, '#4f351d');

      // Tilled clean soil rows gradually emerging beneath as rocks and weeds get cleared
      if (clearP > 0.08) {
        ctx.save();
        ctx.globalAlpha = Math.min(1.0, clearP * 1.3);
        const rowYs = [14, 38, 62, 86, 110];
        for (const ry of rowYs) {
          fill(8, ry, gw - 18, 2, '#3b210f');
          fill(8, ry + 2, gw - 18, 11, '#211106');
          fill(8, ry + 13, gw - 18, 4, '#140a03');
        }
        ctx.restore();
      }

      for (let rx = 10; rx < gw - 16; rx += 12) {
        for (let ry = 10; ry < gh - 16; ry += 10) {
          const hash = (rx * 13 + ry * 29) % 5;
          if (hash === 0) fill(rx, ry, 6, 4, '#3d2714');
          else if (hash === 1) fill(rx, ry, 4, 3, '#634427');
        }
      }

      const rocks = [
        [18, 16, 18, 13], [78, 14, 20, 14], [142, 18, 17, 12],
        [46, 46, 22, 15], [112, 50, 19, 14], [166, 44, 18, 13],
        [22, 84, 20, 14], [86, 88, 22, 15], [148, 82, 19, 14],
        [54, 108, 18, 12], [124, 108, 17, 12], [174, 102, 16, 12],
      ];
      const rocksCount = Math.ceil(rocks.length * (1 - clearP));
      for (const [rx, ry, rw, rh] of rocks.slice(0, rocksCount)) {
        fill(rx, ry + rh - 2, rw + 1, 3, '#170d05');
        fill(rx, ry + 1, rw, rh - 1, '#495057');
        fill(rx + 1, ry, rw - 2, rh - 2, '#6c757d');
        fill(rx + 3, ry + 2, Math.max(4, rw - 7), 3, '#adb5bd');
      }

      const twigs = [
        [48, 22, 18, 3], [112, 26, 16, 3], [24, 62, 18, 3],
        [82, 68, 20, 3], [142, 66, 16, 3], [44, 96, 18, 3], [114, 98, 18, 3],
      ];
      const twigsCount = Math.ceil(twigs.length * (1 - clearP));
      for (const [tx, ty, tw, th] of twigs.slice(0, twigsCount)) {
        fill(tx, ty + 1, tw, th, '#241307');
        fill(tx, ty, tw, th - 1, '#6e4722');
        fill(tx + 3, ty, tw - 6, 1, '#8c5d30');
      }

      const weeds = [
        [16, 36], [40, 30], [68, 32], [102, 20], [132, 34], [168, 26], [186, 38],
        [32, 70], [72, 58], [98, 72], [136, 56], [162, 72], [186, 66],
        [18, 108], [46, 86], [76, 108], [108, 86], [142, 106], [168, 90],
      ];
      const weedsCount = Math.ceil(weeds.length * (1 - clearP));
      weeds.slice(0, weedsCount).forEach(([wx, wy], idx) => {
        const sway = Math.round(Math.sin(this.animClock * 3.5 + idx) * 1);
        fill(wx - 1, wy + 6, 12, 2, '#140b04');
        fill(wx, wy + 1, 10, 6, '#1e4218');
        fill(wx - 2 + sway, wy + 2, 14, 4, '#2d5a27');
        fill(wx + 1 + sway, wy - 2, 8, 6, '#498c3f');
        fill(wx + 3 + sway, wy - 3, 4, 3, '#65a856');
      });

      return;
    }

    // --- TILLED DARK SOIL BASE ---
    fill(6, 6, gw - 14, gh - 14, '#261408');
    const rowYs = [14, 38, 62, 86, 110];
    for (const ry of rowYs) {
      fill(8, ry, gw - 18, 2, '#3b210f');
      fill(8, ry + 2, gw - 18, 11, '#211106');
      fill(8, ry + 13, gw - 18, 4, '#140a03');
    }

    const fertAlpha = garden.phase === 'sow' ? 1.0 : Math.max(0.25, 1.0 - garden.growthProgress * 0.8);
    ctx.save();
    ctx.globalAlpha = fertAlpha;
    for (let i = 0; i < 64; i++) {
      const fx = 12 + ((i * 29 + 7) % (gw - 26));
      const fy = 10 + ((i * 17 + 5) % (gh - 22));
      const color = i % 3 === 0 ? '#e8e2d0' : i % 3 === 1 ? '#ffd54f' : '#80deea';
      fill(fx, fy, 2, 1, color);
    }
    ctx.restore();

    const colXs = [24, 52, 80, 108, 136, 164, 190];
    const sowP =
      isTargetOfActiveAction && this.activeGardenAction?.type === 'sow'
        ? this.activeGardenAction.progress
        : 1.0;
    const totalSlots = 5 * 7;
    rowYs.forEach((ry, rIdx) => {
      colXs.forEach((cx, cIdx) => {
        fill(cx - 2, ry + 4, 6, 5, '#3b210f');
        fill(cx - 1, ry + 5, 4, 3, '#080301');
        const slotIdx = rIdx * 7 + cIdx;
        const isSeeded = garden.phase !== 'sow' ? true : (slotIdx / totalSlots) <= sowP;
        if (isSeeded) {
          fill(cx, ry + 6, 2, 1, '#e6be68');
        }
      });
    });

    if (garden.phase === 'sow') {
      return;
    }

    const p = garden.phase === 'harvest' ? 1.0 : garden.growthProgress;

    if (p > 0.35) {
      const vineProgress = Math.min(1, (p - 0.35) / 0.23);
      const maxSpanW = (gw - 24) * vineProgress;
      const maxSpanH = (gh - 28) * vineProgress;

      for (const ry of rowYs) {
        const vy = ry + 6;
        fill(12, vy + 2, maxSpanW, 3, '#100803');
        fill(12, vy, maxSpanW, 3, '#234f1b');
        fill(14, vy, Math.max(0, maxSpanW - 4), 2, '#428236');
        if (p < 0.85) {
          fill(14, vy, Math.max(0, maxSpanW - 6), 1, '#5ca34e');
        }
      }

      const runnerCols = [38, 76, 114, 152, 182];
      for (const vx of runnerCols) {
        if (vx - 12 <= maxSpanW) {
          fill(vx + 2, 14, 2, maxSpanH, '#100803');
          fill(vx, 14, 3, maxSpanH, '#2b5e22');
          fill(vx + 1, 16, 1, Math.max(0, maxSpanH - 4), '#48873c');
        }
      }
    }

    rowYs.forEach((ry, rIdx) => {
      colXs.forEach((cx, cIdx) => {
        const nodeIndex = rIdx * 7 + cIdx;
        const nodeDelay = (nodeIndex % 7) * 0.012 + rIdx * 0.008;

        if (p >= 0.06 + nodeDelay * 0.4 && p < 0.16 + nodeDelay) {
          fill(cx, ry + 5, 2, 2, '#65b84f');
        }

        const localSprout = Math.max(0, Math.min(1, (p - (0.14 + nodeDelay)) / 0.18));
        if (localSprout > 0) {
          const sway = Math.round(Math.sin(this.animClock * 4 + nodeIndex) * (p < 0.55 ? 1 : 0.4));
          const stemH = Math.max(1, Math.round(localSprout * 5));
          const leafW = Math.max(1, Math.round(localSprout * 5));

          fill(cx, ry + 6 - stemH, 2, stemH, '#3d782e');
          fill(cx - leafW + sway, ry + 5 - stemH, leafW, 3, '#24521a');
          fill(cx - leafW + sway, ry + 4 - stemH, leafW, 2, '#4ea33b');
          fill(cx + 2 + sway, ry + 5 - stemH, leafW, 3, '#24521a');
          fill(cx + 2 + sway, ry + 4 - stemH, leafW, 2, '#4ea33b');

          if (localSprout > 0.6) {
            fill(cx - leafW + 1 + sway, ry + 4 - stemH, Math.max(1, leafW - 2), 1, '#82d66b');
            fill(cx + 3 + sway, ry + 4 - stemH, Math.max(1, leafW - 2), 1, '#82d66b');
          }
        }

        if (p > 0.36 + nodeDelay) {
          const leafGrowth = Math.min(1, (p - (0.36 + nodeDelay)) / 0.20);
          const lw = Math.round(4 + leafGrowth * 6);
          const lh = Math.round(3 + leafGrowth * 4);
          const lx = cx - Math.floor(lw / 2) + ((nodeIndex % 2 === 0) ? -4 : 4);
          const ly = ry + 3;

          fill(lx, ly + 2, lw, lh, '#120903');
          fill(lx, ly, lw, lh, '#183d12');
          fill(lx + 1, ly + 1, Math.max(2, lw - 2), Math.max(2, lh - 2), '#2d6323');
          if (leafGrowth > 0.5) {
            fill(lx + 2, ly + 2, Math.max(2, lw - 4), 1, '#5ca34e');
          }
        }
      });
    });

    if (p > 0.58 && p < 0.94) {
      const flowerNodes = [
        [34, 16], [66, 18], [98, 15], [130, 18], [160, 16], [184, 19],
        [26, 42], [58, 40], [92, 43], [122, 41], [150, 42], [178, 40],
        [38, 66], [70, 64], [104, 67], [138, 65], [168, 66],
        [28, 90], [62, 88], [96, 91], [128, 89], [156, 90], [182, 88],
        [42, 114], [78, 112], [116, 115], [148, 113], [176, 114],
      ];

      flowerNodes.forEach(([fx, fy], idx) => {
        const appearAt = 0.58 + (idx % 8) * 0.018;
        if (p >= appearAt) {
          const bloomScale = Math.min(1, (p - appearAt) / 0.08);
          const fadeOut = p > 0.82 ? Math.max(0, 1 - (p - 0.82) / 0.12) : 1;
          const pulse = Math.sin(this.animClock * 5 + idx) > 0 ? 1 : 0;

          if (fadeOut > 0.2) {
            if (bloomScale < 0.5) {
              fill(fx + 1, fy + 1, 3, 3, '#f0b000');
              fill(fx + 1, fy + 1, 2, 2, '#ffe135');
            } else {
              fill(fx, fy + 1, 5, 4, '#183d12');
              fill(fx + 1, fy, 3, 5, '#ffe135');
              fill(fx, fy + 1, 5, 3, '#ffe135');
              fill(fx + 1, fy + 3, 3, 2, '#f0b000');
              fill(fx + 1, fy, 2 + pulse, 1, '#fff380');
              fill(fx + 2, fy + 2, 1, 1, '#cc6600');
            }
          }
        }
      });
    }

    if (p > 0.76) {
      const fruitProgress = Math.min(1, (p - 0.76) / 0.24);

      const melonSites: Array<{ x: number; y: number; isHero: boolean }> = [
        { x: 38, y: 20, isHero: false },
        { x: 108, y: 20, isHero: false },
        { x: 174, y: 20, isHero: false },
        { x: 38, y: 68, isHero: false },
        { x: 108, y: 68, isHero: true },
        { x: 174, y: 68, isHero: false },
        { x: 38, y: 112, isHero: false },
        { x: 108, y: 112, isHero: false },
        { x: 174, y: 112, isHero: false },
      ];

      melonSites.forEach((site, idx) => {
        if (
          site.isHero &&
          isTargetOfActiveAction &&
          this.activeGardenAction?.type === 'harvest' &&
          this.activeGardenAction.progress >= 0.35
        ) {
          return;
        }
        const localFruit = Math.max(0, Math.min(1, (fruitProgress - (idx % 3) * 0.05) / 0.90));
        if (localFruit <= 0) return;

        const maxW = site.isHero ? 32 : 22;
        const maxH = site.isHero ? 22 : 15;
        const curW = Math.max(6, Math.round(6 + localFruit * (maxW - 6)));
        const curH = Math.max(5, Math.round(5 + localFruit * (maxH - 5)));
        const mx = site.x - Math.floor(curW / 2);
        const my = site.y - Math.floor(curH / 2);

        fill(mx + 1, my + curH - 1, curW - 2, Math.max(2, Math.round(curH * 0.25)), '#0f0702');

        if (localFruit < 0.48) {
          fill(mx + 1, my, curW - 2, curH, '#5c9132');
          fill(mx, my + 1, curW, curH - 2, '#5c9132');
          fill(mx + 1, my + 1, curW - 2, curH - 2, '#88c454');
          fill(mx + 2, my + 1, Math.max(2, curW - 4), Math.max(2, Math.floor(curH * 0.55)), '#a6de76');
          fill(mx + 2, my + 1, Math.max(2, Math.floor(curW * 0.3)), 1, '#d8f7b8');
        } else {
          fill(mx + 2, my, curW - 4, curH, '#0f3012');
          fill(mx + 1, my + 1, curW - 2, curH - 2, '#0f3012');
          fill(mx, my + 2, curW, Math.max(2, curH - 4), '#0b240d');

          fill(mx + 2, my + 1, curW - 4, curH - 2, '#184a1d');
          fill(mx + 1, my + 2, curW - 2, Math.max(2, curH - 4), '#184a1d');

          const stripe1Y = my + Math.max(1, Math.floor(curH * 0.16));
          const stripe2Y = my + Math.floor(curH * 0.44);
          const stripe3Y = my + Math.floor(curH * 0.72);
          const stripeH = Math.max(1, Math.floor(curH * 0.15));

          fill(mx + 3, stripe1Y, Math.max(4, curW - 6), stripeH, '#68b54e');
          fill(mx + 5, stripe1Y, Math.max(2, Math.floor(curW * 0.35)), 1, '#88d46c');

          fill(mx + 1, stripe2Y, Math.max(4, curW - 2), stripeH + 1, '#5ca644');
          fill(mx + 3, stripe2Y, Math.max(3, Math.floor(curW * 0.3)), stripeH, '#88d46c');
          fill(mx + Math.floor(curW * 0.55), stripe2Y + 1, Math.max(2, Math.floor(curW * 0.28)), 1, '#88d46c');

          fill(mx + 2, stripe3Y, Math.max(4, curW - 4), stripeH, '#498c35');
          fill(mx + 4, stripe3Y, Math.max(3, Math.floor(curW * 0.4)), 1, '#72bd57');

          const gleamShift = garden.phase === 'harvest' ? (Math.floor(this.animClock * 3) % 2) : 0;
          fill(mx + 4 + gleamShift, my + 2, Math.max(2, Math.floor(curW * 0.2)), 1, '#d4fabe');
        }
      });
    }

    // Render Emergency Crawling Pests on Vines / Melons of the targeted plot
    if (
      this.activeEmergency &&
      this.activeEmergency.targetPlotId === garden.id &&
      this.activeEmergency.pestsRemaining > 0
    ) {
      const activeCount = this.activeEmergency.pestsRemaining;
      const positions = this.activeEmergency.pestPositions.slice(0, activeCount);

      positions.forEach((pos, idx) => {
        const crawlX = pos.x + Math.sin(this.animClock * 3.5 + pos.offset) * 6;
        const crawlY = pos.y + Math.cos(this.animClock * 2.8 + pos.offset) * 4;
        const legWiggle = Math.floor(this.animClock * 10 + idx) % 2;

        if (this.activeEmergency?.type === 'cucumber_beetle') {
          // Yellow & Black Striped Beetle (Acalymma vittatum)
          fill(crawlX - 1, crawlY + 1, 8, 5, '#140a03');
          fill(crawlX, crawlY, 7, 5, '#f1c40f');
          fill(crawlX + 2, crawlY + 1, 1, 3, '#000000');
          fill(crawlX + 4, crawlY + 1, 1, 3, '#000000');
          fill(crawlX - 2, crawlY + 1, 2, 2, '#000000');
          fill(crawlX - 3, crawlY, 1, 1, '#f39c12');
          fill(crawlX - 3, crawlY + 3, 1, 1, '#f39c12');
          fill(crawlX + 1, crawlY - 1 - legWiggle, 1, 1, '#000000');
          fill(crawlX + 4, crawlY - 1 + legWiggle, 1, 1, '#000000');
          fill(crawlX + 1, crawlY + 5 + legWiggle, 1, 1, '#000000');
          fill(crawlX + 4, crawlY + 5 - legWiggle, 1, 1, '#000000');
        } else if (this.activeEmergency?.type === 'melon_aphid') {
          // Lime-green Melon Aphid
          fill(crawlX, crawlY, 5, 4, '#2ecc71');
          fill(crawlX + 1, crawlY + 1, 3, 2, '#a3e4d7');
          fill(crawlX - 1, crawlY + 1, 1, 1, '#111111');
          fill(crawlX + 1, crawlY - 1 + legWiggle, 1, 1, '#1e8449');
          fill(crawlX + 3, crawlY + 4 - legWiggle, 1, 1, '#1e8449');
        } else {
          // Invasive Weed Shoot
          fill(crawlX, crawlY - 2, 6, 8, '#7d6608');
          fill(crawlX + 1, crawlY - 4, 4, 4, '#d4ac0d');
          fill(crawlX - 1, crawlY, 8, 2, '#140a03');
        }
      });
    }
  }

  /**
   * Renders a cozy, compact 16-bit RPG action prompt bubble at (centerX, bottomY).
   * Automatically parses action text & key binding (e.g. "Rest [E]" -> action "Rest", key "E")
   * and renders a stylized pixel card with an interactive keycap badge.
   */
  private drawFloatingPromptBubble(
    ctx: CanvasRenderingContext2D,
    rawTag: string,
    centerX: number,
    bottomY: number,
    borderColor = '#f0c54d'
  ) {
    let actionText = rawTag;
    let keyText = 'E';
    const match = rawTag.match(/^(.*?)\s*\[(.*?)\]$/);
    if (match) {
      actionText = match[1].trim();
      keyText = match[2].trim();
    } else {
      keyText = '';
    }

    ctx.save();

    // 1. Measure text widths with crisp 6px/5px pixel font
    ctx.font = 'bold 6px "Press Start 2P", monospace';
    const actionW = Math.ceil(ctx.measureText(actionText).width);
    ctx.font = 'bold 5px "Press Start 2P", monospace';
    const keyW = keyText ? Math.ceil(ctx.measureText(keyText).width) : 0;

    const keyCapW = keyText ? Math.max(12, keyW + 6) : 0;
    const keyCapH = 11;
    const paddingX = 5;
    const gap = keyText ? 4 : 0;

    const bubbleW = Math.max(38, paddingX + actionW + gap + keyCapW + paddingX);
    const bubbleH = 15;
    const bubbleX = Math.floor(centerX - bubbleW / 2);
    const bubbleY = Math.floor(bottomY - bubbleH - 5);

    // Pixel drop shadow
    ctx.fillStyle = 'rgba(8, 4, 2, 0.75)';
    ctx.fillRect(bubbleX + 1, bubbleY + 2, bubbleW, bubbleH);

    // Outer Border Frame with 1px Corner Pixel Cutouts (Notches)
    ctx.fillStyle = borderColor;
    ctx.fillRect(bubbleX + 1, bubbleY, bubbleW - 2, bubbleH);
    ctx.fillRect(bubbleX, bubbleY + 1, bubbleW, bubbleH - 2);

    // Dark Timber/Leather Inner Body
    ctx.fillStyle = '#241306';
    ctx.fillRect(bubbleX + 1, bubbleY + 1, bubbleW - 2, bubbleH - 2);

    // Cozy Inner Bevel & Top Highlight Line
    ctx.fillStyle = '#3a200d';
    ctx.fillRect(bubbleX + 2, bubbleY + 2, bubbleW - 4, bubbleH - 4);
    ctx.fillStyle = '#543015';
    ctx.fillRect(bubbleX + 2, bubbleY + 2, bubbleW - 4, 1);

    // Downward Pointer Tick
    ctx.fillStyle = borderColor;
    ctx.fillRect(Math.floor(centerX) - 3, bubbleY + bubbleH, 6, 2);
    ctx.fillStyle = '#241306';
    ctx.fillRect(Math.floor(centerX) - 2, bubbleY + bubbleH, 4, 1);
    ctx.fillStyle = borderColor;
    ctx.fillRect(Math.floor(centerX) - 1, bubbleY + bubbleH + 2, 2, 1);

    // 2. Render Crisp Action Text
    ctx.font = 'bold 6px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff8e7';
    const textCenterY = bubbleY + Math.floor(bubbleH / 2) + 0.5;
    ctx.fillText(actionText, bubbleX + paddingX, textCenterY);

    // 3. Render Styled 3D Pixel Keycap Button Badge
    if (keyText) {
      const keyCapX = bubbleX + bubbleW - paddingX - keyCapW;
      const keyCapY = bubbleY + 2;

      // Keycap outer border
      ctx.fillStyle = borderColor;
      ctx.fillRect(keyCapX, keyCapY, keyCapW, keyCapH);
      // Keycap face fill & 3D bevel
      ctx.fillStyle = '#140a03';
      ctx.fillRect(keyCapX + 1, keyCapY + 1, keyCapW - 2, keyCapH - 2);
      ctx.fillStyle = '#4a2c14';
      ctx.fillRect(keyCapX + 1, keyCapY + 1, keyCapW - 2, keyCapH - 3);
      ctx.fillStyle = '#6e4320';
      ctx.fillRect(keyCapX + 1, keyCapY + 1, keyCapW - 2, 2);

      // Keycap letter text
      ctx.font = 'bold 5px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(keyText, keyCapX + keyCapW / 2, keyCapY + keyCapH / 2 + 0.5);
    }

    ctx.restore();
  }

  private renderGardenBubble(ctx: CanvasRenderingContext2D, garden: PlotData) {
    if (this.activeGardenAction) return;
    const centerX = Math.floor(garden.x + garden.width / 2);

    if (this.activeEmergency && this.activeEmergency.targetPlotId === garden.id) {
      this.drawFloatingPromptBubble(ctx, `Pick Bugs [E]`, centerX - 38, garden.y + 12, '#e67e22');
      this.drawFloatingPromptBubble(ctx, `Bio-Spray [F]`, centerX + 38, garden.y + 12, '#2ecc71');
      return;
    }

    if (garden.phase === 'growing') return;
    const tag =
      garden.actionTag ||
      (garden.phase === 'locked_forest'
        ? `Buy Plot #${garden.plotNumber} (${garden.deedPrice}G) [E]`
        : garden.phase === 'forest_trees'
        ? 'Chop Trees [E]'
        : garden.phase === 'forest_stumps'
        ? 'Pull Stumps [E]'
        : garden.phase === 'sow'
        ? 'Sow [E]'
        : garden.phase === 'harvest'
        ? 'Harvest [E]'
        : 'Clear [E]');
    const borderColor =
      garden.phase === 'harvest'
        ? '#88d46c'
        : garden.phase === 'forest_trees' || garden.phase === 'forest_stumps'
        ? '#e67e22'
        : '#e0b034';
    this.drawFloatingPromptBubble(ctx, tag, centerX, garden.y, borderColor);
  }

  /**
   * Renders the retro 16-bit wood & brass action progress bar above the player's head.
   */
  private renderActionProgressBar(ctx: CanvasRenderingContext2D) {
    if (!this.activeGardenAction) return;
    const act = this.activeGardenAction;
    const px = Math.floor(this.playerX + 16);
    const py = Math.floor(this.playerY - 14);

    const barW = 76;
    const barH = 13;
    const bx = Math.floor(px - barW / 2);
    const by = py;

    // Pixel drop shadow
    ctx.fillStyle = 'rgba(10, 6, 2, 0.85)';
    ctx.fillRect(bx + 1, by + 2, barW, barH);

    // 16-Bit Brass Outer Border
    ctx.fillStyle = '#e0b034';
    ctx.fillRect(bx, by, barW, barH);

    // Dark Timber Inner Bed
    ctx.fillStyle = '#241306';
    ctx.fillRect(bx + 1, by + 1, barW - 2, barH - 2);

    // Track
    ctx.fillStyle = '#140a03';
    ctx.fillRect(bx + 2, by + 2, barW - 4, barH - 4);

    const maxFillW = barW - 4;
    const fillW = Math.max(0, Math.floor(maxFillW * act.progress));

    if (fillW > 0) {
      let fillColor = '#2ecc71';
      let fillLight = '#58d68d';
      if (act.type === 'chop_trees') {
        fillColor = '#e67e22';
        fillLight = '#f39c12';
      } else if (act.type === 'clear_stumps') {
        fillColor = '#a04000';
        fillLight = '#d35400';
      } else if (act.type === 'clear') {
        fillColor = '#3498db';
        fillLight = '#5dade2';
      } else if (act.type === 'sow') {
        fillColor = '#f39c12';
        fillLight = '#f1c40f';
      }

      ctx.fillStyle = fillColor;
      ctx.fillRect(bx + 2, by + 2, fillW, barH - 4);
      ctx.fillStyle = fillLight;
      ctx.fillRect(bx + 2, by + 2, fillW, 2);

      // Segment notches every 10%
      ctx.fillStyle = 'rgba(10, 6, 2, 0.45)';
      for (let s = 1; s < 10; s++) {
        const sx = bx + 2 + Math.floor((maxFillW * s) / 10);
        if (sx < bx + 2 + fillW) {
          ctx.fillRect(sx, by + 2, 1, barH - 4);
        }
      }
    }

    // Downward pointer
    ctx.fillStyle = '#e0b034';
    ctx.fillRect(px - 2, by + barH, 4, 2);
    ctx.fillRect(px - 1, by + barH + 2, 2, 1);

    // Percentage Label
    const pct = Math.floor(act.progress * 100);
    const labelMap: Record<ActiveGardenAction['type'], string> = {
      chop_trees: 'CHOP',
      clear_stumps: 'STUMPS',
      clear: 'CLEAR',
      sow: 'SOW',
      harvest: 'HARVEST',
    };
    const text = `${labelMap[act.type]} ${pct}%`;
    ctx.font = 'bold 5px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, px, by + barH / 2 + 0.5);
  }

  /**
   * Renders the realistic, multi-zone 16-Bit Agronomy Laboratory Interior Scene (`currentLocation === 'lab_interior'`).
   * Features:
   * - North Wall: Sunlit windows, Stainless Lab Sink & Reagent Hutch, Wide Framed DA-BPI Chalkboard, and Oak Reference Library.
   * - Left Wing: Soil Chemistry & pH Titration Bay with Lab Tech Maya, island assay counter, burettes, digital pH meter, and stools.
   * - Right Wing: Lead Agronomist Office & Brix Quality Bay with Professor Citrullus, refractometer desk, microscope, and woven rug.
   * - Lower-Left & Lower-Right: Controlled-Environment Seedling Grow-Light Rack & Harvest Specimen Balance Table.
   * - Center Foyer & South Wall: Clean central walkway runner leading to the wooden Exit Door ("Open Door: Exit Lab [E]").
   */
  private renderLaboratoryInterior(ctx: CanvasRenderingContext2D) {
    const rx = this.labRoom.x;
    const ry = this.labRoom.y;
    const rw = this.labRoom.width;
    const rh = this.labRoom.height;

    const fill = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    };

    // 1. Outer Timber-And-Brass Structural Wall Frame
    fill(rx - 8, ry - 8, rw + 16, rh + 16, '#040805');
    fill(rx - 4, ry - 4, rw + 8, rh + 8, '#241306');
    fill(rx - 2, ry - 2, rw + 4, rh + 4, '#7a4d28');
    fill(rx, ry, rw, rh, '#3b210f');

    // Brass corner brackets on building frame
    fill(rx - 3, ry - 3, 6, 6, '#f0c54d');
    fill(rx + rw - 3, ry - 3, 6, 6, '#f0c54d');
    fill(rx - 3, ry + rh - 3, 6, 6, '#f0c54d');
    fill(rx + rw - 3, ry + rh - 3, 6, 6, '#f0c54d');

    // 2. North Interior Wall (Cream Plastered Masonry & Carved Oak Wainscoting, y: ry+8 .. ry+74)
    const wallX = rx + 10;
    const wallY = ry + 8;
    const wallW = rw - 20;
    fill(wallX, wallY, wallW, 48, '#dcd6c6');
    for (let by = wallY + 8; by < wallY + 48; by += 8) {
      fill(wallX, by, wallW, 1, '#c9c1af');
    }
    // Crown molding & lower wood wainscoting
    fill(wallX, wallY, wallW, 3, '#4a2c14');
    fill(wallX, wallY + 46, wallW, 3, '#3b210f');
    fill(wallX, wallY + 49, wallW, 15, '#6e4722');
    for (let wx = wallX + 8; wx < wallX + wallW - 4; wx += 10) {
      fill(wx, wallY + 49, 1, 15, '#4a2c14');
    }
    fill(wallX, wallY + 64, wallW, 3, '#241306');

    // 3. Ceramic Laboratory Tile Floor with Warm Grout & Subtle Central Corridor Runner
    const floorX = rx + 10;
    const floorY = ry + 75;
    const floorW = rw - 20;
    const floorH = rh - 85;
    const tileSz = 16;

    for (let ty = 0; ty < Math.ceil(floorH / tileSz); ty++) {
      for (let tx = 0; tx < Math.ceil(floorW / tileSz); tx++) {
        const px = floorX + tx * tileSz;
        const py = floorY + ty * tileSz;
        const w = Math.min(tileSz, floorX + floorW - px);
        const h = Math.min(tileSz, floorY + floorH - py);
        const isAlt = (tx + ty) % 2 === 0;
        fill(px, py, w, h, isAlt ? '#d8d1c4' : '#cbc3b4');
        fill(px, py, w, 1, isAlt ? '#e3ddd1' : '#d5cebf');
      }
    }

    // Subtle Wall Baseboard Shadow around perimeter
    fill(floorX, floorY, floorW, 4, 'rgba(20, 12, 5, 0.22)');

    // Central Foyer Runner Carpet (connecting Exit Door up to the two bays without looking like a table)
    fill(284, 120, 72, 166, '#4a2c14');
    fill(286, 122, 68, 162, '#7a4d28');
    fill(289, 125, 62, 156, '#234229');
    for (let ryStripe = 132; ryStripe < 276; ryStripe += 16) {
      fill(293, ryStripe, 54, 2, '#345e3c');
    }

    // Left Zone Mat (Dark Chemical-Resistant Mat under Soil Assay Bench)
    fill(116, 138, 124, 60, '#1c2621');
    fill(118, 140, 120, 56, '#27362e');
    fill(120, 142, 116, 52, '#1f2b25');

    // Right Zone Rug (Warm Burgundy & Brass Woven Office Rug under Professor's Brix Desk)
    fill(400, 138, 124, 60, '#3b1d16');
    fill(402, 140, 120, 56, '#8f5c34');
    fill(405, 143, 114, 50, '#5e2119');
    fill(409, 147, 106, 42, '#732920');

    // 4. North Wall Fixtures:
    // 4a. Left Wall Window & Stainless Sink / Reagent Hutch (x: 116..212)
    fill(122, wallY + 6, 34, 28, '#241306');
    fill(125, wallY + 9, 12, 22, '#5dade2');
    fill(141, wallY + 9, 12, 22, '#5dade2');
    fill(125, wallY + 19, 28, 2, '#241306');
    fill(127, wallY + 11, 5, 6, '#aed6f1');
    fill(143, wallY + 11, 5, 6, '#aed6f1');

    // Upper Chemical Reagent Cabinet (x: 162..222)
    fill(162, wallY + 6, 60, 28, '#3b210f');
    fill(164, wallY + 8, 56, 11, '#241306');
    fill(164, wallY + 21, 56, 11, '#241306');
    const bottles = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'];
    bottles.forEach((col, i) => {
      fill(168 + i * 10, wallY + 10, 5, 8, col);
      fill(169 + i * 10, wallY + 9, 3, 1, '#fff8e7');
      fill(168 + i * 10, wallY + 23, 6, 8, bottles[(i + 2) % bottles.length]);
    });

    // North-Left Stainless Sink & Preparation Counter (x: 116, y: 72, w: 96, h: 30)
    const sk = this.labSinkCounter;
    fill(sk.x, sk.y + sk.height - 2, sk.width, 4, 'rgba(10, 6, 2, 0.3)');
    fill(sk.x, sk.y, sk.width, sk.height, '#241306');
    fill(sk.x + 2, sk.y + 2, sk.width - 4, 12, '#95a5a6');
    fill(sk.x + 4, sk.y + 3, sk.width - 8, 9, '#bdc3c7');
    // Recessed laboratory sink basin & brass gooseneck faucet
    fill(sk.x + 10, sk.y + 4, 28, 7, '#566573');
    fill(sk.x + 12, sk.y + 5, 24, 5, '#34495e');
    fill(sk.x + 22, sk.y - 2, 4, 6, '#d4a838');
    fill(sk.x + 24, sk.y + 4, 2, 3, '#5dade2');
    // Drying rack & distilled water carboy on right half of sink counter
    fill(sk.x + 50, sk.y - 3, 12, 13, '#aed6f1');
    fill(sk.x + 52, sk.y + 2, 8, 7, '#3498db');
    fill(sk.x + 68, sk.y - 1, 16, 11, '#fff8e7');
    fill(sk.x + 70, sk.y + 2, 12, 3, '#2ecc71');
    // Lower wooden cabinet doors
    fill(sk.x + 2, sk.y + 15, sk.width - 4, sk.height - 17, '#5c3818');
    fill(sk.x + 48, sk.y + 15, 2, sk.height - 17, '#241306');

    // 4b. Center Framed DA-BPI Agronomy Chalkboard (x: 234..406, width: 172px — zero text overflow!)
    const cbX = 234;
    const cbY = wallY + 5;
    const cbW = 172;
    const cbH = 42;
    fill(cbX, cbY, cbW, cbH, '#3b210f');
    fill(cbX + 2, cbY + 2, cbW - 4, cbH - 4, '#8a5a2e');
    fill(cbX + 4, cbY + 4, cbW - 8, cbH - 8, '#14331d');
    // Chalk tray & chalk pieces
    fill(cbX + 12, cbY + cbH - 3, cbW - 24, 4, '#5c3818');
    fill(cbX + 28, cbY + cbH - 4, 8, 2, '#fff8e7');
    fill(cbX + 44, cbY + cbH - 4, 8, 2, '#f0c54d');
    fill(cbX + 120, cbY + cbH - 5, 12, 3, '#241306');

    ctx.font = 'bold 6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0c54d';
    ctx.fillText('DA-BPI AGRONOMY LAB', cbX + cbW / 2, cbY + 13);
    ctx.fillStyle = '#e3f0d8';
    ctx.fillText('SOIL pH: 6.0 - 6.8', cbX + cbW / 2, cbY + 24);
    ctx.fillStyle = '#88d46c';
    ctx.fillText('NPK 1:2:2 · BRIX 10+', cbX + cbW / 2, cbY + 34);

    // 4c. Right Wall Botanical Poster & Oak Reference Bookshelf (x: 416..520)
    // Framed Watermelon Botanical Chart
    fill(418, wallY + 7, 36, 34, '#3b210f');
    fill(420, wallY + 9, 32, 30, '#f7eed7');
    fill(426, wallY + 14, 20, 12, '#184a1d');
    fill(428, wallY + 16, 16, 8, '#e74c3c');
    fill(424, wallY + 30, 24, 2, '#6e4722');
    fill(424, wallY + 34, 18, 2, '#8a5a2e');

    // Tall Oak Reference Bookshelf (x: 464, y: 68, w: 56, h: 34)
    const bs = this.labBookshelf;
    fill(bs.x, bs.y + bs.height - 2, bs.width, 4, 'rgba(10, 6, 2, 0.35)');
    fill(bs.x, bs.y - 26, bs.width, bs.height + 26, '#241306');
    fill(bs.x + 2, bs.y - 24, bs.width - 4, bs.height + 22, '#5c3818');
    for (let sy = bs.y - 20; sy < bs.y + bs.height - 6; sy += 13) {
      fill(bs.x + 4, sy, bs.width - 8, 10, '#2b1809');
      for (let bx = bs.x + 6; bx < bs.x + bs.width - 8; bx += 5) {
        const bCol =
          (bx + sy) % 4 === 0
            ? '#c0392b'
            : (bx + sy) % 4 === 1
            ? '#2980b9'
            : (bx + sy) % 4 === 2
            ? '#27ae60'
            : '#d4a838';
        fill(bx, sy + 1, 4, 9, bCol);
      }
    }

    // 5. Lower-Left Corner: Controlled-Environment Seedling Grow-Light Rack
    const sr = this.labSeedlingRack;
    fill(sr.x, sr.y + sr.height - 2, sr.width, 5, 'rgba(10, 6, 2, 0.35)');
    fill(sr.x, sr.y, sr.width, sr.height, '#1e2b22');
    fill(sr.x + 2, sr.y + 2, sr.width - 4, sr.height - 4, '#2c3e32');
    // Glowing UV/Grow-Light Strip
    fill(sr.x + 6, sr.y + 4, sr.width - 12, 3, '#fff380');
    // Soil propagation tray with 5 sprouting Citrullus lanatus seedlings
    fill(sr.x + 6, sr.y + 10, sr.width - 12, 18, '#3b210f');
    fill(sr.x + 8, sr.y + 12, sr.width - 16, 14, '#261408');
    for (let sx = sr.x + 14; sx < sr.x + sr.width - 14; sx += 15) {
      fill(sx, sr.y + 15, 8, 8, '#8a4b29'); // Terracotta pot
      fill(sx + 2, sr.y + 11, 4, 5, '#2ecc71'); // Green cotyledon sprout
      fill(sx + 1, sr.y + 10, 6, 2, '#88d46c');
    }

    // 6. Lower-Right Corner: Harvest Sample Crates & Analytical Balance Table
    const st = this.labSpecimenTable;
    fill(st.x, st.y + st.height - 2, st.width, 5, 'rgba(10, 6, 2, 0.35)');
    fill(st.x, st.y, st.width, st.height, '#241306');
    fill(st.x + 2, st.y + 2, st.width - 4, 14, '#784b24');
    fill(st.x + 2, st.y + 16, st.width - 4, st.height - 18, '#4a2c14');
    // Slatted wooden crate with 2 harvested striped melons
    fill(st.x + 8, st.y - 6, 42, 16, '#5c3818');
    fill(st.x + 10, st.y - 4, 16, 12, '#184a1d');
    fill(st.x + 12, st.y - 1, 12, 3, '#88d46c');
    fill(st.x + 28, st.y - 4, 16, 12, '#184a1d');
    fill(st.x + 30, st.y - 1, 12, 3, '#88d46c');
    // Brass analytical balance scale on right side of table
    fill(st.x + 60, st.y - 5, 20, 14, '#241306');
    fill(st.x + 62, st.y - 3, 16, 10, '#f0c54d');
    fill(st.x + 65, st.y - 1, 10, 4, '#14331d');

    // 7. Depth-Sorted Midground Entities (NPCs, Workstations, and Player sorted by Y so walking around desks looks natural)
    const renderSoilWorkstation = () => {
      const sb = this.labSoilBench;
      fill(sb.x, sb.y + sb.height - 2, sb.width, 5, 'rgba(10, 6, 2, 0.4)');
      fill(sb.x, sb.y, sb.width, sb.height, '#241306');
      // Chemical-resistant slate-green benchtop with oak trim
      fill(sb.x + 2, sb.y + 2, sb.width - 4, 15, '#2b4238');
      fill(sb.x + 4, sb.y + 3, sb.width - 8, 12, '#355246');
      fill(sb.x + 2, sb.y + 17, sb.width - 4, sb.height - 19, '#633d1e');
      fill(sb.x + 36, sb.y + 17, 2, sb.height - 19, '#241306');
      fill(sb.x + 72, sb.y + 17, 2, sb.height - 19, '#241306');

      // Titration Burette Stand on left
      fill(sb.x + 10, sb.y - 12, 2, 20, '#bdc3c7');
      fill(sb.x + 7, sb.y + 6, 8, 3, '#7f8c8d');
      fill(sb.x + 12, sb.y - 9, 6, 3, '#e74c3c');
      fill(sb.x + 14, sb.y - 6, 5, 11, '#aed6f1');
      fill(sb.x + 15, sb.y - 1, 3, 5, '#2ecc71');

      // Digital pH Meter ("6.5") in center-left
      fill(sb.x + 30, sb.y - 5, 22, 14, '#1c0f05');
      fill(sb.x + 32, sb.y - 3, 18, 9, '#14331d');
      fill(sb.x + 34, sb.y - 1, 14, 5, '#2ecc71');

      // Conical Flasks & Test Tube Rack on right
      fill(sb.x + 60, sb.y - 6, 10, 14, '#d6eaf8');
      fill(sb.x + 61, sb.y + 1, 8, 6, '#3498db');
      fill(sb.x + 76, sb.y - 4, 22, 12, '#4a2c14');
      fill(sb.x + 79, sb.y - 8, 4, 9, '#f1c40f');
      fill(sb.x + 85, sb.y - 8, 4, 9, '#e74c3c');
      fill(sb.x + 91, sb.y - 8, 4, 9, '#2ecc71');

      // Two Lab Stools in front of Soil Bench
      fill(sb.x + 22, sb.y + sb.height + 3, 12, 8, '#241306');
      fill(sb.x + 23, sb.y + sb.height + 4, 10, 5, '#8a5a2e');
      fill(sb.x + 74, sb.y + sb.height + 3, 12, 8, '#241306');
      fill(sb.x + 75, sb.y + sb.height + 4, 10, 5, '#8a5a2e');
    };

    const renderHarvestWorkstation = () => {
      const hb = this.labHarvestBench;
      fill(hb.x, hb.y + hb.height - 2, hb.width, 5, 'rgba(10, 6, 2, 0.4)');
      fill(hb.x, hb.y, hb.width, hb.height, '#241306');
      fill(hb.x + 2, hb.y + 2, hb.width - 4, 15, '#784b24');
      fill(hb.x + 4, hb.y + 3, hb.width - 8, 12, '#966132');
      fill(hb.x + 2, hb.y + 17, hb.width - 4, hb.height - 19, '#4a2c14');
      fill(hb.x + 52, hb.y + 17, 2, hb.height - 19, '#241306');

      // Cut Watermelon Specimen on Tray (left)
      fill(hb.x + 8, hb.y - 4, 24, 13, '#d8c29d');
      fill(hb.x + 10, hb.y - 6, 20, 12, '#184a1d');
      fill(hb.x + 12, hb.y - 4, 16, 8, '#e74c3c');
      fill(hb.x + 15, hb.y - 2, 2, 2, '#111111');
      fill(hb.x + 21, hb.y - 2, 2, 2, '#111111');

      // Optical Brix Refractometer & Brass Microscope (center)
      fill(hb.x + 40, hb.y - 3, 16, 11, '#2c3e50');
      fill(hb.x + 50, hb.y - 2, 5, 8, '#5dade2');
      fill(hb.x + 64, hb.y - 10, 10, 18, '#d4a838');
      fill(hb.x + 62, hb.y + 5, 14, 3, '#241306');

      // Open Agronomy Ledger & Quill on right
      fill(hb.x + 82, hb.y - 3, 20, 13, '#f7eed7');
      fill(hb.x + 91, hb.y - 3, 2, 13, '#bba377');
      fill(hb.x + 84, hb.y, 6, 2, '#6e4722');
      fill(hb.x + 94, hb.y + 2, 6, 2, '#27ae60');
    };

    const drawList: Array<{ y: number; draw: () => void }> = [
      {
        y: this.labSoilBench.y + this.labSoilBench.height,
        draw: renderSoilWorkstation,
      },
      {
        y: this.labHarvestBench.y + this.labHarvestBench.height,
        draw: renderHarvestWorkstation,
      },
      ...this.labInteriorNpcs.map(npc => ({
        y: npc.y + npc.height,
        draw: () => {
          const sprite = this.atlas.npcs[npc.id];
          if (sprite) {
            ctx.drawImage(sprite, npc.x, npc.y);
          }
        },
      })),
      {
        y: this.playerY + 30,
        draw: () => {
          this.drawPlayerWithJumpAndWalk(ctx);
        },
      },
    ];

    drawList.sort((a, b) => a.y - b.y);
    for (const item of drawList) {
      item.draw();
    }

    // 8. Interior Exit Door at Bottom Center of Laboratory Room (x: 296, y: 294)
    const ed = this.labExitDoor;
    // Coir welcome mat inside the door
    fill(ed.x - 4, ed.y - 16, ed.width + 8, 14, '#241306');
    fill(ed.x - 2, ed.y - 14, ed.width + 4, 10, '#6e4722');
    fill(ed.x + 2, ed.y - 12, ed.width - 4, 6, '#8a5a2e');
    // Wooden Exit Door Frame built into the south wall
    fill(ed.x - 2, ed.y, ed.width + 4, ed.height, '#241306');
    fill(ed.x + 2, ed.y + 2, ed.width - 4, ed.height - 4, '#784b24');
    fill(ed.x + 6, ed.y + 5, 16, ed.height - 9, '#5c3818');
    fill(ed.x + 26, ed.y + 5, 16, ed.height - 9, '#5c3818');
    // Brass doorknob & EXIT badge
    fill(ed.x + ed.width - 10, ed.y + 12, 4, 4, '#f0c54d');
    fill(ed.x + 12, ed.y - 2, 24, 9, '#1b4324');
    ctx.font = 'bold 5px "Press Start 2P", monospace';
    ctx.fillStyle = '#88d46c';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', ed.x + ed.width / 2, ed.y + 3);

    // 9. Render Floating Interactive Prompt Bubble when player is near Exit Door, Professor, Maya, or Lab Benches
    const nearby = this.getNearbyInteractable();
    if (nearby) {
      const borderCol =
        nearby.type === 'lab_exit_door'
          ? '#88d46c'
          : nearby.type === 'soil_bench' || nearby.type === 'harvest_bench'
          ? '#2ecc71'
          : '#f0c54d';
      this.drawFloatingPromptBubble(ctx, nearby.label, nearby.x, nearby.y, borderCol);
    }
  }

  /**
   * Renders the realistic 16-Bit Farmer House (Cabin) Interior Scene (`currentLocation === 'cabin_interior'`).
   * Features:
   * - Warm hardwood plank floor with wood grain, log-and-wainscoted cabin walls, sunlit curtained windows,
   *   and a central brick hearth fireplace with a warm flickering fire animation.
   * - Left Wing: Realistic Wardrobe Cabinet (`Open Wardrobe: Outfits [E]`) — tall carved mahogany armoire
   *   with double doors (one slightly ajar showing hanging farmer outfits, lab coat, overalls & caps),
   *   a standing full-length dressing mirror, and a woven dressing rug.
   * - Right Wing: Realistic Farmhouse Bed (`Sleep Until 06:00 AM [E]`) — solid oak four-poster bed with
   *   carved headboard & footboard, two white pillows, a folded forest-green & harvest-gold patchwork quilt,
   *   a bedside nightstand with a glowing brass table lamp, and a braided bedroom rug.
   * - Lower-Left & Lower-Right: Farmhouse dining table with sliced watermelon & tea mug, plus a study desk & fern.
   * - South Center: Interior wooden Exit Door (`Open Door: Exit House [E]`) with welcome mat.
   */
  private renderCabinInterior(ctx: CanvasRenderingContext2D) {
    const rx = this.cabinRoom.x;
    const ry = this.cabinRoom.y;
    const rw = this.cabinRoom.width;
    const rh = this.cabinRoom.height;

    const fill = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    };

    // 1. Outer Log-And-Brass Structural Cabin Frame
    fill(rx - 8, ry - 8, rw + 16, rh + 16, '#040805');
    fill(rx - 4, ry - 4, rw + 8, rh + 8, '#241306');
    fill(rx - 2, ry - 2, rw + 4, rh + 4, '#8c5828');
    fill(rx, ry, rw, rh, '#3b210f');

    // Brass corner brackets
    fill(rx - 3, ry - 3, 6, 6, '#f0c54d');
    fill(rx + rw - 3, ry - 3, 6, 6, '#f0c54d');
    fill(rx - 3, ry + rh - 3, 6, 6, '#f0c54d');
    fill(rx + rw - 3, ry + rh - 3, 6, 6, '#f0c54d');

    // 2. North Interior Cabin Wall (Warm Timber Planks & Wainscoting, y: ry+8 .. ry+74)
    const wallX = rx + 10;
    const wallY = ry + 8;
    const wallW = rw - 20;
    fill(wallX, wallY, wallW, 48, '#b88b58');
    for (let by = wallY; by < wallY + 48; by += 8) {
      fill(wallX, by, wallW, 2, '#c99e6b');
      fill(wallX, by + 7, wallW, 1, '#85582a');
    }
    // Exposed timber ceiling beam & lower carved wainscoting
    fill(wallX, wallY, wallW, 4, '#3b210f');
    fill(wallX, wallY + 46, wallW, 3, '#3b210f');
    fill(wallX, wallY + 49, wallW, 15, '#5c3416');
    for (let wx = wallX + 8; wx < wallX + wallW - 4; wx += 10) {
      fill(wx, wallY + 49, 1, 15, '#3b210f');
    }
    fill(wallX, wallY + 64, wallW, 3, '#241306');

    // 3. Warm Hardwood Plank Floor with Wood Grain & Joinery Seams
    const floorX = rx + 10;
    const floorY = ry + 75;
    const floorW = rw - 20;
    const floorH = rh - 85;
    fill(floorX, floorY, floorW, floorH, '#8c5828');

    const plankH = 12;
    for (let py = floorY; py < floorY + floorH; py += plankH) {
      const rowIdx = Math.floor((py - floorY) / plankH);
      const isAlt = rowIdx % 2 === 0;
      const h = Math.min(plankH, floorY + floorH - py);
      fill(floorX, py, floorW, h, isAlt ? '#96602e' : '#875425');
      fill(floorX, py, floorW, 1, isAlt ? '#a66d38' : '#96602e');
      fill(floorX, py + h - 1, floorW, 1, '#593312');

      const offset = (rowIdx * 37) % 64;
      for (let px = floorX + offset; px < floorX + floorW - 8; px += 64) {
        fill(px, py, 2, h, '#593312');
        fill(px + 14, py + 4, 18, 1, '#75461d');
      }
    }

    // Wall Baseboard Shadow
    fill(floorX, floorY, floorW, 4, 'rgba(20, 10, 3, 0.28)');

    // 4. Cozy Farmhouse Area Rugs:
    // 4a. Left Dressing Area Rug (Warm Forest-Green & Gold Woven Mat in front of Wardrobe & Mirror)
    fill(118, 146, 104, 52, '#241306');
    fill(120, 148, 100, 48, '#d4a838');
    fill(123, 151, 94, 42, '#1f4726');
    fill(128, 156, 84, 32, '#2b5e33');

    // 4b. Center Hearth Rug (Braided Crimson, Gold & Timber Rug in front of Fireplace)
    fill(266, 140, 108, 134, '#241306');
    fill(268, 142, 104, 130, '#8f5c34');
    fill(272, 146, 96, 122, '#6e231a');
    fill(278, 152, 84, 110, '#872d22');
    fill(286, 160, 68, 94, '#d4a838');
    fill(290, 164, 60, 86, '#5c2018');

    // 4c. Right Bedroom Area Rug (Soft Cream, Sage & Gold Woven Rug under Farmhouse Bed)
    fill(404, 122, 114, 74, '#241306');
    fill(406, 124, 110, 70, '#c7a467');
    fill(410, 128, 102, 62, '#2c5434');
    fill(414, 132, 94, 54, '#3a6b44');

    // 5. North Wall Windows & Brick Hearth Fireplace:
    // Left Sunlit Cottage Window with Curtains (x: 146, y: wallY + 6)
    const drawCurtainedWindow = (wx: number, wy: number) => {
      fill(wx, wy, 42, 32, '#241306');
      fill(wx + 3, wy + 3, 16, 26, '#5dade2');
      fill(wx + 23, wy + 3, 16, 26, '#5dade2');
      fill(wx + 3, wy + 15, 36, 2, '#241306');
      fill(wx + 5, wy + 5, 6, 8, '#d6eaf8');
      fill(wx + 25, wy + 5, 6, 8, '#d6eaf8');
      // Warm red-and-gold draped curtains on left and right
      fill(wx - 3, wy - 2, 48, 3, '#3b210f');
      fill(wx - 2, wy + 1, 8, 30, '#872d22');
      fill(wx, wy + 1, 4, 28, '#a93226');
      fill(wx - 2, wy + 18, 9, 2, '#f0c54d');
      fill(wx + 36, wy + 1, 8, 30, '#872d22');
      fill(wx + 38, wy + 1, 4, 28, '#a93226');
      fill(wx + 35, wy + 18, 9, 2, '#f0c54d');
      // Wooden window sill
      fill(wx - 2, wy + 31, 46, 4, '#4a2c14');
    };
    drawCurtainedWindow(148, wallY + 6);
    drawCurtainedWindow(442, wallY + 6);

    // Center North Wall: Brick & Stone Farmhouse Fireplace (x: 276, y: 36..98)
    const fp = this.cabinFireplace;
    // Stone hearth pad on floor
    fill(fp.x - 6, fp.y + fp.height - 4, fp.width + 12, 14, '#343a40');
    fill(fp.x - 4, fp.y + fp.height - 2, fp.width + 8, 10, '#6c757d');
    // Brick chimney breast rising up the north wall
    fill(fp.x, wallY + 2, fp.width, fp.y + fp.height - (wallY + 2), '#241306');
    fill(fp.x + 2, wallY + 4, fp.width - 4, fp.y + fp.height - (wallY + 6), '#7d321d');
    for (let by = wallY + 8; by < fp.y + fp.height - 6; by += 6) {
      fill(fp.x + 2, by, fp.width - 4, 1, '#4a1d10');
    }
    // Carved Oak Fireplace Mantle Shelf
    fill(fp.x - 4, wallY + 28, fp.width + 8, 6, '#241306');
    fill(fp.x - 2, wallY + 29, fp.width + 4, 4, '#8c5828');
    // Framed Golden Watermelon Trophy Plaque & Candle on Mantle
    fill(fp.x + 28, wallY + 8, 32, 18, '#241306');
    fill(fp.x + 30, wallY + 10, 28, 14, '#1b4324');
    fill(fp.x + 38, wallY + 13, 12, 8, '#2ecc71');
    fill(fp.x + 10, wallY + 18, 5, 10, '#fff8e7');
    fill(fp.x + 11, wallY + 15, 3, 3, '#f1c40f');
    // Arched Firebox & Flickering Logs/Flames
    fill(fp.x + 16, fp.y - 6, fp.width - 32, 32, '#140b05');
    fill(fp.x + 22, fp.y + 16, fp.width - 44, 6, '#4a2c14');
    const flicker = Math.floor(this.animClock * 6) % 3;
    fill(fp.x + 26, fp.y + 6 + flicker, 36, 12 - flicker, '#e67e22');
    fill(fp.x + 32, fp.y + 8 - flicker, 24, 10, '#f1c40f');
    fill(fp.x + 38, fp.y + 11, 12, 6, '#fff380');

    // 6. Depth-Sorted Midground Furniture & Player (so the player walks naturally in front of and behind furniture)
    // 6a. Realistic Wardrobe Cabinet & Standing Dressing Mirror (Left Wing)
    const renderWardrobeAndMirror = () => {
      const wd = this.cabinInteriorWardrobe;
      // Drop shadow
      fill(wd.x - 2, wd.y + wd.height - 2, wd.width + 4, 6, 'rgba(10, 6, 2, 0.45)');

      // Main Carved Mahogany Armoire Body (x: 124, y: 74..154, width: 62, height: 80)
      const armX = wd.x;
      const armY = wd.y - 38;
      const armW = 62;
      const armH = 80;

      // Outer cabinet frame & overhanging crown molding
      fill(armX - 3, armY, armW + 6, 6, '#241306');
      fill(armX - 1, armY + 1, armW + 2, 4, '#8c5828');
      fill(armX, armY + 6, armW, armH - 6, '#241306');
      fill(armX + 2, armY + 8, armW - 4, armH - 10, '#5c3416');

      // Left Door (Closed carved walnut door with recessed panels & brass handle)
      fill(armX + 4, armY + 10, 25, 50, '#3b210f');
      fill(armX + 6, armY + 12, 21, 21, '#784722');
      fill(armX + 8, armY + 14, 17, 17, '#8c5828');
      fill(armX + 6, armY + 36, 21, 22, '#784722');
      fill(armX + 8, armY + 38, 17, 18, '#8c5828');
      // Brass keyhole plate & handle on left door
      fill(armX + 24, armY + 31, 3, 6, '#f0c54d');

      // Right Bay (Open Wardrobe Compartment revealing hanging outfits, shirts, lab coat & hats!)
      fill(armX + 31, armY + 10, 27, 50, '#1f1107');
      // Brass hanging rod across top of wardrobe interior
      fill(armX + 32, armY + 14, 25, 2, '#f0c54d');
      // Hanging Outfit 1: White Agronomy Lab Coat
      fill(armX + 34, armY + 16, 7, 22, '#ecf0f1');
      fill(armX + 36, armY + 16, 3, 8, '#3498db');
      // Hanging Outfit 2: Forest-Green Field Jacket & Overalls
      fill(armX + 42, armY + 16, 7, 22, '#27ae60');
      fill(armX + 43, armY + 26, 5, 12, '#2980b9');
      // Hanging Outfit 3: Harvest Gold Flannel Shirt
      fill(armX + 50, armY + 16, 6, 20, '#e67e22');
      fill(armX + 51, armY + 18, 4, 14, '#f1c40f');
      // Lower Shoe & Hat Shelf inside right bay
      fill(armX + 32, armY + 42, 25, 2, '#784722');
      fill(armX + 34, armY + 45, 9, 5, '#2ecc71'); // Farmer cap
      fill(armX + 45, armY + 45, 10, 5, '#d4a838'); // Straw hat

      // Bottom Full-Width Linen Drawers with Brass Pulls
      fill(armX + 4, armY + 62, armW - 8, 13, '#3b210f');
      fill(armX + 6, armY + 64, 24, 9, '#6e4320');
      fill(armX + 32, armY + 64, 24, 9, '#6e4320');
      fill(armX + 15, armY + 67, 6, 3, '#f0c54d');
      fill(armX + 41, armY + 67, 6, 3, '#f0c54d');

      // Standing Full-Length Dressing Mirror beside the Armoire (x: armX + 66, y: armY + 16)
      const mirX = armX + 66;
      const mirY = armY + 18;
      fill(mirX - 2, mirY + 54, 24, 6, '#241306');
      fill(mirX, mirY + 52, 20, 4, '#6e4320');
      fill(mirX, mirY, 20, 54, '#241306');
      fill(mirX + 2, mirY + 2, 16, 50, '#8c5828');
      fill(mirX + 4, mirY + 4, 12, 46, '#85c1e9');
      fill(mirX + 5, mirY + 6, 4, 40, '#d6eaf8');
      fill(mirX + 10, mirY + 14, 3, 24, '#aed6f1');
    };

    // 6b. Realistic Farmhouse Bed & Bedside Nightstand with Warm Lamp (Right Wing)
    const sleepAct = this.activeSleepAction;
    const isTuckedInBed =
      sleepAct !== null &&
      (sleepAct.phase === 'sleeping' ||
        sleepAct.phase === 'blinking' ||
        (sleepAct.phase === 'waking_up' && sleepAct.elapsedMs < 3800));

    const renderBedAndNightstand = () => {
      // Bedside Nightstand (x: 386, y: 104, w: 28, h: 30)
      const ns = this.cabinNightstand;
      fill(ns.x, ns.y + ns.height - 2, ns.width, 4, 'rgba(10, 6, 2, 0.4)');
      fill(ns.x, ns.y, ns.width, ns.height, '#241306');
      fill(ns.x + 2, ns.y + 2, ns.width - 4, 10, '#8c5828');
      fill(ns.x + 2, ns.y + 13, ns.width - 4, ns.height - 15, '#5c3416');
      fill(ns.x + 11, ns.y + 18, 6, 3, '#f0c54d');

      // Warm Glowing Brass Table Lamp on Nightstand (dims softly while sleeping)
      const isNightLampDim =
        sleepAct !== null && (sleepAct.phase === 'sleeping' || sleepAct.phase === 'blinking');
      fill(ns.x + 5, ns.y - 4, 10, 8, '#d4a838');
      fill(ns.x + 2, ns.y - 14, 16, 11, '#241306');
      fill(ns.x + 3, ns.y - 13, 14, 9, isNightLampDim ? '#b87333' : '#f5b041');
      fill(ns.x + 5, ns.y - 11, 10, 5, isNightLampDim ? '#e67e22' : '#fef9e7');

      // Farmer's Green Cap placed neatly on the Nightstand while the character is in bed
      if (isTuckedInBed) {
        fill(ns.x + 17, ns.y - 3, 9, 4, '#2d6e28');
        fill(ns.x + 18, ns.y - 3, 7, 1, '#428f3b');
        fill(ns.x + 16, ns.y, 10, 2, '#153812');
      }

      // Realistic Solid Oak Farmhouse Four-Poster Bed (x: 420, y: 114, w: 86, h: 66)
      const bed = this.cabinInteriorBed;
      fill(bed.x - 2, bed.y + bed.height - 2, bed.width + 4, 6, 'rgba(10, 6, 2, 0.45)');

      // Carved Oak Headboard & Corner Posts (extending above bed.y)
      const hbY = bed.y - 20;
      fill(bed.x, hbY, bed.width, 24, '#241306');
      fill(bed.x + 2, hbY + 2, bed.width - 4, 20, '#6e4320');
      fill(bed.x + 6, hbY + 5, 34, 14, '#8c5828');
      fill(bed.x + 46, hbY + 5, 34, 14, '#8c5828');
      // Brass finials on headboard posts
      fill(bed.x + 1, hbY - 3, 6, 4, '#f0c54d');
      fill(bed.x + bed.width - 7, hbY - 3, 6, 4, '#f0c54d');

      // Main Wooden Bed Frame & Mattress Base
      fill(bed.x, bed.y, bed.width, bed.height, '#241306');
      fill(bed.x + 2, bed.y + 2, bed.width - 4, bed.height - 4, '#5c3416');
      // Crisp White Fitted Sheet & Folded Top Sheet
      fill(bed.x + 5, bed.y + 4, bed.width - 10, bed.height - 14, '#e8e2d5');
      fill(bed.x + 6, bed.y + 5, bed.width - 12, 18, '#ffffff');

      // Two Plump Stitched White Pillows at the Head of the Bed
      fill(bed.x + 9, bed.y + 4, 30, 14, '#bdc3c7');
      fill(bed.x + 10, bed.y + 5, 28, 12, '#ffffff');
      fill(bed.x + 12, bed.y + 7, 24, 8, '#f8f9f9');

      fill(bed.x + 47, bed.y + 4, 30, 14, '#bdc3c7');
      fill(bed.x + 48, bed.y + 5, 28, 12, '#ffffff');
      fill(bed.x + 50, bed.y + 7, 24, 8, '#f8f9f9');

      // Character Laying Down on Left Pillow (drawn BEFORE the quilt so the quilt tucks over their body!)
      let breathRise = 0;
      if (isTuckedInBed && sleepAct) {
        // Subtle pillow depression shadow under head
        fill(bed.x + 13, bed.y + 6, 22, 9, '#d5dbdb');
        let sleepFrameIdx = 0;
        if (sleepAct.phase === 'waking_up') {
          sleepFrameIdx = 2; // Eyes open & morning stretch
        } else {
          sleepFrameIdx = Math.floor(sleepAct.elapsedMs / 550) % 2;
          breathRise = sleepFrameIdx === 1 ? -1 : 0;
        }
        const sleepSprite =
          this.atlas.playerSleeping[sleepFrameIdx] || this.atlas.playerSleeping[0];
        if (sleepSprite) {
          ctx.drawImage(sleepSprite, bed.x + 9, bed.y + 4);
        }
      }

      // Folded Forest-Green & Harvest-Gold Patchwork Quilt covering lower 2/3 of the bed
      const qY = bed.y + 21 + breathRise;
      const qH = bed.height - 31 - breathRise;
      fill(bed.x + 5, qY, bed.width - 10, qH, '#14331d');
      // Folded gold trim collar at top of quilt
      fill(bed.x + 5, qY, bed.width - 10, 5, '#d4a838');
      fill(bed.x + 6, qY + 1, bed.width - 12, 3, '#f0c54d');
      // Subtle body contour highlight under the quilt when tucked in
      if (isTuckedInBed) {
        fill(bed.x + 11, qY + 5, 26, 18, '#194726');
      }
      // Patchwork squares
      const sqW = 18;
      const sqH = 13;
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 4; c++) {
          const sx = bed.x + 7 + c * sqW;
          const sy = qY + 6 + r * sqH;
          const isEven = (r + c) % 2 === 0;
          fill(sx, sy, sqW - 1, sqH - 1, isEven ? '#27ae60' : '#2d6a36');
          fill(sx + 2, sy + 2, sqW - 5, sqH - 5, isEven ? '#52be80' : '#f0c54d');
        }
      }

      // Carved Oak Footboard & Corner Posts at bottom of Bed
      fill(bed.x, bed.y + bed.height - 10, bed.width, 10, '#241306');
      fill(bed.x + 2, bed.y + bed.height - 8, bed.width - 4, 6, '#784722');
      fill(bed.x + 1, bed.y + bed.height - 12, 6, 4, '#f0c54d');
      fill(bed.x + bed.width - 7, bed.y + bed.height - 12, 6, 4, '#f0c54d');
    };

    // 6c. Lower-Left Farmhouse Dining Table with Fresh Watermelon Bowl & Tea Mug
    const renderDiningTable = () => {
      const dt = this.cabinDiningTable;
      fill(dt.x, dt.y + dt.height - 2, dt.width, 5, 'rgba(10, 6, 2, 0.4)');
      // Wooden chairs tucked on left and right
      fill(dt.x - 10, dt.y + 8, 10, 24, '#241306');
      fill(dt.x - 8, dt.y + 10, 8, 20, '#6e4320');
      fill(dt.x + dt.width, dt.y + 8, 10, 24, '#241306');
      fill(dt.x + dt.width, dt.y + 10, 8, 20, '#6e4320');
      // Table body
      fill(dt.x, dt.y, dt.width, dt.height, '#241306');
      fill(dt.x + 2, dt.y + 2, dt.width - 4, 24, '#8c5828');
      fill(dt.x + 4, dt.y + 4, dt.width - 8, 20, '#a06732');
      fill(dt.x + 2, dt.y + 26, dt.width - 4, dt.height - 28, '#5c3416');
      // Cream & Red Checkered Table Runner
      fill(dt.x + 14, dt.y + 6, dt.width - 28, 16, '#f7eed7');
      fill(dt.x + 16, dt.y + 8, dt.width - 32, 12, '#c0392b');
      // Wooden Bowl with Sliced Red Watermelon & Ceramic Mug
      fill(dt.x + 24, dt.y + 6, 22, 12, '#3b210f');
      fill(dt.x + 26, dt.y + 5, 18, 10, '#184a1d');
      fill(dt.x + 28, dt.y + 6, 14, 7, '#e74c3c');
      fill(dt.x + 56, dt.y + 8, 9, 9, '#fff8e7');
      fill(dt.x + 58, dt.y + 9, 5, 5, '#6e4320');
    };

    // 6d. Lower-Right Farmhouse Study Desk & Potted Monstera Plant
    const renderStudyDesk = () => {
      const sd = this.cabinStudyDesk;
      fill(sd.x, sd.y + sd.height - 2, sd.width, 5, 'rgba(10, 6, 2, 0.4)');
      fill(sd.x, sd.y, sd.width, sd.height, '#241306');
      fill(sd.x + 2, sd.y + 2, sd.width - 4, 18, '#784722');
      fill(sd.x + 2, sd.y + 20, sd.width - 4, sd.height - 22, '#4a2c14');
      // Open Farmer's Almanac & Brass Lantern on Desk
      fill(sd.x + 12, sd.y + 4, 22, 13, '#f7eed7');
      fill(sd.x + 22, sd.y + 4, 2, 13, '#8c5828');
      fill(sd.x + 42, sd.y + 2, 12, 14, '#f0c54d');
      // Lush Potted Fern beside Desk
      fill(sd.x + 62, sd.y + 6, 14, 12, '#8a4b29');
      fill(sd.x + 58, sd.y - 6, 22, 14, '#1e4624');
      fill(sd.x + 60, sd.y - 8, 18, 12, '#2ecc71');
      fill(sd.x + 63, sd.y - 10, 12, 6, '#88d46c');
    };

    const drawList: Array<{ y: number; draw: () => void }> = [
      {
        y: this.cabinInteriorWardrobe.y + this.cabinInteriorWardrobe.height,
        draw: renderWardrobeAndMirror,
      },
      {
        y: this.cabinInteriorBed.y + this.cabinInteriorBed.height,
        draw: renderBedAndNightstand,
      },
      {
        y: this.cabinDiningTable.y + this.cabinDiningTable.height,
        draw: renderDiningTable,
      },
      {
        y: this.cabinStudyDesk.y + this.cabinStudyDesk.height,
        draw: renderStudyDesk,
      },
    ];

    if (!isTuckedInBed) {
      drawList.push({
        y: sleepAct
          ? Math.max(this.playerY + 30, this.cabinInteriorBed.y + this.cabinInteriorBed.height + 2)
          : this.playerY + 30,
        draw: () => {
          const isStepAnim = sleepAct !== null;
          const frameIdx = isStepAnim
            ? Math.floor((sleepAct?.elapsedMs || 0) / 140) % 4
            : undefined;
          this.drawPlayerWithJumpAndWalk(ctx, frameIdx);
        },
      });
    }

    drawList.sort((a, b) => a.y - b.y);
    for (const item of drawList) {
      item.draw();
    }

    // 7. Interior Exit Door at Bottom Center of Farmer House (x: 296, y: 294)
    const ed = this.cabinExitDoor;
    // Coir welcome mat inside the door
    fill(ed.x - 4, ed.y - 16, ed.width + 8, 14, '#241306');
    fill(ed.x - 2, ed.y - 14, ed.width + 4, 10, '#6e4722');
    fill(ed.x + 2, ed.y - 12, ed.width - 4, 6, '#8a5a2e');
    // Wooden Exit Door Frame built into the south wall
    fill(ed.x - 2, ed.y, ed.width + 4, ed.height, '#241306');
    fill(ed.x + 2, ed.y + 2, ed.width - 4, ed.height - 4, '#784b24');
    fill(ed.x + 6, ed.y + 5, 16, ed.height - 9, '#5c3818');
    fill(ed.x + 26, ed.y + 5, 16, ed.height - 9, '#5c3818');
    // Brass doorknob & EXIT badge
    fill(ed.x + ed.width - 10, ed.y + 12, 4, 4, '#f0c54d');
    fill(ed.x + 12, ed.y - 2, 24, 9, '#1b4324');
    ctx.font = 'bold 5px "Press Start 2P", monospace';
    ctx.fillStyle = '#88d46c';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', ed.x + ed.width / 2, ed.y + 3);

    // 8. Render Active Sleep Animation Overlays (Cozy Night Dim, Floating Zzz Bubbles, Rest Gauge & Eyelid Blink)
    if (sleepAct) {
      this.renderCabinSleepSequence(ctx, sleepAct);
      return;
    }

    // 9. Render Floating Interactive Prompt Bubble when player is near Exit Door, Wardrobe, or Bed
    const nearby = this.getNearbyInteractable();
    if (nearby) {
      const borderCol =
        nearby.type === 'cabin_exit_door'
          ? '#88d46c'
          : nearby.type === 'wardrobe' || nearby.type === 'bed'
          ? '#f0c54d'
          : '#2ecc71';
      this.drawFloatingPromptBubble(ctx, nearby.label, nearby.x, nearby.y, borderCol);
    }
  }

  /**
   * Renders the cozy night ambiance, floating pixel-art "Zzz" sleep bubbles,
   * 16-bit Rest & Recovery gauge, and realistic Eyelid Blink & Dawn Transition.
   */
  private renderCabinSleepSequence(ctx: CanvasRenderingContext2D, sleepAct: ActiveSleepAction) {
    const bed = this.cabinInteriorBed;
    const rx = this.cabinRoom.x;
    const ry = this.cabinRoom.y;
    const rw = this.cabinRoom.width;
    const rh = this.cabinRoom.height;

    // 1. Cozy Nighttime Dimming or Morning Sunbeams inside Cabin
    if (sleepAct.phase === 'sleeping' || sleepAct.phase === 'blinking') {
      const dimAlpha =
        sleepAct.phase === 'sleeping'
          ? Math.min(0.38, ((sleepAct.elapsedMs - 650) / 700) * 0.38)
          : 0.38;
      ctx.save();
      ctx.fillStyle = `rgba(10, 14, 34, ${dimAlpha.toFixed(3)})`;
      ctx.fillRect(rx, ry, rw, rh);
      // Warm amber candlelight halo around the nightstand lamp & fireplace
      ctx.fillStyle = 'rgba(245, 176, 65, 0.14)';
      ctx.fillRect(this.cabinNightstand.x - 14, this.cabinNightstand.y - 26, 52, 52);
      ctx.fillRect(this.cabinFireplace.x + 8, this.cabinFireplace.y - 6, 72, 44);
      ctx.restore();
    } else if (sleepAct.phase === 'waking_up') {
      // Warm Golden Morning Sunbeams streaming from the north cabin windows
      const wakeFade = Math.max(0, 1 - (sleepAct.elapsedMs - 3350) / 650);
      ctx.save();
      ctx.fillStyle = `rgba(255, 236, 158, ${(0.22 * wakeFade).toFixed(3)})`;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.fillStyle = `rgba(255, 248, 196, ${(0.28 * wakeFade).toFixed(3)})`;
      ctx.fillRect(rx + 60, ry + 16, 64, 140);
      ctx.fillRect(rx + rw - 124, ry + 16, 64, 140);
      ctx.restore();
    }

    // 2. Floating Animated "Z", "z", "Zzz" Sleep Bubbles rising from the Character on the Pillow
    if (
      sleepAct.phase === 'sleeping' ||
      (sleepAct.phase === 'blinking' && sleepAct.elapsedMs < 2680)
    ) {
      const headX = bed.x + 25;
      const headY = bed.y + 4;
      const sleepElapsed = Math.max(0, sleepAct.elapsedMs - 650);

      const zBubbles = [
        { offsetMs: 0, label: 'z', fontSize: 6, color: '#aed6f1' },
        { offsetMs: 420, label: 'Z', fontSize: 8, color: '#f9e79f' },
        { offsetMs: 840, label: 'Zzz', fontSize: 9, color: '#f0c54d' },
      ];

      ctx.save();
      for (let i = 0; i < zBubbles.length; i++) {
        const zb = zBubbles[i];
        const localTime = sleepElapsed - zb.offsetMs;
        if (localTime < 0) continue;

        const cycleDur = 1250;
        const cycleT = (localTime % cycleDur) / cycleDur;
        const floatY = headY - 3 - cycleT * 26;
        const swayX = headX + Math.sin(cycleT * Math.PI * 2 + i * 1.4) * 7 + i * 4;
        const alpha =
          cycleT < 0.2 ? cycleT / 0.2 : cycleT > 0.78 ? (1 - cycleT) / 0.22 : 1.0;

        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.font = `bold ${zb.fontSize}px "Press Start 2P", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Crisp 16-bit dark pixel outline/shadow
        ctx.fillStyle = '#140a03';
        ctx.fillText(zb.label, Math.floor(swayX) + 1, Math.floor(floatY) + 1);
        ctx.fillText(zb.label, Math.floor(swayX) - 1, Math.floor(floatY));
        ctx.fillStyle = zb.color;
        ctx.fillText(zb.label, Math.floor(swayX), Math.floor(floatY));
      }
      ctx.restore();
    }

    // 3. 16-Bit Floating Rest & Recovery Progress Gauge above the Bed Headboard
    {
      const barW = 94;
      const barH = 14;
      const bx = Math.floor(bed.x + bed.width / 2 - barW / 2);
      const by = Math.floor(bed.y - 46);

      ctx.fillStyle = 'rgba(10, 6, 2, 0.85)';
      ctx.fillRect(bx + 1, by + 2, barW, barH);
      ctx.fillStyle = '#f0c54d';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = '#241306';
      ctx.fillRect(bx + 1, by + 1, barW - 2, barH - 2);
      ctx.fillStyle = '#140a03';
      ctx.fillRect(bx + 2, by + 2, barW - 4, barH - 4);

      const maxFillW = barW - 4;
      const fillW = Math.max(0, Math.floor(maxFillW * sleepAct.progress));
      if (fillW > 0) {
        ctx.fillStyle = sleepAct.phase === 'waking_up' ? '#2ecc71' : '#5dade2';
        ctx.fillRect(bx + 2, by + 2, fillW, barH - 4);
        ctx.fillStyle = sleepAct.phase === 'waking_up' ? '#88d46c' : '#85c1e9';
        ctx.fillRect(bx + 2, by + 2, fillW, 2);
      }

      const pct = Math.min(100, Math.floor(sleepAct.progress * 100));
      const labelText =
        sleepAct.phase === 'waking_up' ? 'MORNING 100%' : `SLEEPING ${pct}%`;
      ctx.font = 'bold 5px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff8e7';
      ctx.fillText(labelText, Math.floor(bed.x + bed.width / 2), by + barH / 2 + 0.5);
    }

    // 4. Realistic Eyelid Blink & Deep Sleep Dawn Transition (2300ms - 3350ms)
    if (sleepAct.phase === 'blinking') {
      const bElapsed = sleepAct.elapsedMs - 2300; // 0..1050ms
      let lidClosure = 0; // 0.0 (open) to 1.0 (completely closed)

      if (bElapsed < 170) {
        // First drowsy half-blink closing
        lidClosure = (bElapsed / 170) * 0.68;
      } else if (bElapsed < 300) {
        // Drowsy half-blink opening slightly
        lidClosure = 0.68 - ((bElapsed - 170) / 130) * 0.36;
      } else if (bElapsed < 480) {
        // Second full eyelid close into deep sleep
        lidClosure = 0.32 + ((bElapsed - 300) / 180) * 0.68;
      } else if (bElapsed < 780) {
        // Eyes fully closed in deep restful sleep while dawn breaks
        lidClosure = 1.0;
      } else {
        // Eyelids blinking open into the new morning (780ms..1050ms)
        lidClosure = Math.max(0, 1.0 - (bElapsed - 780) / 270);
      }

      const halfH = Math.ceil((this.viewHeight / 2) * lidClosure);
      ctx.save();
      // Soft dark vignette behind eyelids
      ctx.fillStyle = `rgba(8, 5, 14, ${(lidClosure * 0.55).toFixed(3)})`;
      ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);

      // Upper & Lower Eyelid Curtains closing toward center of screen
      ctx.fillStyle = '#0d0704';
      ctx.fillRect(0, 0, this.viewWidth, halfH);
      ctx.fillRect(0, this.viewHeight - halfH, this.viewWidth, halfH);

      // Subtle warm gold eyelid rim trim when partially blinking
      if (lidClosure > 0.05 && lidClosure < 0.98) {
        ctx.fillStyle = '#3b210f';
        ctx.fillRect(0, halfH - 2, this.viewWidth, 2);
        ctx.fillRect(0, this.viewHeight - halfH, this.viewWidth, 2);
      }

      // Centered 16-Bit Nocturnal Rest & Dawn Card when eyelids are nearly/fully closed
      if (lidClosure >= 0.88) {
        const tState = this.timeSystem.getState();
        const cardW = 310;
        const cardH = 68;
        const cx = Math.floor((this.viewWidth - cardW) / 2);
        const cy = Math.floor((this.viewHeight - cardH) / 2);

        ctx.fillStyle = '#f0c54d';
        ctx.fillRect(cx, cy, cardW, cardH);
        ctx.fillStyle = '#241306';
        ctx.fillRect(cx + 2, cy + 2, cardW - 4, cardH - 4);
        ctx.fillStyle = '#180d05';
        ctx.fillRect(cx + 4, cy + 4, cardW - 8, cardH - 8);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 8px "Press Start 2P", monospace';
        ctx.fillStyle = '#f0c54d';
        ctx.fillText('ZZZ... SLEEPING SOUNDLY', this.viewWidth / 2, cy + 20);

        ctx.font = 'bold 6px "Press Start 2P", monospace';
        ctx.fillStyle = '#88d46c';
        ctx.fillText(
          `DAWN BREAKS: ${tState.dayOfWeek}, DAY ${tState.day} - 06:00 AM`,
          this.viewWidth / 2,
          cy + 39
        );

        ctx.font = '5px "Press Start 2P", monospace';
        ctx.fillStyle = '#aed6f1';
        ctx.fillText(
          'STAMINA 100% RESTORED  |  MELON CROPS ADVANCED',
          this.viewWidth / 2,
          cy + 54
        );
      }
      ctx.restore();
    }
  }

  /**
   * Renders the Main Watermelon Trading Pavilion (`this.marketStall`) at (780, 334, w: 84, h: 44).
   * Features a Crimson & Cream striped canvas awning, timber posts, brass produce scale,
   * whole dark-green striped watermelons, halved red seeded watermelon slices, and melon crates below.
   */
  private renderMainWatermelonStall(ctx: CanvasRenderingContext2D) {
    const ms = this.marketStall;
    const fill = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    };

    // Ground drop shadow
    fill(ms.x - 4, ms.y + ms.height - 2, ms.width + 8, 6, 'rgba(10, 6, 2, 0.45)');

    // Lower Counter Base & Slatted Watermelon Storage Crates underneath
    fill(ms.x, ms.y + 10, ms.width, ms.height - 10, '#241306');
    fill(ms.x + 2, ms.y + 12, ms.width - 4, 14, '#8c5828');
    fill(ms.x + 2, ms.y + 26, ms.width - 4, ms.height - 28, '#5c3416');
    // Under-counter crate recesses with extra watermelons
    fill(ms.x + 8, ms.y + 28, 30, 13, '#2b1809');
    fill(ms.x + 11, ms.y + 30, 11, 9, '#184a1d');
    fill(ms.x + 13, ms.y + 33, 7, 2, '#88d46c');
    fill(ms.x + 24, ms.y + 30, 11, 9, '#184a1d');
    fill(ms.x + 26, ms.y + 33, 7, 2, '#88d46c');

    fill(ms.x + 46, ms.y + 28, 30, 13, '#2b1809');
    fill(ms.x + 49, ms.y + 30, 11, 9, '#184a1d');
    fill(ms.x + 51, ms.y + 33, 7, 2, '#88d46c');
    fill(ms.x + 62, ms.y + 30, 11, 9, '#184a1d');

    // Slanted Display Countertop with Butcher Paper & Tiered Produce Trays
    fill(ms.x + 3, ms.y + 2, ms.width - 6, 16, '#3b210f');
    fill(ms.x + 5, ms.y + 4, 48, 12, '#2d5a27'); // Banana-leaf lined melon bed
    fill(ms.x + 55, ms.y + 4, 24, 12, '#f7eed7'); // Cream butcher paper for cut slices

    // 4 Whole Striped Citrullus lanatus Watermelons on Left & Center Tray
    const wholeMelons = [
      [ms.x + 7, ms.y + 1],
      [ms.x + 22, ms.y + 1],
      [ms.x + 37, ms.y + 1],
      [ms.x + 14, ms.y + 7],
      [ms.x + 30, ms.y + 7],
    ];
    for (const [mx, my] of wholeMelons) {
      fill(mx, my, 13, 9, '#0f3012');
      fill(mx + 1, my + 1, 11, 7, '#184a1d');
      fill(mx + 2, my + 2, 9, 2, '#68b54e');
      fill(mx + 3, my + 5, 7, 2, '#88d46c');
      fill(mx + 3, my + 2, 3, 1, '#d4fabe');
    }

    // Halved & Quartered Bright-Red Seeded Watermelon Wedges on Right Butcher Paper
    // Half Melon 1
    fill(ms.x + 57, ms.y + 2, 11, 7, '#184a1d');
    fill(ms.x + 58, ms.y + 2, 9, 5, '#e74c3c');
    fill(ms.x + 60, ms.y + 4, 1, 1, '#111111');
    fill(ms.x + 64, ms.y + 4, 1, 1, '#111111');
    // Half Melon 2
    fill(ms.x + 67, ms.y + 7, 11, 7, '#184a1d');
    fill(ms.x + 68, ms.y + 7, 9, 5, '#ff5252');
    fill(ms.x + 70, ms.y + 9, 1, 1, '#111111');
    fill(ms.x + 74, ms.y + 9, 1, 1, '#111111');

    // Timber Support Pillars on Left & Right Corners
    const roofY = ms.y - 22;
    fill(ms.x + 2, roofY + 14, 4, 22, '#241306');
    fill(ms.x + 3, roofY + 14, 2, 22, '#6e4320');
    fill(ms.x + ms.width - 6, roofY + 14, 4, 22, '#241306');
    fill(ms.x + ms.width - 5, roofY + 14, 2, 22, '#6e4320');

    // Hanging Brass Produce Scale on Right Pillar
    fill(ms.x + ms.width - 14, roofY + 18, 8, 2, '#d4a838');
    fill(ms.x + ms.width - 11, roofY + 20, 2, 6, '#f0c54d');
    fill(ms.x + ms.width - 14, roofY + 26, 8, 3, '#f0c54d');

    // Scalloped Crimson & Cream Striped Canvas Awning Roof
    const awX = ms.x - 4;
    const awW = ms.width + 8;
    fill(awX, roofY, awW, 18, '#241306');
    const stripeW = 8;
    for (let sx = awX + 2; sx < awX + awW - 2; sx += stripeW) {
      const idx = Math.floor((sx - awX) / stripeW);
      const isRed = idx % 2 === 0;
      const w = Math.min(stripeW, awX + awW - 2 - sx);
      fill(sx, roofY + 2, w, 12, isRed ? '#c0392b' : '#f7eed7');
      fill(sx, roofY + 2, w, 3, isRed ? '#e74c3c' : '#ffffff');
      // Scalloped valance fringe at bottom of awning
      fill(sx + 1, roofY + 14, Math.max(2, w - 2), 4, isRed ? '#922b21' : '#dfd3b8');
    }

    // Mini Wooden Header Badge on Awning ("MELONS")
    fill(ms.x + 18, roofY - 5, 48, 9, '#241306');
    fill(ms.x + 19, roofY - 4, 46, 7, '#3b210f');
    ctx.font = 'bold 5px "Press Start 2P", monospace';
    ctx.fillStyle = '#f0c54d';
    ctx.textAlign = 'center';
    ctx.fillText('MELONS', ms.x + ms.width / 2, roofY + 1);
  }

  /**
   * Renders the Tropical Fruit & Citrus Harvest Stall (`this.fruitMarketStall`) at (944, 334, w: 96, h: 44).
   * Features a Forest-Green & Harvest-Gold striped awning, 6 slanted woven rattan bins filled with
   * golden mangoes, pineapples, red apples, citrus oranges, green bananas, and watermelons.
   */
  private renderFruitMarketStall(ctx: CanvasRenderingContext2D) {
    const fs = this.fruitMarketStall;
    const fill = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    };

    // Ground drop shadow
    fill(fs.x - 4, fs.y + fs.height - 2, fs.width + 8, 6, 'rgba(10, 6, 2, 0.45)');

    // Wooden Counter Body & Woven Rattan Fruit Baskets underneath
    fill(fs.x, fs.y + 10, fs.width, fs.height - 10, '#241306');
    fill(fs.x + 2, fs.y + 12, fs.width - 4, 14, '#784722');
    fill(fs.x + 2, fs.y + 26, fs.width - 4, fs.height - 28, '#4a2c14');

    // 3 Woven Baskets under the stall brimming with extra fruits
    for (let bi = 0; bi < 3; bi++) {
      const bx = fs.x + 8 + bi * 28;
      const by = fs.y + 28;
      fill(bx, by, 22, 12, '#241306');
      fill(bx + 1, by + 2, 20, 9, '#b88b58');
      fill(bx + 2, by + 4, 18, 2, '#8c5828');
      const fCol = bi === 0 ? '#f1c40f' : bi === 1 ? '#e74c3c' : '#e67e22';
      fill(bx + 3, by, 16, 4, fCol);
    }

    // Slanted 4-Compartment Fruit Display Rack on Countertop
    fill(fs.x + 3, fs.y + 1, fs.width - 6, 17, '#3b210f');

    // Bin 1 (Left): Golden Philippine Mangoes
    fill(fs.x + 5, fs.y + 3, 20, 13, '#5c3416');
    for (let mx = 0; mx < 3; mx++) {
      for (let my = 0; my < 2; my++) {
        fill(fs.x + 7 + mx * 6, fs.y + 4 + my * 5, 5, 4, '#f39c12');
        fill(fs.x + 8 + mx * 6, fs.y + 4 + my * 5, 3, 2, '#f1c40f');
      }
    }

    // Bin 2 (Center-Left): Crisp Red Apples & Crimson Plums
    fill(fs.x + 27, fs.y + 3, 20, 13, '#5c3416');
    for (let ax = 0; ax < 3; ax++) {
      for (let ay = 0; ay < 2; ay++) {
        fill(fs.x + 29 + ax * 6, fs.y + 4 + ay * 5, 5, 4, '#c0392b');
        fill(fs.x + 30 + ax * 6, fs.y + 4 + ay * 5, 2, 2, '#ff6b6b');
      }
    }

    // Bin 3 (Center-Right): Tropical Pineapples (with green leafy crowns) & Citrus Oranges
    fill(fs.x + 49, fs.y + 3, 20, 13, '#5c3416');
    fill(fs.x + 51, fs.y + 5, 7, 9, '#d68910');
    fill(fs.x + 52, fs.y + 6, 5, 7, '#f5b041');
    fill(fs.x + 52, fs.y + 1, 5, 4, '#27ae60'); // Pineapple crown
    fill(fs.x + 60, fs.y + 5, 7, 9, '#d68910');
    fill(fs.x + 61, fs.y + 6, 5, 7, '#f5b041');
    fill(fs.x + 61, fs.y + 1, 5, 4, '#27ae60');

    // Bin 4 (Right): Sweet Striped Watermelons & Green Banana Hands
    fill(fs.x + 71, fs.y + 3, 20, 13, '#5c3416');
    fill(fs.x + 73, fs.y + 3, 16, 6, '#2ecc71');
    fill(fs.x + 74, fs.y + 4, 14, 3, '#f1c40f'); // Ripe bananas
    fill(fs.x + 73, fs.y + 9, 15, 7, '#184a1d'); // Striped melon
    fill(fs.x + 75, fs.y + 11, 11, 2, '#88d46c');

    // Timber Support Pillars
    const roofY = fs.y - 22;
    fill(fs.x + 2, roofY + 14, 4, 22, '#241306');
    fill(fs.x + 3, roofY + 14, 2, 22, '#6e4320');
    fill(fs.x + fs.width - 6, roofY + 14, 4, 22, '#241306');
    fill(fs.x + fs.width - 5, roofY + 14, 2, 22, '#6e4320');

    // Scalloped Forest-Green & Harvest-Gold Striped Canvas Awning Roof
    const awX = fs.x - 4;
    const awW = fs.width + 8;
    fill(awX, roofY, awW, 18, '#241306');
    const stripeW = 8;
    for (let sx = awX + 2; sx < awX + awW - 2; sx += stripeW) {
      const idx = Math.floor((sx - awX) / stripeW);
      const isGreen = idx % 2 === 0;
      const w = Math.min(stripeW, awX + awW - 2 - sx);
      fill(sx, roofY + 2, w, 12, isGreen ? '#1e5628' : '#f0c54d');
      fill(sx, roofY + 2, w, 3, isGreen ? '#2ecc71' : '#fff380');
      fill(sx + 1, roofY + 14, Math.max(2, w - 2), 4, isGreen ? '#143b1b' : '#c99b26');
    }

    // Mini Wooden Header Badge ("FRUITS")
    fill(fs.x + 24, roofY - 5, 48, 9, '#241306');
    fill(fs.x + 25, roofY - 4, 46, 7, '#1b4324');
    ctx.font = 'bold 5px "Press Start 2P", monospace';
    ctx.fillStyle = '#f0c54d';
    ctx.textAlign = 'center';
    ctx.fillText('FRUITS', fs.x + fs.width / 2, roofY + 1);
  }

  /**
   * Renders the Farm Seed, Fertilizer & Melon Crate Stand (`this.produceCrateStall`) at (944, 484, w: 96, h: 44).
   * Features a Terracotta-Orange & Cream striped awning, stacked wooden crates of striped watermelons
   * and golden honeydews, plus burlap sacks of NPK fertilizer and seed packets.
   */
  private renderProduceCrateStall(ctx: CanvasRenderingContext2D) {
    const cs = this.produceCrateStall;
    const fill = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    };

    // Ground drop shadow
    fill(cs.x - 4, cs.y + cs.height - 2, cs.width + 8, 6, 'rgba(10, 6, 2, 0.45)');

    // Heavy Timber Platform & Crate Base
    fill(cs.x, cs.y + 10, cs.width, cs.height - 10, '#241306');
    fill(cs.x + 2, cs.y + 12, cs.width - 4, 14, '#8c5828');
    fill(cs.x + 2, cs.y + 26, cs.width - 4, cs.height - 28, '#5c3416');

    // Left Section: Burlap Sacks of 14-14-14 NPK & Organic Seed Pouches
    fill(cs.x + 6, cs.y - 2, 22, 18, '#241306');
    fill(cs.x + 7, cs.y - 1, 20, 16, '#c7a467');
    fill(cs.x + 9, cs.y + 3, 16, 4, '#27ae60');
    fill(cs.x + 10, cs.y + 9, 14, 2, '#784722');

    // Center Section: Slatted Wooden Crate Packed with Striped Watermelons
    fill(cs.x + 31, cs.y - 2, 34, 18, '#241306');
    fill(cs.x + 32, cs.y - 1, 32, 16, '#6e4320');
    fill(cs.x + 34, cs.y + 1, 13, 10, '#184a1d');
    fill(cs.x + 36, cs.y + 4, 9, 2, '#88d46c');
    fill(cs.x + 49, cs.y + 1, 13, 10, '#184a1d');
    fill(cs.x + 51, cs.y + 4, 9, 2, '#88d46c');

    // Right Section: Crate of Golden Honeydew Melons & Red Watermelon Wedges
    fill(cs.x + 67, cs.y - 2, 24, 18, '#241306');
    fill(cs.x + 68, cs.y - 1, 22, 16, '#6e4320');
    fill(cs.x + 70, cs.y + 2, 9, 9, '#f1c40f');
    fill(cs.x + 71, cs.y + 3, 6, 4, '#fff380');
    fill(cs.x + 80, cs.y + 2, 9, 9, '#e74c3c');
    fill(cs.x + 80, cs.y + 9, 9, 3, '#184a1d');

    // Lower Front Slatted Crates
    fill(cs.x + 12, cs.y + 28, 32, 12, '#3b210f');
    fill(cs.x + 14, cs.y + 30, 28, 3, '#8c5828');
    fill(cs.x + 14, cs.y + 35, 28, 3, '#8c5828');
    fill(cs.x + 52, cs.y + 28, 32, 12, '#3b210f');
    fill(cs.x + 54, cs.y + 30, 28, 3, '#8c5828');
    fill(cs.x + 54, cs.y + 35, 28, 3, '#8c5828');

    // Timber Support Pillars
    const roofY = cs.y - 22;
    fill(cs.x + 2, roofY + 14, 4, 22, '#241306');
    fill(cs.x + 3, roofY + 14, 2, 22, '#6e4320');
    fill(cs.x + cs.width - 6, roofY + 14, 4, 22, '#241306');
    fill(cs.x + cs.width - 5, roofY + 14, 2, 22, '#6e4320');

    // Scalloped Terracotta-Orange & Cream Striped Canvas Awning
    const awX = cs.x - 4;
    const awW = cs.width + 8;
    fill(awX, roofY, awW, 18, '#241306');
    const stripeW = 8;
    for (let sx = awX + 2; sx < awX + awW - 2; sx += stripeW) {
      const idx = Math.floor((sx - awX) / stripeW);
      const isTerra = idx % 2 === 0;
      const w = Math.min(stripeW, awX + awW - 2 - sx);
      fill(sx, roofY + 2, w, 12, isTerra ? '#d35400' : '#f7eed7');
      fill(sx, roofY + 2, w, 3, isTerra ? '#e67e22' : '#ffffff');
      fill(sx + 1, roofY + 14, Math.max(2, w - 2), 4, isTerra ? '#a04000' : '#dfd3b8');
    }

    // Mini Wooden Header Badge ("SUPPLY")
    fill(cs.x + 24, roofY - 5, 48, 9, '#241306');
    fill(cs.x + 25, roofY - 4, 46, 7, '#3b210f');
    ctx.font = 'bold 5px "Press Start 2P", monospace';
    ctx.fillStyle = '#f0c54d';
    ctx.textAlign = 'center';
    ctx.fillText('SUPPLY', cs.x + cs.width / 2, roofY + 1);
  }

  /**
   * Renders the Outdoor Harvest Grading Table & Watermelon Crate Pyramid (`this.harvestBench`) at (780, 492, w: 76, h: 38).
   */
  private renderOutdoorHarvestStation(ctx: CanvasRenderingContext2D) {
    const hb = this.harvestBench;
    const fill = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    };

    fill(hb.x - 2, hb.y + hb.height - 2, hb.width + 4, 5, 'rgba(10, 6, 2, 0.45)');
    // Main Oak Grading Table (left 48px)
    fill(hb.x, hb.y, 48, hb.height, '#241306');
    fill(hb.x + 2, hb.y + 2, 44, 14, '#8c5828');
    fill(hb.x + 4, hb.y + 4, 40, 10, '#a06732');
    fill(hb.x + 2, hb.y + 16, 44, hb.height - 18, '#5c3416');
    // Striped Watermelon & Refractometer on Table
    fill(hb.x + 6, hb.y - 4, 18, 12, '#184a1d');
    fill(hb.x + 8, hb.y - 1, 14, 3, '#88d46c');
    fill(hb.x + 28, hb.y - 2, 14, 10, '#e74c3c');
    fill(hb.x + 28, hb.y + 6, 14, 3, '#184a1d');

    //Stacked Slatted Watermelon Crate beside the Table (right 26px)
    const cx = hb.x + 50;
    const cy = hb.y + 2;
    fill(cx, cy, 26, hb.height - 2, '#241306');
    fill(cx + 2, cy + 2, 22, hb.height - 6, '#6e4320');
    fill(cx + 4, cy - 5, 18, 12, '#184a1d');
    fill(cx + 6, cy - 2, 14, 3, '#88d46c');
    fill(cx + 3, cy + 12, 20, 3, '#8c5828');
    fill(cx + 3, cy + 20, 20, 3, '#8c5828');
  }

  /**
   * Renders a realistic 16-bit Organic IPM Bio-Spray Mixing & Pressurized Tank Station (`this.bioSprayRig`)
   * next to Farmer Rosa at (98, 188, w: 52, h: 36).
   * Features:
   * - Raised heavy-timber deck pallet & sloped corrugated green/brass shelter roof with "BIO-SPRAY" badge
   * - Primary stainless & emerald-green pressurized botanical tank with brass bands, pressure gauge dial & sight-glass
   * - Secondary amber Neem-Oil / Trichoderma mixing carboy & botanical bottle crate
   * - Coiled high-pressure yellow spray hose on a side reel & mounted brass spray lance wand
   */
  private renderBioSprayStation(ctx: CanvasRenderingContext2D) {
    const bs = this.bioSprayRig;
    const fill = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    };

    // Ground drop shadow
    fill(bs.x - 3, bs.y + bs.height - 3, bs.width + 6, 6, 'rgba(10, 6, 2, 0.5)');

    // 1. Heavy-Timber Slatted Deck Platform (Bottom base)
    const deckY = bs.y + bs.height - 10;
    fill(bs.x, deckY, bs.width, 10, '#241306');
    fill(bs.x + 2, deckY + 1, bs.width - 4, 4, '#8c5828');
    fill(bs.x + 2, deckY + 5, bs.width - 4, 4, '#5c3416');
    for (let dx = bs.x + 6; dx < bs.x + bs.width - 4; dx += 8) {
      fill(dx, deckY + 1, 2, 8, '#3b210f');
    }

    // Rear Timber Support Posts holding the mini shelter canopy
    const roofY = bs.y - 12;
    fill(bs.x + 2, roofY + 10, 3, bs.height - 8, '#241306');
    fill(bs.x + 3, roofY + 10, 1, bs.height - 8, '#6e4320');
    fill(bs.x + bs.width - 5, roofY + 10, 3, bs.height - 8, '#241306');
    fill(bs.x + bs.width - 4, roofY + 10, 1, bs.height - 8, '#6e4320');

    // 2. Left/Center: Pressurized Emerald & Stainless Bio-Pesticide Cylindrical Tank
    const tx = bs.x + 6;
    const ty = bs.y + 2;
    const tw = 20;
    const th = 24;
    fill(tx, ty, tw, th, '#0d2611');
    fill(tx + 2, ty - 2, tw - 4, 3, '#1e5628'); // Domed tank cap
    fill(tx + 1, ty + 1, tw - 2, th - 2, '#1e7e34');
    fill(tx + 3, ty + 2, 5, th - 4, '#2ecc71'); // Cylindrical specular highlight
    fill(tx + 4, ty + 3, 2, th - 6, '#88d46c');
    // Heavy Brass Securing Bands around Tank
    fill(tx, ty + 5, tw, 2, '#d4a838');
    fill(tx + 2, ty + 5, 6, 1, '#fff380');
    fill(tx, ty + 17, tw, 2, '#d4a838');
    fill(tx + 2, ty + 17, 6, 1, '#fff380');

    // Translucent Liquid Level Sight-Glass Tube on Tank Front (with animated bio-extract bubble)
    fill(tx + 11, ty + 8, 5, 8, '#0b1f0e');
    const levelPulse = Math.floor(this.animClock * 2) % 2;
    fill(tx + 12, ty + 9 + levelPulse, 3, 6 - levelPulse, '#88d46c');
    fill(tx + 13, ty + 10, 1, 2, '#ffffff');

    // Top Brass Pressure Gauge Dial & Red Cutoff Valve on Tank Dome
    fill(tx + 7, ty - 7, 6, 6, '#241306');
    fill(tx + 8, ty - 6, 4, 4, '#fff8e7');
    fill(tx + 9, ty - 5, 2, 2, '#e74c3c'); // Gauge needle
    fill(tx + 2, ty - 4, 4, 2, '#e74c3c'); // Relief valve handle

    // 3. Center-Right: Wooden Reagent Crate with Amber Neem-Oil & Botanical Extract Bottles
    const cx = bs.x + 27;
    const cy = bs.y + 12;
    fill(cx, cy, 13, 14, '#241306');
    fill(cx + 1, cy + 5, 11, 8, '#6e4320');
    fill(cx + 1, cy + 8, 11, 2, '#3b210f');
    // Bottle 1 (Amber Neem Oil)
    fill(cx + 2, cy - 2, 4, 7, '#d35400');
    fill(cx + 3, cy - 4, 2, 2, '#f0c54d');
    fill(cx + 3, cy, 2, 3, '#f39c12');
    // Bottle 2 (Cyan/Green Trichoderma Bio-Fungicide)
    fill(cx + 7, cy - 1, 4, 6, '#16a085');
    fill(cx + 8, cy - 3, 2, 2, '#ffffff');
    fill(cx + 8, cy + 1, 2, 3, '#1abc9c');

    // 4. Far Right: Coiled High-Pressure Yellow Spray Hose Reel & Brass Spray Lance Wand
    const hx = bs.x + 40;
    const hy = bs.y + 7;
    fill(hx - 1, hy, 9, 14, '#241306');
    fill(hx, hy + 1, 7, 12, '#f1c40f');
    fill(hx + 1, hy + 3, 5, 2, '#d4ac0d');
    fill(hx + 1, hy + 7, 5, 2, '#d4ac0d');
    // Vertical Stainless & Brass Spray Lance Wand clipped to right post
    fill(bs.x + bs.width - 3, bs.y - 2, 2, 26, '#bdc3c7');
    fill(bs.x + bs.width - 4, bs.y - 4, 4, 3, '#f0c54d'); // Brass mist nozzle tip
    fill(bs.x + bs.width - 5, bs.y + 16, 4, 3, '#c0392b'); // Trigger grip

    // 5. Sloped Corrugated Forest-Green & Brass Canopy Roof over Station
    const awX = bs.x - 2;
    const awW = bs.width + 4;
    fill(awX, roofY, awW, 11, '#241306');
    for (let sx = awX + 2; sx < awX + awW - 2; sx += 6) {
      const isAlt = Math.floor((sx - awX) / 6) % 2 === 0;
      const w = Math.min(6, awX + awW - 2 - sx);
      fill(sx, roofY + 2, w, 7, isAlt ? '#1b4d24' : '#246630');
      fill(sx, roofY + 2, w, 2, isAlt ? '#2ecc71' : '#58d68d');
    }
    // Mini Brass & Dark-Green Header Sign ("BIO-SPRAY")
    fill(bs.x + 6, roofY - 5, 40, 8, '#241306');
    fill(bs.x + 7, roofY - 4, 38, 6, '#14331d');
    ctx.font = 'bold 4px "Press Start 2P", monospace';
    ctx.fillStyle = '#88d46c';
    ctx.textAlign = 'center';
    ctx.fillText('BIO-SPRAY', bs.x + bs.width / 2, roofY - 0.5);
  }

  /**
   * Renders a realistic 16-bit Drip Irrigation Manifold & Pressure Valve Station (`this.irrigationValve`)
   * south of the garden at (378, 638, w: 44, h: 34).
   */
  private renderIrrigationValveStation(ctx: CanvasRenderingContext2D) {
    const iv = this.irrigationValve;
    const fill = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    };

    // Ground shadow & concrete pad
    fill(iv.x - 2, iv.y + iv.height - 3, iv.width + 4, 5, 'rgba(10, 6, 2, 0.45)');
    fill(iv.x, iv.y + 18, iv.width, 16, '#2b3035');
    fill(iv.x + 2, iv.y + 20, iv.width - 4, 12, '#6c757d');
    fill(iv.x + 3, iv.y + 21, iv.width - 6, 9, '#868e96');

    // Black poly-drip distribution pipes emerging from pad toward garden
    fill(iv.x + 8, iv.y + 12, 4, 12, '#1c2833');
    fill(iv.x + 32, iv.y + 12, 4, 12, '#1c2833');

    // Blue Cast-Iron Main Water Riser & Horizontal Brass Manifold
    fill(iv.x + 18, iv.y + 4, 8, 22, '#154360');
    fill(iv.x + 20, iv.y + 5, 4, 20, '#2980b9');
    fill(iv.x + 6, iv.y + 10, 32, 5, '#7d6608');
    fill(iv.x + 7, iv.y + 11, 30, 3, '#f0c54d');

    // Spoked Red Cast-Iron Master Handwheel on Top
    fill(iv.x + 13, iv.y - 3, 18, 7, '#641e16');
    fill(iv.x + 14, iv.y - 2, 16, 5, '#e74c3c');
    fill(iv.x + 17, iv.y - 1, 10, 3, '#241306');
    fill(iv.x + 20, iv.y - 2, 4, 5, '#f0c54d');

    // Brass Pressure Gauge on Right Side of Manifold
    fill(iv.x + 30, iv.y + 1, 9, 9, '#241306');
    fill(iv.x + 31, iv.y + 2, 7, 7, '#f0c54d');
    fill(iv.x + 32, iv.y + 3, 5, 5, '#ffffff');
    fill(iv.x + 34, iv.y + 4, 2, 2, '#2980b9');
  }

  public render() {
    const { ctx, canvas } = this;

    // --- SCENE A1: INSIDE THE AGRONOMY LABORATORY BUILDING ---
    if (this.currentLocation === 'lab_interior') {
      ctx.fillStyle = '#080e09';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      const scaleX = canvas.width / this.viewWidth;
      const scaleY = canvas.height / this.viewHeight;
      ctx.scale(scaleX, scaleY);
      this.renderLaboratoryInterior(ctx);
      ctx.restore();
      return;
    }

    // --- SCENE A2: INSIDE THE FARMER'S HOUSE (CABIN INTERIOR) ---
    if (this.currentLocation === 'cabin_interior') {
      ctx.fillStyle = '#080e09';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      const scaleX = canvas.width / this.viewWidth;
      const scaleY = canvas.height / this.viewHeight;
      ctx.scale(scaleX, scaleY);
      this.renderCabinInterior(ctx);
      ctx.restore();
      return;
    }

    // --- SCENE B: OUTDOOR FARM WORLD ---
    const camX = Math.floor(this.cameraX);
    const camY = Math.floor(this.cameraY);

    ctx.fillStyle = '#0d160e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const timeState = this.timeSystem.getState();
    const garden = this.getNearestPlot();

    ctx.save();
    const scaleX = canvas.width / this.viewWidth;
    const scaleY = canvas.height / this.viewHeight;
    ctx.scale(scaleX, scaleY);
    ctx.translate(-camX, -camY);

    // 1. Render Cohesive Farm Background (Green Grass Edges, Wooden Fence, Dirt Paths, Lab, Farmer House & Cobble Marketplace)
    if (this.staticMapCanvas) {
      ctx.drawImage(this.staticMapCanvas, 0, 0);
    }

    // 2. Render All 4 Farm Plots (Starter Field + 3 Purchasable Forested Expansion Plots)
    for (const plot of this.plots) {
      this.renderSingleCentralGarden(ctx, plot);
    }

    // 3. Render Outdoor Perimeter Stations & Depth-Sorted Marketplace Stalls, NPCs, and Player
    const outdoorDrawList: Array<{ y: number; draw: () => void }> = [
      {
        y: this.bioSprayRig.y + this.bioSprayRig.height,
        draw: () => this.renderBioSprayStation(ctx),
      },
      {
        y: this.irrigationValve.y + this.irrigationValve.height,
        draw: () => this.renderIrrigationValveStation(ctx),
      },
      {
        y: this.fishBucket.y + this.fishBucket.height,
        draw: () => this.renderPierAndFishBucketStation(ctx),
      },
      {
        y: this.marketStall.y + this.marketStall.height,
        draw: () => this.renderMainWatermelonStall(ctx),
      },
      {
        y: this.fruitMarketStall.y + this.fruitMarketStall.height,
        draw: () => this.renderFruitMarketStall(ctx),
      },
      {
        y: this.produceCrateStall.y + this.produceCrateStall.height,
        draw: () => this.renderProduceCrateStall(ctx),
      },
      {
        y: this.harvestBench.y + this.harvestBench.height,
        draw: () => this.renderOutdoorHarvestStation(ctx),
      },
      ...this.outdoorNpcs.map(npc => ({
        y: npc.y + npc.height,
        draw: () => {
          const sprite = this.atlas.npcs[npc.id];
          if (sprite) {
            ctx.drawImage(sprite, npc.x, npc.y);
          }
        },
      })),
      {
        y: this.playerY + 30,
        draw: () => {
          if (this.activeGardenAction) {
            const act = this.activeGardenAction;
            let actionSprite: HTMLCanvasElement | null = null;
            if (act.type === 'chop_trees') {
              const cycleProgress = (act.elapsedMs % 850) / 850;
              const fIdx = cycleProgress < 0.35 ? 0 : cycleProgress < 0.65 ? 1 : 2;
              actionSprite = this.atlas.playerChopping[fIdx] || this.atlas.playerChopping[0];
            } else if (act.type === 'clear_stumps') {
              const cycleProgress = (act.elapsedMs % 750) / 750;
              const fIdx = cycleProgress < 0.35 ? 0 : cycleProgress < 0.65 ? 1 : 2;
              actionSprite = this.atlas.playerClearing[fIdx] || this.atlas.playerClearing[0];
            } else if (act.type === 'clear') {
              const cycleProgress = (act.elapsedMs % 800) / 800;
              const fIdx = cycleProgress < 0.35 ? 0 : cycleProgress < 0.65 ? 1 : 2;
              actionSprite = this.atlas.playerClearing[fIdx] || this.atlas.playerClearing[0];
            } else if (act.type === 'sow') {
              const cycleProgress = (act.elapsedMs % 700) / 700;
              const fIdx = cycleProgress < 0.35 ? 0 : cycleProgress < 0.65 ? 1 : 2;
              actionSprite = this.atlas.playerSowing[fIdx] || this.atlas.playerSowing[0];
            } else if (act.type === 'harvest') {
              const fIdx = act.progress < 0.35 ? 0 : act.progress < 0.65 ? 1 : act.progress < 0.90 ? 2 : 3;
              actionSprite = this.atlas.playerHarvesting[fIdx] || this.atlas.playerHarvesting[0];
            }

            if (actionSprite) {
              ctx.drawImage(actionSprite, this.playerX - 2, this.playerY - 4);
            } else {
              const playerFrames = this.atlas.player[this.playerDirection];
              ctx.drawImage(playerFrames[0], this.playerX, this.playerY);
            }
          } else if (!this.hasPlayerWalked && garden.phase === 'sow') {
            ctx.drawImage(this.atlas.playerPlanting, this.playerX, this.playerY);
          } else {
            this.drawPlayerWithJumpAndWalk(ctx);
          }
        },
      },
    ];

    outdoorDrawList.sort((a, b) => a.y - b.y);
    for (const item of outdoorDrawList) {
      item.draw();
    }

    // 6. Render Interactive UI Bubbles above all 4 Plots
    for (const plot of this.plots) {
      this.renderGardenBubble(ctx, plot);
    }

    // 6B. Render Retro Floating Action Progress Bar above Character
    if (this.activeGardenAction) {
      this.renderActionProgressBar(ctx);
    }

    // 7. Render Floating Interactive Prompt Bubble when near the Exterior Lab/House Doors, NPCs, or Outdoor Fixtures
    const nearby = this.getNearbyInteractable();
    if (nearby && nearby.type !== 'plot') {
      const borderCol =
        nearby.type === 'lab_enter_door' || nearby.type === 'cabin_enter_door'
          ? '#88d46c'
          : '#e0b034';
      this.drawFloatingPromptBubble(ctx, nearby.label, nearby.x, nearby.y, borderCol);
    }

    // 8. Render Soil, Seed & Harvest Particles
    for (const p of this.particles) {
      if (p.life > 0) {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1.0;

    // 9. Day / Night Ambient Lighting Overlay
    if (timeState.ambientLight.alpha > 0.01) {
      ctx.fillStyle = timeState.ambientLight.color;
      ctx.globalAlpha = timeState.ambientLight.alpha;
      ctx.fillRect(camX, camY, this.viewWidth, this.viewHeight);
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();

    // 10. Render Weather Particle Overlay (outdoor only)
    ctx.save();
    ctx.scale(scaleX, scaleY);
    this.weatherParticles.render(ctx, this.weatherSystem.getWeather());
    ctx.restore();
  }

  /**
   * Renders the Lakeside Pier Livewell Fish Bucket & Tackle Post right beside the Southern River Pier.
   */
  private renderPierAndFishBucketStation(ctx: CanvasRenderingContext2D) {
    const fb = this.fishBucket;
    const fill = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    };

    const px = this.fishingPier.x;
    const py = this.fishingPier.y - 20;
    fill(px - 3, py, 4, 24, '#241306');
    fill(px - 2, py + 1, 2, 22, '#8c5828');
    fill(px + 29, py, 4, 24, '#241306');
    fill(px + 30, py + 1, 2, 22, '#8c5828');
    for (let rx = px; rx < px + 29; rx += 5) {
      fill(rx, py + 5 + Math.round(Math.sin(rx * 0.2) * 2), 5, 2, '#d4a838');
    }

    // Slatted Timber Dock Platform under the Fish Bucket
    fill(fb.x - 3, fb.y + fb.height - 6, fb.width + 6, 8, 'rgba(10, 6, 2, 0.45)');
    fill(fb.x - 2, fb.y + fb.height - 8, fb.width + 4, 7, '#241306');
    fill(fb.x, fb.y + fb.height - 7, fb.width, 5, '#8c5828');
    for (let sx = fb.x + 4; sx < fb.x + fb.width - 2; sx += 6) {
      fill(sx, fb.y + fb.height - 7, 2, 5, '#3b210f');
    }

    // Galvanized Steel & Oak Livewell Fish Bucket
    const bx = fb.x + 2;
    const by = fb.y + 4;
    const bw = 20;
    const bh = 18;
    fill(bx, by, bw, bh, '#1c2833');
    fill(bx + 1, by + 1, bw - 2, bh - 2, '#7f8c8d');
    fill(bx + 3, by + 2, 5, bh - 4, '#bdc3c7');
    fill(bx + 4, by + 3, 2, bh - 6, '#ecf0f1');
    fill(bx, by + 6, bw, 2, '#d4a838');
    fill(bx, by + 13, bw, 2, '#d4a838');

    // Fresh Aerated River Water at top rim of bucket
    fill(bx + 1, by + 1, bw - 2, 4, '#154360');
    fill(bx + 2, by + 2, bw - 4, 2, '#2980b9');
    const ripple = Math.floor(this.animClock * 3) % 2;
    fill(bx + 4 + ripple * 3, by + 2, 6, 1, '#85c1e9');

    if (this.pierBucketCount > 0) {
      const wag = Math.floor(this.animClock * 5) % 2;
      fill(bx + 5 + wag, by - 3, 6, 5, '#f39c12');
      fill(bx + 4 + wag, by - 5, 3, 2, '#d35400');
      if (this.pierBucketCount > 1) {
        fill(bx + 11 - wag, by - 2, 5, 4, '#5dade2');
        fill(bx + 14 - wag, by - 4, 3, 2, '#2874a6');
      }
      fill(bx + 7, by + 2 - wag, 2, 1, '#d6eaf8');
    }

    // Small Tackle & Bait Tin Box beside the Bucket
    const tx = bx + 21;
    const ty = by + 9;
    fill(tx, ty, 8, 9, '#241306');
    fill(tx + 1, ty + 1, 6, 7, '#b85d19');
    fill(tx + 1, ty + 3, 6, 2, '#f0c54d');

    // Compact "FISH:X" Tag Plate above Bucket
    const tagX = bx - 1;
    const tagY = by - 13;
    fill(tagX, tagY, 26, 8, '#154360');
    fill(tagX + 1, tagY + 1, 24, 6, '#0b2638');
    ctx.save();
    ctx.font = 'bold 5px "Press Start 2P", monospace';
    ctx.fillStyle = '#85c1e9';
    ctx.textAlign = 'center';
    ctx.fillText(`FISH:${this.pierBucketCount}`, tagX + 13, tagY + 6);
    ctx.restore();
  }
}
