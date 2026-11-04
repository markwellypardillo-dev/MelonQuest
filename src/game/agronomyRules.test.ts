import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assessWatermelonSoil,
  evaluatePestIntervention,
  evaluateHarvestReadiness,
  OPTIMAL_PH_MIN,
  OPTIMAL_PH_MAX,
} from './agronomyRules.ts';

test('assessWatermelonSoil identifies optimal soil correctly', () => {
  const result = assessWatermelonSoil({
    pH: 6.4,
    nitrogen: 45,
    phosphorus: 35,
    potassium: 160,
    moisture: 55,
  });

  assert.equal(result.status, 'optimal');
  assert.equal(result.recommendedTreatment, 'none');
  assert.equal(result.isReadyForPlanting, true);
  assert.equal(result.nStatus, 'balanced');
  assert.equal(result.pStatus, 'balanced');
  assert.equal(result.kStatus, 'balanced');
});

test('assessWatermelonSoil detects acid soil requiring lime', () => {
  const result = assessWatermelonSoil({
    pH: 5.2,
    nitrogen: 40,
    phosphorus: 30,
    potassium: 150,
    moisture: 50,
  });

  assert.equal(result.status, 'acidic');
  assert.equal(result.recommendedTreatment, 'lime');
  assert(result.treatmentAmountKgPerHa > 0);
  assert.equal(result.isReadyForPlanting, false);
});

test('assessWatermelonSoil detects alkaline soil requiring sulfur', () => {
  const result = assessWatermelonSoil({
    pH: 7.6,
    nitrogen: 40,
    phosphorus: 30,
    potassium: 150,
    moisture: 50,
  });

  assert.equal(result.status, 'alkaline');
  assert.equal(result.recommendedTreatment, 'sulfur');
  assert(result.treatmentAmountKgPerHa > 0);
  assert.equal(result.isReadyForPlanting, false);
});

test('evaluatePestIntervention correctly validates biological and targeted treatments', () => {
  assert.equal(evaluatePestIntervention('cucumber_beetle', 'kaolin_spinosad'), true);
  assert.equal(evaluatePestIntervention('cucumber_beetle', 'insecticidal_soap'), false);

  assert.equal(evaluatePestIntervention('melon_aphid', 'insecticidal_soap'), true);
  assert.equal(evaluatePestIntervention('melon_aphid', 'potassium_bicarbonate'), false);

  assert.equal(evaluatePestIntervention('powdery_mildew', 'potassium_bicarbonate'), true);
  assert.equal(evaluatePestIntervention('beneficial_ladybug', 'protect_beneficial'), true);
  assert.equal(evaluatePestIntervention('beneficial_ladybug', 'kaolin_spinosad'), false);
});

test('evaluateHarvestReadiness confirms ripe watermelon when all 4 indicators pass', () => {
  const ripeResult = evaluateHarvestReadiness({
    tendrilDryingPct: 95,
    groundSpotColor: 'butter_yellow',
    thumpFrequencyHz: 110,
    refractometerBrix: 12.0,
  });

  assert.equal(ripeResult.isFullyRipe, true);
  assert.equal(ripeResult.tendrilPass, true);
  assert.equal(ripeResult.groundSpotPass, true);
  assert.equal(ripeResult.thumpAcousticPass, true);
  assert.equal(ripeResult.brixPass, true);
  assert.equal(ripeResult.usdaGrade, 'U.S. No. 1');
});

test('evaluateHarvestReadiness rejects immature watermelon with green tendril or white belly spot', () => {
  const immatureTendril = evaluateHarvestReadiness({
    tendrilDryingPct: 30, // green
    groundSpotColor: 'butter_yellow',
    thumpFrequencyHz: 110,
    refractometerBrix: 11.5,
  });
  assert.equal(immatureTendril.isFullyRipe, false);
  assert.equal(immatureTendril.tendrilPass, false);
  assert.equal(immatureTendril.usdaGrade, 'Immature / Reject');

  const immatureBelly = evaluateHarvestReadiness({
    tendrilDryingPct: 95,
    groundSpotColor: 'white', // unripe
    thumpFrequencyHz: 110,
    refractometerBrix: 11.5,
  });
  assert.equal(immatureBelly.isFullyRipe, false);
  assert.equal(immatureBelly.groundSpotPass, false);

  const immatureThump = evaluateHarvestReadiness({
    tendrilDryingPct: 95,
    groundSpotColor: 'butter_yellow',
    thumpFrequencyHz: 210, // high pitch metallic ping
    refractometerBrix: 11.5,
  });
  assert.equal(immatureThump.isFullyRipe, false);
  assert.equal(immatureThump.thumpAcousticPass, false);
});
