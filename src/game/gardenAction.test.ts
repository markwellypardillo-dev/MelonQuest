import test from 'node:test';
import assert from 'node:assert/strict';

// Simple mock for HTMLCanvasElement and context in node test environment
class MockCanvas {
  width = 640;
  height = 360;
  getContext() {
    return {
      fillStyle: '',
      fillRect: () => {},
      drawImage: () => {},
      measureText: () => ({ width: 40 }),
      fillText: () => {},
      save: () => {},
      restore: () => {},
      scale: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
    };
  }
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 640, height: 360 };
  }
  addEventListener() {}
  removeEventListener() {}
}

(global as any).document = {
  createElement: (tag: string) => {
    if (tag === 'canvas') return new MockCanvas();
    return {};
  },
};
(global as any).window = {
  addEventListener: () => {},
  removeEventListener: () => {},
};

import { MelonEngine } from './engine.ts';

test('Garden actions trigger progressive multi-step execution rather than instant completion', () => {
  let plotInteracted = false;
  let gardenStatusChanged = false;

  const engine = new MelonEngine(new MockCanvas() as any, {
    onInteractPlot: () => {
      plotInteracted = true;
    },
    onGardenStatusChange: () => {
      gardenStatusChanged = true;
    },
    onInteractSoilLab: () => {},
    onInteractHarvestBench: () => {},
    onRemediateIrrigation: () => {},
    onRemediateBioSpray: () => {},
    onInteractNpc: () => {},
    onInteractBed: () => {},
    onInteractWardrobe: () => {},
    onInteractMarketplace: () => {},
    onInteractFishing: () => {},
    onStepChange: () => {},
  });

  const garden = engine.plots[0];
  assert.equal(garden.phase, 'clear');

  // 1. Initial click / trigger does NOT instantly clear the garden
  engine.advanceSingleGardenStage(true);
  assert.equal(garden.phase, 'clear', 'Garden should remain in clear phase while action is in progress');
  assert.ok(engine.activeGardenAction !== null, 'activeGardenAction should be initialized');
  assert.equal(engine.activeGardenAction?.type, 'clear');
  assert.equal(engine.activeGardenAction?.progress, 0);

  // 2. Second click during active action is ignored (no spamming/resetting)
  engine.advanceSingleGardenStage(true);
  assert.equal(engine.activeGardenAction?.type, 'clear');

  // 3. Advancing time partially increases progress without completing early
  engine.update(0.8); // 800ms
  assert.ok(engine.activeGardenAction !== null);
  assert.ok((engine.activeGardenAction?.progress ?? 0) > 0.3 && (engine.activeGardenAction?.progress ?? 0) < 0.4);
  assert.equal(garden.phase, 'clear');

  // 4. Advancing time to completion cleanly transitions to 'sow'
  engine.update(1.8); // 1800ms more (total > 2400ms)
  assert.equal(engine.activeGardenAction, null, 'Action should be cleared after completion');
  assert.equal(garden.phase, 'sow', 'Garden should transition to sow phase after clearing action completes');
  assert.equal(garden.isCleared, true);
  assert.equal(garden.isTilled, true);

  // 5. Sowing action test: trigger sowing
  engine.advanceSingleGardenStage(true);
  const sowAct = (engine as any).activeGardenAction;
  assert.ok(sowAct !== null);
  assert.equal(sowAct?.type, 'sow');
  assert.equal(garden.phase, 'sow', 'Garden remains in sow phase during sowing action');

  // Advancing time finishes sowing and starts growing
  engine.update(2.2); // > 2100ms
  assert.equal((engine as any).activeGardenAction, null);
  assert.equal(garden.phase, 'growing', 'Garden transitions to growing after sowing action completes');

  // 6. Fast-forward garden to harvest phase
  garden.growthMinutes = 2200; // harvest threshold
  engine.update(0.1);
  assert.equal(garden.phase, 'harvest');

  // 7. Harvest action test: trigger harvest
  engine.advanceSingleGardenStage(true);
  const harvestAct = (engine as any).activeGardenAction;
  assert.ok(harvestAct !== null);
  assert.equal(harvestAct?.type, 'harvest');
  assert.equal(plotInteracted, false, 'onInteractPlot should not fire immediately on 1st click');

  // Advancing time finishes harvest action and fires onInteractPlot
  engine.update(2.8); // > 2600ms
  assert.equal(engine.activeGardenAction, null);
  assert.equal(plotInteracted, true, 'onInteractPlot should fire when harvest action completes');
  assert.equal(garden.phase, 'clear', 'Garden cycles back to clear after harvest');
});

