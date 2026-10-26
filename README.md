# eight-to-fourteen-modulation-encoder

Encodes bytes into 14-bit EFM channel words using the lookup table defined by the optical disc standards (CD, MiniDisc). Each input byte (0..255) maps to a unique 14-bit value in the range 0..16383.

```js
import { encodeByte, encodeBytes, formatChannelWord } from 'eight-to-fourteen-modulation-encoder';

const word = encodeByte(0);            // 0x2400
const binary = formatChannelWord(word); // '01001000100000'

const words = encodeBytes(Uint8Array.of(0, 1, 255));
// Uint16Array(3) [0x2400, ...]
```

## Why this exists

EFM is the run-length-limited code used on CDs and MiniDiscs. Mapping the 256 possible byte values to 14-bit channel words by hand is tedious and error-prone, so the table is baked in here as a flat array indexed by the input byte. The trade-off is memory: the table is 256 entries of a few bytes each, which is negligible, but it means the package is only as correct as the table. Every entry is asserted, in the test suite, to fall within the run-length bounds (at least two and at most ten zeros between consecutive ones) that the optical readout channel requires.

## The awkward edge

This library encodes a single byte at a time and does NOT insert the 3-bit merging bits that real disc frames place between consecutive 14-bit words. That is the caller's job. The merging bits are chosen dynamically based on the run-length state at the boundary; including them here would require maintaining digital-sum state across calls, which is a different concern. If you need a full frame assembler, wrap this encoder and add the merging logic on top.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

