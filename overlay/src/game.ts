export interface GameState {
  lavaUntil: number;
}

export function createGame(canvas: HTMLCanvasElement): {
  state: GameState;
  setFloorLava: (durationMs: number) => void;
  draw: () => void;
} {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  const context = ctx;

  const state: GameState = { lavaUntil: 0 };
  const player = { x: 960, y: 720, w: 48, h: 64 };
  const floorY = 900;

  function setFloorLava(durationMs: number): void {
    state.lavaUntil = Math.max(state.lavaUntil, performance.now() + durationMs);
  }

  function draw(): void {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const lava = performance.now() < state.lavaUntil;
    context.fillStyle = "#0f1419";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = lava ? "#ff5a1f" : "#2a3340";
    context.fillRect(0, floorY, canvas.width, canvas.height - floorY);
    context.fillStyle = lava ? "#ffd166" : "#6ee7b7";
    context.fillRect(player.x - player.w / 2, player.y - player.h, player.w, player.h);
    context.fillStyle = "#94a3b8";
    context.font = "24px IBM Plex Mono, monospace";
    context.fillText(lava ? "LAVA FLOOR" : "SAFE FLOOR", 48, floorY - 24);
  }

  return { state, setFloorLava, draw };
}