test('Bed sleep sequence progresses through getting_in, sleeping, blinking, and waking_up', () => {
  const engine = new MelonEngine(new MockCanvas() as any, {
    onInteractPlot: () => {},
    onGardenStatusChange: () => {},
    onInteractSoilLab: () => {},
    onInteractHarvestBench: () => {},
    onRemediateIrrigation: () => {},
    onRemediateBioSpray: () => {},
    onInteractNpc: () => {},
    onInteractBed: () => {},
    onInteractWardrobe: () => {},
    onInteractMarketplace: () => {},
    onInteractFishing: () => {},
    onStepChange: () => {},
  });

  const initialDay = engine.timeSystem.getState().day;
  let completedDay = -1;

  engine.startSleepSequence((nextTime) => {
    completedDay = nextTime.day;
  });

  assert.equal(engine.currentLocation, 'cabin_interior');
  assert.ok(engine.activeSleepAction !== null);
  assert.equal(engine.activeSleepAction?.phase, 'getting_in');

  // Advance 1.0s into 'sleeping' phase (Zzz bubbles + breathing)
  engine.update(1.0);
  assert.equal((engine as any).activeSleepAction?.phase, 'sleeping');
  assert.equal(engine.timeSystem.getState().day, initialDay, 'Day has not yet advanced before blinking phase');

  // Advance 1.9s more (total 2.9s) into 'blinking' phase (past 2850ms peak closure)
  engine.update(1.9);
  assert.equal((engine as any).activeSleepAction?.phase, 'blinking');
  assert.equal(engine.timeSystem.getState().day, initialDay + 1, 'Day advances to next morning during deep eyelid blink');
  assert.equal(engine.timeSystem.getState().hour, 6);

  // Advance 0.6s more (total 3.5s) into 'waking_up' phase
  engine.update(0.6);
  assert.equal((engine as any).activeSleepAction?.phase, 'waking_up');

  // Advance 0.6s more (total 4.1s) to finish sequence
  engine.update(0.6);
  assert.equal((engine as any).activeSleepAction, null);
  assert.equal(completedDay, initialDay + 1);
});

test('Emergency pest outbreaks can be resolved via hand picking or bio-spraying', () => {
  let emergencyStarted = false;
  let emergencyProgressCount = -1;
  let emergencyResolved = false;

  const engine = new MelonEngine(new MockCanvas() as any, {
    onInteractPlot: () => {},
    onGardenStatusChange: () => {},
    onInteractSoilLab: () => {},
    onInteractHarvestBench: () => {},
    onRemediateIrrigation: () => {},
    onRemediateBioSpray: () => {},
    onInteractNpc: () => {},
    onInteractBed: () => {},
    onInteractWardrobe: () => {},
    onInteractMarketplace: () => {},
    onInteractFishing: () => {},
    onEmergencyQuestStart: () => {
      emergencyStarted = true;
    },
    onEmergencyQuestProgress: (rem) => {
      emergencyProgressCount = rem;
    },
    onEmergencyQuestResolved: () => {
      emergencyResolved = true;
    },
    onStepChange: () => {},
  });

  // 1. Trigger emergency outbreak
  engine.triggerEmergencyOutbreak('cucumber_beetle');
  assert.equal(emergencyStarted, true);
  assert.ok(engine.activeEmergency !== null);
  assert.equal(engine.activeEmergency?.pestsRemaining, 5);

  // 2. Hand pick 1 pest bug
  engine.pickPestByHand();
  assert.equal(engine.activeEmergency?.pestsRemaining, 4);
  assert.equal(emergencyProgressCount, 4);
  assert.equal(emergencyResolved, false);

  // 3. Bio-spray clears all remaining 4 pests at once
  engine.sprayPestsByBioSpray();
  assert.equal(engine.activeEmergency, null);
  assert.equal(emergencyProgressCount, 0);
  assert.equal(emergencyResolved, true);
});

import { CustomizationManager, HAIR_COLOR_PALETTES } from './characterCustomization.ts';
import { createPlayerFishingPoseSprites } from './spriteGenerator.ts';

