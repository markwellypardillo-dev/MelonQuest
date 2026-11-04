import test from 'node:test';
import assert from 'node:assert/strict';
import { WeatherSystem } from './weatherSystem.ts';

test('WeatherSystem initializes with optimal weather and expected metrics', () => {
  const ws = new WeatherSystem({ minCycleDuration: 45, maxCycleDuration: 60 });
  assert.equal(ws.getWeather(), 'optimal');
  assert.equal(ws.isCropStressed(), false);

  const metrics = ws.getMetrics();
  assert.equal(metrics.current, 'optimal');
  assert.equal(metrics.humidityPct, 52);
  assert.equal(metrics.temperatureF, 78);
  assert(metrics.timeRemainingSeconds >= 45 && metrics.timeRemainingSeconds <= 60);
});

test('WeatherSystem transitions to high humidity and triggers crop stress after threshold', () => {
  const ws = new WeatherSystem({ minCycleDuration: 50, maxCycleDuration: 50, stressThresholdSeconds: 20 });
  ws.setWeather('high_humidity');
  assert.equal(ws.getWeather(), 'high_humidity');
  assert.equal(ws.isCropStressed(), false);

  // Advance time by 10s (below 20s stress threshold)
  ws.update(10);
  assert.equal(ws.isCropStressed(), false);

  // Advance time by another 11s (total 21s, over 20s stress threshold)
  ws.update(11);
  assert.equal(ws.isCropStressed(), true);
  assert.equal(ws.getMetrics().cropStressActive, true);
});

test('WeatherSystem transitions to drought and triggers crop stress', () => {
  const ws = new WeatherSystem({ minCycleDuration: 50, maxCycleDuration: 50, stressThresholdSeconds: 15 });
  ws.setWeather('drought');
  assert.equal(ws.getWeather(), 'drought');

  const metrics = ws.getMetrics();
  assert.equal(metrics.humidityPct, 21);
  assert.equal(metrics.temperatureF, 99);

  ws.update(16);
  assert.equal(ws.isCropStressed(), true);
});

test('Remediation actions properly resolve specific weather hazards', () => {
  const ws = new WeatherSystem({ stressThresholdSeconds: 10 });

  // Test drought remediation with irrigation
  ws.setWeather('drought');
  ws.update(12);
  assert.equal(ws.isCropStressed(), true);

  // Wrong action fails
  const wrongRes = ws.remediate('bio_spray');
  assert.equal(wrongRes.success, false);
  assert.equal(ws.getWeather(), 'drought');

  // Correct action resolves drought
  const correctRes = ws.remediate('irrigation');
  assert.equal(correctRes.success, true);
  assert.equal(ws.getWeather(), 'optimal');
  assert.equal(ws.isCropStressed(), false);

  // Test high humidity remediation with bio_spray
  ws.setWeather('high_humidity');
  ws.update(12);
  assert.equal(ws.isCropStressed(), true);

  const sprayRes = ws.remediate('bio_spray');
  assert.equal(sprayRes.success, true);
  assert.equal(ws.getWeather(), 'optimal');
  assert.equal(ws.isCropStressed(), false);
});
