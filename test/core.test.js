import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  EFM_TABLE,
  EFM_RUN_LENGTH,
  encodeByte,
  encodeBytes,
  formatChannelWord,
} from '../src/index.js';

/** Helper: minimum and maximum run of '0' bits between '1' bits in a 14-bit word. */
function runLengths(word) {
  const bits = formatChannelWord(word);
  const onePositions = [];
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') onePositions.push(i);
  }
  const runs = [];
  for (let i = 1; i < onePositions.length; i++) {
    runs.push(onePositions[i] - onePositions[i - 1] - 1);
  }
  return { min: runs.length ? Math.min(...runs) : null, max: runs.length ? Math.max(...runs) : null };
}

test('EFM_TABLE has exactly 256 entries', () => {
  assert.equal(EFM_TABLE.length, 256);
});

test('every table entry is a 14-bit value (0..16383)', () => {
  for (let i = 0; i < 256; i++) {
    const v = EFM_TABLE[i];
    assert.ok(Number.isInteger(v), `entry ${i} is not an integer`);
    assert.ok(v >= 0 && v <= 0x3fff, `entry ${i} = ${v} out of 14-bit range`);
  }
});

test('every table entry satisfies the EFM run-length constraint', () => {
  // Every 14-bit channel word must have at least two and at most ten zeros
  // between consecutive ones. This is the whole point of EFM.
  for (let i = 0; i < 256; i++) {
    const { min, max } = runLengths(EFM_TABLE[i]);
    if (min === null) continue; // word with fewer than 2 ones: skip
    assert.ok(min >= EFM_RUN_LENGTH.min, `byte ${i}: run ${min} < min`);
    assert.ok(max <= EFM_RUN_LENGTH.max, `byte ${i}: run ${max} > max`);
  }
});

test('encodeByte returns the table entry for the input', () => {
  assert.equal(encodeByte(0), EFM_TABLE[0]);
  assert.equal(encodeByte(1), EFM_TABLE[1]);
  assert.equal(encodeByte(255), EFM_TABLE[255]);
});

test('encodeByte rejects non-integers', () => {
  assert.throws(() => encodeByte(1.5), TypeError);
  assert.throws(() => encodeByte('1'), TypeError);
  assert.throws(() => encodeByte(null), TypeError);
});

test('encodeByte rejects out-of-range integers', () => {
  assert.throws(() => encodeByte(-1), RangeError);
  assert.throws(() => encodeByte(256), RangeError);
});

test('formatChannelWord pads to exactly 14 characters', () => {
  assert.equal(formatChannelWord(0).length, 14);
  assert.equal(formatChannelWord(0x3fff).length, 14);
  assert.equal(formatChannelWord(0b1), '00000000000001');
});

test('formatChannelWord rejects non-14-bit inputs', () => {
  assert.throws(() => formatChannelWord(-1), RangeError);
  assert.throws(() => formatChannelWord(0x4000), RangeError);
  assert.throws(() => formatChannelWord(1.5), RangeError);
});

test('encodeBytes returns a Uint16Array of the same length as the input', () => {
  const out = encodeBytes([0, 1, 2, 3]);
  assert.ok(out instanceof Uint16Array);
  assert.equal(out.length, 4);
});

test('encodeBytes maps each input byte to the corresponding table entry', () => {
  const out = encodeBytes([0, 1, 2, 3, 254, 255]);
  assert.deepEqual(Array.from(out), [
    EFM_TABLE[0], EFM_TABLE[1], EFM_TABLE[2],
    EFM_TABLE[3], EFM_TABLE[254], EFM_TABLE[255],
  ]);
});

test('encodeBytes accepts any iterable, including a Uint8Array', () => {
  const src = Uint8Array.of(0, 128, 255);
  const out = encodeBytes(src);
  assert.equal(out.length, 3);
  assert.equal(out[0], EFM_TABLE[0]);
  assert.equal(out[1], EFM_TABLE[128]);
  assert.equal(out[2], EFM_TABLE[255]);
});

test('encodeBytes of an empty iterable yields an empty Uint16Array', () => {
  const out = encodeBytes([]);
  assert.equal(out.length, 0);
});

test('encodeBytes propagates the RangeError for an invalid byte', () => {
  assert.throws(() => encodeBytes([0, 1, 256]), RangeError);
});
