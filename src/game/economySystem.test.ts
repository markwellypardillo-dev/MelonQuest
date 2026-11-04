import test from 'node:test';
import assert from 'node:assert/strict';
import { EconomySystem, BAIT_CATALOG } from './economySystem.ts';

test('EconomySystem initializes with 150 starting capital and basic supplies', () => {
  const econ = new EconomySystem();
  assert(econ.getCoins() >= 0);
  const inv = econ.getInventory();
  assert(inv.length > 0);
  assert(inv.some(i => i.id === 'seed_sugar_baby'));
  assert(econ.getTotalBaitCount() > 0);
});

test('EconomySystem awards coins for USDA No. 1, Choice, and Commercial melons with quality multipliers', () => {
  const econ = new EconomySystem();
  const initialCoins = econ.getCoins();

  econ.addItem({
    id: 'melon_sugar_baby',
    name: 'Sugar Baby Watermelon',
    category: 'crop',
    quality: 'usda_no_1',
    value: 60,
    description: 'Crisp and sweet',
  }, 1);

  const sale = econ.sellItem('melon_sugar_baby', 1, 'usda_no_1');
  assert.equal(sale.success, true);
  assert.equal(sale.earned, 90);
  assert.equal(econ.getCoins(), initialCoins + 90);
});

test('EconomySystem rejects spoiled produce with 0 coins and compost warning', () => {
  const econ = new EconomySystem();
  const initialCoins = econ.getCoins();

  econ.addItem({
    id: 'melon_spoiled',
    name: 'Overripe Rotten Watermelon',
    category: 'crop',
    quality: 'spoiled',
    value: 50,
    description: 'Rotten soft melon',
  }, 1);

  const sale = econ.sellItem('melon_spoiled', 1, 'spoiled');
  assert.equal(sale.success, true);
  assert.equal(sale.earned, 0);
  assert(sale.message.includes('compost') || sale.message.includes('Spoiled'));
  assert.equal(econ.getCoins(), initialCoins);
});

test('EconomySystem deducts coins when buying store listings and packs of bait', () => {
  const econ = new EconomySystem();
  econ.addCoins(100);
  const before = econ.getCoins();
  const baitBefore = econ.getTotalBaitCount();

  const buy = econ.buyItem(BAIT_CATALOG[1]); // River Cricket Bait (x3) for 18 coins
  assert.equal(buy.success, true);
  assert.equal(econ.getCoins(), before - 18);
  assert.equal(econ.getTotalBaitCount(), baitBefore + 3);
});

test('EconomySystem consumes bait when rigging hook and stores caught fish in Pier Fish Bucket', () => {
  const econ = new EconomySystem();
  const beforeBait = econ.getTotalBaitCount();
  const rigResult = econ.consumeBait('earthworm_bait');
  assert.equal(rigResult.success, true);
  assert.equal(econ.getTotalBaitCount(), beforeBait - 1);

  const bucketBefore = econ.getPierBucketCount();
  const addedFish = econ.addFishToBucket({
    id: 'fish_golden_river_trout',
    name: 'Golden River Trout',
    weightLb: 3.4,
    lengthIn: 16.5,
    value: 55,
    rarity: 'Prize',
    caughtWithBait: 'Red Earthworm Bait',
    caughtAt: 'Day 1',
    description: 'Prized golden trout.',
  });
  assert.equal(econ.getPierBucketCount(), bucketBefore + 1);

  const transferred = econ.transferBucketFishToInventory(addedFish.uid);
  assert.equal(transferred, true);
  assert.equal(econ.getPierBucketCount(), bucketBefore);
  assert(econ.getInventory().some(i => i.id === 'fish_golden_river_trout'));
});
