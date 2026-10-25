import type { GameAPI } from "../game-api/index.js";

export function apply(api: GameAPI): () => void {
  const makeFloorLava = () => api.setFloorLava(10_000);
  makeFloorLava();
  return api.onInterval(makeFloorLava, 10_000);
}
