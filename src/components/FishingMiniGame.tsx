/**
 * Realistic Full-Screen River Pier Fishing Mini-Game for MelonQuest.
 * Features:
 * - High-Detail Widescreen 16-Bit River Canvas (640x300 internal buffer)
 * - Multi-layer Flowing Water Currents, Light Caustics, Drifting Foam & Swaying Reeds
 * - Anatomically Detailed, Articulated Swimming Fish Silhouettes with Sine Wag Dynamics
 * - Live Splash Physics, Water Droplets, Line Tension Waves, and Balsa Bobber Cavitation
 * - Tactile 16-Bit Wood, Brass & Slate Controls with Zero Unwanted/Redundant Text
 * - Quick-Access Visual Tutorial Modal for New Players ([ ? TUTORIAL ])
 * - Prominent [X] EXIT (ESC) Button & Responsive Full-Screen Layout
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  EconomySystem,
  InventoryItem,
  PierBucketFish,
} from '../game/economySystem';
import {
  CustomizationManager,
  PlayerCustomizationState,
} from '../game/characterCustomization';
import { createPlayerFishingPoseSprites } from '../game/spriteGenerator';
import { audio } from '../game/soundEffects';

interface FishingMiniGameProps {
  economy: EconomySystem;
  customization?: PlayerCustomizationState;
  onClose: () => void;
  onOpenMarket?: () => void;
  onOpenInventory?: () => void;
  onOpenWardrobe?: () => void;
}

type FishingPhase =
  | 'select_bait'
  | 'rigging_bait'
  | 'baited_ready'
  | 'casting'
  | 'waiting'
  | 'hooked'
  | 'reeling'
  | 'caught'
  | 'lost';

interface FishSpecies {
  id: string;
  name: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Prize';
  minWeight: number;
  maxWeight: number;
  minLength: number;
  maxLength: number;
  baseValue: number;
  bodyColor: string;
  bellyColor: string;
  finColor: string;
  stripeColor?: string;
  isCatfish?: boolean;
  fightStrength: number;
}

const RIVER_FISH_SPECIES: FishSpecies[] = [
  {
    id: 'fish_silver_river_perch',
    name: 'Silver River Perch',
    rarity: 'Common',
    minWeight: 0.9,
    maxWeight: 2.2,
    minLength: 9.5,
    maxLength: 13.8,
    baseValue: 18,
    bodyColor: '#5dade2',
    bellyColor: '#d6eaf8',
    finColor: '#2874a6',
    stripeColor: '#1f618d',
    fightStrength: 0.85,
  },
  {
    id: 'fish_channel_catfish',
    name: 'Whiskered Mud Catfish',
    rarity: 'Uncommon',
    minWeight: 2.1,
    maxWeight: 4.8,
    minLength: 14.0,
    maxLength: 21.5,
    baseValue: 28,
    bodyColor: '#566573',
    bellyColor: '#aeb6bf',
    finColor: '#2c3e50',
    isCatfish: true,
    fightStrength: 1.05,
  },
  {
    id: 'fish_spotted_bass',
    name: 'Emerald Largemouth Bass',
    rarity: 'Rare',
    minWeight: 2.8,
    maxWeight: 6.2,
    minLength: 15.5,
    maxLength: 23.0,
    baseValue: 40,
    bodyColor: '#27ae60',
    bellyColor: '#abebc6',
    finColor: '#196f3d',
    stripeColor: '#145a32',
    fightStrength: 1.25,
  },
  {
    id: 'fish_golden_river_trout',
    name: 'Golden Melon-Fed Trout',
    rarity: 'Prize',
    minWeight: 3.5,
    maxWeight: 7.8,
    minLength: 17.0,
    maxLength: 25.5,
    baseValue: 62,
    bodyColor: '#f39c12',
    bellyColor: '#fef9e7',
    finColor: '#d35400',
    stripeColor: '#e74c3c',
    fightStrength: 1.4,
  },
];

interface WaterSplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export const FishingMiniGame: React.FC<FishingMiniGameProps> = ({
  economy,
  customization,
  onClose,
  onOpenMarket,
  onOpenInventory,
  onOpenWardrobe,
}) => {
  const playerSprites = useMemo(() => {
    const activeState = customization || new CustomizationManager().getState();
    return createPlayerFishingPoseSprites(activeState);
  }, [customization]);
  const [phase, setPhase] = useState<FishingPhase>('select_bait');
  const [baitList, setBaitList] = useState<InventoryItem[]>(() => economy.getBaitItems());
  const [selectedBaitId, setSelectedBaitId] = useState<string>(() => economy.getEquippedBaitId());
  const [hookedBaitName, setHookedBaitName] = useState<string | null>(null);
  const [bucketFish, setBucketFish] = useState<PierBucketFish[]>(() => economy.getPierBucketFish());

  // Metrics
  const [tension, setTension] = useState(25);
  const [fishDistance, setFishDistance] = useState(100); // 100 = far, 0 = landed
  const [isHoldingReel, setIsHoldingReel] = useState(false);
  const [nibbleCount, setNibbleCount] = useState(0);
  const [activeSpecies, setActiveSpecies] = useState<FishSpecies>(RIVER_FISH_SPECIES[0]);
  const [lastCaughtFish, setLastCaughtFish] = useState<PierBucketFish | null>(null);
  const [statusTag, setStatusTag] = useState<string>('RIG BAIT');
  const [showTutorial, setShowTutorial] = useState(false);

  // Canvas & Physics Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<FishingPhase>(phase);
  const tensionRef = useRef(tension);
  const distanceRef = useRef(fishDistance);
  const holdingReelRef = useRef(isHoldingReel);
  const nibbleRef = useRef(0);
  const rigProgressRef = useRef(0);
  const castProgressRef = useRef(0);
  const reelCrankAngleRef = useRef(0);
  const activeSpeciesRef = useRef<FishSpecies>(activeSpecies);
  const splashParticlesRef = useRef<WaterSplashParticle[]>([]);

  phaseRef.current = phase;
  tensionRef.current = tension;
  distanceRef.current = fishDistance;
  holdingReelRef.current = isHoldingReel;
  activeSpeciesRef.current = activeSpecies;

  const syncEconomyState = useCallback(() => {
    const baits = economy.getBaitItems();
    setBaitList(baits);
    setBucketFish(economy.getPierBucketFish());
    const eq = economy.getEquippedBaitId();
    setSelectedBaitId(eq);
  }, [economy]);

  useEffect(() => {
    syncEconomyState();
  }, [syncEconomyState]);

  const spawnSplash = (x: number, y: number, count = 10, speedMult = 1) => {
    const arr = splashParticlesRef.current;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 1.1) + Math.random() * (Math.PI * 0.8);
      const spd = (1.5 + Math.random() * 3.5) * speedMult;
      arr.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0,
        maxLife: 20 + Math.random() * 15,
        size: 1.5 + Math.random() * 1.5,
        color: Math.random() > 0.4 ? '#ffffff' : '#aed6f1',
      });
    }
  };

  const pickFishForBait = (baitId: string): FishSpecies => {
    const roll = Math.random();
    if (baitId === 'melon_rind_bait') {
      if (roll < 0.48) return RIVER_FISH_SPECIES[3]; // Golden Trout
      if (roll < 0.8) return RIVER_FISH_SPECIES[2];  // Bass
      return RIVER_FISH_SPECIES[1];                  // Catfish
    }
    if (baitId === 'cricket_bait') {
      if (roll < 0.25) return RIVER_FISH_SPECIES[3];
      if (roll < 0.68) return RIVER_FISH_SPECIES[2];
      return RIVER_FISH_SPECIES[0];
    }
    if (roll < 0.12) return RIVER_FISH_SPECIES[3];
    if (roll < 0.35) return RIVER_FISH_SPECIES[2];
    if (roll < 0.68) return RIVER_FISH_SPECIES[1];
    return RIVER_FISH_SPECIES[0];
  };

  // Step 1: Rig Bait
  const handlePutBaitOnHook = useCallback(() => {
    const res = economy.consumeBait(selectedBaitId);
    if (!res.success || !res.baitUsed) {
      audio.playErrorBuzz();
      return;
    }

    audio.playMenuClick();
    economy.setEquippedBaitId(selectedBaitId);
    setHookedBaitName(res.baitUsed.name);
    syncEconomyState();
    rigProgressRef.current = 0;
    setPhase('rigging_bait');
    setStatusTag('RIGGING...');
  }, [economy, selectedBaitId, syncEconomyState]);

  useEffect(() => {
    if (phase !== 'rigging_bait') return;
    const start = performance.now();
    const duration = 650;
    let raf = 0;

    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      rigProgressRef.current = p;
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        audio.playToolSound();
        setPhase('baited_ready');
        setStatusTag('READY');
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Step 2: Cast Line
  const handleCastReel = useCallback(() => {
    if (phase !== 'baited_ready') return;
    audio.playWaterSound();
    castProgressRef.current = 0;
    const chosenSpecies = pickFishForBait(selectedBaitId);
    setActiveSpecies(chosenSpecies);
    setPhase('casting');
    setStatusTag('CASTING...');
  }, [phase, selectedBaitId]);

  useEffect(() => {
    if (phase !== 'casting') return;
    const start = performance.now();
    const duration = 800;
    let raf = 0;

    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      castProgressRef.current = p;
      reelCrankAngleRef.current += 0.4;
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        audio.playWaterSound();
        spawnSplash(390, 168, 14, 1.2);
        nibbleRef.current = 0;
        setNibbleCount(0);
        setPhase('waiting');
        setStatusTag('WAITING...');
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Step 3: Waiting for Nibble & Plunge Bite
  useEffect(() => {
    if (phase !== 'waiting') return;

    const t1 = setTimeout(() => {
      nibbleRef.current = 1;
      setNibbleCount(1);
      spawnSplash(400, 168, 4, 0.6);
      setStatusTag('NIBBLE!');
    }, 1200);

    const t2 = setTimeout(() => {
      nibbleRef.current = 2;
      setNibbleCount(2);
      spawnSplash(400, 168, 6, 0.8);
      setStatusTag('NIBBLE!');
    }, 2200);

    const t3 = setTimeout(() => {
      nibbleRef.current = 3;
      audio.playWeatherWarningSound();
      spawnSplash(400, 172, 18, 1.4);
      setPhase('hooked');
      setStatusTag('! BITE !');
    }, 3100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [phase]);

  // Timeout if missed strike
  useEffect(() => {
    if (phase !== 'hooked') return;
    const miss = setTimeout(() => {
      audio.playErrorBuzz();
      setHookedBaitName(null);
      setPhase('lost');
      setStatusTag('ESCAPED');
    }, 2800);
    return () => clearTimeout(miss);
  }, [phase]);

  // Step 4: Strike Hook
  const handleStrikeHook = useCallback(() => {
    if (phase !== 'hooked') return;
    audio.playWaterSound();
    spawnSplash(395, 170, 20, 1.5);
    setTension(32);
    setFishDistance(80);
    setIsHoldingReel(false);
    setPhase('reeling');
    setStatusTag('REELING');
  }, [phase]);

  // Step 5: Reeling Loop
  useEffect(() => {
    if (phase !== 'reeling') return;

    const interval = setInterval(() => {
      const sp = activeSpeciesRef.current;
      const holding = holdingReelRef.current;
      const surge = Math.sin(Date.now() * 0.009) > 0.5 ? sp.fightStrength * 3.5 : 0;

      setTension(prev => {
        const delta = holding ? 4.5 + surge : -3.8 + surge * 0.3;
        const next = Math.max(5, Math.min(100, prev + delta));
        if (next >= 98) {
          audio.playErrorBuzz();
          setIsHoldingReel(false);
          setHookedBaitName(null);
          setPhase('lost');
          setStatusTag('SNAPPED!');
        }
        return next;
      });

      setFishDistance(prev => {
        const pull = holding ? -5.4 : 1.1 * sp.fightStrength;
        const next = Math.max(0, Math.min(100, prev + pull));
        if (next <= 0) {
          const spNow = activeSpeciesRef.current;
          const weightLb = Number(
            (spNow.minWeight + Math.random() * (spNow.maxWeight - spNow.minWeight)).toFixed(1)
          );
          const lengthIn = Number(
            (spNow.minLength + Math.random() * (spNow.maxLength - spNow.minLength)).toFixed(1)
          );
          const weightBonus = Math.round(weightLb * 3);
          const finalValue = spNow.baseValue + weightBonus;

          const stored = economy.addFishToBucket({
            id: spNow.id,
            name: spNow.name,
            weightLb,
            lengthIn,
            value: finalValue,
            rarity: spNow.rarity,
            caughtWithBait: hookedBaitName || 'River Bait',
            caughtAt: 'Southern Pier',
            description: `${spNow.name} landed at the Southern Pier.`,
          });

          audio.playSuccessFanfare();
          setIsHoldingReel(false);
          setHookedBaitName(null);
          setLastCaughtFish(stored);
          setBucketFish(economy.getPierBucketFish());
          setPhase('caught');
          setStatusTag('LANDED!');
        }
        return next;
      });

      if (holdingReelRef.current) {
        reelCrankAngleRef.current += 0.6;
        const currentDist = distanceRef.current;
        const bx = 220 + (currentDist / 100) * 180;
        spawnSplash(bx, 168, 2, 0.7);
      }
    }, 90);

    return () => clearInterval(interval);
  }, [phase, economy, hookedBaitName]);

  const handleQuickPulseReel = () => {
    if (phase !== 'reeling') return;
    audio.playMenuClick();
    reelCrankAngleRef.current += 0.9;
    setTension(prev => Math.min(96, prev + 8));
    setFishDistance(prev => Math.max(0, prev - 10));
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        audio.playMenuClick();
        if (showTutorial) {
          setShowTutorial(false);
        } else {
          onClose();
        }
        return;
      }

      if (e.code === 'KeyT' || e.key === '?') {
        e.preventDefault();
        audio.playMenuClick();
        setShowTutorial(prev => !prev);
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (showTutorial) {
          setShowTutorial(false);
          return;
        }
        if (phase === 'select_bait') {
          handlePutBaitOnHook();
        } else if (phase === 'baited_ready') {
          handleCastReel();
        } else if (phase === 'hooked') {
          handleStrikeHook();
        } else if (phase === 'reeling') {
          setIsHoldingReel(true);
        } else if (phase === 'caught' || phase === 'lost') {
          setPhase('select_bait');
          setStatusTag('RIG BAIT');
        }
        return;
      }

      if (e.code === 'Digit1' && baitList[0]) {
        setSelectedBaitId(baitList[0].id);
        economy.setEquippedBaitId(baitList[0].id);
      } else if (e.code === 'Digit2' && baitList[1]) {
        setSelectedBaitId(baitList[1].id);
        economy.setEquippedBaitId(baitList[1].id);
      } else if (e.code === 'Digit3' && baitList[2]) {
        setSelectedBaitId(baitList[2].id);
        economy.setEquippedBaitId(baitList[2].id);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && phase === 'reeling') {
        setIsHoldingReel(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [phase, baitList, economy, showTutorial, onClose, handlePutBaitOnHook, handleCastReel, handleStrikeHook]);

  // --- High-Detail 16-Bit River Canvas Renderer (640 x 300) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const startTime = performance.now();

    const draw = (now: number) => {
      const t = (now - startTime) / 1000;
      const W = canvas.width; // 640
      const H = canvas.height; // 300
      ctx.imageSmoothingEnabled = false;

      const fill = (x: number, y: number, w: number, h: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
      };

      // 1. Atmospheric Sky & Forest Horizon
      fill(0, 0, W, 80, '#091c14');
      fill(0, 0, W, 50, '#112b1f');
      fill(0, 0, W, 26, '#173a2a');

      // Rolling Pine Forest Ridge with Light Shading
      for (let tx = 0; tx < W; tx += 28) {
        fill(tx, 36, 26, 44, '#143c22');
        fill(tx + 4, 30, 18, 36, '#1d5430');
        fill(tx + 8, 24, 10, 24, '#277040');
        fill(tx + 12, 18, 3, 10, '#358a52'); // Spire tip
      }

      // Far Riverbank with Turf and Silt
      fill(0, 74, W, 12, '#3d2817');
      fill(0, 74, W, 5, '#498c3f');
      fill(0, 77, W, 3, '#356d2b');

      // 2. Realistic Multi-Depth Water Flow & Light Caustics
      fill(0, 84, W, H - 84, '#061621'); // Deep base
      fill(0, 92, W, H - 92, '#0a2334');
      fill(0, 126, W, H - 126, '#103953');
      fill(0, 180, W, H - 180, '#174f72');

      // Flowing Caustics & Sine Wave River Ripples
      for (let row = 0; row < 7; row++) {
        const ry = 98 + row * 26;
        const speed = 24 + row * 7;
        for (let col = 0; col < 9; col++) {
          const rx = ((col * 80 + t * speed + row * 38) % (W + 70)) - 35;
          const waveLift = Math.sin(t * 3 + rx * 0.05) * 1.5;
          fill(rx, ry + waveLift, 28, 2, '#2471a3');
          fill(rx + 6, ry + waveLift + 1, 16, 1, '#85c1e9');
          fill(rx + 10, ry + waveLift, 6, 1, '#ffffff'); // Sun glint
        }
      }

      // Swaying River Reeds on Far Bank
      for (let rx = 180; rx < W; rx += 45) {
        const sway = Math.sin(t * 2 + rx * 0.1) * 3;
        fill(rx + sway, 64, 2, 18, '#2e7d32');
        fill(rx + 2 + sway, 60, 2, 22, '#43a047');
        fill(rx + 1 + sway, 58, 2, 5, '#8d6e63'); // Seed head
      }

      // Floating Lilypads with Lotus Blossoms
      const lilypads = [
        { x: 370, y: 120 },
        { x: 480, y: 165 },
        { x: 560, y: 225 },
      ];
      for (const lp of lilypads) {
        const bob = Math.sin(t * 2.2 + lp.x * 0.1) * 1.5;
        // Pad lobes
        fill(lp.x, lp.y + bob, 22, 12, '#1e8449');
        fill(lp.x + 3, lp.y + 1 + bob, 16, 8, '#2ecc71');
        fill(lp.x + 15, lp.y + 4 + bob, 7, 4, '#103953'); // Cutout notch
        // Pink/White Lotus Flower
        fill(lp.x + 8, lp.y - 4 + bob, 6, 6, '#f9e79f');
        fill(lp.x + 9, lp.y - 3 + bob, 4, 4, '#ffffff');
        fill(lp.x + 10, lp.y - 2 + bob, 2, 2, '#f06292');
      }

      // 3. Swimming Fish Silhouettes (Multi-Depth & Articulated Wag)
      const currentPhase = phaseRef.current;
      const ambientFish = [
        { baseX: 300, baseY: 135, speed: 20, dir: -1, species: RIVER_FISH_SPECIES[0] },
        { baseX: 430, baseY: 195, speed: 15, dir: 1, species: RIVER_FISH_SPECIES[2] },
        { baseX: 520, baseY: 245, speed: 22, dir: -1, species: RIVER_FISH_SPECIES[1] },
      ];

      for (let i = 0; i < ambientFish.length; i++) {
        const af = ambientFish[i];
        const fx = af.baseX + Math.sin(t * 0.8 + i * 2) * 55;
        const fy = af.baseY + Math.cos(t * 1.2 + i) * 8;
        const wag = Math.sin(t * 10 + i) * 3;

        // Fish Shadow in Water
        fill(fx, fy, 24, 10, '#091c29');
        fill(fx + 4, fy + 2, 16, 6, af.species.bodyColor);
        // Wagging tail
        fill(fx + (af.dir < 0 ? 22 : -6), fy + wag, 6, 8, af.species.finColor);
      }

      // 4. Sturdy Southern Pier & Pilings
      // Bank turf on left
      fill(0, 74, 76, 75, '#2d572c');
      fill(0, 84, 70, 65, '#5c3818');

      // Pier Support Pilings
      const pilings = [72, 126, 180];
      for (const px of pilings) {
        fill(px, 150, 12, 90, '#1c0f05');
        fill(px + 3, 150, 5, 90, '#422510');
        fill(px + 1, 210, 10, 30, '#1e4620'); // Waterline moss
      }

      // Pier Timber Planks
      fill(25, 134, 180, 26, '#261306');
      fill(28, 138, 174, 18, '#6d3f19');
      for (let px = 32; px < 200; px += 12) {
        fill(px, 138, 10, 17, '#8a5223');
        fill(px + 9, 138, 2, 18, '#321a08');
        fill(px + 4, 140, 2, 2, '#111111'); // Iron bolt
        fill(px + 4, 152, 2, 2, '#111111');
      }

      // Brass Pier Lantern with Warm Flicker
      fill(46, 80, 6, 56, '#1c0f05');
      fill(44, 74, 10, 8, '#321a08');
      const flicker = Math.sin(t * 15) > 0.3 ? '#fff9c4' : '#f39c12';
      fill(45, 76, 8, 6, flicker);

      // 5. Lakeside Pier Fish Livewell Bucket (beside the Angler)
      const bx = 66;
      const by = 112;
      fill(bx - 3, by + 25, 28, 4, 'rgba(0,0,0,0.5)');
      fill(bx, by, 26, 25, '#1e2b37');
      fill(bx + 2, by + 2, 22, 22, '#566573');
      fill(bx + 4, by + 3, 6, 19, '#7f8c8d');
      fill(bx, by + 7, 26, 3, '#d4a838');
      fill(bx, by + 17, 26, 3, '#d4a838');
      fill(bx + 3, by + 2, 20, 5, '#2471a3');
      fill(bx + 6, by + 3, 12, 2, '#85c1e9');

      if (bucketFish.length > 0) {
        const wag = Math.floor(t * 8) % 2;
        fill(bx + 9 + wag, by - 6, 9, 7, '#f39c12');
        fill(bx + 8 + wag, by - 9, 5, 4, '#e67e22');
        fill(bx + 16 - wag, by - 5, 8, 5, '#5dade2');
      }

      // 6. Customized Player Character on Pier Deck (100% consistent with Field & Wardrobe)
      const ax = 150;
      const ay = 92;
      const spriteX = 126;
      const spriteY = 82;

      let poseSprite = playerSprites.idle0;
      let rodBaseX = spriteX + 22 * 2;
      let rodBaseY = spriteY + 18 * 2;

      if (currentPhase === 'rigging_bait') {
        poseSprite = playerSprites.rigging;
        rodBaseX = spriteX + 21 * 2;
        rodBaseY = spriteY + 18 * 2;
      } else if (currentPhase === 'casting') {
        if (castProgressRef.current < 0.35) {
          poseSprite = playerSprites.windup;
          rodBaseX = spriteX + 15 * 2;
          rodBaseY = spriteY + 12 * 2;
        } else {
          poseSprite = playerSprites.castForward;
          rodBaseX = spriteX + 24 * 2;
          rodBaseY = spriteY + 17 * 2;
        }
      } else if (currentPhase === 'hooked' || currentPhase === 'reeling') {
        const crankFrame = Math.floor(t * (holdingReelRef.current ? 12 : 5)) % 2 === 0;
        poseSprite = crankFrame ? playerSprites.reeling0 : playerSprites.reeling1;
        rodBaseX = spriteX + 21 * 2;
        rodBaseY = spriteY + (crankFrame ? 17 : 16) * 2;
      } else if (currentPhase === 'caught') {
        poseSprite = playerSprites.caught;
        rodBaseX = spriteX + 24 * 2;
        rodBaseY = spriteY + 17 * 2;
      } else {
        const breatheFrame = Math.floor(t * 2) % 2 === 0;
        poseSprite = breatheFrame ? playerSprites.idle0 : playerSprites.idle1;
        rodBaseX = spriteX + 22 * 2;
        rodBaseY = spriteY + (breatheFrame ? 18 : 17) * 2;
      }

      ctx.drawImage(poseSprite, spriteX, spriteY, 64, 64);

      // 7. Bamboo Rod, Spinning Reel & Dynamic Flex
      let rodTipX = rodBaseX + 60;
      let rodTipY = rodBaseY - 36;

      if (currentPhase === 'select_bait' || currentPhase === 'rigging_bait') {
        rodTipX = rodBaseX + 42;
        rodTipY = rodBaseY - 14;
      } else if (currentPhase === 'casting') {
        const cp = castProgressRef.current;
        if (cp < 0.35) {
          rodTipX = rodBaseX - 22;
          rodTipY = rodBaseY - 40;
        } else {
          rodTipX = rodBaseX + 72;
          rodTipY = rodBaseY - 28;
        }
      } else if (currentPhase === 'hooked' || currentPhase === 'reeling') {
        const tug = Math.sin(t * 22) * 3.5;
        rodTipX = rodBaseX + 56 + tug;
        rodTipY = rodBaseY - 16 + Math.abs(tug);
      }

      // Flexible Segmented Rod with Guides
      const segments = 18;
      for (let s = 0; s <= segments; s++) {
        const u = s / segments;
        const bend =
          currentPhase === 'reeling' || currentPhase === 'hooked'
            ? Math.sin(u * Math.PI) * 12
            : 0;
        const rx = rodBaseX + (rodTipX - rodBaseX) * u;
        const ry = rodBaseY + (rodTipY - rodBaseY) * u + bend * u;
        fill(rx, ry, 2, 3, s === segments ? '#e74c3c' : '#d4a838');
        // Metal Line Guide Rings every 4 segments
        if (s > 0 && s % 5 === 0 && s < segments) {
          fill(rx, ry + 2, 2, 2, '#bdc3c7');
        }
      }

      // Brass Spinning Reel
      const reelX = rodBaseX + 8;
      const reelY = rodBaseY - 1;
      fill(reelX - 3, reelY - 3, 9, 9, '#f0c54d');
      fill(reelX - 1, reelY - 1, 6, 6, '#8e6822');
      const crankX = reelX + Math.cos(reelCrankAngleRef.current) * 6;
      const crankY = reelY + Math.sin(reelCrankAngleRef.current) * 6;
      fill(crankX, crankY, 3, 3, '#ffffff');

      // 8. Phase-Specific Mechanics: Line, Bobber, Splash & Fish Catch
      if (
        currentPhase === 'select_bait' ||
        currentPhase === 'rigging_bait' ||
        currentPhase === 'baited_ready'
      ) {
        const hx = rodTipX;
        const hy = rodTipY + 30;
        for (let ly = rodTipY; ly < hy; ly += 2) {
          fill(hx, ly, 1, 2, '#d6eaf8');
        }
        // Steel Hook
        fill(hx - 2, hy, 7, 7, '#bdc3c7');
        fill(hx - 2, hy + 6, 9, 2, '#ecf0f1');
        fill(hx + 5, hy + 1, 2, 6, '#ecf0f1');

        if (currentPhase === 'rigging_bait') {
          const rp = rigProgressRef.current;
          const bxAnim = hx - 32 + rp * 30;
          const byAnim = hy - 20 + rp * 22;
          fill(bxAnim, byAnim, 9, 6, '#e74c3c');
          fill(bxAnim + 1, byAnim + 1, 6, 3, '#f5b7b1');
        } else if (currentPhase === 'baited_ready') {
          const isMelon = selectedBaitId.includes('melon');
          const isCricket = selectedBaitId.includes('cricket');
          fill(
            hx - 3,
            hy + 2,
            9,
            7,
            isMelon ? '#e74c3c' : isCricket ? '#784722' : '#d98880'
          );
          fill(
            hx - 2,
            hy + 7,
            7,
            4,
            isMelon ? '#2ecc71' : isCricket ? '#f0c54d' : '#922b21'
          );
        }
      } else if (currentPhase === 'casting') {
        const cp = Math.max(0, (castProgressRef.current - 0.3) / 0.7);
        const startX = rodTipX;
        const startY = rodTipY;
        const targetX = 400;
        const targetY = 168;
        const curX = startX + (targetX - startX) * cp;
        const curY = startY + (targetY - startY) * cp - Math.sin(cp * Math.PI) * 54;

        for (let i = 0; i <= 24; i++) {
          const u = i / 24;
          const lx = rodTipX + (curX - rodTipX) * u;
          const ly = rodTipY + (curY - rodTipY) * u - Math.sin(u * Math.PI) * 14;
          fill(lx, ly, 1, 1, '#ebf5fb');
        }
        fill(curX - 4, curY - 5, 9, 5, '#e74c3c');
        fill(curX - 4, curY, 9, 5, '#ffffff');
      } else if (
        currentPhase === 'waiting' ||
        currentPhase === 'hooked' ||
        currentPhase === 'reeling'
      ) {
        const distRatio =
          currentPhase === 'reeling' ? distanceRef.current / 100 : 1;
        const bobberX = 230 + distRatio * 180;
        const nibbleDip =
          currentPhase === 'waiting' && nibbleRef.current > 0
            ? Math.sin(t * 18) * 5
            : 0;
        const plungeDip =
          currentPhase === 'hooked'
            ? 14 + Math.sin(t * 26) * 5
            : currentPhase === 'reeling'
            ? 7 + Math.sin(t * 20) * 4
            : Math.sin(t * 3.5) * 2 + nibbleDip;
        const bobberY = 166 + plungeDip;

        const sag = currentPhase === 'reeling' || currentPhase === 'hooked' ? 0 : 16;
        for (let i = 0; i <= 36; i++) {
          const u = i / 36;
          const lx = rodTipX + (bobberX - rodTipX) * u;
          const ly = rodTipY + (bobberY - rodTipY) * u + Math.sin(u * Math.PI) * sag;
          fill(lx, ly, 1, 1, tensionRef.current > 80 ? '#ff7675' : '#ebf5fb');
        }

        // Ripple Rings on Water
        const ring = (t * 22) % 20;
        fill(bobberX - 9 - ring, bobberY + 4, 7, 2, '#85c1e9');
        fill(bobberX + 7 + ring, bobberY + 4, 7, 2, '#85c1e9');

        // Balsa Bobber Body
        fill(bobberX - 4, bobberY - 7, 9, 6, '#e74c3c');
        fill(bobberX - 4, bobberY - 1, 9, 5, '#ffffff');
        fill(bobberX - 1, bobberY - 10, 3, 3, '#f1c40f'); // Yellow tip

        // Approaching Stalker / Hooked Fighting Fish
        if (
          (currentPhase === 'waiting' && nibbleRef.current >= 1) ||
          currentPhase === 'hooked' ||
          currentPhase === 'reeling'
        ) {
          const sp = activeSpeciesRef.current;
          const fishX =
            currentPhase === 'waiting'
              ? bobberX + 14 + Math.sin(t * 6) * 7
              : bobberX - 12 + Math.sin(t * 24) * 6;
          const fishY =
            currentPhase === 'waiting' ? bobberY + 14 : bobberY + 4;

          const wagAngle = Math.sin(t * 24) * 4;

          // Fish Body
          fill(fishX, fishY, 28, 13, sp.bodyColor);
          fill(fishX + 4, fishY + 7, 20, 5, sp.bellyColor);
          if (sp.stripeColor) {
            fill(fishX + 8, fishY + 5, 14, 2, sp.stripeColor);
          }
          if (sp.isCatfish) {
            // Whiskers
            fill(fishX - 4, fishY + 4, 5, 1, '#2c3e50');
            fill(fishX - 4, fishY + 8, 5, 1, '#2c3e50');
          }
          // Articulated wagging tail
          fill(fishX + 24, fishY - 3 + wagAngle, 8, 16, sp.finColor);
          fill(fishX + 5, fishY + 3, 3, 3, '#111111'); // Eye
        }

        // Bite Exclamation Indicator
        if (currentPhase === 'hooked') {
          fill(bobberX - 6, bobberY - 36, 14, 20, '#f1c40f');
          fill(bobberX - 5, bobberY - 35, 12, 18, '#c0392b');
          fill(bobberX - 1, bobberY - 32, 3, 9, '#ffffff');
          fill(bobberX - 1, bobberY - 21, 3, 3, '#ffffff');
        }
      } else if (currentPhase === 'caught' && lastCaughtFish) {
        const sp = activeSpeciesRef.current;
        const fx = ax + 40;
        const fy = ay + 4 + Math.sin(t * 6) * 3;
        fill(rodTipX, rodTipY, 1, 24, '#ebf5fb');
        fill(fx, fy, 30, 15, sp.bodyColor);
        fill(fx + 4, fy + 8, 20, 5, sp.bellyColor);
        fill(fx + 26, fy - 2, 9, 17, sp.finColor);
        fill(fx + 4, fy + 3, 3, 3, '#111111');

        // Golden Sparkles
        for (let s = 0; s < 5; s++) {
          const sx = fx + Math.sin(t * 5 + s * 1.5) * 22;
          const sy = fy + Math.cos(t * 4 + s) * 14;
          fill(sx, sy, 3, 3, '#f1c40f');
        }
      }

      // 9. Update & Draw Splash Particles
      const particles = splashParticlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // Gravity
        p.life++;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        } else {
          fill(p.x, p.y, p.size, p.size, p.color);
        }
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [bucketFish.length, selectedBaitId, lastCaughtFish, playerSprites]);

  const totalBaitCount = baitList.reduce((s, b) => s + b.quantity, 0);
  const totalBucketValue = bucketFish.reduce((s, f) => s + f.value, 0);

  const handleSellAllBucket = () => {
    const res = economy.sellAllBucketFish();
    if (res.count > 0) {
      audio.playSuccessFanfare();
      setBucketFish(economy.getPierBucketFish());
      setStatusTag('SOLD');
    } else {
      audio.playErrorBuzz();
    }
  };

  const handleTransferAllBucket = () => {
    const count = economy.transferAllBucketToInventory();
    if (count > 0) {
      audio.playToolSound();
      setBucketFish(economy.getPierBucketFish());
      setStatusTag('TO BAG');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#07130e] text-[#f7eed7] select-none overflow-hidden animate-odyssey-fade">
      {/* 1. Sleek 16-Bit Top Navigation Header */}
      <div className="px-3 sm:px-5 py-2 bg-[#1b0e04] border-b-3 border-[#361c0a] shadow-md flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-pixel text-xs sm:text-sm text-[#f0c54d] font-bold tracking-wider drop-shadow-[1px_1px_0px_#000]">
            RIVER PIER
          </span>

          {/* Minimalist Glowing Status Pill */}
          <div className="px-2.5 py-0.5 bg-[#2a1608] border border-[#7a4b22] text-[9px] font-pixel text-[#fce4ec] flex items-center gap-1.5 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f0c54d] animate-pulse" />
            <span className="text-[#f0c54d] font-bold">{statusTag}</span>
          </div>
        </div>

        {/* Right Header Action Group */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* How to Fish Tutorial Button */}
          <button
            onClick={() => {
              audio.playMenuClick();
              setShowTutorial(true);
            }}
            className="px-2.5 py-1.5 bg-[#2d4d3a] hover:bg-[#3d684f] text-[#aed6f1] font-pixel text-[9px] font-bold border border-[#488463] cursor-pointer flex items-center gap-1 transition-colors"
            title="How to fish guide (?)"
          >
            <span>?</span>
            <span className="hidden sm:inline">TUTORIAL</span>
          </button>

          {onOpenWardrobe && (
            <button
              onClick={() => {
                audio.playMenuClick();
                onOpenWardrobe();
              }}
              className="px-2.5 py-1.5 bg-[#2a1708] hover:bg-[#422510] text-[#f0c54d] font-pixel text-[9px] border border-[#7a4b22] cursor-pointer"
            >
              OUTFIT
            </button>
          )}

          {onOpenMarket && (
            <button
              onClick={() => {
                audio.playMenuClick();
                onOpenMarket();
              }}
              className="px-2.5 py-1.5 bg-[#3d200d] hover:bg-[#582e13] text-[#f0c54d] font-pixel text-[9px] border border-[#7a4b22] cursor-pointer"
            >
              MARKET
            </button>
          )}

          {onOpenInventory && (
            <button
              onClick={() => {
                audio.playMenuClick();
                onOpenInventory();
              }}
              className="px-2.5 py-1.5 bg-[#2a1708] hover:bg-[#422510] text-[#cbb282] font-pixel text-[9px] border border-[#5c3818] cursor-pointer"
            >
              BAG ({totalBaitCount})
            </button>
          )}

          {/* Prominent Red/Gold Exit Button */}
          <button
            onClick={() => {
              audio.playMenuClick();
              onClose();
            }}
            className="px-3.5 py-1.5 bg-[#8f2419] hover:bg-[#b02e21] active:bg-[#6d1a12] text-white font-pixel text-xs font-bold border-2 border-[#f0c54d] shadow-[2px_2px_0px_#210707] cursor-pointer flex items-center gap-1.5 transition-transform active:translate-y-0.5"
            title="Exit fishing (Esc)"
          >
            <span>[X]</span>
            <span>EXIT</span>
            <span className="hidden sm:inline text-[8px] text-[#ffcdd2] opacity-80">(ESC)</span>
          </button>
        </div>
      </div>

      {/* 2. Realistic River Widescreen Viewport */}
      <div className="flex-1 w-full min-h-0 relative bg-[#061621] flex items-center justify-center overflow-hidden border-b-3 border-[#361c0a]">
        <canvas
          ref={canvasRef}
          width={640}
          height={300}
          className="w-full h-full object-contain pixelated max-w-full max-h-full block"
        />

        {/* Minimal On-Canvas Tags */}
        <div className="absolute top-2.5 left-3 bg-[#1b0e04]/90 border border-[#f0c54d] px-2 py-0.5 text-[8px] font-pixel text-[#f0c54d] shadow-sm">
          {hookedBaitName && phase !== 'select_bait'
            ? `HOOK: ${hookedBaitName.toUpperCase()}`
            : `BAIT: ${totalBaitCount} REMAINING`}
        </div>

        <div className="absolute bottom-2.5 left-3 bg-[#103953]/90 border border-[#85c1e9] px-2 py-0.5 text-[8px] font-pixel text-[#d4e6f1] shadow-sm">
          LIVEWELL: {bucketFish.length} FISH ({totalBucketValue}G)
        </div>
      </div>

      {/* 3. Tactile 16-Bit Control Deck (Zero Unwanted Text) */}
      <div className="w-full bg-[#140a03] border-t-2 border-[#3d1f0a] p-2 sm:p-2.5 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-2 sm:gap-2.5 items-stretch w-full">

          {/* Panel 1: Tackle Box (Bait Selection) */}
          <div className="w-full md:w-72 bg-[#201005] border-2 border-[#6d3f19] p-2 flex flex-col justify-between shrink-0">
            <div className="flex items-center justify-between border-b border-[#4d290e] pb-1 mb-1.5">
              <span className="text-[9px] font-pixel font-bold text-[#f0c54d]">
                TACKLE POUCH
              </span>
              <span className="text-[8px] text-[#cbb282]">{totalBaitCount} Total</span>
            </div>

            {baitList.length === 0 ? (
              <div className="p-2 bg-[#331111] border border-[#7a2222] text-[8px] font-pixel text-[#f5b7b1] text-center my-auto">
                No bait in bag! Visit Market.
              </div>
            ) : (
              <div className="space-y-1">
                {baitList.map(bait => {
                  const isSelected = selectedBaitId === bait.id;
                  return (
                    <button
                      key={bait.id}
                      onClick={() => {
                        audio.playMenuClick();
                        setSelectedBaitId(bait.id);
                        economy.setEquippedBaitId(bait.id);
                      }}
                      className={`w-full p-1.5 text-left text-[8px] font-pixel border cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-[#4a2610] border-[#f0c54d] text-[#fff8e7]'
                          : 'bg-[#261306] border-[#4d290e] text-[#cbb282] hover:border-[#8a5223]'
                      }`}
                    >
                      <span className="truncate">{bait.name}</span>
                      <span className="text-[#f0c54d] font-bold">x{bait.quantity}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={handlePutBaitOnHook}
              disabled={baitList.length === 0 || phase === 'reeling' || phase === 'hooked'}
              className="mt-1.5 w-full py-1.5 bg-[#b85d19] hover:bg-[#d35400] disabled:opacity-40 disabled:pointer-events-none text-white text-[9px] font-pixel font-bold border border-[#6e3206] shadow-[0_1px_0_#210707] cursor-pointer text-center"
            >
              RIG HOOK
            </button>
          </div>

          {/* Panel 2: Primary Angling Hub */}
          <div className="w-full md:flex-1 bg-[#201005] border-2 border-[#6d3f19] p-2 sm:p-2.5 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between border-b border-[#4d290e] pb-1 mb-1.5">
              <span className="text-[9px] font-pixel font-bold text-[#f0c54d]">
                ACTION HUB
              </span>
              <span className="text-[8px] font-pixel text-[#8a5223]">SPACEBAR SUPPORTED</span>
            </div>

            {/* Stage: Select / Rigging */}
            {phase === 'select_bait' && (
              <div className="flex-1 flex flex-col justify-center items-center py-2 text-center">
                <span className="text-[10px] font-pixel text-[#f0c54d]">
                  SELECT BAIT &middot; PRESS RIG HOOK
                </span>
              </div>
            )}

            {phase === 'rigging_bait' && (
              <div className="flex-1 flex flex-col justify-center items-center py-2 text-center animate-pulse">
                <span className="text-[10px] font-pixel text-[#f0c54d]">
                  RIGGING HOOK...
                </span>
              </div>
            )}

            {/* Stage: Baited Ready */}
            {phase === 'baited_ready' && (
              <div className="flex-1 flex flex-col justify-center gap-1.5">
                <button
                  onClick={handleCastReel}
                  className="w-full py-3 bg-[#2e7d32] hover:bg-[#388e3c] active:bg-[#1b5e20] text-white text-xs font-pixel font-bold border-2 border-[#81c784] shadow-[0_2px_0_#0d3310] cursor-pointer"
                >
                  CAST LINE [SPACE]
                </button>
              </div>
            )}

            {/* Stage: Casting Animation */}
            {phase === 'casting' && (
              <div className="flex-1 flex flex-col justify-center items-center py-2 text-center">
                <span className="text-[10px] font-pixel text-[#85c1e9]">
                  LINE ARCHING INTO WATER...
                </span>
              </div>
            )}

            {/* Stage: Waiting */}
            {phase === 'waiting' && (
              <div className="flex-1 flex flex-col justify-between gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-pixel text-[#85c1e9] animate-pulse">
                    WATCHING BOBBER... {nibbleCount > 0 ? `(${nibbleCount})` : ''}
                  </span>
                  <button
                    onClick={() => {
                      audio.playMenuClick();
                      setHookedBaitName(null);
                      setPhase('select_bait');
                      setStatusTag('RIG BAIT');
                    }}
                    className="px-2 py-0.5 bg-[#3d200d] hover:bg-[#582e13] text-[#cbb282] text-[8px] font-pixel border border-[#6d3f19] cursor-pointer"
                  >
                    REEL IN
                  </button>
                </div>
                <div className="h-1.5 bg-[#061621] border border-[#103953] overflow-hidden">
                  <div
                    className="h-full bg-[#3498db] transition-all duration-300"
                    style={{ width: `${(nibbleCount / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Stage: Hooked */}
            {phase === 'hooked' && (
              <div className="flex-1 flex flex-col justify-center">
                <button
                  onClick={handleStrikeHook}
                  className="w-full py-3 bg-[#e67e22] hover:bg-[#d35400] active:bg-[#ba4a00] text-white text-xs sm:text-sm font-pixel font-bold border-2 border-[#fff1b8] shadow-[0_3px_0_#5e2602] cursor-pointer animate-pulse"
                >
                  ! STRIKE HOOK ! [SPACE]
                </button>
              </div>
            )}

            {/* Stage: Reeling */}
            {phase === 'reeling' && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-2 text-[8px] font-pixel">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span>TENSION</span>
                      <span className={tension > 80 ? 'text-[#e74c3c] font-bold' : ''}>
                        {Math.round(tension)}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-[#0a0502] border border-[#4d290e] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-75 ${
                          tension > 80
                            ? 'bg-[#e74c3c] animate-pulse'
                            : tension > 55
                            ? 'bg-[#f39c12]'
                            : 'bg-[#2ecc71]'
                        }`}
                        style={{ width: `${tension}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5 text-[#85c1e9]">
                      <span>DISTANCE</span>
                      <span>{(fishDistance * 0.25).toFixed(1)}m</span>
                    </div>
                    <div className="h-2.5 bg-[#061621] border border-[#103953] overflow-hidden">
                      <div
                        className="h-full bg-[#3498db] transition-all duration-75"
                        style={{ width: `${100 - fishDistance}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onMouseDown={() => setIsHoldingReel(true)}
                  onMouseUp={() => setIsHoldingReel(false)}
                  onMouseLeave={() => setIsHoldingReel(false)}
                  onTouchStart={() => setIsHoldingReel(true)}
                  onTouchEnd={() => setIsHoldingReel(false)}
                  onClick={handleQuickPulseReel}
                  className={`w-full py-2 font-pixel text-[9px] sm:text-xs font-bold border-2 cursor-pointer transition-colors ${
                    isHoldingReel
                      ? 'bg-[#103953] border-[#85c1e9] text-white shadow-inner'
                      : 'bg-[#2471a3] hover:bg-[#2980b9] border-[#0e2d42] text-white shadow-[0_2px_0_#071a26]'
                  }`}
                >
                  {isHoldingReel ? 'CRANKING REEL... (RELEASE IF RED)' : 'HOLD / TAP REEL [SPACEBAR]'}
                </button>
              </div>
            )}

            {/* Stage: Caught */}
            {phase === 'caught' && lastCaughtFish && (
              <div className="flex items-center justify-between gap-2 p-1 bg-[#112918] border border-[#27ae60]">
                <div>
                  <div className="text-[9px] font-pixel text-[#2ecc71] font-bold">
                    {lastCaughtFish.name.toUpperCase()}
                  </div>
                  <div className="text-[10px] text-[#a3e4d7]">
                    {lastCaughtFish.weightLb} lb &middot; {lastCaughtFish.rarity} &middot;{' '}
                    <strong className="text-[#f0c54d]">+{lastCaughtFish.value}G</strong>
                  </div>
                </div>
                <button
                  onClick={() => {
                    audio.playMenuClick();
                    setPhase('select_bait');
                    setStatusTag('RIG BAIT');
                  }}
                  className="px-3 py-1 bg-[#2e7d32] hover:bg-[#388e3c] text-white text-[8px] font-pixel font-bold border border-[#81c784] cursor-pointer"
                >
                  KEEP &amp; CAST AGAIN [SPACE]
                </button>
              </div>
            )}

            {/* Stage: Lost */}
            {phase === 'lost' && (
              <div className="flex items-center justify-between gap-2 p-1 bg-[#331111] border border-[#922b21]">
                <div className="text-[9px] font-pixel text-[#e74c3c] font-bold">
                  LINE BROKE FREE
                </div>
                <button
                  onClick={() => {
                    audio.playMenuClick();
                    setPhase('select_bait');
                    setStatusTag('RIG BAIT');
                  }}
                  className="px-3 py-1 bg-[#8a5223] hover:bg-[#a46738] text-white text-[8px] font-pixel font-bold border border-[#261306] cursor-pointer"
                >
                  RIG BAIT [SPACE]
                </button>
              </div>
            )}
          </div>

          {/* Panel 3: Pier Livewell */}
          <div className="w-full md:w-72 bg-[#201005] border-2 border-[#6d3f19] p-2 flex flex-col justify-between shrink-0">
            <div className="flex items-center justify-between border-b border-[#4d290e] pb-1 mb-1.5">
              <span className="text-[9px] font-pixel font-bold text-[#f0c54d]">
                PIER LIVEWELL
              </span>
              <span className="text-[8px] font-pixel text-[#85c1e9]">
                {bucketFish.length} FISH ({totalBucketValue}G)
              </span>
            </div>

            {bucketFish.length === 0 ? (
              <div className="text-[8px] font-pixel text-[#cbb282] text-center my-auto p-1.5">
                Livewell empty.
              </div>
            ) : (
              <div className="space-y-1 max-h-16 overflow-y-auto pixel-scroll pr-1">
                {bucketFish.map(f => (
                  <div
                    key={f.uid}
                    className="p-1 bg-[#170a03] border border-[#4d290e] flex items-center justify-between text-[8px] font-pixel"
                  >
                    <span className="text-[#f7eed7] truncate">{f.name}</span>
                    <span className="text-[#f0c54d] font-bold shrink-0">{f.value}G</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
              <button
                onClick={handleTransferAllBucket}
                disabled={bucketFish.length === 0}
                className="py-1 bg-[#1d5430] hover:bg-[#277040] disabled:opacity-40 disabled:pointer-events-none text-white text-[8px] font-pixel border border-[#358a52] cursor-pointer text-center"
              >
                TO BAG
              </button>
              <button
                onClick={handleSellAllBucket}
                disabled={bucketFish.length === 0}
                className="py-1 bg-[#b85d19] hover:bg-[#d35400] disabled:opacity-40 disabled:pointer-events-none text-white text-[8px] font-pixel border border-[#6e3206] cursor-pointer text-center"
              >
                SELL ALL
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Interactive Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80 animate-odyssey-fade">
          <div className="w-full max-w-md bg-[#241206] border-3 border-[#f0c54d] p-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b-2 border-[#5c3818] pb-2 mb-3">
              <span className="font-pixel text-xs text-[#f0c54d] font-bold">
                HOW TO FISH &middot; 3 SIMPLE STEPS
              </span>
              <button
                onClick={() => {
                  audio.playMenuClick();
                  setShowTutorial(false);
                }}
                className="px-2 py-0.5 bg-[#8f2419] text-white font-pixel text-xs border border-[#3d1414] cursor-pointer"
              >
                [X]
              </button>
            </div>

            <div className="space-y-3 text-[10px] font-pixel text-[#f7eed7]">
              {/* Step 1 */}
              <div className="p-2.5 bg-[#170a03] border border-[#5c3818] flex items-start gap-2.5">
                <span className="px-1.5 py-0.5 bg-[#b85d19] text-white font-bold text-xs shrink-0">1</span>
                <div>
                  <div className="text-[#f0c54d] font-bold">TACKLE UP</div>
                  <div className="text-[#cbb282] text-[9px] mt-0.5">
                    Select a bait from your Tackle Pouch (Earthworm, Cricket, or Melon Rind) and click <strong>RIG HOOK</strong>.
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-2.5 bg-[#170a03] border border-[#5c3818] flex items-start gap-2.5">
                <span className="px-1.5 py-0.5 bg-[#2e7d32] text-white font-bold text-xs shrink-0">2</span>
                <div>
                  <div className="text-[#81c784] font-bold">CAST &amp; WATCH</div>
                  <div className="text-[#cbb282] text-[9px] mt-0.5">
                    Click <strong>CAST LINE [SPACE]</strong>. Watch the bobber float. Fish will circle and nibble.
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-2.5 bg-[#170a03] border border-[#5c3818] flex items-start gap-2.5">
                <span className="px-1.5 py-0.5 bg-[#2980b9] text-white font-bold text-xs shrink-0">3</span>
                <div>
                  <div className="text-[#85c1e9] font-bold">STRIKE &amp; REEL</div>
                  <div className="text-[#cbb282] text-[9px] mt-0.5">
                    When the bobber plunges underwater, click <strong>STRIKE [SPACE]</strong> immediately! Then hold or tap <strong>REEL</strong> to pull the fish in. Keep tension in the green zone.
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                audio.playMenuClick();
                setShowTutorial(false);
              }}
              className="mt-3.5 w-full py-2 bg-[#2e7d32] hover:bg-[#388e3c] text-white font-pixel text-xs font-bold border-2 border-[#81c784] cursor-pointer shadow-md text-center"
            >
              GOT IT! BACK TO FISHING
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
