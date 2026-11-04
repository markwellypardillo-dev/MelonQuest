import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TimeAndCalendarSystem,
  calculateMelonGrowth,
  CROP_STAGE_THRESHOLDS,
} from './timeSystem.ts';

test('TimeAndCalendarSystem starts at Day 1 Monday 06:00 AM', () => {
  const clock = new TimeAndCalendarSystem(6 * 60);
  const state = clock.getState();

  assert.equal(state.day, 1);
  assert.equal(state.dayOfWeek, 'MON');
  assert.equal(state.hour, 6);
  assert.equal(state.minute, 0);
  assert.equal(state.phase, 'dawn');
  assert.equal(clock.getFormattedTime(), '6:00 AM');
});

test('Time scaling accelerates clock progression properly', () => {
  const clock = new TimeAndCalendarSystem(6 * 60);
  clock.setTimeSpeed(6);

  // 10 real seconds at 6x should advance 60 in-game minutes (1 hour)
  const advanced = clock.update(10);
  assert.equal(advanced, 60);

  const state = clock.getState();
  assert.equal(state.hour, 7);
  assert.equal(state.minute, 0);
});

test('Sleep fast-forwards to 06:00 AM the next day and restores stamina', () => {
  const clock = new TimeAndCalendarSystem(14 * 60); // 14:00 Day 1
  clock.stamina = 40;

  const elapsedMinutes = clock.sleepUntilMorning();
  assert.equal(elapsedMinutes, 16 * 60); // 14:00 to 06:00 next day is 16 hours

  const state = clock.getState();
  assert.equal(state.day, 2);
  assert.equal(state.dayOfWeek, 'TUE');
  assert.equal(state.hour, 6);
  assert.equal(state.minute, 0);
  assert.equal(state.stamina, 100);
});

test('calculateMelonGrowth advances through all stages correctly', () => {
  // Seed stage
  const seed = calculateMelonGrowth(100, 0);
  assert.equal(seed.stage, 'seed');
  assert.equal(seed.stageIndex, 0);
  assert.equal(seed.isHarvestable, false);

  // Sprout stage
  const sprout = calculateMelonGrowth(300, 0);
  assert.equal(sprout.stage, 'sprout');
  assert.equal(sprout.stageIndex, 1);

  // Vine stage
  const vine = calculateMelonGrowth(600, 0);
  assert.equal(vine.stage, 'vine');
  assert.equal(vine.stageIndex, 2);

  // Flowering stage
  const flower = calculateMelonGrowth(1100, 0);
  assert.equal(flower.stage, 'flowering');
  assert.equal(flower.stageIndex, 3);

  // Fruiting stage
  const fruit = calculateMelonGrowth(1800, 0);
  assert.equal(fruit.stage, 'fruiting');
  assert.equal(fruit.stageIndex, 4);

  // Mature stage
  const mature = calculateMelonGrowth(2200, 200);
  assert.equal(mature.stage, 'mature');
  assert.equal(mature.stageIndex, 5);
  assert.equal(mature.isHarvestable, true);
  assert.equal(mature.isSpoiled, false);

  // Spoiled stage (exceeded spoilage window)
  const spoiled = calculateMelonGrowth(2200, CROP_STAGE_THRESHOLDS.spoilageWindow + 10);
  assert.equal(spoiled.stage, 'spoiled');
  assert.equal(spoiled.stageIndex, 6);
  assert.equal(spoiled.isHarvestable, false);
  assert.equal(spoiled.isSpoiled, true);
});
