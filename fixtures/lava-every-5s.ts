import type { GameAPI } from "../game-api/index.js";

/** Demo backup: faster lava cadence for timelapse takes. */
export function apply(api: GameAPI): () => void {
  const pulse = () => api.setFloorLava(3_000);
  pulse();
  return api.onInterval(pulse, 5_000);
}