test('Character customization supports Male and Female genders, realistic outfits, hair styles, hair colors, headwear, and fishing poses', () => {
  const manager = new CustomizationManager();
  assert.equal(manager.getState().gender, 'male');

  // Switch to Female and verify auto-adaptation of hair and beard
  manager.setGender('female');
  assert.equal(manager.getState().gender, 'female');
  assert.equal(manager.getState().hairId, 'hair_long_waves');
  assert.equal(manager.getState().beardId, 'beard_clean');

  // Select hair color and hat
  manager.setHairColor('auburn');
  assert.equal(manager.getState().hairColorId, 'auburn');
  assert.equal(HAIR_COLOR_PALETTES.length, 5);

  // Unlock and equip twin braids and straw sunhat
  manager.purchaseUnlock('hair_twin_braids');
  manager.purchaseUnlock('hat_straw');
  assert.equal(manager.equip('hair', 'hair_twin_braids'), true);
  assert.equal(manager.equip('hat', 'hat_straw'), true);
  assert.equal(manager.equip('outfit', 'outfit_overalls'), true);

  // Verify fishing pose sprites generate cleanly for the customized Female character
  const femaleFishingSprites = createPlayerFishingPoseSprites(manager.getState());
  assert.ok(femaleFishingSprites.idle0);
  assert.ok(femaleFishingSprites.idle1);
  assert.ok(femaleFishingSprites.rigging);
  assert.ok(femaleFishingSprites.windup);
  assert.ok(femaleFishingSprites.castForward);
  assert.ok(femaleFishingSprites.reeling0);
  assert.ok(femaleFishingSprites.reeling1);
  assert.ok(femaleFishingSprites.caught);

  // Verify engine regeneration works for all outfits and both genders without error
  const engine = new MelonEngine(
    new MockCanvas() as any,
    {
      onInteractPlot: () => {},
      onGardenStatusChange: () => {},
      onInteractSoilLab: () => {},
      onInteractHarvestBench: () => {},
      onRemediateIrrigation: () => {},
      onRemediateBioSpray: () => {},
      onInteractNpc: () => {},
      onInteractBed: () => {},
      onInteractWardrobe: () => {},
      onInteractMarketplace: () => {},
      onInteractFishing: () => {},
      onStepChange: () => {},
    },
    manager.getState()
  );

  // Switch back to Male and test Lab Coat + Peaked Cap + fishing poses
  manager.setGender('male');
  manager.equip('outfit', 'outfit_lab');
  manager.equip('hat', 'hat_cap');
  engine.setCustomization(manager.getState());
  assert.equal(manager.getState().gender, 'male');
  assert.equal(manager.getState().outfitId, 'outfit_lab');

  const maleFishingSprites = createPlayerFishingPoseSprites(manager.getState());
  assert.ok(maleFishingSprites.idle0);
  assert.ok(maleFishingSprites.caught);
});

test('Character 4-frame biomechanical walking animation and Spacebar jump sequence work across all directions', () => {
  const engine = new MelonEngine(new MockCanvas() as any, {
    onInteractPlot: () => {},
    onGardenStatusChange: () => {},
    onInteractSoilLab: () => {},
    onInteractHarvestBench: () => {},
    onRemediateIrrigation: () => {},
    onRemediateBioSpray: () => {},
    onInteractNpc: () => {},
    onInteractBed: () => {},
    onInteractWardrobe: () => {},
    onInteractMarketplace: () => {},
    onInteractFishing: () => {},
    onStepChange: () => {},
  });

  const atlas = (engine as any).atlas;
  // 1. Verify 4-frame walking cycle and 3-frame jump poses exist for all 4 directions
  for (const dir of ['down', 'up', 'left', 'right'] as const) {
    assert.equal(atlas.player[dir].length, 4, `Expected 4 walk frames for ${dir}`);
    assert.equal(atlas.playerJump[dir].length, 3, `Expected 3 jump frames for ${dir}`);
  }

  // 2. Verify walking advances through all 4 frames (0, 1, 2, 3)
  engine.keysHeld['KeyD'] = true;
  const visitedFrames = new Set<number>();
  for (let i = 0; i < 12; i++) {
    engine.update(0.05);
    visitedFrames.add((engine as any).currentFrame);
  }
  engine.keysHeld['KeyD'] = false;
  assert.equal(visitedFrames.size, 4, 'Walking should cycle through all 4 stride frames');

  // 3. Verify Spacebar jump initiates takeoff crouch (poseIndex 0), rises to mid-air apex (poseIndex 1),
  //    transitions to landing cushion flex (poseIndex 2), and lands back on ground
  const getJump = () => engine.activeJump;
  assert.equal(getJump(), null);
  engine.triggerJump();
  assert.ok(getJump() !== null, 'triggerJump() should start activeJump');
  assert.equal(getJump()?.poseIndex, 0, 'Initial jump phase should be takeoff crouch (0)');

  // Advance 0.04s (40ms -> ~8.7% of 460ms) -> still in takeoff crouch (0) with positive jumpZ
  engine.update(0.04);
  assert.equal(getJump()?.poseIndex, 0);
  assert.ok((getJump()?.jumpZ ?? 0) > 0);

  // Advance 0.19s more (total 230ms -> 50% of 460ms) -> mid-air apex tuck (poseIndex 1) at peak height (~16px)
  engine.update(0.19);
  assert.equal(getJump()?.poseIndex, 1, 'Mid-jump should use airborne apex pose (1)');
  assert.ok((getJump()?.jumpZ ?? 0) > 14, 'Mid-jump should reach near peak height');

  // Advance 0.18s more (total 410ms -> ~89% of 460ms) -> landing cushion flex (poseIndex 2)
  engine.update(0.18);
  assert.equal(getJump()?.poseIndex, 2, 'Late jump should use landing cushion flex pose (2)');

  // Advance 0.10s more (total 510ms > 460ms) -> jump completes and clears activeJump
  engine.update(0.1);
  assert.equal(getJump(), null, 'Jump should complete and reset activeJump to null');
});

