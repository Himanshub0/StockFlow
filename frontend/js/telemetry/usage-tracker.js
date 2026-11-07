/**
 * Usage Telemetry & Audit Logger
 * Records user interactions, navigation, and operations for prototype evaluation.
 */

class UsageTracker {
  constructor() {
    this.logs = [];
    this.sessionId = `sess-${Date.now().toString(36)}`;
  }

  track(eventType, details = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      eventType,
      details
    };
    this.logs.push(entry);
    // Keep reasonable max size
    if (this.logs.length > 500) this.logs.shift();
  }

  getLogs() {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }
}

export const tracker = new UsageTracker();
