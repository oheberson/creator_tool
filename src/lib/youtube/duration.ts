/**
 * Parse YouTube contentDetails.duration ISO 8601 (e.g. PT15M33S) to seconds.
 */
export function parseIso8601DurationSeconds(iso: string | undefined): number {
  if (!iso || !iso.startsWith("PT")) return 0;
  let seconds = 0;
  const h = /(\d+)H/.exec(iso);
  const m = /(\d+)M/.exec(iso);
  const s = /(\d+)S/.exec(iso);
  if (h) seconds += Number.parseInt(h[1], 10) * 3600;
  if (m) seconds += Number.parseInt(m[1], 10) * 60;
  if (s) seconds += Number.parseInt(s[1], 10);
  return seconds;
}
