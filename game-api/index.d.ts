/** Minimal contract used by the Codex SDK latency spike. */
export interface GameAPI {
  setFloorLava(durationMs: number): void;
  onInterval(callback: () => void, intervalMs: number): () => void;
}