import { EconomySystem, LAND_DEED_CATALOG } from './economySystem.ts';

test('Expanded 44x32 map supports 4 farm plots, land deed purchases, realistic axe tree chopping (+15G timber salvage), and stump pulling', () => {
  const economy = new EconomySystem();
  economy.resetUnlockedPlots();
  economy.addCoins(500); // Ensure plenty of coins for testing deed purchases

  let timberSalvagedBonus = 0;
  let lastPurchasedPlotNumber = 0;

  const engine = new MelonEngine(new MockCanvas() as any, {
    onInteractPlot: () => {},
    onGardenStatusChange: () => {},
    onInteractSoilLab: () => {},
    onInteractHarvestBench: () => {},
    onRemediateIrrigation: () => {},
    onRemediateBioSpray: () => {},
    onInteractNpc: () => {},
    onInteractBed: () => {},
    onInteractWardrobe: () => {},
    onInteractMarketplace: () => {},
    onInteractFishing: () => {},
    onPurchasePlotDeed: (plot) => {
      lastPurchasedPlotNumber = plot.plotNumber;
      return economy.unlockPlot(plot.plotNumber, plot.deedPrice);
    },
    onTimberSalvaged: (_plot, bonus) => {
      timberSalvagedBonus += bonus;
    },
    onStepChange: () => {},
  });

  // 1. Verify expanded 44x32 map dimensions and 4 plots in 2x2 layout
  assert.equal(engine.mapWidth, 44);
  assert.equal(engine.mapHeight, 32);
  assert.equal(engine.plots.length, 4);
  assert.equal(LAND_DEED_CATALOG.length, 3);

  const [plot1, plot2, plot3, plot4] = engine.plots;
  assert.equal(plot1.phase, 'clear');
  assert.equal(plot1.isUnlocked, true);
  assert.equal(plot2.phase, 'locked_forest');
  assert.equal(plot2.isUnlocked, false);
  assert.equal(plot2.deedPrice, 120);
  assert.equal(plot3.phase, 'locked_forest');
  assert.equal(plot3.deedPrice, 220);
  assert.equal(plot4.phase, 'locked_forest');
  assert.equal(plot4.deedPrice, 350);

  // Verify 3-frame lumberjack axe chopping sprites exist
  const atlas = (engine as any).atlas;
  assert.equal(atlas.playerChopping.length, 3, 'Expected 3 lumberjack axe chopping frames');

  // Verify initially only Plot #1 is in unlockedPlots (unpurchased plots are never shown)
  const initialStatus = engine.getGardenStatus();
  assert.equal(initialStatus.unlockedCount, 1);
  assert.equal(initialStatus.unlockedPlots?.length, 1);
  assert.equal(initialStatus.unlockedPlots?.[0].plotNumber, 1);

  // 2. Walk to Plot #2 (East Timberland) and interact to purchase its deed via on-plot For Sale sign
  engine.playerX = plot2.x + 80;
  engine.playerY = plot2.y + 60;
  engine.advanceSingleGardenStage(true, plot2);

  assert.equal(lastPurchasedPlotNumber, 2);
  assert.equal(plot2.isUnlocked, true);
  assert.equal(plot2.phase, 'forest_trees', 'Plot #2 should transition to forest_trees after deed purchase');
  assert.equal(plot2.actionTag, 'Chop Trees [E]');
  assert.equal(economy.isPlotUnlocked(2), true);

  // Verify unlockedPlots now includes Plot #1 and Plot #2, while Plot #3 and #4 remain hidden
  const afterPlot2PurchaseStatus = engine.getGardenStatus();
  assert.equal(afterPlot2PurchaseStatus.unlockedCount, 2);
  assert.equal(afterPlot2PurchaseStatus.unlockedPlots?.length, 2);
  assert.deepEqual(
    afterPlot2PurchaseStatus.unlockedPlots?.map(p => p.plotNumber),
    [1, 2]
  );

  // 3. Interact with Plot #2 in 'forest_trees' to start the 2600ms axe tree-chopping action
  const getAct = () => engine.activeGardenAction;
  engine.advanceSingleGardenStage(true, plot2);
  assert.ok(getAct() !== null);
  assert.equal(getAct()?.type, 'chop_trees');
  assert.equal(getAct()?.targetPlotId, plot2.id);

  // Advance 1.0s (partial chopping) -> still in forest_trees
  engine.update(1.0);
  assert.equal(plot2.phase, 'forest_trees');
  assert.ok((getAct()?.progress ?? 0) > 0.35);

  // Advance 1.8s more (total 2.8s > 2.6s) -> trees felled, +15G timber salvage awarded, transitions to 'forest_stumps'
  engine.update(1.8);
  assert.equal(getAct(), null);
  assert.equal(plot2.phase, 'forest_stumps', 'Plot #2 should transition to forest_stumps after chopping trees');
  assert.equal(plot2.actionTag, 'Pull Stumps [E]');
  assert.equal(timberSalvagedBonus, 15, 'Chopping woodland trees should award +15G salvaged timber bonus');

  // 4. Interact with Plot #2 in 'forest_stumps' to start the 2300ms stump extraction action
  engine.advanceSingleGardenStage(true, plot2);
  assert.ok(getAct() !== null);
  assert.equal(getAct()?.type, 'clear_stumps');

  // Advance 2.5s (> 2.3s) -> stumps pulled, transitions to 'clear' (ready for standard rock/weed clearing -> sowing -> growing)
  engine.update(2.5);
  assert.equal(getAct(), null);
  assert.equal(plot2.phase, 'clear', 'Plot #2 should transition to clear after pulling stumps');
  assert.equal(plot2.actionTag, 'Clear [E]');

  // 5. Purchase Plot #3 via Broker Silas Marketplace catalog (`buyItem(LAND_DEED_CATALOG[1])`)
  const buyRes = economy.buyItem(LAND_DEED_CATALOG[1]);
  assert.equal(buyRes.success, true);
  engine.unlockPlotFromDeed(3);
  assert.equal(plot3.isUnlocked, true);
  assert.equal(plot3.phase, 'forest_trees');

  // 6. Set Plot #1 and Plot #2 to different growing stages and verify separate timers per unlocked plot
  plot1.phase = 'growing';
  plot1.growthMinutes = 200; // Sprouting stage
  plot2.phase = 'growing';
  plot2.growthMinutes = 1100; // Flowering stage

  engine.focusPlot(1);
  const multiGrowingStatus = engine.getGardenStatus();
  assert.equal(multiGrowingStatus.unlockedCount, 3);
  assert.equal(multiGrowingStatus.unlockedPlots?.length, 3, 'Only the 3 purchased plots are listed (Plot #4 excluded)');
  const slot1 = multiGrowingStatus.unlockedPlots?.find(s => s.plotNumber === 1);
  const slot2 = multiGrowingStatus.unlockedPlots?.find(s => s.plotNumber === 2);
  const slot3 = multiGrowingStatus.unlockedPlots?.find(s => s.plotNumber === 3);
  assert.ok(slot1 && slot2 && slot3);
  assert.equal(slot1.isNearest, true);
  assert.equal(slot2.isNearest, false);
  assert.notEqual(slot1.stageLabel, slot2.stageLabel, 'Plot #1 and Plot #2 should report independent growth stages');
  assert.notEqual(slot1.timeRemainingText, slot2.timeRemainingText, 'Plot #1 and Plot #2 should report separate countdown timers');
  assert.equal(slot3.phase, 'forest_trees');
  assert.equal(slot3.timeRemainingText, 'CHOP [E]');

  // Focus Plot #2 and verify active nearest plot switches to Plot #2
  engine.focusPlot(2);
  const focusedPlot2Status = engine.getGardenStatus();
  assert.equal(focusedPlot2Status.plotNumber, 2);
  assert.equal(focusedPlot2Status.unlockedPlots?.find(s => s.plotNumber === 2)?.isNearest, true);
});
