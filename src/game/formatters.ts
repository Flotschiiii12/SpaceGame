/**
 * Universal AAA Idle Game Compact Number & Time Formatter
 * Formats numbers cleanly (e.g. 950, 1.24K, 45.8K, 3.12M, 1.05B, 4.20T, 12.5Qa, 1.8aa)
 * so UI labels never overflow or overlap.
 */

const STANDARD_SUFFIXES = [
  '',
  'K',
  'M',
  'B',
  'T',
  'Qa',
  'Qi',
  'Sx',
  'Sp',
  'Oc',
  'No',
  'Dc',
];

export function formatCompactNumber(value: number, forceDecimals?: number): string {
  if (!Number.isFinite(value)) return '0';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  if (abs < 1000) {
    if (abs > 0 && abs < 10 && forceDecimals && forceDecimals > 0) {
      return `${sign}${abs.toFixed(forceDecimals)}`;
    }
    return `${sign}${Math.round(abs)}`;
  }

  const tier = Math.floor(Math.log10(abs) / 3);
  if (tier <= 0) {
    return `${sign}${Math.round(abs)}`;
  }

  let suffix = '';
  if (tier < STANDARD_SUFFIXES.length) {
    suffix = STANDARD_SUFFIXES[tier];
  } else {
    // Procedural idle-game alphabetic notation: aa, ab, ac ... zz
    const offset = tier - STANDARD_SUFFIXES.length;
    const firstChar = String.fromCharCode(97 + Math.floor(offset / 26) % 26);
    const secondChar = String.fromCharCode(97 + (offset % 26));
    suffix = `${firstChar}${secondChar}`;
  }

  const scaled = abs / Math.pow(10, tier * 3);
  const decimals =
    typeof forceDecimals === 'number'
      ? forceDecimals
      : scaled >= 100
      ? 0
      : scaled >= 10
      ? 1
      : 2;

  return `${sign}${scaled.toFixed(decimals)}${suffix}`;
}

export function formatDurationCompact(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}
