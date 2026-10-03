import { MEMORY_ARENA_CONFIG, type SoloWaveState } from './memoryArena';
import { getSpawnVisual, SPAWN_ANIMATION_MS } from './roundOpening';

export interface ArenaWall { x: number; y: number; w: number; h: number }

export const SOLO_ARENA_WIDTH = 1200;
export const SOLO_ARENA_HEIGHT = 900;
export const SOLO_ARENA_BOUNDARY: ArenaWall[] = [
  { x: 0, y: 0, w: 1200, h: 40 },
  { x: 0, y: 0, w: 40, h: 900 },
  { x: 1160, y: 0, w: 40, h: 900 },
  { x: 0, y: 860, w: 1200, h: 40 },
];

// All layouts share one fixed box, wide passages and an open center spawn.
export const SOLO_ARENA_LAYOUTS = [
  { name: 'Twin Cover', interior: [
    { x: 340, y: 260, w: 90, h: 90 },
    { x: 770, y: 550, w: 90, h: 90 },
  ] },
  { name: 'Split Lanes', interior: [
    { x: 310, y: 240, w: 50, h: 330 },
    { x: 840, y: 330, w: 50, h: 330 },
  ] },
  { name: 'Four Corners', interior: [
    { x: 300, y: 220, w: 150, h: 55 },
    { x: 750, y: 220, w: 150, h: 55 },
    { x: 300, y: 625, w: 150, h: 55 },
    { x: 750, y: 625, w: 150, h: 55 },
  ] },
  { name: 'Staggered Gates', interior: [
    { x: 470, y: 200, w: 260, h: 50 },
    { x: 240, y: 425, w: 180, h: 50 },
    { x: 780, y: 425, w: 180, h: 50 },
    { x: 470, y: 650, w: 260, h: 50 },
  ] },
].map(layout => ({ ...layout, walls: [...SOLO_ARENA_BOUNDARY, ...layout.interior] }));

export const ARENA_MATERIALIZE_AT_MS = SPAWN_ANIMATION_MS + 120;
export const ARENA_WALL_STAGGER_MS = 60;

export function getSoloArenaLayout(wave: number) {
  return SOLO_ARENA_LAYOUTS[(Math.max(1, Math.floor(wave)) - 1) % SOLO_ARENA_LAYOUTS.length];
}

// Derive everything from the saved wave countdown so pausing and loading retain
// the exact geometry and transition phase without additional clocks or save data.
export function getSoloArenaFrame(wave: SoloWaveState, reducedMotion = false) {
  const elapsed = MEMORY_ARENA_CONFIG.waves.breakMs - wave.breakRemainingMs;
  const outgoing = wave.phase === 'break' && elapsed < ARENA_MATERIALIZE_AT_MS;
  const layout = getSoloArenaLayout(wave.number + (wave.phase === 'break' && !outgoing ? 1 : 0));
  const settledAt = ARENA_MATERIALIZE_AT_MS + SPAWN_ANIMATION_MS +
    (layout.interior.length - 1) * ARENA_WALL_STAGGER_MS;
  const walls = wave.phase === 'active' ? layout.walls
    : elapsed < SPAWN_ANIMATION_MS ? layout.walls
    : elapsed < settledAt ? SOLO_ARENA_BOUNDARY : layout.walls;
  const interior = layout.interior.map((wall, index) => {
    const age = wave.phase === 'active' ? SPAWN_ANIMATION_MS
      : outgoing ? SPAWN_ANIMATION_MS - elapsed
      : elapsed - ARENA_MATERIALIZE_AT_MS - index * ARENA_WALL_STAGGER_MS;
    const visual = getSpawnVisual(age, reducedMotion);
    if (age < 0 || (outgoing && age === 0)) visual.ringAlpha = 0;
    return { wall, visual };
  });
  return { walls, interior, layout };
}

export function isArenaPositionClear(x: number, y: number, radius: number, walls: readonly ArenaWall[]) {
  return !walls.some(wall => {
    const dx = x - Math.max(wall.x, Math.min(x, wall.x + wall.w));
    const dy = y - Math.max(wall.y, Math.min(y, wall.y + wall.h));
    return dx * dx + dy * dy < radius * radius;
  });
}

// Nudge a player or uncollected pickup to the nearest clear edge if a new wall
// forms at their position. No damage, reset to spawn, or change to arena bounds.
export function findClearArenaPosition(body: { x: number; y: number; radius: number }, walls: readonly ArenaWall[]) {
  const padding = body.radius + 2;
  const clampX = (x: number) => Math.max(40 + padding, Math.min(SOLO_ARENA_WIDTH - 40 - padding, x));
  const clampY = (y: number) => Math.max(40 + padding, Math.min(SOLO_ARENA_HEIGHT - 40 - padding, y));
  const origin = { x: clampX(body.x), y: clampY(body.y) };
  const xs = [origin.x, 600, ...walls.flatMap(wall => [clampX(wall.x - padding), clampX(wall.x + wall.w + padding)])];
  const ys = [origin.y, 450, ...walls.flatMap(wall => [clampY(wall.y - padding), clampY(wall.y + wall.h + padding)])];
  let nearest = { x: 600, y: 450 };
  let nearestDistance = Infinity;
  for (const x of xs) for (const y of ys) {
    const distance = (x - body.x) ** 2 + (y - body.y) ** 2;
    if (distance < nearestDistance && isArenaPositionClear(x, y, body.radius, walls)) {
      nearest = { x, y };
      nearestDistance = distance;
    }
  }
  return nearest;
}
