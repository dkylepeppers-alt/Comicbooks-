/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LogContext {
  area?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Lightweight client-side logger to capture operational failures.
 * Currently writes to the console and preserves recent entries in-session
 * to avoid shipping data externally while still providing visibility for
 * debugging and triage.
 */
class Logger {
  private buffer: Array<{ timestamp: string; message: string; details?: unknown; context?: LogContext }> = [];
  private readonly maxEntries = 50;

  logError(message: string, details?: unknown, context?: LogContext) {
    const entry = {
      timestamp: new Date().toISOString(),
      message,
      details,
      context,
    };

    // Add to in-memory buffer for potential future UI surfacing
    this.buffer.push(entry);
    if (this.buffer.length > this.maxEntries) {
      this.buffer.shift();
    }

    // Echo to console for immediate visibility
     
    console.error(`[Comicbooks][Error] ${message}`, context, details);
  }

  getRecentErrors() {
    return [...this.buffer];
  }
}

export const logger = new Logger();
