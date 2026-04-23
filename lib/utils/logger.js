/**
 * lib/utils/logger.js — Structured JSON stdout logger.
 *
 * Outputs newline-delimited JSON (NDJSON) suitable for Vercel's log aggregator,
 * Datadog, Grafana Loki, or any structured log pipeline.
 *
 * Format:
 *   {"level":"info","ts":"2026-04-23T18:00:00.000Z","msg":"Certificate issued","certId":"..."}
 *
 * Usage:
 *   import { log } from '../utils/logger.js';
 *   log.info('Certificate issued', { certId, studentName });
 *   log.warn('Email send failed', { error: err.message });
 *   log.error('Unhandled exception', { error: err.message, stack: err.stack });
 */

function write(level, msg, meta = {}) {
  const line = JSON.stringify({
    level,
    ts: new Date().toISOString(),
    msg,
    ...meta,
  });
  // level >= warn → stderr so monitoring tools can filter; info → stdout
  if (level === 'error' || level === 'warn') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

export const log = {
  /** Informational — routine operation events */
  info:  (msg, meta) => write('info',  msg, meta),
  /** Warning — recoverable issues that may need attention */
  warn:  (msg, meta) => write('warn',  msg, meta),
  /** Error — failures that require investigation */
  error: (msg, meta) => write('error', msg, meta),
  /** Debug — verbose details, gated by NODE_ENV */
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production') write('debug', msg, meta);
  },
};
