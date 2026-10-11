/**
 * Public entry point for the eight-to-fourteen-modulation-encoder package.
 *
 * Re-exports the surface that callers are meant to depend on. Keeping the
 * table, the validators, and the formatters behind `core.js` means the index
 * stays small and lets a reader see the whole public API at a glance.
 */
export {
  EFM_TABLE,
  EFM_RUN_LENGTH,
  encodeByte,
  encodeBytes,
  formatChannelWord,
} from './core.js';
