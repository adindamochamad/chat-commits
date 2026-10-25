import type { GameAPI } from "../game-api/index.js";

/** Demo backup: single lava pulse on merge. */
export function apply(api: GameAPI): void {
  api.setFloorLava(5_000);
}
