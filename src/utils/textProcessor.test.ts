import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanAndNormalizeSpeech,
  segmentRunOnSpeech,
  calculateSpeechPace,
  matchAndDetectTerms,
  generateInstantGloss
} from './textProcessor.ts';
import { DEFAULT_LUBRICANT_GLOSSARY } from '../services/glossaryData.ts';

test('cleanAndNormalizeSpeech strips filler words and normalizes spacing', () => {
  const dirty = 'uh so when we look at, um, the kinematic viscosity  at 100°C';
  const cleaned = cleanAndNormalizeSpeech(dirty);
  assert.equal(cleaned, 'so when we look at, the kinematic viscosity at 100°C');
});

test('calculateSpeechPace rates lecturer speaking speeds accurately', () => {
  // 180 words in 60 seconds = 180 WPM -> very_fast
  const fastResult = calculateSpeechPace(180, 60);
  assert.equal(fastResult.wpm, 180);
  assert.equal(fastResult.level, 'very_fast');

  // 140 words in 60 seconds = 140 WPM -> fast
  const moderateResult = calculateSpeechPace(140, 60);
  assert.equal(moderateResult.wpm, 140);
  assert.equal(moderateResult.level, 'fast');

  // 100 words in 60 seconds = 100 WPM -> normal
  const normalResult = calculateSpeechPace(100, 60);
  assert.equal(normalResult.wpm, 100);
  assert.equal(normalResult.level, 'normal');

  // Zero duration guard
  const zeroResult = calculateSpeechPace(50, 0);
  assert.equal(zeroResult.wpm, 0);
});

test('segmentRunOnSpeech segments rapid long run-on sentences without losing context', () => {
  const longRunOn =
    "Now when you formulate Group III+ base oils with approximately 20 percent Polyalphaolefin PAO 4 cSt, " +
    "because the blending kettle temperature must remain strictly at 60 degrees Celsius, " +
    "and therefore you add secondary ZDDP at 800 ppm to form the protective tribofilm under ASTM D4172 wear test.";

  const segments = segmentRunOnSpeech(longRunOn, { maxWordsPerSegment: 16 });
  assert.ok(segments.length >= 2, 'Should segment into multiple manageable chunks');
  // Confirm key chemical formulas remain intact
  const fullRejoined = segments.join(' ');
  assert.ok(fullRejoined.includes('PAO 4 cSt'));
  assert.ok(fullRejoined.includes('ZDDP at 800 ppm'));
  assert.ok(fullRejoined.includes('ASTM D4172'));
});

test('matchAndDetectTerms detects lubricant and chemical engineering terms', () => {
  const sampleSpeech = "We measured the HTHS viscosity and added ZDDP to maintain anti-wear properties under high shear.";
  const terms = matchAndDetectTerms(sampleSpeech, DEFAULT_LUBRICANT_GLOSSARY);
  assert.ok(terms.includes('ZDDP'));
  assert.ok(terms.some(t => t.includes('HTHS')));
});

test('generateInstantGloss provides instant first-word draft gloss', () => {
  const interim = "viscosity blending temperature";
  const draft = generateInstantGloss(interim, DEFAULT_LUBRICANT_GLOSSARY, 'vi');
  assert.ok(draft.includes('độ nhớt'));
  assert.ok(draft.includes('phối trộn'));
  assert.ok(draft.includes('nhiệt độ'));
});
