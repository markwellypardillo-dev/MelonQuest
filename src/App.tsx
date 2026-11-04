/**
 * MelonQuest: A 2D Pixel-Art RPG Educational Progressive Web App.
 * Strict zero-emoji policy applied.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MelonEngine, PlotData, GardenHudStatus } from './game/engine';
import { WeatherMetrics } from './game/weatherSystem';
import { QUESTS, QUIZZES, Quest } from './game/farmingData';
import { audio } from './game/soundEffects';
import { usePWAInstall } from './hooks/usePWAInstall';
import { GameSettings, loadSettings, saveSettings } from './game/settings';
import { TimeAndCalendarSystem, GameTimeState } from './game/timeSystem';
import { CustomizationManager, PlayerCustomizationState } from './game/characterCustomization';
import { EconomySystem } from './game/economySystem';
import {
  BadgeId,
  ProgressionState,
  INITIAL_BADGES,
  loadProgressionState,
  saveProgressionState,
} from './game/progressionSystem';

// Components
import { TitleScreen } from './components/TitleScreen';
import { DialogueBox } from './components/DialogueBox';
import { SoilLabMiniGame } from './components/SoilLabMiniGame';
import { PestScoutMiniGame } from './components/PestScoutMiniGame';
import { HarvestInspectMiniGame } from './components/HarvestInspectMiniGame';
import { QuizModal } from './components/QuizModal';
import { GuidebookModal } from './components/GuidebookModal';
import { PauseSettingsModal } from './components/PauseSettingsModal';
import { DiplomaModal } from './components/DiplomaModal';
import { VirtualControls } from './components/VirtualControls';
import { PWAInstallModal } from './components/PWAInstallModal';
import { GameHeaderHUD, EmergencyQuestInfo } from './components/GameHeaderHUD';
import { CharacterCustomizationModal } from './components/CharacterCustomizationModal';
import { MarketplaceModal } from './components/MarketplaceModal';
import { FishingMiniGame } from './components/FishingMiniGame';
import { ProgressionSusModal } from './components/ProgressionSusModal';
import { InventoryModal, InventoryTab } from './components/InventoryModal';

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

interface DialogueState {
  speakerName: string;
  speakerRole: string;
  text: string;
  onAdvance: () => void;
  actionLabel?: string;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('playing');
  const [currentQuestIndex, setCurrentQuestIndex] = useState(0);
  const [quests, setQuests] = useState<Quest[]>(QUESTS);
  const [dialogue, setDialogue] = useState<DialogueState | null>(null);
  const [isHudExpanded, setIsHudExpanded] = useState(false);
  const [showQuestDrawer, setShowQuestDrawer] = useState(false);
  const [isCleanView, setIsCleanView] = useState(false);

  // Progression (Player Rankings, Collectible Badges & SUS Evaluation)
  const [progression, setProgression] = useState<ProgressionState>(loadProgressionState);
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [progressionTab, setProgressionTab] = useState<'badges' | 'rankings' | 'sus'>('badges');
  const [badgeToast, setBadgeToast] = useState<{ title: string; xp: number } | null>(null);

  const unlockBadge = useCallback((badgeId: BadgeId) => {
    setProgression(prev => {
      const target = prev.badges.find(b => b.id === badgeId);
      if (!target || target.unlocked) return prev;
      const updatedBadges = prev.badges.map(b =>
        b.id === badgeId ? { ...b, unlocked: true, unlockedAt: new Date().toLocaleTimeString() } : b
      );
      const nextState: ProgressionState = {
        ...prev,
        xp: prev.xp + target.xpReward,
        badges: updatedBadges,
      };
      saveProgressionState(nextState);
      setBadgeToast({ title: target.title, xp: target.xpReward });
      return nextState;
    });
  }, []);

  useEffect(() => {
    if (!badgeToast) return;
    const t = setTimeout(() => setBadgeToast(null), 3200);
    return () => clearTimeout(t);
  }, [badgeToast]);

  // Core Extended System Managers
  const customManagerRef = useRef<CustomizationManager>(new CustomizationManager());
  const [customizationState, setCustomizationState] = useState<PlayerCustomizationState>(() =>
    customManagerRef.current.getState()
  );
  const economyRef = useRef<EconomySystem>(new EconomySystem());
  const [coins, setCoins] = useState(() => economyRef.current.getCoins());
  const [timeState, setTimeState] = useState<GameTimeState>(() => new TimeAndCalendarSystem().getState());
  const [gardenStatus, setGardenStatus] = useState<GardenHudStatus>({
    phase: 'clear',
    stageLabel: 'UNKEMPT BED',
    stagePercent: 0,
    overallPercent: 0,
    timeRemainingText: 'CLEAR [E]',
  });

  // Weather & Emergency States
  const [weatherMetrics, setWeatherMetrics] = useState<WeatherMetrics | null>(null);
  const [isCropStressed, setIsCropStressed] = useState(false);
  const [emergencyQuest, setEmergencyQuest] = useState<EmergencyQuestInfo | null>(null);

  // Active Modals & Mini-Games
  const [activeMiniGame, setActiveMiniGame] = useState<'soil_lab' | 'pest_scout' | 'harvest_bench' | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [showGuidebook, setShowGuidebook] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showDiploma, setShowDiploma] = useState(false);
  const [showManualInstall, setShowManualInstall] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showFishing, setShowFishing] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [inventoryTab, setInventoryTab] = useState<InventoryTab>('all');
  const [inventorySummaryCount, setInventorySummaryCount] = useState(() => {
    const invCount = economyRef.current.getInventory().reduce((s, i) => s + i.quantity, 0);
    return invCount + economyRef.current.getPierBucketCount();
  });

  const [, setIsAudioMuted] = useState(audio.getIsMuted());
  const [settings, setSettings] = useState<GameSettings>(loadSettings);

  // Engine & Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<MelonEngine | null>(null);

  // PWA Install Hook
  const pwa = usePWAInstall();

  // Sync state to body
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Check URL query ?title=1 or ?clean=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('title') === '1') {
      setGameState('title');
    }
    if (params.get('clean') === '1') {
      setIsCleanView(true);
    }
  }, []);

  // Sync coin balance, inventory & pier fish bucket from economy
  useEffect(() => {
    const updateCounts = () => {
      const invCount = economyRef.current.getInventory().reduce((s, i) => s + i.quantity, 0);
      const bucketCount = economyRef.current.getPierBucketCount();
      setInventorySummaryCount(invCount + bucketCount);
      engineRef.current?.setPierBucketCount(bucketCount);
    };
    economyRef.current.onCoinsChange = (newBal) => {
      setCoins(newBal);
    };
    economyRef.current.onInventoryChange = () => {
      updateCounts();
    };
    economyRef.current.onBucketChange = () => {
      updateCounts();
    };
    updateCounts();
  }, []);

  const handleUpdateSetting = useCallback(<K extends keyof GameSettings>(key: K, val: GameSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: val };
      saveSettings(next);
      return next;
    });

    if (key === 'detailLevel') {
      engineRef.current?.setDetailLevel(val as any);
    } else if (key === 'particleQuality') {
      engineRef.current?.weatherParticles.setQuality(val as any);
    } else if (key === 'isAudioMuted') {
      audio.setMuted(val as boolean);
      setIsAudioMuted(val as boolean);
    } else if (key === 'volume') {
      audio.setVolume(val as number);
    }
  }, []);

  // Sleep Handler (Residential Cabin Bed)
  const handleSleep = useCallback(() => {
    if (!engineRef.current) return;
    if (engineRef.current.activeSleepAction) return;
    engineRef.current.startSleepSequence((nextTime) => {
      setTimeState(nextTime);
      setDialogue({
        speakerName: 'Residential Cabin Bed',
        speakerRole: 'Rest & Recovery',
        text: `You slept soundly until 06:00 AM on ${nextTime.dayOfWeek}, Day ${nextTime.day}. Stamina fully restored to 100%! Experimental melon crops have advanced overnight.`,
        onAdvance: () => setDialogue(null),
      });
    });
  }, []);

  // Time Acceleration Speed Handler
  const handleSetTimeSpeed = useCallback((speed: 1 | 2 | 3 | 4 | 5 | 6) => {
    audio.playMenuClick();
    engineRef.current?.timeSystem.setTimeSpeed(speed);
    if (engineRef.current) {
      setTimeState(engineRef.current.timeSystem.getState());
    }
  }, []);

  // Character Customization Applied Handler
  const handleCustomizationApplied = useCallback((state: PlayerCustomizationState) => {
    setCustomizationState(state);
    engineRef.current?.setCustomization(state);
  }, []);

  const activeQuest = quests[currentQuestIndex] || quests[quests.length - 1];
  const questsRef = useRef<Quest[]>(quests);
  questsRef.current = quests;
  const currentQuestIndexRef = useRef<number>(currentQuestIndex);
  currentQuestIndexRef.current = currentQuestIndex;

  // Engine Callbacks & Handlers
  const handleInteractNpc = useCallback((npcId: 'professor' | 'rosa' | 'maya' | 'merchant') => {
    const qIdx = currentQuestIndexRef.current;

    if (npcId === 'merchant') {
      setShowMarketplace(true);
      return;
    }

    if (npcId === 'professor') {
      if (qIdx === 0) {
        setDialogue({
          speakerName: 'Professor Citrullus',
          speakerRole: 'Lead Agronomist',
          text: 'Welcome to the Melon Research Facility! Start at the central garden: clear the rocks and weeds [Clear E], sow seeds into the 5 fertilized rows [Sow E], and watch the seedlings sprout using the in-game clock (1x-6x).',
          onAdvance: () => {
            setDialogue(null);
            const currentQuests = questsRef.current;
            if (currentQuests[0]?.steps[0]?.isComplete && currentQuests[0]?.steps[1]?.isComplete) {
              setActiveQuizId('quiz_1');
            }
          },
        });
      } else if (qIdx === 3) {
        setDialogue({
          speakerName: 'Professor Citrullus',
          speakerRole: 'Lead Agronomist',
          text: 'Once the central garden reaches 100% maturity after 36 in-game hours, harvest the striped watermelons [[E] Harvest] and complete the 4-point empirical assay at the Harvest Inspection Bench.',
          onAdvance: () => {
            setDialogue(null);
          },
        });
      } else {
        setDialogue({
          speakerName: 'Professor Citrullus',
          speakerRole: 'Lead Agronomist',
          text: 'Maintain strict empirical observation of the central garden. Consult the Farming Guidebook [G] at any time for botanical and chemical reference standards.',
          onAdvance: () => setDialogue(null),
        });
      }
    } else if (npcId === 'maya') {
      if (qIdx === 1) {
        setDialogue({
          speakerName: 'Lab Tech Maya',
          speakerRole: 'Soil Specialist',
          text: 'Greetings, Research Assistant! While your central garden vines establish, step up to the Soil Testing Bench to balance acidic soil to pH 6.5 and formulate 1-2-2 N-P-K base fertilizer.',
          onAdvance: () => {
            setQuests(prev => {
              if (prev[1].steps[0].isComplete) return prev;
              const copy = [...prev];
              copy[1].steps[0].isComplete = true;
              return copy;
            });
            setDialogue(null);
            setActiveMiniGame('soil_lab');
          },
        });
      } else {
        setDialogue({
          speakerName: 'Lab Tech Maya',
          speakerRole: 'Soil Specialist',
          text: 'Always ensure your soil test cores represent the top 15-20 cm root zone. Target pH 6.0 to 6.8 is the agronomic standard for Citrullus lanatus.',
          onAdvance: () => setDialogue(null),
        });
      }
    } else if (npcId === 'rosa') {
      if (qIdx === 2) {
        setDialogue({
          speakerName: 'Farmer Rosa',
          speakerRole: 'Senior Cultivator',
          text: 'Attention in the field! As yellow monoecious flowers bloom across the central garden vines, we must scout the foliage, separate cucumber beetles from beneficial ladybugs, and apply IPM controls.',
          onAdvance: () => {
            setQuests(prev => {
              if (prev[2].steps[0].isComplete) return prev;
              const copy = [...prev];
              copy[2].steps[0].isComplete = true;
              return copy;
            });
            setDialogue(null);
            setActiveMiniGame('pest_scout');
          },
        });
      } else {
        const isGrowing = engineRef.current?.plots.some(p => p.phase === 'growing');
        const hasEmergency = Boolean(engineRef.current?.activeEmergency);
        if (isGrowing && !hasEmergency) {
          setDialogue({
            speakerName: 'Farmer Rosa',
            speakerRole: 'Senior Cultivator',
            text: 'Field Emergency Alert! Cucumber beetles are attacking our growing watermelon vines! I am sounding the alarm! Approach the affected plot and press [E] to Pick Bugs by hand or [F] to Bio-Spray!',
            onAdvance: () => {
              setDialogue(null);
              engineRef.current?.triggerEmergencyOutbreak('cucumber_beetle');
            },
          });
        } else {
          setDialogue({
            speakerName: 'Farmer Rosa',
            speakerRole: 'Senior Cultivator',
            text: 'Keep an eye on the top HUD Garden Stage Monitor and clock! You can adjust time speed from 1x to 6x as your watermelon vines flower and fruit across all unlocked plots.',
            onAdvance: () => setDialogue(null),
          });
        }
      }
    }
  }, []);

  const handleInteractPlot = useCallback((plot: PlotData) => {
    const centerX = plot.x + plot.width / 2;
    const centerY = plot.y + plot.height / 2;

    // Multi-plot harvest reward & progression
    audio.playSuccessFanfare();
    engineRef.current?.spawnParticles(centerX, centerY, '#82cf67', 16);
    economyRef.current.addCoins(120);
    economyRef.current.addItem({
      id: 'melon_sugar_baby',
      name: 'Sugar Baby Watermelon',
      category: 'crop',
      quality: 'usda_no_1',
      value: 80,
      description: 'Harvested empirical Citrullus lanatus specimen. 12.5 Brix sugar rating.',
    }, 2);
    setCoins(economyRef.current.getCoins());

    setQuests(prev => {
      const copy = [...prev];
      copy[0].steps[0].isComplete = true;
      copy[0].steps[1].isComplete = true;
      copy[0].steps[2].isComplete = true;
      copy[3].steps[0].isComplete = true;
      copy[3].steps[1].isComplete = true;
      return copy;
    });
  }, []);

  const handleInteractSoilLab = useCallback(() => {
    setQuests(prev => {
      if (prev[1].steps[0].isComplete) return prev;
      const copy = [...prev];
      copy[1].steps[0].isComplete = true;
      return copy;
    });
    setActiveMiniGame('soil_lab');
  }, []);

  const handleInteractHarvestBench = useCallback(() => {
    setActiveMiniGame('harvest_bench');
  }, []);

  const handleRemediateIrrigation = useCallback(() => {
    if (!engineRef.current) return;
    const res = engineRef.current.weatherSystem.remediate('irrigation');
    if (res.success) {
      audio.playWaterSound();
      engineRef.current.spawnParticles(14 * 32 + 16, 24 * 32 + 16, '#3498db', 24);
      setWeatherMetrics(engineRef.current.weatherSystem.getMetrics());
      unlockBadge('badge_weather');
      setDialogue({
        speakerName: 'Southern Canal Valve',
        speakerRole: 'Irrigation Remediation Active',
        text: res.message,
        onAdvance: () => setDialogue(null),
      });
    } else {
      audio.playMenuClick();
      setDialogue({
        speakerName: 'Southern Canal Valve',
        speakerRole: 'Drip System Inspection',
        text: 'Soil moisture is currently optimal (60% field capacity). Additional irrigation is not required.',
        onAdvance: () => setDialogue(null),
      });
    }
  }, [unlockBadge]);

  const handleRemediateBioSpray = useCallback(() => {
    if (!engineRef.current) return;
    const res = engineRef.current.weatherSystem.remediate('bio_spray');
    if (res.success) {
      audio.playSpraySound();
      engineRef.current.spawnParticles(3 * 32 + 16, 11 * 32 + 16, '#2ecc71', 28);
      for (const plot of engineRef.current.plots) {
        if (plot.isMulched) {
          plot.pestTreated = true;
          plot.pestDiagnosed = true;
          engineRef.current.spawnParticles(plot.tileX * 32 + 16, plot.tileY * 32 + 16, '#2ecc71', 8);
        }
      }
      setWeatherMetrics(engineRef.current.weatherSystem.getMetrics());
      unlockBadge('badge_weather');
      setDialogue({
        speakerName: 'Field Bio-Spray Rig',
        speakerRole: 'Protective Bio-Barrier Deployed',
        text: res.message,
        onAdvance: () => setDialogue(null),
      });
    } else {
      audio.playMenuClick();
      setDialogue({
        speakerName: 'Field Bio-Spray Rig',
        speakerRole: 'Protective System Inspection',
        text: 'Atmospheric humidity is within nominal bounds. Preventative bio-spray application is not required.',
        onAdvance: () => setDialogue(null),
      });
    }
  }, [unlockBadge]);

  // Initialize Canvas & Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const engine = new MelonEngine(
      canvas,
      {
        onInteractNpc: handleInteractNpc,
        onInteractPlot: handleInteractPlot,
        onInteractSoilLab: handleInteractSoilLab,
        onInteractHarvestBench: handleInteractHarvestBench,
        onRemediateIrrigation: handleRemediateIrrigation,
        onRemediateBioSpray: handleRemediateBioSpray,
        onInteractBed: handleSleep,
        onInteractWardrobe: () => setShowCustomization(true),
        onInteractMarketplace: () => setShowMarketplace(true),
        onInteractFishing: () => setShowFishing(true),
        onInteractFishBucket: () => {
          setInventoryTab('bucket');
          setShowInventory(true);
        },
        onPurchasePlotDeed: (plot) => {
          const res = economyRef.current.unlockPlot(plot.plotNumber, plot.deedPrice);
          setCoins(economyRef.current.getCoins());
          if (res.success) {
            setDialogue({
              speakerName: 'DA-BPI Land Registry',
              speakerRole: `${plot.title} Deed Acquired`,
              text: `Purchased ${plot.title} Land Deed for ${plot.deedPrice}G! Stand by the plot and press [E] to Chop Trees (+15G timber salvage), then Pull Stumps [E] to prepare the soil bed for watermelon cultivation.`,
              onAdvance: () => setDialogue(null),
            });
          } else {
            setDialogue({
              speakerName: 'DA-BPI Land Registry',
              speakerRole: `${plot.title} (${plot.deedPrice}G)`,
              text: `${res.message} Harvest watermelons, catch river fish, or trade with Broker Silas to earn more coins!`,
              onAdvance: () => setDialogue(null),
            });
          }
          return res;
        },
        onTimberSalvaged: (plot, bonusCoins) => {
          economyRef.current.addCoins(bonusCoins);
          setCoins(economyRef.current.getCoins());
          setDialogue({
            speakerName: 'Woodland Clearing Complete',
            speakerRole: `${plot.title} Timber Salvage (+${bonusCoins}G)`,
            text: `All pine and oak trees on ${plot.title} have been felled! You earned +${bonusCoins}G from salvaged cedar timber. Press [E] on the plot to Pull Stumps and unlock the soil bed!`,
            onAdvance: () => setDialogue(null),
          });
        },
        onTimeUpdate: (ts) => setTimeState(ts),
        onGardenStatusChange: (status) => {
          setGardenStatus(status);
          if (status.phase === 'sow') {
            unlockBadge('badge_clear');
          } else if (status.phase === 'growing') {
            unlockBadge('badge_clear');
            unlockBadge('badge_sow');
          } else if (status.phase === 'harvest') {
            unlockBadge('badge_clear');
            unlockBadge('badge_sow');
          }
          setQuests(prev => {
            let changed = false;
            const markStep = (qIdx: number, sIdx: number) => {
              if (!prev[qIdx].steps[sIdx].isComplete) {
                prev[qIdx].steps[sIdx].isComplete = true;
                changed = true;
              }
            };

            if (status.phase === 'sow') {
              markStep(0, 0);
            } else if (status.phase === 'growing') {
              markStep(0, 0);
              markStep(0, 1);
              if (
                status.stageLabel === 'SPROUTING' ||
                status.stageLabel === 'VINING' ||
                status.stageLabel === 'FLOWERING' ||
                status.stageLabel === 'FRUITING'
              ) {
                markStep(0, 2);
              }
              if (
                status.stageLabel === 'VINING' ||
                status.stageLabel === 'FLOWERING' ||
                status.stageLabel === 'FRUITING'
              ) {
                markStep(1, 2);
              }
              if (status.stageLabel === 'FRUITING') {
                markStep(2, 2);
              }
            } else if (status.phase === 'harvest') {
              markStep(0, 0);
              markStep(0, 1);
              markStep(0, 2);
              markStep(1, 2);
              markStep(2, 2);
              markStep(3, 0);
            }
            return changed ? [...prev] : prev;
          });
        },
        onPlotSpoiled: (plotId) => {
          audio.playErrorBuzz();
          setDialogue({
            speakerName: 'Professor Citrullus',
            speakerRole: 'Lead Agronomist',
            text: `Field Alert! Plot #${plotId + 1} reached overripeness and spoiled on the vine! Watermelons are non-climacteric and will not preserve once mature. It must be composted.`,
            onAdvance: () => setDialogue(null),
          });
        },
        onWeatherShift: (m) => {
          setWeatherMetrics(m);
        },
        onCropStressChange: (st) => {
          setIsCropStressed(st);
          if (st) {
            audio.playErrorBuzz();
          }
        },
        onEmergencyQuestStart: (em) => {
          setEmergencyQuest({
            title: `${em.title} (${em.targetPlotTitle})`,
            pestsRemaining: em.pestsRemaining,
            totalPests: em.totalPests,
          });
          unlockBadge('badge_emergency');
        },
        onEmergencyQuestProgress: (rem, _tot) => {
          setEmergencyQuest(prev => prev ? { ...prev, pestsRemaining: rem } : null);
        },
        onEmergencyQuestResolved: () => {
          setEmergencyQuest(null);
          economyRef.current.addCoins(80);
          setCoins(economyRef.current.getCoins());
          unlockBadge('badge_emergency');
          setDialogue({
            speakerName: 'Field Emergency Resolved',
            speakerRole: 'Crop Protection Victory',
            text: 'Outstanding work, Agronomist! Emergency pest outbreak repelled using IPM controls. Crops protected and +80 Coins awarded!',
            onAdvance: () => setDialogue(null),
          });
        },
        onStepChange: () => {},
      },
      customManagerRef.current.getState()
    );

    engineRef.current = engine;
    engine.syncUnlockedPlots(economyRef.current.getUnlockedPlots());
    economyRef.current.onPlotUnlock = (plotId) => {
      engine.unlockPlotFromDeed(plotId);
      setGardenStatus(engine.getGardenStatus());
    };
    engine.setDetailLevel(settings.detailLevel);
    engine.weatherParticles.setQuality(settings.particleQuality);
    engine.setPierBucketCount(economyRef.current.getPierBucketCount());
    setWeatherMetrics(engine.weatherSystem.getMetrics());
    setTimeState(engine.timeSystem.getState());
    setGardenStatus(engine.getGardenStatus());
    engine.start();
    (window as any).__melonEngine = engine;
    (window as any).__openFishing = () => setShowFishing(true);

    return () => {
      window.removeEventListener('resize', resize);
      engine.stop();
    };
  }, [
    handleInteractNpc,
    handleInteractPlot,
    handleInteractSoilLab,
    handleInteractHarvestBench,
    handleRemediateIrrigation,
    handleRemediateBioSpray,
    handleSleep,
    unlockBadge,
  ]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isTyping) {
        if (e.code === 'Escape') {
          e.preventDefault();
          target.blur();
        }
        return;
      }

      if (e.code === 'KeyM') {
        e.preventDefault();
        const muted = audio.toggleMute();
        setIsAudioMuted(muted);
        return;
      }

      if (e.code === 'KeyG') {
        e.preventDefault();
        audio.playMenuClick();
        setShowGuidebook(prev => !prev);
        return;
      }

      if (e.code === 'KeyB') {
        e.preventDefault();
        audio.playMenuClick();
        setShowProgressionModal(prev => !prev);
        return;
      }

      if (e.code === 'KeyC' && gameState === 'playing' && !showPauseMenu && !showGuidebook) {
        e.preventDefault();
        audio.playMenuClick();
        setShowCustomization(prev => !prev);
        return;
      }

      if (e.code === 'KeyI' && gameState === 'playing' && !showPauseMenu && !showGuidebook) {
        e.preventDefault();
        audio.playMenuClick();
        setInventoryTab('all');
        setShowInventory(prev => !prev);
        return;
      }

      if (e.code === 'KeyH' && gameState === 'playing' && !showPauseMenu && !showGuidebook) {
        e.preventDefault();
        audio.playMenuClick();
        setIsCleanView(prev => !prev);
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        if (isCleanView) {
          setIsCleanView(false);
        } else if (showInventory) {
          setShowInventory(false);
        } else if (showProgressionModal) {
          setShowProgressionModal(false);
        } else if (showManualInstall) {
          setShowManualInstall(false);
        } else if (showGuidebook) {
          setShowGuidebook(false);
        } else if (showCustomization) {
          setShowCustomization(false);
        } else if (showMarketplace) {
          setShowMarketplace(false);
        } else if (showFishing) {
          setShowFishing(false);
        } else if (activeMiniGame) {
          setActiveMiniGame(null);
        } else if (dialogue) {
          setDialogue(null);
        } else if (activeQuizId) {
          setActiveQuizId(null);
        } else if (gameState === 'playing') {
          setGameState('paused');
          setShowPauseMenu(true);
        } else if (gameState === 'paused') {
          setGameState('playing');
          setShowPauseMenu(false);
        }
        return;
      }

      if (e.code === 'Space') {
        if (
          gameState === 'playing' &&
          !dialogue &&
          !activeMiniGame &&
          !activeQuizId &&
          !showGuidebook &&
          !showProgressionModal &&
          !showPauseMenu &&
          !showCustomization &&
          !showMarketplace &&
          !showFishing &&
          !showInventory
        ) {
          e.preventDefault();
          engineRef.current?.triggerJump();
          if (engineRef.current) {
            engineRef.current.keysHeld['Space'] = true;
          }
          return;
        }
      }

      if (e.code === 'KeyE') {
        if (
          gameState === 'playing' &&
          !dialogue &&
          !activeMiniGame &&
          !activeQuizId &&
          !showGuidebook &&
          !showProgressionModal &&
          !showPauseMenu &&
          !showCustomization &&
          !showMarketplace &&
          !showFishing &&
          !showInventory
        ) {
          e.preventDefault();
          engineRef.current?.triggerAction();
          return;
        }
      }

      if (e.code === 'KeyF') {
        if (
          gameState === 'playing' &&
          !dialogue &&
          !activeMiniGame &&
          !activeQuizId &&
          !showGuidebook &&
          !showProgressionModal &&
          !showPauseMenu &&
          !showCustomization &&
          !showMarketplace &&
          !showFishing &&
          !showInventory
        ) {
          if (engineRef.current?.activeEmergency) {
            e.preventDefault();
            engineRef.current.sprayPestsByBioSpray();
            return;
          }
        }
      }

      if (engineRef.current) {
        engineRef.current.keysHeld[e.code] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (engineRef.current) {
        engineRef.current.keysHeld[e.code] = false;
      }
    };

    const handleBlur = () => {
      if (engineRef.current) {
        engineRef.current.keysHeld = {};
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [
    gameState,
    dialogue,
    activeMiniGame,
    activeQuizId,
    showGuidebook,
    showProgressionModal,
    showManualInstall,
    showPauseMenu,
    showCustomization,
    showMarketplace,
    showFishing,
    showInventory,
    isCleanView,
  ]);

  // Mini-Game Completion Callbacks
  const handleSoilLabComplete = () => {
    setActiveMiniGame(null);
    unlockBadge('badge_soil_ph');
    setQuests(prev => {
      const copy = [...prev];
      copy[1].steps[0].isComplete = true;
      copy[1].steps[1].isComplete = true;
      return copy;
    });
    setTimeout(() => {
      setActiveQuizId('quiz_2');
    }, 400);
  };

  const handlePestScoutComplete = () => {
    setActiveMiniGame(null);
    unlockBadge('badge_ipm');
    setQuests(prev => {
      const copy = [...prev];
      copy[2].steps[0].isComplete = true;
      copy[2].steps[1].isComplete = true;
      return copy;
    });
    // Award pest control bounty to player treasury
    economyRef.current.addCoins(30);
    setCoins(economyRef.current.getCoins());
    setTimeout(() => {
      setActiveQuizId('quiz_3');
    }, 400);
  };

  const handleHarvestInspectComplete = () => {
    setActiveMiniGame(null);
    unlockBadge('badge_brix');
    setQuests(prev => {
      const copy = [...prev];
      copy[3].steps[2].isComplete = true;
      return copy;
    });
    // Add harvested prime watermelon specimens to player inventory
    economyRef.current.addItem({
      id: 'melon_sugar_baby',
      name: 'Sugar Baby Watermelon',
      category: 'crop',
      quality: 'usda_no_1',
      value: 80,
      description: 'Harvested empirical Citrullus lanatus specimen. 12.5 Brix sugar rating.',
    }, 2);
    setCoins(economyRef.current.getCoins());
    setTimeout(() => {
      setActiveQuizId('quiz_4');
    }, 400);
  };

  const handleQuizPass = (_quizId: string) => {
    setActiveQuizId(null);
    unlockBadge('badge_scholar');
    const qIdx = currentQuestIndex;

    setQuests(prev => {
      const copy = [...prev];
      if (copy[qIdx]) {
        copy[qIdx].isCompleted = true;
        const lastStep = copy[qIdx].steps[copy[qIdx].steps.length - 1];
        if (lastStep) lastStep.isComplete = true;
      }
      return copy;
    });

    audio.playQuestComplete();

    if (qIdx < 3) {
      setCurrentQuestIndex(qIdx + 1);
    } else {
      unlockBadge('badge_master');
      setShowDiploma(true);
    }
  };

  const handleStartGame = () => {
    audio.playSuccessFanfare();
    setGameState('playing');
  };

  const handleRestartProgress = () => {
    const resetProg: ProgressionState = {
      xp: 0,
      harvestCount: 0,
      quizzesPassed: 0,
      badges: INITIAL_BADGES.map(b => ({ ...b })),
    };
    setProgression(resetProg);
    saveProgressionState(resetProg);

    setQuests(QUESTS.map(q => ({
      ...q,
      isCompleted: false,
      steps: q.steps.map(s => ({ ...s, isComplete: false, currentCount: 0 })),
    })));
    setCurrentQuestIndex(0);
    setActiveMiniGame(null);
    setActiveQuizId(null);
    setShowGuidebook(false);
    setShowProgressionModal(false);
    setShowPauseMenu(false);
    setShowDiploma(false);
    setShowCustomization(false);
    setShowMarketplace(false);
    setShowFishing(false);
    setDialogue(null);

    economyRef.current.resetUnlockedPlots();

    if (engineRef.current) {
      engineRef.current.currentLocation = 'outdoor';
      engineRef.current.playerX = 468;
      engineRef.current.playerY = 368;
      engineRef.current.setCropGrowthStage(0);
      for (const plot of engineRef.current.plots) {
        plot.isUnlocked = plot.plotNumber === 1;
        plot.phase = plot.plotNumber === 1 ? 'clear' : 'locked_forest';
        plot.actionTag =
          plot.plotNumber === 1
            ? 'Clear [E]'
            : `Buy Plot #${plot.plotNumber} (${plot.deedPrice}G) [E]`;
        plot.growthProgress = 0;
        plot.lifecycleNumber = 1;
        plot.isCleared = false;
        plot.isTilled = false;
        plot.isMulched = false;
        plot.cropStage = 0;
        plot.growthMinutes = 0;
        plot.matureMinutes = 0;
        plot.isSpoiled = false;
        plot.pestDiagnosed = false;
        plot.pestTreated = false;
      }
      engineRef.current.persistPlotsState();
      engineRef.current.weatherSystem.reset();
      setWeatherMetrics(engineRef.current.weatherSystem.getMetrics());
      setGardenStatus(engineRef.current.getGardenStatus());
    }

    setGameState('playing');
  };

  const isAnyModalOpen = Boolean(
    activeMiniGame ||
      activeQuizId ||
      showGuidebook ||
      showProgressionModal ||
      showPauseMenu ||
      showDiploma ||
      showManualInstall ||
      showCustomization ||
      showMarketplace ||
      showFishing ||
      showInventory
  );

  const unlockedBadgesCount = progression.badges.filter(b => b.unlocked).length;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0d160e] select-none font-sans">
      {/* 1. Main Canvas Renderport */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block pixelated"
        tabIndex={0}
      />

      {/* 2. Top Game Header HUD (Time, Calendar, Speed, Garden Stage Monitor, Coins, Stamina, Quick Actions) */}
      {gameState === 'playing' && !isAnyModalOpen && !isCleanView && (
        <GameHeaderHUD
          timeState={timeState}
          coins={coins}
          gardenStatus={gardenStatus}
          emergencyQuest={emergencyQuest}
          unlockedBadgesCount={unlockedBadgesCount}
          onSetTimeSpeed={handleSetTimeSpeed}
          onSleep={handleSleep}
          onOpenCustomization={() => setShowCustomization(true)}
          onOpenInventory={() => {
            setInventoryTab('all');
            setShowInventory(true);
          }}
          inventoryCount={inventorySummaryCount}
          onOpenMarketplace={() => setShowMarketplace(true)}
          onOpenFishing={() => setShowFishing(true)}
          onOpenGuidebook={() => setShowGuidebook(true)}
          onOpenProgression={() => {
            setProgressionTab('badges');
            setShowProgressionModal(true);
          }}
          onToggleCleanView={() => setIsCleanView(true)}
          onToggleQuests={() => setShowQuestDrawer(prev => !prev)}
          isQuestsOpen={showQuestDrawer}
          onFocusPlot={(plotNum) => {
            engineRef.current?.focusPlot(plotNum);
            if (engineRef.current) {
              setGardenStatus(engineRef.current.getGardenStatus());
            }
          }}
          onTriggerPlotAction={(plotNum) => {
            if (!engineRef.current) return;
            engineRef.current.focusPlot(plotNum);
            engineRef.current.triggerAction();
            setGardenStatus(engineRef.current.getGardenStatus());
          }}
          onPause={() => {
            audio.playMenuClick();
            setGameState('paused');
            setShowPauseMenu(true);
          }}
        />
      )}

      {/* 3. Sub-HUD: Quests & Weather Hanging Signs (Toggled via QUESTS button so 8 modular beds stay unobstructed) */}
      {gameState === 'playing' && !isAnyModalOpen && !isCleanView && showQuestDrawer && (
        <div className="fixed top-14 left-0 right-0 z-30 pointer-events-none px-2.5 sm:px-4 pt-1.5 flex items-start justify-between gap-3">
          {/* Active Quest Protocol Banner: Ornate Parchment Style */}
          <div className="pixel-parchment p-2.5 sm:p-3 max-w-[280px] sm:max-w-sm pointer-events-auto shadow-2xl relative">
            <div className="absolute -top-2 left-4 flex gap-1">
              <div className="w-1.5 h-3 bg-[#f1c40f] -mt-0.5 border border-[#4a2e13]" />
              <div className="w-1.5 h-3 bg-[#f1c40f] -mt-0.5 border border-[#4a2e13]" />
            </div>

            <div
              onClick={() => setIsHudExpanded(prev => !prev)}
              className="flex items-center justify-between border-b-2 border-[#bba377] pb-1.5 cursor-pointer mt-0.5"
            >
              <div className="flex items-center gap-1.5 truncate mr-1">
                <span className="w-2 h-2 bg-[#8e6822] rotate-45 shrink-0" />
                <span className="font-pixel text-[9px] sm:text-[10px] text-[#5a2e0a] font-bold tracking-wider truncate">
                  PHASE {activeQuest.phaseNumber}: {activeQuest.title.split(':')[1] || activeQuest.title}
                </span>
              </div>
              <span className="font-pixel text-[8px] sm:text-[9px] text-[#8e6822] font-bold shrink-0">
                {isHudExpanded ? '[-] HIDE' : '[+] VIEW'}
              </span>
            </div>

            {/* Steps: Visible when expanded or on desktop */}
            <div className={`mt-2 space-y-1.5 text-xs ${isHudExpanded ? 'block' : 'hidden sm:block'}`}>
              <div className="text-[11px] text-[#4a301a] font-bold leading-tight mb-1">
                Advisor: <span className="text-[#1b5e20]">{activeQuest.advisor}</span>
              </div>
              {activeQuest.steps.map(step => (
                <div
                  key={step.id}
                  className={`flex items-start gap-2 text-[11px] sm:text-xs font-bold leading-snug ${
                    step.isComplete ? 'text-[#2e7d32] line-through opacity-75' : 'text-[#2e1c0c]'
                  }`}
                >
                  <span className="font-pixel text-[8px] sm:text-[9px] text-[#8e6822] shrink-0 whitespace-nowrap mt-0.5">
                    {step.isComplete ? '[OK]' : '[ ]'}
                  </span>
                  <span>
                    {step.description}
                    {step.requiredCount && !step.isComplete
                      ? ` (${step.currentCount || 0}/${step.requiredCount})`
                      : ''}
                  </span>
                </div>
              ))}

              {/* Direct Phase Quiz Button inside Quest Drawer */}
              <div className="pt-1.5 border-t border-[#bba377] flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    audio.playMenuClick();
                    setActiveQuizId(activeQuest.quizId);
                  }}
                  className="w-full py-1 px-2 bg-[#38200d] hover:bg-[#4e2d12] text-[#f0c54d] border border-[#8e6822] font-pixel text-[8px] cursor-pointer text-center"
                >
                  [TAKE PHASE {activeQuest.phaseNumber} QUIZ]
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Weather & Agronomy Station: 3D Green Hanging Sign */}
          {weatherMetrics && (
            <div className="relative pointer-events-auto">
              <div className="absolute -top-2 left-6 w-1 h-3 bg-[#7a4d28] border border-[#2a1708]" />
              <div className="absolute -top-2 right-6 w-1 h-3 bg-[#7a4d28] border border-[#2a1708]" />

              <div
                className={`pixel-hanging-sign p-2 sm:p-2.5 max-w-[250px] sm:max-w-xs transition-all ${
                  weatherMetrics.current === 'drought'
                    ? 'bg-gradient-to-b from-[#d35400] to-[#a04000] border-[#f39c12] text-[#fff7e6]'
                    : weatherMetrics.current === 'high_humidity'
                    ? 'bg-gradient-to-b from-[#2980b9] to-[#1f618d] border-[#5dade2] text-[#ebf5fb]'
                    : 'bg-gradient-to-b from-[#2e7d32] to-[#1b5e20] border-[#a5d6a7] text-[#e8f8f5]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 pb-1 border-b border-white/20">
                  <span
                    className={`font-pixel text-[8px] sm:text-[9px] font-bold tracking-wider ${
                      weatherMetrics.current === 'drought'
                        ? 'text-[#ffeaa7] animate-pulse'
                        : weatherMetrics.current === 'high_humidity'
                        ? 'text-[#d4efdf] animate-pulse'
                        : 'text-[#ffffff]'
                    }`}
                  >
                    {weatherMetrics.current === 'optimal'
                      ? 'WEATHER: OPTIMAL'
                      : weatherMetrics.current === 'drought'
                      ? 'HAZARD: DROUGHT'
                      : 'HAZARD: HIGH HUMIDITY'}
                  </span>
                  <span className="font-pixel text-[8px] bg-black/40 px-1.5 py-0.5 rounded-none text-white">
                    {weatherMetrics.timeRemainingSeconds}s
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between text-[11px] sm:text-xs font-bold gap-2">
                  <span>HUM: <strong className="text-white">{weatherMetrics.humidityPct}%</strong></span>
                  <span>TEMP: <strong className="text-white">{weatherMetrics.temperatureF}F</strong></span>
                  {isCropStressed ? (
                    <span className="font-pixel text-[7px] text-[#e74c3c] bg-white px-1 py-0.5 animate-pulse">
                      [STRESS]
                    </span>
                  ) : (
                    <span className="font-pixel text-[7px] text-[#2ecc71] bg-black/40 px-1 py-0.5">
                      [HEALTHY]
                    </span>
                  )}
                </div>

                {/* Quick remediation action button if hazard active */}
                {weatherMetrics.current === 'drought' && (
                  <button
                    onClick={handleRemediateIrrigation}
                    className="mt-1.5 w-full pixel-btn pixel-btn-action py-1 text-[8px] sm:text-[9px] font-pixel text-white bg-[#e67e22] hover:bg-[#d35400] text-center"
                  >
                    [OPEN DRIP VALVE]
                  </button>
                )}
                {weatherMetrics.current === 'high_humidity' && (
                  <button
                    onClick={handleRemediateBioSpray}
                    className="mt-1.5 w-full pixel-btn pixel-btn-action py-1 text-[8px] sm:text-[9px] font-pixel text-white bg-[#27ae60] hover:bg-[#2ecc71] text-center"
                  >
                    [DEPLOY BIO-SPRAY]
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. On-Screen Virtual Controls for Mobile/Tablet */}
      {gameState === 'playing' && !isAnyModalOpen && !isCleanView && settings.touchControls !== 'hidden' && (
        <VirtualControls
          onDirectionChange={(x, y) => {
            if (engineRef.current) {
              engineRef.current.joystickVector = { x, y };
            }
          }}
          onActionA={() => {
            if (dialogue) {
              dialogue.onAdvance();
            } else {
              engineRef.current?.triggerAction();
            }
          }}
          onActionB={() => {
            setShowGuidebook(true);
          }}
        />
      )}

      {/* 5. Retro RPG Dialogue Box */}
      {dialogue && !isAnyModalOpen && (
        <DialogueBox
          speakerName={dialogue.speakerName}
          speakerRole={dialogue.speakerRole}
          text={dialogue.text}
          onAdvance={dialogue.onAdvance}
          onClose={() => setDialogue(null)}
          actionLabel={dialogue.actionLabel}
        />
      )}

      {/* 6. Mini-Game Modals */}
      {activeMiniGame === 'soil_lab' && (
        <SoilLabMiniGame
          onComplete={handleSoilLabComplete}
          onClose={() => setActiveMiniGame(null)}
        />
      )}

      {activeMiniGame === 'pest_scout' && (
        <PestScoutMiniGame
          onComplete={handlePestScoutComplete}
          onClose={() => setActiveMiniGame(null)}
        />
      )}

      {activeMiniGame === 'harvest_bench' && (
        <HarvestInspectMiniGame
          onComplete={handleHarvestInspectComplete}
          onClose={() => setActiveMiniGame(null)}
        />
      )}

      {/* 7. Side Activity: River Fishing */}
      {showFishing && (
        <FishingMiniGame
          economy={economyRef.current}
          customization={customizationState}
          onClose={() => setShowFishing(false)}
          onOpenWardrobe={() => {
            setShowFishing(false);
            setShowCustomization(true);
          }}
          onOpenMarket={() => {
            setShowFishing(false);
            setShowMarketplace(true);
          }}
          onOpenInventory={() => {
            setShowFishing(false);
            setInventoryTab('bucket');
            setShowInventory(true);
          }}
        />
      )}

      {/* 7B. Farmer Inventory & Pier Fish Bucket Modal */}
      {showInventory && (
        <InventoryModal
          economy={economyRef.current}
          initialTab={inventoryTab}
          onClose={() => setShowInventory(false)}
          onOpenMarket={() => {
            setShowInventory(false);
            setShowMarketplace(true);
          }}
          onOpenFishing={() => {
            setShowInventory(false);
            setShowFishing(true);
          }}
        />
      )}

      {/* 8. Character Customization Modal (Wardrobe) */}
      {showCustomization && (
        <CharacterCustomizationModal
          customManager={customManagerRef.current}
          economy={economyRef.current}
          onClose={() => setShowCustomization(false)}
          onCustomizationApplied={handleCustomizationApplied}
        />
      )}

      {/* 9. Marketplace Modal (Broker Silas) */}
      {showMarketplace && (
        <MarketplaceModal
          economy={economyRef.current}
          onClose={() => setShowMarketplace(false)}
          onPlotPurchased={(plotId) => {
            engineRef.current?.unlockPlotFromDeed(plotId);
            if (engineRef.current) {
              setGardenStatus(engineRef.current.getGardenStatus());
            }
          }}
          onOpenInventory={() => {
            setShowMarketplace(false);
            setInventoryTab('all');
            setShowInventory(true);
          }}
        />
      )}

      {/* 10. Agronomy Certification Quiz Modal */}
      {activeQuizId && QUIZZES[activeQuizId] && (
        <QuizModal
          quiz={QUIZZES[activeQuizId]}
          onPass={() => handleQuizPass(activeQuizId)}
          onClose={() => setActiveQuizId(null)}
        />
      )}

      {/* 11. Pause and Settings Modal (hidden while Guidebook, Progression or Install Modal is open on top) */}
      {showPauseMenu && !showGuidebook && !showProgressionModal && !showManualInstall && (
        <PauseSettingsModal
          onResume={() => {
            setShowPauseMenu(false);
            setGameState('playing');
          }}
          onRestart={handleRestartProgress}
          onOpenGuidebook={() => setShowGuidebook(true)}
          onOpenProgression={() => {
            setProgressionTab('badges');
            setShowProgressionModal(true);
          }}
          onInstallClick={() => setShowManualInstall(true)}
          isInstallable={pwa.isInstallable}
          isInstalled={pwa.isInstalled}
          settings={settings}
          onUpdateSetting={handleUpdateSetting}
        />
      )}

      {/* 12. Capstone Diploma Modal */}
      {showDiploma && !showProgressionModal && (
        <DiplomaModal
          onRestart={handleRestartProgress}
          onContinue={() => {
            setShowDiploma(false);
            setGameState('playing');
          }}
          onOpenSusEvaluation={() => {
            setProgressionTab('sus');
            setShowProgressionModal(true);
          }}
        />
      )}

      {/* 13. Title Screen */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          onOpenGuidebook={() => setShowGuidebook(true)}
          onInstallClick={() => setShowManualInstall(true)}
          isInstallable={pwa.isInstallable}
          isInstalled={pwa.isInstalled}
          settings={settings}
          onUpdateSetting={handleUpdateSetting}
          isOverlayOpen={showGuidebook || showManualInstall || showProgressionModal}
        />
      )}

      {/* 14. Dedicated Farming Guidebook Module (Always renders above Pause & Title screens) */}
      {showGuidebook && (
        <GuidebookModal onClose={() => setShowGuidebook(false)} />
      )}

      {/* 15. Progression (Collectible Badges, Player Rankings & SUS Usability Survey) */}
      {showProgressionModal && (
        <ProgressionSusModal
          progression={progression}
          initialTab={progressionTab}
          onClose={() => setShowProgressionModal(false)}
        />
      )}

      {/* 16. Compact 16-Bit Badge Unlocked Toast Banner */}
      {badgeToast && (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none pixel-wood-bar px-3.5 py-2 border-2 border-[#f0c54d] shadow-2xl flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 bg-[#2ecc71] border border-white shrink-0" />
          <div>
            <div className="font-pixel text-[8px] text-[#f0c54d]">BADGE UNLOCKED</div>
            <div className="font-pixel text-[10px] text-white">
              {badgeToast.title} <span className="text-[#2ecc71]">(+{badgeToast.xp} XP)</span>
            </div>
          </div>
        </div>
      )}

      {/* 17. PWA Install Modal */}
      <PWAInstallModal
        hook={pwa}
        forceOpen={showManualInstall}
        onClose={() => setShowManualInstall(false)}
      />
    </div>
  );
}
