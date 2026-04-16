/**
 * Vitest resolves the real `server-only` package, which throws outside the Next.js
 * server graph. Tests run agents in plain Node; this shim is a no-op substitute.
 */
export {};
